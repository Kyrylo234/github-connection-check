import { lazy, Suspense, useMemo, useState } from "react";
import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  FlaskConical,
  Globe2,
  Pause,
  Play,
  Radio,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationPanel } from "@/components/world-pulse/LocationPanel";
import { SentimentDot } from "@/components/world-pulse/SentimentBadge";
import { TensionIndex } from "@/components/world-pulse/TensionIndex";
import { DEMO_SNAPSHOT_AT, demoNewsEvents } from "@/data/demoNews";
import { calculateTensionIndex, filterNewsEvents } from "@/lib/news-analysis";
import type { SentimentFilter, TimeRange } from "@/types/news";

const WorldGlobe = lazy(() => import("@/components/world-pulse/WorldGlobe"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "World Pulse — See the world's mood" },
      {
        name: "description",
        content: "Explore a demo 3D globe of global news sentiment, regional events and an experimental World Tension Index.",
      },
      { property: "og:title", content: "World Pulse — See the world's mood" },
      {
        property: "og:description",
        content: "An interactive demo globe of geographically located news sentiment and crisis signals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function GlobeFallback() {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-4">
      <div className="relative flex size-24 items-center justify-center rounded-full border border-signal/20 bg-signal/5">
        <div className="absolute inset-2 animate-pulse-soft rounded-full border border-signal/20" />
        <Globe2 className="size-9 text-signal" aria-hidden="true" />
      </div>
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-signal">Initialising orbit view</p>
    </div>
  );
}

