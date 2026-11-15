import { Layers3, X } from "lucide-react";
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
    <aside className="flex h-full max-h-full min-h-0 flex-col overflow-hidden rounded-none border border-report-rule bg-report-paper" aria-label="The Briefing">
      <div className="flex items-center justify-between border-b border-report-rule px-4 py-4">
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
          <section aria-label="Situation">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-display text-base font-bold uppercase text-signal">Situation</h4>
            <span className="font-system text-[8px] text-muted-foreground">DEMO DATA</span>
          </div>
          <h3 className="mt-3 font-mono text-[15px] font-medium leading-7 text-balance">
            {getPrimaryArticle(selectedEvent).title}
            <span className="ml-2 font-system text-[10px] font-normal text-muted-foreground">— {selectedEvent.category}</span>
          </h3>
          </section>

          <section className="mt-5 border-t border-report-rule pt-3" aria-label="Assessment">
          <h4 className="font-display text-base font-bold uppercase text-signal">Assessment</h4>
          <div className="mt-3 grid grid-cols-2">
            <div className="col-span-2 min-w-0 border-b border-report-rule pb-3">
              <p className="font-system text-[8px] uppercase text-signal/80">Location</p>
              <p className="mt-2 text-[11px] leading-5 text-foreground/85">{selectedEvent.location.name}, {selectedEvent.location.country}</p>
              <p className="mt-1 font-system text-[9px] text-muted-foreground">
                {Math.abs(selectedEvent.location.latitude).toFixed(2)}°{selectedEvent.location.latitude >= 0 ? "N" : "S"} · {Math.abs(selectedEvent.location.longitude).toFixed(2)}°{selectedEvent.location.longitude >= 0 ? "E" : "W"}
              </p>
            </div>
            <div className="min-w-0 border-r border-report-rule py-3 pr-3">
              <p className="font-system text-[8px] uppercase text-signal/80">Sentiment</p>
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
            <div className="severity-display min-w-0 py-3 pl-3" style={{ "--severity-position": `${selectedEvent.severity * 100}%` } as CSSProperties}>
              <p className="font-system text-[8px] uppercase text-signal/80">Severity</p>
              <p className="severity-number mt-1.5 font-system text-lg font-normal">{Math.round(selectedEvent.severity * 100)}<span className="text-xs">%</span></p>
              <Progress
                value={selectedEvent.severity * 100}
                aria-label="Event severity"
                className="severity-meter mt-2 h-0.5 bg-secondary"
              />
            </div>
          </div>
          </section>

          <section className="mt-2 border-t border-report-rule pt-3" aria-label="Source Notes">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-base font-bold uppercase text-signal">Source Notes</h4>
            <span className="font-system text-[9px] text-muted-foreground">{selectedEvent.articleCount} total</span>
          </div>
          <div className="mt-3 divide-y divide-report-rule">
            {selectedEvent.articles.map((article) => (
              <article key={article.id} className="py-3 first:pt-0">
                <div className="flex items-center justify-between gap-3 font-system text-[8px] uppercase tracking-wider text-muted-foreground">
                  <span className="font-mono">{article.source}</span>
                  <span className="shrink-0">{formatDemoTime(article.publishedAt)}</span>
                </div>
                <h5 className="mt-2 text-[11px] font-medium leading-5 text-foreground/85">{article.title}</h5>
                <p className="mt-2 font-system text-[8px] uppercase tracking-[0.12em] text-signal/80">Fictional demo article</p>
              </article>
            ))}
          </div>
          <p className="mt-3 border-t border-report-rule pt-3 text-[9px] leading-4 text-muted-foreground">
            Sample sentiment and severity are illustrative. Location refers to the fictional event, not a publisher.
          </p>
          </section>
        </div>
      </ScrollArea>
    </aside>
  );
}
