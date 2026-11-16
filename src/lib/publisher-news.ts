import { XMLParser } from "fast-xml-parser";
import countryCentres from "@/data/news-country-centres.json";
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
  unmappedSignals?: Pick<
    AnalyzedNewsEvent,
    "occurredAt" | "sentiment" | "severity" | "articleCount"
  >[];
  archiveVersion?: number;
}

/** A content version shared by the status check and the full news query. */
export function newsArticlesVersion(snapshot: NewsSnapshot | null): string | null {
  if (!snapshot) return null;
  let hash = 2166136261;
  for (const article of snapshot.articles) {
    const content = `${article.id}\u0000${article.title}\u0000${article.description ?? ""}\u0000${article.publishedAt}\u0000`;
    for (let index = 0; index < content.length; index++) {
      hash = Math.imul(hash ^ content.charCodeAt(index), 16777619);
    }
  }
  return `${snapshot.articles.length}:${(hash >>> 0).toString(16)}`;
}

export function newsSnapshotVersion(snapshot: NewsSnapshot | null): string | null {
  const articleVersion = newsArticlesVersion(snapshot);
  if (!snapshot || !articleVersion) return null;
  let hash = 2166136261;
  for (const error of snapshot.errors) {
    for (let index = 0; index < error.length; index++) {
      hash = Math.imul(hash ^ error.charCodeAt(index), 16777619);
    }
  }
  for (const signal of snapshot.unmappedSignals ?? []) {
    for (const character of `${signal.occurredAt}:${signal.sentiment}:${signal.severity}`) {
      hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    }
  }
  return `${articleVersion}:${(hash >>> 0).toString(16)}`;
}
export interface NewsResponse {
  analysis?: AnalysisState;
  snapshot: NewsSnapshot | null;
  error: string | null;
  nextRefreshAt: string | null;
  stale: boolean;
}

export function newsDate(value: string) {
  return (
    new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(value)) + " UTC"
  );
}

export function cleanNewsText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  if (xml.length > 2_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new Error("Unsupported feed format");
  const parsed = new XMLParser({ processEntities: false, ignoreAttributes: true }).parse(xml);
  const items: unknown = parsed?.rss?.channel?.item;
  if (!items) throw new Error("No RSS articles found");
  return (Array.isArray(items) ? items : [items]).flatMap((item): NewsArticle[] => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const title = cleanNewsText(record["title"]);
    const published = record["pubDate"];
    const link = record["link"];
    const date = typeof published === "string" ? Date.parse(published) : NaN;
    if (!title || !Number.isFinite(date) || typeof link !== "string") return [];
    try {
      const url = new URL(link);
      if (url.protocol !== "https:" && url.protocol !== "http:") return [];
      url.hash = "";
      for (const key of [...url.searchParams.keys()])
        if (/^utm_|^fbclid$/.test(key)) url.searchParams.delete(key);
      return [
        {
          id: url.href,
          url: url.href,
          title,
          description: cleanNewsText(record["description"]).slice(0, 500),
          source,
          publishedAt: new Date(date).toISOString(),
          category: categorizeNews(title),
          isDemo: false,
        },
      ];
    } catch {
      return [];
    }
  });
}

export function deduplicateNews(articles: NewsArticle[]): NewsArticle[] {
  return [...new Map(articles.map((article) => [article.id, article])).values()]
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 100);
}

export function headlineSeverity(title: string): number {
  const impact = headlineEventImpact(title);
  if (impact === -0.7) return 0.8;
  if (impact === 0.5) return 0.3;
  return 0.2;
}

/** A short RSS summary can supply direct evidence when the title is vague. */
export function articleEventImpact(
  article: Pick<NewsArticle, "title" | "description">,
): number | null {
  const titleImpact = headlineEventImpact(article.title);
  if (titleImpact !== null) return titleImpact;
  const summary = (article.description ?? "").slice(0, 240);
  const harm =
    /\b(killed|died|dead|injured|wounded|bodies|casualties|fatalities|trapped under (?:the )?rubble|mass funeral)\b/i.test(
      summary,
    );
  const recovery = /\b(rescued|saved|recovered|released from captivity)\b/i.test(summary);
  return harm === recovery ? null : harm ? -0.7 : 0.5;
}