function Index() {
  const [sentiment, setSentiment] = useState<SentimentFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [resetToken, setResetToken] = useState(0);

  const filteredEvents = useMemo(
    () => filterNewsEvents(demoNewsEvents, sentiment, timeRange),
    [sentiment, timeRange],
  );
  const tension = useMemo(() => calculateTensionIndex(filteredEvents), [filteredEvents]);
  const selectedEvent = filteredEvents.find((event) => event.id === selectedEventId) ?? null;

  const selectEvent = (eventId: string) => setSelectedEventId(eventId);
  const resetView = () => {
    setSelectedEventId(null);
    setResetToken((token) => token + 1);
  };
  return (
    <div className="min-h-screen bg-background text-foreground xl:flex xl:h-screen xl:flex-col xl:overflow-hidden">
      <header className="shrink-0 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] w-full max-w-[1920px] items-center gap-2 px-4 sm:gap-5 sm:px-5">
          <Link to="/" className="group flex shrink-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" aria-label="World Pulse home">
            <span className="relative hidden size-9 items-center justify-center rounded-lg border border-signal/25 bg-signal/8 sm:flex">
              <Globe2 className="size-5 text-signal transition-transform duration-200 group-hover:rotate-12" aria-hidden="true" />
              <span className="absolute right-1.5 top-1.5 size-1 rounded-full bg-sentiment-positive" />
            </span>
            <span>
              <span className="block font-display text-xs font-bold uppercase leading-none tracking-[0.18em] sm:text-[15px]">World Pulse</span>
              <span className="mt-1.5 hidden font-mono text-[7px] uppercase tracking-[0.2em] text-muted-foreground sm:block">Global sentiment observatory</span>
            </span>
          </Link>

          <nav className="flex h-full items-center gap-1 sm:ml-6" aria-label="Primary navigation">
            <Link to="/" className="relative flex h-full items-center gap-2 border-b border-signal px-2 text-xs font-medium text-foreground sm:px-3">
              <Radio className="size-3.5 text-signal" aria-hidden="true" />
              <span className="hidden sm:inline">Live globe</span><span className="sm:hidden">Globe</span>
            </Link>
            <Link to="/scenarios" className="group flex h-full items-center gap-2 border-b border-transparent px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3">
              <FlaskConical className="size-3.5" aria-hidden="true" />
              <span className="hidden md:inline">Scenario Lab</span><span className="md:hidden">Lab</span>
              <ArrowUpRight className="hidden size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-full border bg-secondary/30 px-3 py-1.5 lg:flex">
              <span className="size-1.5 animate-pulse-soft rounded-full bg-sentiment-positive" />
              <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">Demo environment</span>
            </div>
            <div className="hidden h-8 w-px bg-border sm:block" />
            <TensionIndex reading={tension} eventCount={filteredEvents.length} />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col gap-3 p-3 xl:min-h-0">
        <section className="glass-panel flex shrink-0 flex-col gap-4 rounded-xl px-4 py-3 lg:flex-row lg:items-center lg:justify-between" aria-label="Globe filters and controls">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg border bg-secondary/40">
              <SlidersHorizontal className="size-3.5 text-signal" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display text-sm font-semibold tracking-tight">Global signal map</h1>
              <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.13em] text-muted-foreground" aria-live="polite">
                {filteredEvents.length} fictional events · {tension.totalArticles} sample articles
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={sentiment} onValueChange={(value) => { setSentiment(value as SentimentFilter); setSelectedEventId(null); }}>
              <SelectTrigger aria-label="Filter by sentiment" className="h-8 w-[142px] border-border bg-background/40 font-mono text-[10px] shadow-none">
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sentiments</SelectItem>
                <SelectItem value="positive"><span className="flex items-center gap-2"><SentimentDot score={0.5} /> Positive</span></SelectItem>
                <SelectItem value="neutral"><span className="flex items-center gap-2"><SentimentDot score={0} /> Neutral</span></SelectItem>
                <SelectItem value="negative"><span className="flex items-center gap-2"><SentimentDot score={-0.5} /> Negative</span></SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={(value) => { setTimeRange(value as TimeRange); setSelectedEventId(null); }}>
              <SelectTrigger aria-label="Filter by time range" className="h-8 w-[132px] border-border bg-background/40 font-mono text-[10px] shadow-none">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="72h">Last 72 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>

            <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
            <Button variant="outline" size="sm" onClick={() => setAutoRotate((value) => !value)} className="h-8 border-border bg-background/40 px-3 font-mono text-[9px] uppercase tracking-wider shadow-none" aria-pressed={!autoRotate}>
              {autoRotate ? <Pause className="size-3" /> : <Play className="size-3" />}
              {autoRotate ? "Pause rotation" : "Resume rotation"}
            </Button>
            <Button variant="outline" size="sm" onClick={resetView} className="h-8 border-border bg-background/40 px-3 font-mono text-[9px] uppercase tracking-wider shadow-none">
              <RotateCcw className="size-3" /> Reset view
            </Button>
          </div>
        </section>

        <section className="glass-panel globe-vignette relative min-h-[540px] flex-1 overflow-hidden rounded-xl xl:min-h-0" aria-label="Interactive 3D news globe">
            <div className="pointer-events-none absolute inset-x-8 top-0 z-20 h-px animate-scan bg-signal/30" />
            <div className="pointer-events-none absolute left-4 top-4 z-20">
              <p className="font-mono text-[9px] uppercase tracking-[0.17em] text-signal">Global orbit</p>
              <p className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">{filteredEvents.length} signals · Drag to rotate · Scroll to zoom</p>
            </div>
            <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-lg border bg-background/55 p-3 backdrop-blur-md">
              <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.15em] text-muted-foreground">Sentiment</p>
              <div className="space-y-1.5">
                {(["positive", "neutral", "negative"] as const).map((item) => (
                  <div key={item} className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                    <SentimentDot score={item === "positive" ? 0.5 : item === "negative" ? -0.5 : 0} /> {item}
                  </div>
                ))}
              </div>
              <p className="mt-2.5 max-w-28 border-t pt-2 text-[8px] leading-3 text-muted-foreground">Larger glow = stronger sentiment + more articles</p>
            </div>
            <div className="absolute inset-0">
              <ClientOnly fallback={<GlobeFallback />}>
                <Suspense fallback={<GlobeFallback />}>
                  <WorldGlobe events={filteredEvents} selectedEventId={selectedEventId} autoRotate={autoRotate} resetToken={resetToken} onSelect={selectEvent} onClose={() => setSelectedEventId(null)} />
                </Suspense>
              </ClientOnly>
            </div>
            <div className="pointer-events-none absolute bottom-4 left-4 z-20 hidden font-mono text-[7px] uppercase tracking-[0.13em] text-muted-foreground md:block">
              Demo snapshot · {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", hour12: false }).format(new Date(DEMO_SNAPSHOT_AT))} UTC
            </div>
            {selectedEvent && (
              <div className="absolute inset-x-3 bottom-3 top-auto z-30 max-h-[calc(100%-1.5rem)] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-4 sm:w-[360px] sm:max-h-none">
                <LocationPanel selectedEvent={selectedEvent} onClose={() => setSelectedEventId(null)} />
              </div>
            )}
        </section>
      </main>
    </div>
  );
}
