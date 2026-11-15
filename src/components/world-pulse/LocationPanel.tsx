import { Crosshair, FileText, Layers3, MapPin, ShieldAlert, X } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPrimaryArticle } from "@/data/demoNews";
import { formatDemoTime, formatSentiment, getSentiment } from "@/lib/news-analysis";
import type { AnalyzedNewsEvent } from "@/types/news";
import { SentimentBadge } from "./SentimentBadge";

const sentimentNumberStyles = {
  positive: "text-sentiment-positive",
  neutral: "text-sentiment-neutral",
  negative: "text-sentiment-negative",
};

interface LocationPanelProps {
  events: AnalyzedNewsEvent[];
  selectedEvent: AnalyzedNewsEvent | null;
  onSelect: (eventId: string) => void;
  onClose: () => void;
}

export function LocationPanel({ events, selectedEvent, onSelect, onClose }: LocationPanelProps) {
  const sentimentCounts = {
    positive: events.filter((event) => getSentiment(event.sentiment) === "positive").length,
    neutral: events.filter((event) => getSentiment(event.sentiment) === "neutral").length,
    negative: events.filter((event) => getSentiment(event.sentiment) === "negative").length,
  };
  const highestSeverity = [...events].sort((a, b) => b.severity - a.severity).slice(0, 3);

  return (
    <aside className="glass-panel flex h-full min-h-0 flex-col overflow-hidden rounded-xl" aria-label="Location intelligence panel">
      <div className="flex items-center justify-between border-b px-4 py-4">
        <div className="flex items-center gap-2.5">
          <Layers3 className="size-4 text-signal" aria-hidden="true" />
          <h2 className="font-display text-sm font-semibold">{selectedEvent ? "Location intelligence" : "Signal intelligence"}</h2>
        </div>
        {selectedEvent ? (
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" aria-label="Close location panel">
            <X className="size-4" />
          </button>
        ) : <span className="font-mono text-[8px] tracking-[0.14em] text-signal">DEMO DATA</span>}
      </div>

      {selectedEvent ? (
        <ScrollArea className="min-h-0 flex-1">
          <div className="animate-fade-up p-4" key={selectedEvent.id}>
            <div className="flex flex-wrap items-center gap-2">
              <SentimentBadge score={selectedEvent.sentiment} />
              <span className="rounded-full border bg-background/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{selectedEvent.category}</span>
              <span className="ml-auto font-mono text-[8px] tracking-[0.14em] text-signal">DEMO DATA</span>
            </div>
            <h3 className="mt-4 font-display text-[17px] font-semibold leading-7 text-balance">
              {getPrimaryArticle(selectedEvent).title}
            </h3>
            <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-signal" aria-hidden="true" />
              <div>
                <p className="text-foreground/85">{selectedEvent.location.name}, {selectedEvent.location.country}</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider">
                  {Math.abs(selectedEvent.location.latitude).toFixed(2)}°{selectedEvent.location.latitude >= 0 ? "N" : "S"} · {Math.abs(selectedEvent.location.longitude).toFixed(2)}°{selectedEvent.location.longitude >= 0 ? "E" : "W"}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-lg border bg-background/30 p-3">
                <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">Sentiment</p>
                <p className="mt-1.5 font-display text-lg font-semibold">{formatSentiment(selectedEvent.sentiment)}</p>
                <p className="mt-0.5 text-[9px] text-muted-foreground">−1 to +1</p>
              </div>
              <div className="rounded-lg border bg-background/30 p-3">
                <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">Severity</p>
                <p className="mt-1.5 font-display text-lg font-semibold">{Math.round(selectedEvent.severity * 100)}<span className="text-xs text-muted-foreground">%</span></p>
                <Progress value={selectedEvent.severity * 100} className="mt-2 h-0.5 bg-secondary" />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t pt-4">
              <h4 className="flex items-center gap-2 text-xs font-semibold"><FileText className="size-3.5 text-signal" /> Related articles</h4>
              <span className="font-mono text-[9px] text-muted-foreground">{selectedEvent.articleCount} total</span>
            </div>
            <div className="mt-3 space-y-2.5">
              {selectedEvent.articles.map((article) => (
                <article key={article.id} className="rounded-lg border bg-background/30 p-3">
                  <div className="flex items-center justify-between gap-3 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                    <span>{article.source}</span>
                    <span className="shrink-0">{formatDemoTime(article.publishedAt)}</span>
                  </div>
                  <h5 className="mt-2 text-[11px] font-medium leading-5 text-foreground/85">{article.title}</h5>
                  <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.12em] text-signal/80">Fictional demo article</p>
                </article>
              ))}
            </div>
            <p className="mt-4 border-t pt-3 text-[9px] leading-4 text-muted-foreground">
              Sample sentiment and severity are illustrative. Location refers to the fictional event, not a publisher.
            </p>
          </div>
        </ScrollArea>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-4">
            <div className="flex flex-col items-center rounded-lg border border-dashed bg-background/20 px-5 py-7 text-center">
              <div className="relative flex size-14 items-center justify-center rounded-full border border-signal/20 bg-signal/5">
                <div className="absolute inset-1 animate-pulse-soft rounded-full border border-signal/15" />
                <Crosshair className="size-5 text-signal" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-sm font-semibold">Explore a signal</h3>
              <p className="mt-2 text-[11px] leading-5 text-muted-foreground">Select a glowing hotspot or news entry to inspect its location and related demo articles.</p>
            </div>

            <div className="mt-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Selected set</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(["positive", "neutral", "negative"] as const).map((sentiment) => (
                  <div key={sentiment} className="rounded-lg border bg-background/30 p-2.5 text-center">
                    <p className={`font-display text-xl font-semibold ${sentimentNumberStyles[sentiment]}`}>{sentimentCounts[sentiment]}</p>
                    <p className="mt-1 font-mono text-[7px] uppercase tracking-wider text-muted-foreground">{sentiment}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t pt-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-3.5 text-signal" />
                <h3 className="text-xs font-semibold">Highest severity</h3>
              </div>
              <div className="mt-3 space-y-2">
                {highestSeverity.map((event) => (
                  <button key={event.id} onClick={() => onSelect(event.id)} className="group w-full rounded-lg border bg-background/25 p-3 text-left transition-colors hover:bg-secondary/55 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                      <span>{event.location.name}</span><span>{Math.round(event.severity * 100)}% severity</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-foreground/80 group-hover:text-foreground">{getPrimaryArticle(event).title}</p>
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
              <MapPin className="size-3" /> {events.length} events in selected set
            </p>
          </div>
        </ScrollArea>
      )}
    </aside>
  );
}