export function articleSeverity(article: Pick<NewsArticle, "title" | "description">): number {
  const titleSeverity = headlineSeverity(article.title);
  if (titleSeverity !== 0.2) return titleSeverity;
  const impact = articleEventImpact(article);
  return impact === -0.7 ? 0.8 : impact === 0.5 ? 0.3 : 0.2;
}

/** An explicit harm or recovery event takes precedence over neutral-sounding reporting language. */
export function headlineEventImpact(title: string): number | null {
  const harm =
    /\b(attack(?:s|ed)?|war|kill(?:s|ed|ing)?|death(?:s)?|dead|behead(?:ed|ing)?|execution|executed|missile(?:s)?|strike(?:s)?|flood(?:s|ed|ing)?|earthquake|crisis|outbreak|breach|crash|collision|disaster|fire|injur(?:y|ies|ed)|funeral(?:s)?|casualt(?:y|ies)|fatalit(?:y|ies)|rubble)\b/i.test(
      title,
    );
  const recovery =
    /\b(peace|ceasefire|agreement|rescu(?:e|ed|es)|recover(?:y|ed|ing)?|aid|relief|reopen(?:s|ed)?|saved|cured)\b/i.test(
      title,
    );
  return harm === recovery ? null : harm ? -0.7 : 0.5;
}

// National centres from the same country gazetteer used by hosted resolution.
// Avoid names that also commonly identify a person, US state, or ambiguous country.
const ambiguousCountryCodes = new Set(["CG", "GE", "JO", "TD"]);
const countryAliases: Record<string, string[]> = {
  GB: ["UK"],
  US: ["US", "USA"],
};
const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const places = [
  ...Object.entries(countryCentres).flatMap(([code, place]) =>
    ambiguousCountryCodes.has(code)
      ? []
      : [place.name, ...(countryAliases[code] ?? [])].map((name) => ({
          country: place.name,
          latitude: place.lat,
          longitude: place.lng,
          mention: new RegExp(`\\b${escapePattern(name)}\\b`, "gi"),
        })),
  ),
  {
    country: "Palestine",
    latitude: 31.4,
    longitude: 34.4,
    mention: /\bGaza\b/gi,
  },
];

export function locateNews(article: NewsArticle): AnalyzedNewsEvent | null {
  const mentions = places.flatMap((place) =>
    [...article.title.matchAll(place.mention)].map((match) => ({
      place,
      start: match.index,
      end: match.index + match[0].length,
    })),
  );
  // "Guinea" within "Papua New Guinea" is one place, while a separate
  // mention of Guinea still makes the headline ambiguous.
  const maximalMentions = mentions.filter(
    (mention) =>
      !mentions.some(
        (other) =>
          other.start <= mention.start &&
          other.end >= mention.end &&
          other.end - other.start > mention.end - mention.start,
      ),
  );
  const uniquePlaces = (items: typeof maximalMentions) => [
    ...new Map(
      items.map((item) => [
        `${item.place.country}:${item.place.latitude}:${item.place.longitude}`,
        item.place,
      ]),
    ).values(),
  ];
  const allMentions = uniquePlaces(maximalMentions);
  const matches = uniquePlaces(
    maximalMentions.filter((mention) =>
      /\b(?:in|across|inside|near|at|throughout|within)\s+(?:the\s+)?(?:(?:northern|southern|eastern|western|central)\s+)?$/i.test(
        article.title.slice(0, mention.start),
      ),
    ),
  );
  if (matches.length !== 1 || allMentions.length !== 1) return null;
  const place = matches[0];
  if (!place) return null;
  const { country, latitude, longitude } = place;
  const sentiment = articleEventImpact(article) ?? 0;
  return {
    id: article.id,
    location: { name: "Approximate national location", country, latitude, longitude },
    category: article.category ?? "Society",
    sentiment,
    severity: articleSeverity(article),
    occurredAt: article.publishedAt,
    articles: [article],
    articleCount: 1,
    isDemo: false,
  };
}
