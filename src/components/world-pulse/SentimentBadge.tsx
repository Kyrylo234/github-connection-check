import { getSentiment } from "@/lib/news-analysis";
import { cn } from "@/lib/utils";

const sentimentStyles = {
  positive: "border-sentiment-positive/20 bg-sentiment-positive/8 text-sentiment-positive",
  neutral: "border-sentiment-neutral/20 bg-sentiment-neutral/8 text-sentiment-neutral",
  negative: "border-sentiment-negative/20 bg-sentiment-negative/8 text-sentiment-negative",
};

const dotStyles = {
  positive: "bg-sentiment-positive",
  neutral: "bg-sentiment-neutral",
  negative: "bg-sentiment-negative",
};

export function SentimentDot({ score, className }: { score: number; className?: string }) {
  const sentiment = getSentiment(score);
  return <span className={cn("inline-block size-1.5 shrink-0 rounded-full", dotStyles[sentiment], className)} aria-hidden="true" />;
}

export function SentimentBadge({ score, showScore = false }: { score: number; showScore?: boolean }) {
  const sentiment = getSentiment(score);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-system text-[9px] uppercase tracking-wider", sentimentStyles[sentiment])}>
      <SentimentDot score={score} />
      {sentiment}{showScore ? ` ${score > 0 ? "+" : ""}${score.toFixed(2)}` : ""}
    </span>
  );
}
