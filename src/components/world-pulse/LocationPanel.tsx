import { FileText, Layers3, MapPin, X } from "lucide-react";
import type { CSSProperties } from "react";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { getPrimaryArticle } from "@/data/demoNews";
import { formatDemoTime, formatSentiment, getSentiment } from "@/lib/news-analysis";
import type { AnalyzedNewsEvent } from "@/types/news";
import { SentimentBadge } from "./SentimentBadge";

interface LocationPanelProps {
  selectedEvent: AnalyzedNewsEvent;
  onClose: () => void;
}

export function LocationPanel({ selectedEvent, onClose }: LocationPanelProps) {
  const sliderColour = {
    negative: "[&_[data-radix-slider-range]]:bg-sentiment-negative [&_[role=slider]]:border-sentiment-negative [&_[role=slider]]:bg-sentiment-negative",
    neutral: "[&_[data-radix-slider-range]]:bg-sentiment-neutral [&_[role=slider]]:border-sentiment-neutral [&_[role=slider]]:bg-sentiment-neutral",
    positive: "[&_[data-radix-slider-range]]:bg-sentiment-positive [&_[role=slider]]:border-sentiment-positive [&_[role=slider]]:bg-sentiment-positive",
  }[getSentiment(selectedEvent.sentiment)];
  return (
    <aside className="glass-panel flex h-full max-h-full min-h-0 flex-col overflow-hidden rounded-sm border-t-2 border-t-signal bg-popover" aria-label="The Briefing">
      <div className="flex items-center justify-between border-b px-4 py-4">
        <div className="flex items-center gap-2.5">
          <Layers3 className="size-4 text-signal" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold uppercase">The Briefing</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="size-7 rounded-sm text-muted-foreground" aria-label="Close briefing">
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="animate-fade-up p-4" key={selectedEvent.id}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border bg-background/30 px-2 py-0.5 font-system text-[9px] uppercase tracking-wider text-muted-foreground">{selectedEvent.category}</span>
            <span className="ml-auto font-system text-[8px] tracking-[0.14em] text-signal">DEMO DATA</span>
          </div>
          <h3 className="mt-4 font-mono text-[15px] font-medium leading-7 text-balance">
            {getPrimaryArticle(selectedEvent).title}
          </h3>
          <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-signal" aria-hidden="true" />
            <div>
              <p className="text-foreground/85">{selectedEvent.location.name}, {selectedEvent.location.country}</p>
              <p className="mt-0.5 font-system text-[9px] uppercase tracking-wider">
                {Math.abs(selectedEvent.location.latitude).toFixed(2)}°{selectedEvent.location.latitude >= 0 ? "N" : "S"} · {Math.abs(selectedEvent.location.longitude).toFixed(2)}°{selectedEvent.location.longitude >= 0 ? "E" : "W"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 divide-x border-y py-3">
            <div className="px-3">
              <p className="font-system text-[8px] uppercase tracking-[0.14em] text-muted-foreground">Sentiment</p>
              <div className="mt-2">
                <SentimentBadge score={selectedEvent.sentiment} />
              </div>
              <Slider
                aria-label="Event sentiment"
                aria-valuetext={formatSentiment(selectedEvent.sentiment)}
                min={-1}
                max={1}
                step={0.01}
                value={[selectedEvent.sentiment]}
                disabled
                className={`mt-3 [&_[role=slider]]:opacity-100 ${sliderColour}`}
              />
              <div className="mt-2 flex justify-between font-system text-[9px] text-muted-foreground">
                <span>−1</span>
                <span>{formatSentiment(selectedEvent.sentiment)}</span>
                <span>+1</span>
              </div>
            </div>
            <div className="severity-display px-3" style={{ "--severity-position": `${selectedEvent.severity * 100}%` } as CSSProperties}>
              <p className="font-system text-[8px] uppercase tracking-[0.14em] text-muted-foreground">Severity</p>
              <p className="severity-number mt-1.5 font-system text-lg font-normal">{Math.round(selectedEvent.severity * 100)}<span className="text-xs">%</span></p>
              <Progress
                value={selectedEvent.severity * 100}
                aria-label="Event severity"
                className="severity-meter mt-2 h-0.5 bg-secondary"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t pt-4">
            <h4 className="flex items-center gap-2 font-display text-base font-bold"><FileText className="size-3.5 text-signal" /> Related articles</h4>
            <span className="font-system text-[9px] text-muted-foreground">{selectedEvent.articleCount} total</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {selectedEvent.articles.map((article) => (
              <article key={article.id} className="rounded-sm border bg-background/30 p-3">
                <div className="flex items-center justify-between gap-3 font-system text-[8px] uppercase tracking-wider text-muted-foreground">
                  <span className="font-mono">{article.source}</span>
                  <span className="shrink-0">{formatDemoTime(article.publishedAt)}</span>
                </div>
                <h5 className="mt-2 text-[11px] font-medium leading-5 text-foreground/85">{article.title}</h5>
                <p className="mt-2 font-system text-[8px] uppercase tracking-[0.12em] text-signal/80">Fictional demo article</p>
              </article>
            ))}
          </div>
          <p className="mt-4 border-t pt-3 text-[9px] leading-4 text-muted-foreground">
            Sample sentiment and severity are illustrative. Location refers to the fictional event, not a publisher.
          </p>
        </div>
      </ScrollArea>
    </aside>
  );
}
