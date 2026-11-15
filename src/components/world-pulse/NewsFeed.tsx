import type { CSSProperties } from "react";
import { ChevronRight, FilterX, Newspaper, Radio } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { getPrimaryArticle } from "@/data/demoNews";
import { formatDemoTime } from "@/lib/news-analysis";
import { cn } from "@/lib/utils";
import type { AnalyzedNewsEvent } from "@/types/news";
import { SentimentDot } from "./SentimentBadge";

interface NewsFeedProps {
  events: AnalyzedNewsEvent[];
  selectedEventId: string | null;
  onSelect: (eventId: string) => void;
  onResetFilters: () => void;
}

export function NewsFeed({ events, selectedEventId, onSelect, onResetFilters }: NewsFeedProps) {
  return (
    <section className="glass-panel flex h-full min-h-0 flex-col overflow-hidden rounded-xl" aria-labelledby="news-feed-title">
      <div className="flex items-center justify-between border-b px-4 py-4">
        <div className="flex items-center gap-2.5">
          <Newspaper className="size-4 text-signal" aria-hidden="true" />
          <h2 id="news-feed-title" className="font-display text-sm font-semibold">News feed</h2>
        </div>
        <span className="rounded-md border bg-background/40 px-2 py-1 font-mono text-[9px] text-muted-foreground">
          {events.length} event{events.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex items-center justify-between border-b bg-background/20 px-4 py-2.5">
        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          <Radio className="size-3 text-signal" /> Latest signals
        </span>
        <span className="font-mono text-[8px] tracking-[0.14em] text-signal">DEMO DATA</span>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <FilterX className="size-8 text-muted-foreground" aria-hidden="true" />
          <h3 className="mt-4 text-sm font-semibold">No signals match</h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Try a wider time range or include every sentiment.</p>
          <button onClick={onResetFilters} className="mt-4 rounded-md border bg-secondary px-3 py-2 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            Reset filters
          </button>
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-2">
            {events.map((event, index) => {
              const article = getPrimaryArticle(event);
              const selected = event.id === selectedEventId;
              return (
                <button
                  key={event.id}
                  onClick={() => onSelect(event.id)}
                  className={cn(
                    "group animate-fade-up stagger relative w-full rounded-lg border border-transparent p-3 text-left transition-colors duration-200 hover:border-border hover:bg-secondary/55 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    selected && "border-signal/25 bg-signal/8 hover:bg-signal/10",
                  )}
                  style={{ "--i": Math.min(index, 10) } as CSSProperties}
                  aria-pressed={selected}
                  aria-label={`Open demo event: ${article.title}`}
                >
                  <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    <SentimentDot score={event.sentiment} />
                    <span>{event.category}</span>
                    <span className="text-border">/</span>
                    <span>{formatDemoTime(event.occurredAt)}</span>
                    <span className="ml-auto text-[8px] text-signal/80">DEMO</span>
                  </div>
                  <h3 className="mt-2 text-[12px] font-medium leading-[1.55] text-foreground/90 transition-colors group-hover:text-foreground">
                    {article.title}
                  </h3>
                  <div className="mt-2.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="truncate">{event.location.name}, {event.location.country}</span>
                    <span className="ml-auto shrink-0 font-mono text-[9px]">{event.articleCount} article{event.articleCount === 1 ? "" : "s"}</span>
                    <ChevronRight className="size-3 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </section>
  );
}
