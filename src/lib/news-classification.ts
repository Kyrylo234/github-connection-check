import { z } from "zod";
import { locateNews } from "./publisher-news";
import type { AnalyzedNewsEvent, NewsArticle } from "@/types/news";

export const analysisSchema = z
  .object({
    results: z.array(
      z
        .object({
          articleId: z.string(),
          eventLocationName: z.string().nullable(),
          countryCode: z.string().nullable(),
          sentiment: z.number(),
          severity: z.number(),
          confidence: z.number(),
          rationale: z.string(),
        })
        .strict(),
    ),
  })
  .strict();
export type Classification = z.infer<typeof analysisSchema>["results"][number] & {
  location: AnalyzedNewsEvent["location"] | null;
  analyzedAt: string;
  locationConfidence?: number;
};
export interface AnalysisState {
  results: Classification[];
  error: string | null;
  lastUpdatedAt: string | null;
}

export function validateClassification(value: unknown, ids: string[]) {
  const parsed = analysisSchema.parse(Array.isArray(value) ? { results: value } : value);
  const resultIds = parsed.results.map((result) => result.articleId);
  if (
    resultIds.length !== ids.length ||
    new Set(resultIds).size !== ids.length ||
    resultIds.some((id) => !ids.includes(id))
  )
    throw new Error("AI results did not match the submitted articles");
  return parsed.results.map((result) => ({
    ...result,
    sentiment: Math.max(-1, Math.min(1, result.sentiment)),
    severity: Math.max(0, Math.min(1, result.severity)),
    confidence: Math.max(0, Math.min(1, result.confidence)),
    rationale: result.rationale.slice(0, 500),
    eventLocationName: result.eventLocationName?.slice(0, 120) ?? null,
    countryCode: result.countryCode?.toUpperCase() ?? null,
  }));
}

export function storySignals(articles: NewsArticle[], results: Classification[]) {
  return articles.flatMap((article) => {
    const classified = results.find((result) => result.articleId === article.id);
    const heuristic = locateNews(article);
    if (classified)
      return [
        {
          occurredAt: article.publishedAt,
          sentiment: classified.sentiment,
          severity: classified.severity,
          articleCount: 1,
        },
      ];
    return heuristic ? [heuristic] : [];
  });
}

/** Spend the bounded AI batch on headlines that cannot already be pinned safely. */
export function selectStoriesForAnalysis(
  articles: readonly NewsArticle[],
  analyzedIds: ReadonlySet<string>,
  limit: number,
): NewsArticle[] {
  const fresh = articles.filter((article) => !analyzedIds.has(article.id));
  return [
    ...fresh.filter((article) => !locateNews(article)),
    ...fresh.filter((article) => locateNews(article)),
  ].slice(0, limit);
}

export function classifiedEvents(
  articles: NewsArticle[],
  results: Classification[],
): AnalyzedNewsEvent[] {
  return articles.flatMap((article): AnalyzedNewsEvent[] => {
    const classified = results.find((result) => result.articleId === article.id);
    if (!classified) {
      const event = locateNews(article);
      return event ? [{ ...event, analysisMethod: "Heuristic fallback" as const }] : [];
    }
    if (!classified.location || (classified.locationConfidence ?? classified.confidence) < 0.6) {
      const heuristic = locateNews(article);
      return heuristic ? [{ ...heuristic, analysisMethod: "Heuristic fallback" as const }] : [];
    }
    return [
      {
        id: article.id,
        location: classified.location,
        category: article.category ?? "Society",
        occurredAt: article.publishedAt,
        articles: [article],
        articleCount: 1,
        isDemo: false,
        sentiment: classified.sentiment,
        severity: classified.severity,
        confidence: classified.confidence,
        rationale: classified.rationale,
        analysisMethod: "Gemini AI" as const,
      },
    ];
  });
}

/** The shared headline cache and live archive only retain stories that can be pinned. */
export function mappableArticles(
  articles: NewsArticle[],
  results: Classification[],
): NewsArticle[] {
  const mappedIds = new Set(classifiedEvents(articles, results).map((event) => event.id));
  return articles.filter((article) => mappedIds.has(article.id));
}

export function clusterNews(events: AnalyzedNewsEvent[]): AnalyzedNewsEvent[] {
  const groups = new Map<string, AnalyzedNewsEvent[]>();
  for (const event of events) {
    const key = `${event.location.latitude}:${event.location.longitude}:${event.analysisMethod}`;
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.values()].flatMap((group) => {
    const first = group[0];
    if (!first) return [];
    return [
      {
        ...first,
        id: `cluster:${first.location.latitude}:${first.location.longitude}:${first.analysisMethod}`,
        articles: group.flatMap((event) => event.articles),
        articleCount: group.length,
        sentiment: group.reduce((sum, event) => sum + event.sentiment, 0) / group.length,
        severity: Math.max(...group.map((event) => event.severity)),
        occurredAt: group.reduce(
          (latest, event) => (event.occurredAt > latest ? event.occurredAt : latest),
          first.occurredAt,
        ),
      },
    ];
  });
}
