import { classifySentimentLocally, type SentimentPrediction } from "./local-sentiment";
import { headlineSeverity, locateNews } from "./publisher-news";
import type { Classification } from "./news-classification";
import type { NewsArticle } from "@/types/news";

export function sentimentFromPredictions(predictions: SentimentPrediction[]) {
  const scores = new Map(predictions.map(({ label, score }) => [label.toLowerCase(), score]));
  const negative = scores.get("negative");
  const neutral = scores.get("neutral");
  const positive = scores.get("positive");
  if ([negative, neutral, positive].some(score => score === undefined || !Number.isFinite(score) || score < 0 || score > 1)) {
    throw new Error("The local sentiment model returned invalid scores.");
  }
  const total = negative! + neutral! + positive!;
  if (Math.abs(total - 1) > 0.02) throw new Error("The local sentiment model returned incomplete scores.");
  const confidence = Math.max(negative!, neutral!, positive!);
  const sentiment = neutral! >= confidence ? 0 : positive! > negative!
    ? Math.max(0.21, positive! - negative!) : -Math.max(0.21, negative! - positive!);
  return { sentiment, confidence };
}

export async function classifyLocally(article: NewsArticle, onProgress?: (progress: number) => void): Promise<Classification> {
  const predictions = await classifySentimentLocally(`${article.title}. ${article.description ?? ""}`.slice(0, 900), onProgress);
  const { sentiment, confidence } = sentimentFromPredictions(predictions);
  const event = locateNews(article);
  return {
    articleId: article.id,
    eventLocationName: event?.location.name ?? null,
    countryCode: null,
    location: event?.location ?? null,
    sentiment,
    severity: headlineSeverity(article.title),
    confidence,
    rationale: "Sentiment from the local classifier; severity and location from headline rules.",
    analyzedAt: new Date().toISOString(),
  };
}
