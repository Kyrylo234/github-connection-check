import { Activity, Info } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import type { TensionReading } from "@/lib/news-analysis";

interface TensionIndexProps {
  reading: TensionReading;
  eventCount: number;
}

export function TensionIndex({ reading, eventCount }: TensionIndexProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 sm:gap-4" data-testid="tension-index">
      <div className="hidden size-9 items-center justify-center rounded-lg border border-signal/20 bg-signal/8 sm:flex">
        <Activity className="size-4 text-signal" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            World Tension Index
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <button className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" aria-label="Explain the World Tension Index">
                <Info className="size-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 rounded-xl p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">Transparent calculation</p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                For each selected event, negative sentiment magnitude is multiplied by severity and article-cluster weight.
              </p>
              <div className="mt-3 rounded-lg border bg-background/50 p-3 font-mono text-[10px] leading-5 text-foreground">
                pressure = max(0, −sentiment)<br />
                × (0.7 + 0.3 × severity)<br />
                × (1 + 0.15 × log₂(articles))
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                The average pressure is scaled to 0–100 and capped. Currently uses {eventCount} events and {reading.totalArticles} articles; {reading.negativeEvents} events have negative sentiment.
              </p>
              <p className="mt-3 border-t pt-3 text-[11px] leading-5 text-muted-foreground">
                Experimental news-based signal only. It is not a validated measure of global stability.
              </p>
            </PopoverContent>
          </Popover>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-display text-2xl font-semibold leading-none tracking-tight" aria-label={`Tension score ${reading.score} out of 100`}>
            {reading.score}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">/100</span>
          <span className="rounded-full border border-signal/20 bg-signal/8 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-signal">
            {reading.band}
          </span>
        </div>
        <Progress value={reading.score} className="mt-2 h-0.5 w-28 bg-secondary" aria-label="World Tension Index" />
        <p className="mt-1.5 hidden font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground md:block">
          Experimental signal · Demo events
        </p>
      </div>
    </div>
  );
}
