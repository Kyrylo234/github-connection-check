import { XMLParser } from "fast-xml-parser";
import type { AnalyzedNewsEvent, NewsArticle, NewsCategory } from "@/types/news";
import type { AnalysisState } from "./news-classification";

export const NEWS_CACHE_MINUTES = 2;
export const PUBLISHER_FEEDS = [
  { name: "BBC News", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "The Guardian", url: "https://www.theguardian.com/world/rss" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
] as const;

export interface NewsSnapshot {
  articles: NewsArticle[];
  fetchedAt: string;
  errors: string[];
  validators?: Record<string, { etag?: string; lastModified?: string }>;
}

/** A content version shared by the status check and the full news query. */
export function newsSnapshotVersion(snapshot: NewsSnapshot | null): string | null {
  if (!snapshot) return null;
  let hash = 2166136261;
  for (const article of snapshot.articles) {
    const content = `${article.id}\u0000${article.title}\u0000${article.description ?? ""}\u0000${article.publishedAt}\u0000`;
    for (let index = 0; index < content.length; index++) {
      hash = Math.imul(hash ^ content.charCodeAt(index), 16777619);
    }
  }
  for (const error of snapshot.errors) {
    for (let index = 0; index < error.length; index++) {
      hash = Math.imul(hash ^ error.charCodeAt(index), 16777619);
    }
  }
  return `${snapshot.articles.length}:${(hash >>> 0).toString(16)}`;
}
export interface NewsResponse {
  analysis?: AnalysisState;
  snapshot: NewsSnapshot | null;
  error: string | null;
  nextRefreshAt: string | null;
  stale: boolean;
}

export function newsDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) + " UTC";
}

export function cleanNewsText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function categorizeNews(title: string): NewsCategory {
  const rules: [NewsCategory, RegExp][] = [
    ["Conflict", /\b(war|attack|missile|military|killed|troops|strike)\b/i],
    ["Climate", /\b(climate|flood|earthquake|storm|wildfire|drought)\b/i],
    ["Health", /\b(health|hospital|disease|outbreak|vaccine)\b/i],
    ["Economy", /\b(economy|trade|tariff|inflation|market|supply|port)\b/i],
    ["Technology", /\b(cyber|technology|data breach|AI)\b/i],
    ["Diplomacy", /\b(talks|treaty|summit|diplomat|ceasefire)\b/i],
  ];
  return rules.find(([, pattern]) => pattern.test(title))?.[0] ?? "Society";
}

/** Canonical URL is the provider-independent ID. Never interpret source metadata as a place. */
export function parsePublisherFeed(xml: string, source: string): NewsArticle[] {
  if (xml.length > 2_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("Unsupported feed format");
  const parsed = new XMLParser({ processEntities: false, ignoreAttributes: true }).parse(xml);
  const items: unknown = parsed?.rss?.channel?.item;
  if (!items) throw new Error("No RSS articles found");
  return (Array.isArray(items) ? items : [items]).flatMap((item): NewsArticle[] => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const title = cleanNewsText(record['title']);
    const published = record['pubDate'];
    const link = record['link'];
    const date = typeof published === "string" ? Date.parse(published) : NaN;
    if (!title || !Number.isFinite(date) || typeof link !== "string") return [];
    try {
      const url = new URL(link);
      if (url.protocol !== "https:" && url.protocol !== "http:") return [];
      url.hash = "";
      for (const key of [...url.searchParams.keys()]) if (/^utm_|^fbclid$/.test(key)) url.searchParams.delete(key);
      return [{ id: url.href, url: url.href, title, description: cleanNewsText(record['description']).slice(0, 500), source,
        publishedAt: new Date(date).toISOString(), category: categorizeNews(title), isDemo: false }];
    } catch { return []; }
  });
}

export function deduplicateNews(articles: NewsArticle[]): NewsArticle[] {
  return [...new Map(articles.map(article => [article.id, article])).values()]
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 100);
}

// Approximate national centres, not capitals or publisher headquarters. Only explicit
// locative phrases in titles qualify. Multiple possible locations remain unpinned.
const places: [string, string, number, number][] = [
  ["Ukraine", "Ukraine", 49, 32], ["Russia", "Russia", 61, 100],
  ["Gaza", "Palestine", 31.4, 34.4], ["Israel", "Israel", 31.5, 34.8],
  ["Iran", "Iran", 32, 54], ["Lebanon", "Lebanon", 33.9, 35.8],
  ["Syria", "Syria", 35, 38], ["Sudan", "Sudan", 15, 30],
  ["China", "China", 35, 105], ["Taiwan", "Taiwan", 23.7, 121],
  ["India", "India", 22, 79], ["Pakistan", "Pakistan", 30, 70],
  ["Japan", "Japan", 36, 138], ["South Korea", "South Korea", 36, 128],
  ["France", "France", 46.6, 2.2], ["Germany", "Germany", 51, 10],
  ["United Kingdom|UK", "United Kingdom", 54, -2], ["United States|US|USA", "United States", 39, -98],
  ["Brazil", "Brazil", -10, -52], ["Mexico", "Mexico", 23, -102],
  ["Canada", "Canada", 56, -106], ["Australia", "Australia", -25, 134],
  ["South Africa", "South Africa", -29, 25], ["Nigeria", "Nigeria", 9, 8],
];

export function locateNews(article: NewsArticle): AnalyzedNewsEvent | null {
  const matches = places.filter(([pattern]) => new RegExp(`\\b(?:in|across|inside|near) (?:northern |southern |eastern |western )?(?:${pattern})\\b`, "i").test(article.title));
  const allMentions = places.filter(([pattern]) => new RegExp(`\\b(?:${pattern})\\b`, "i").test(article.title));
  if (matches.length !== 1 || allMentions.length !== 1) return null;
  const place = matches[0];
  if (!place) return null;
  const [, country, latitude, longitude] = place;
  const negative = /\b(attack|war|killed|deaths|missile|flood|earthquake|crisis|outbreak|breach)\b/i.test(article.title);
  const positive = /\b(peace|ceasefire|agreement|rescued|recovery|aid)\b/i.test(article.title);
  const sentiment = negative && !positive ? -0.7 : positive && !negative ? 0.5 : 0;
  return { id: article.id, location: { name: "Approximate national location", country, latitude, longitude },
    category: article.category ?? "Society", sentiment, severity: negative ? 0.8 : positive ? 0.3 : 0.2,
    occurredAt: article.publishedAt, articles: [article], articleCount: 1, isDemo: false };
}
