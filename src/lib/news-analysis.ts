import { DEMO_SNAPSHOT_AT } from "@/data/demoNews";
import type {
  AnalyzedNewsEvent,
  Sentiment,
  SentimentFilter,
  TimeRange,
} from "@/types/news";

export const TIME_RANGE_HOURS: Record<TimeRange, number> = {
  "24h": 24,
  "72h": 72,
  "7d": 24 * 7,
  "30d": 24 * 30,
};

export function getSentiment(score: number): Sentiment {
  if (score > 0.2) return "positive";
  if (score < -0.2) return "negative";
  return "neutral";
}

export function filterNewsEvents(
  events: AnalyzedNewsEvent[],
  sentiment: SentimentFilter,
  timeRange: TimeRange,
  snapshotAt = DEMO_SNAPSHOT_AT,
) {
  const oldestTimestamp = Date.parse(snapshotAt) - TIME_RANGE_HOURS[timeRange] * 60 * 60 * 1000;

  return events.filter((event) => {
    const matchesSentiment = sentiment === "all" || getSentiment(event.sentiment) === sentiment;
    return matchesSentiment && Date.parse(event.occurredAt) >= oldestTimestamp;
  });
}

export function getHotspotIntensity(event: AnalyzedNewsEvent) {
  const sentimentMagnitude = Math.abs(event.sentiment);
  const clusterBoost = Math.log2(event.articleCount) / 5;
  return Math.min(1, sentimentMagnitude * 0.78 + clusterBoost + event.severity * 0.1);
}

export interface TensionReading {
  score: number;
  band: "Low" | "Elevated" | "High" | "Severe";
  totalArticles: number;
  negativeEvents: number;
}

/**
 * Experimental demo signal, not a validated stability measure.
 * Event pressure = max(0, -sentiment) × (0.7 + 0.3 × severity) × article weight.
 * Article weight = 1 + 0.15 × log₂(article count). Score = mean pressure × 100, capped.
 */
export function calculateTensionIndex(events: AnalyzedNewsEvent[]): TensionReading {
  const totalArticles = events.reduce((sum, event) => sum + event.articleCount, 0);
  const negativeEvents = events.filter((event) => event.sentiment < 0).length;
  if (events.length === 0) return { score: 0, band: "Low", totalArticles, negativeEvents };

  const totalPressure = events.reduce((sum, event) => {
    const negativeMagnitude = Math.max(0, -event.sentiment);
    const severityWeight = 0.7 + 0.3 * event.severity;
    const articleWeight = 1 + 0.15 * Math.log2(event.articleCount);
    return sum + negativeMagnitude * severityWeight * articleWeight;
  }, 0);

  const score = Math.min(100, Math.round((totalPressure / events.length) * 100));
  const band = score >= 75 ? "Severe" : score >= 50 ? "High" : score >= 25 ? "Elevated" : "Low";
  return { score, band, totalArticles, negativeEvents };
}

export function formatDemoTime(isoDate: string) {
  const elapsedHours = Math.max(
    0,
    Math.floor((Date.parse(DEMO_SNAPSHOT_AT) - Date.parse(isoDate)) / (60 * 60 * 1000)),
  );
  if (elapsedHours < 1) return "Just now";
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  return `${Math.floor(elapsedHours / 24)}d ago`;
}

export function formatSentiment(score: number) {
  return `${score > 0 ? "+" : ""}${score.toFixed(2)}`;
}
