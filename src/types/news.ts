export type NewsCategory =
  | "Conflict"
  | "Climate"
  | "Economy"
  | "Health"
  | "Technology"
  | "Diplomacy"
  | "Society";

export type Sentiment = "positive" | "neutral" | "negative";
export type SentimentFilter = "all" | Sentiment;
/** Rolling lookback duration in minutes. */
export type TimeRange = number;

/** Stable article shape: live providers can replace demo fixtures without changing the UI. */
export interface NewsArticle {
  id: string;
  title: string;
  description?: string;
  category?: NewsCategory;
  source: string;
  author?: string;
  publishedAt: string;
  url?: string;
  isDemo: boolean;
}

/** Geolocation describes where the event happened, never the publisher's headquarters. */
export interface AnalyzedNewsEvent {
  id: string;
  location: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  category: NewsCategory;
  sentiment: number;
  severity: number;
  occurredAt: string;
  articles: NewsArticle[];
  articleCount: number;
  isDemo: boolean;
  analysisMethod?: "Gemini AI" | "Heuristic fallback";
  confidence?: number;
  rationale?: string;
}
