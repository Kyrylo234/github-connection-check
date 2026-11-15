import { lazy, Suspense, useMemo, useState } from "react";
import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  FlaskConical,
  Globe2,
  Radio,
} from "lucide-react";

import briefingRoom from "@/assets/briefing-room.jpg";
import { GlobeFilters } from "@/components/world-pulse/GlobeFilters";
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
      { title: "SitRep — Global Situation Room" },
      {
        name: "description",
        content: "Explore SitRep’s demo 3D globe of global news sentiment, regional events and an experimental World Tension Index.",
      },
      { property: "og:title", content: "SitRep — Global Situation Room" },
      {
        property: "og:description",
        content: "SitRep’s interactive demo globe of geographically located news sentiment and crisis signals.",
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
      <p className="font-system text-[9px] uppercase tracking-[0.2em] text-signal">Initialising orbit view</p>
    </div>
  );
}

function Index() {
  const [sentiment, setSentiment] = useState<SentimentFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [minimumSeverity, setMinimumSeverity] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const filteredEvents = useMemo(
    () => filterNewsEvents(demoNewsEvents, sentiment, timeRange, undefined, minimumSeverity),
    [sentiment, timeRange, minimumSeverity],
  );
  const tension = useMemo(() => calculateTensionIndex(filteredEvents), [filteredEvents]);
  const selectedEvent = filteredEvents.find((event) => event.id === selectedEventId) ?? null;

  const selectEvent = (eventId: string) => setSelectedEventId(eventId);
  return (
    <div className="briefing-dashboard flex flex-col bg-background text-foreground">
      <header className="briefing-header relative z-40 shrink-0 border-b">
        <div className="mx-auto flex h-[74px] w-full max-w-[1920px] items-center gap-2 px-4 sm:gap-5 sm:px-5">
          <Link to="/" className="group flex shrink-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" aria-label="SitRep home">
            <span className="relative hidden size-9 items-center justify-center rounded-sm border border-signal/40 bg-signal/8 sm:flex">
              <Globe2 className="size-5 text-signal transition-transform duration-200 group-hover:rotate-12" aria-hidden="true" />
              <span className="absolute right-1.5 top-1.5 size-1 rounded-full bg-sentiment-positive" />
            </span>
            <span>
              <span className="block font-display text-2xl font-bold leading-none sm:text-3xl">SitRep</span>
            </span>
          </Link>

          <nav className="flex h-full items-center gap-1 sm:ml-6" aria-label="Primary navigation">
            <Link to="/" className="relative flex h-full items-center gap-2 border-b border-signal px-2 text-xs font-medium text-foreground sm:px-3">
              <Radio className="size-3.5 text-signal" aria-hidden="true" />
              <span>Globe</span>
            </Link>
            <Link to="/scenarios" className="group flex h-full items-center gap-2 border-b border-transparent px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3">
              <FlaskConical className="size-3.5" aria-hidden="true" />
              <span className="hidden md:inline">Scenario Lab</span><span className="md:hidden">Lab</span>
              <ArrowUpRight className="hidden size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden h-8 w-px bg-border sm:block" />
            <TensionIndex reading={tension} eventCount={filteredEvents.length} />
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 flex-col">
        <GlobeFilters sentiment={sentiment} timeRange={timeRange} minimumSeverity={minimumSeverity}
          onSentimentChange={(value) => { setSentiment(value); setSelectedEventId(null); }}
          onTimeRangeChange={(value) => { setTimeRange(value); setSelectedEventId(null); }}
          onSeverityChange={(value) => { setMinimumSeverity(value); setSelectedEventId(null); }} />

        <section className="briefing-display relative min-h-[540px] flex-1 overflow-hidden" aria-label="Interactive 3D news globe">
            <img src={briefingRoom} alt="" width={1920} height={1088} className="briefing-room-image" />
            <div className="briefing-room-shade pointer-events-none absolute inset-0" />
            <div className="pointer-events-none absolute right-7 top-7 z-20 rounded-sm border bg-background/80 p-3">
              <p className="mb-2 font-system text-[8px] uppercase tracking-[0.15em] text-muted-foreground">Sentiment</p>
              <div className="space-y-1.5">
                {(["positive", "neutral", "negative"] as const).map((item) => (
                  <div key={item} className="flex items-center gap-2 font-system text-[8px] uppercase tracking-wider text-muted-foreground">
                    <SentimentDot score={item === "positive" ? 0.5 : item === "negative" ? -0.5 : 0} /> {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 isolate z-0">
              <ClientOnly fallback={<GlobeFallback />}>
                <Suspense fallback={<GlobeFallback />}>
                  <WorldGlobe sourceEvents={demoNewsEvents} events={filteredEvents} selectedEventId={selectedEventId} autoRotate={true} resetToken={0} onSelect={selectEvent} onClose={() => setSelectedEventId(null)} />
                </Suspense>
              </ClientOnly>
            </div>
            <div className="pointer-events-none absolute bottom-7 left-7 z-20 hidden font-system text-[8px] uppercase text-muted-foreground lg:block">
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
