import type { CSSProperties } from "react";
import calmEarth from "@/assets/tension-earth-calm.jpg";
import fieryEarth from "@/assets/tension-earth-inferno.jpg";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TensionReading } from "@/lib/news-analysis";
import { getTensionFireIntensity } from "@/lib/tension-visual";

interface TensionIndexProps {
  reading: TensionReading;
  eventCount: number;
}

export function TensionIndex({ reading, eventCount }: TensionIndexProps) {
  const fireIntensity = getTensionFireIntensity(reading.score);

  return (
    <div className="min-w-0" data-testid="tension-index">
      <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-auto gap-1 p-0 hover:bg-transparent sm:gap-2" aria-label={`World Tension Index: ${reading.score} out of 100. View calculation`}>
                <span className="relative block size-11 shrink-0 sm:size-16" style={{ "--tension-heat": `${fireIntensity * 100}%`, "--tension-glow-opacity": 0.12 + fireIntensity * 0.38 } as CSSProperties} role="img" aria-label={fireIntensity === 0 ? "Calm Earth" : `Earth with ${Math.round(fireIntensity * 100)} percent fire intensity`}>
                  <span className="tension-earth-glow pointer-events-none absolute rounded-full" aria-hidden="true" />
                  <span className="tension-earth absolute inset-0 overflow-hidden">
                  <img src={calmEarth} alt="" width={816} height={816} className="absolute inset-0 size-full object-contain" />
                  <img src={fieryEarth} alt="" width={816} height={816} className="absolute inset-0 size-full object-contain transition-opacity duration-700" style={{ opacity: fireIntensity }} data-testid="tension-fire" />
                  {fireIntensity > 0 && (
                    <span className="tension-flickers pointer-events-none absolute inset-0" style={{ "--fire-intensity": fireIntensity } as CSSProperties} aria-hidden="true">
                      {[0, 1, 2].map((patch) => (
                        <img key={patch} src={fieryEarth} alt="" width={816} height={816} className="tension-fire-patch absolute inset-0 size-full animate-fire-flicker object-contain" />
                      ))}
                    </span>
                  )}
                  </span>
                </span>
                <span className="block text-left">
                  <span className="hidden font-system text-[9px] uppercase leading-4 text-muted-foreground sm:block">World Tension</span>
                  <span className="flex items-baseline gap-1">
                    <span className="font-system text-2xl font-normal leading-none tabular-nums" aria-label={`Tension score ${reading.score} out of 100`}>{reading.score}</span>
                    <span className="font-system text-[9px] font-normal text-muted-foreground">/100</span>
                  </span>
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 rounded-xl p-4">
              <p className="font-system text-[10px] uppercase tracking-[0.16em] text-signal">Transparent calculation</p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Uses available publisher stories from the latest 24 hours of the current snapshot, regardless of map filters or confirmed locations. Negative sentiment magnitude is multiplied by severity and article-cluster weight.
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
  );
}
