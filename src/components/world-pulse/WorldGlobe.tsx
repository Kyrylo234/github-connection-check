import { createElement, useEffect, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { Globe2, MousePointer2 } from "lucide-react";

import earthAsset from "@/assets/world-pulse-earth.asset.json";
import { getPrimaryArticle } from "@/data/demoNews";
import { getHotspotIntensity, getSentiment } from "@/lib/news-analysis";
import { useHotspotFocus } from "@/hooks/use-hotspot-focus";
import type { AnalyzedNewsEvent, Sentiment } from "@/types/news";

interface WorldGlobeProps {
  events: AnalyzedNewsEvent[];
  sourceEvents: AnalyzedNewsEvent[];
  selectedEventId: string | null;
  autoRotate: boolean;
  resetToken: number;
  onSelect: (eventId: string) => void;
  onClose: () => void;
}

interface GlobePalette {
  positive: string;
  neutral: string;
  negative: string;
  atmosphere: string;
  transparent: string;
}

function readPalette(): GlobePalette {
  const styles = getComputedStyle(document.documentElement);
  return {
    positive: styles.getPropertyValue("--sentiment-positive-rgb").trim(),
    neutral: styles.getPropertyValue("--sentiment-neutral-rgb").trim(),
    negative: styles.getPropertyValue("--sentiment-negative-rgb").trim(),
    atmosphere: styles.getPropertyValue("--atmosphere-rgb").trim(),
    transparent: styles.getPropertyValue("--transparent-rgb").trim(),
  };
}

function cssChannels(value: string) {
  return value.trim().split(/\s+/).join(", ");
}

function browserSupportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function GlobeLoading() {
  return (
    <div className="flex h-full min-h-[420px] w-full flex-col items-center justify-center gap-5 text-center">
      <div className="relative flex size-28 items-center justify-center rounded-full border border-signal/20 bg-signal/5">
        <div className="absolute inset-2 animate-pulse-soft rounded-full border border-signal/20" />
        <Globe2 className="size-10 text-signal" aria-hidden="true" />
      </div>
      <div>
        <p className="font-system text-[10px] uppercase tracking-[0.22em] text-signal">Initialising orbit view</p>
        <p className="mt-2 text-sm text-muted-foreground">Preparing the demo globe…</p>
      </div>
    </div>
  );
}

export default function WorldGlobe({
  events,
  sourceEvents,
  selectedEventId,
  autoRotate,
  resetToken,
  onSelect,
  onClose,
}: WorldGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [palette] = useState<GlobePalette>(() => readPalette());
  const focusedHotspot = useHotspotFocus(sourceEvents, events, autoRotate, selectedEventId, resetToken);

  useEffect(() => {
    setWebGLSupported(browserSupportsWebGL());
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!globeReady || !globeRef.current) return;
    const controls = globeRef.current.controls();
    controls.autoRotate = autoRotate && !selectedEventId && !focusedHotspot;
    controls.autoRotateSpeed = 0.38;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 145;
    controls.maxDistance = 650;
  }, [autoRotate, selectedEventId, focusedHotspot, globeReady]);

  useEffect(() => {
    if (!globeReady || !globeRef.current) return;
    const aspect = dimensions.height / Math.max(dimensions.width, 1);
    const altitude = Math.min(4.4, 2.05 * Math.max(1, aspect * 0.78));
    globeRef.current.pointOfView({ lat: 24, lng: 28, altitude }, 850);
  }, [resetToken, globeReady, dimensions.height, dimensions.width]);

  useEffect(() => {
    if (!globeReady || !globeRef.current || !selectedEventId) return;
    const selected = events.find((event) => event.id === selectedEventId);
    if (!selected) return;
    const aspect = dimensions.height / Math.max(dimensions.width, 1);
    const altitude = Math.min(4.4, 1.75 * Math.max(1, aspect * 0.78));
    globeRef.current.pointOfView(
      {
        lat: selected.location.latitude,
        lng: selected.location.longitude,
        altitude,
      },
      750,
    );
  }, [selectedEventId, events, globeReady, dimensions.height, dimensions.width]);

  useEffect(() => {
    if (!globeReady || !globeRef.current || !focusedHotspot || selectedEventId || !autoRotate) return;
    const aspect = dimensions.height / Math.max(dimensions.width, 1);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    globeRef.current.pointOfView({
      lat: focusedHotspot.location.latitude,
      lng: focusedHotspot.location.longitude,
      altitude: Math.min(4.4, 1.75 * Math.max(1, aspect * 0.78)),
    }, reducedMotion ? 0 : 1000);
  }, [focusedHotspot, selectedEventId, autoRotate, globeReady, dimensions.height, dimensions.width]);

  if (webGLSupported === false) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center p-8">
        <div className="max-w-md text-center">
          <Globe2 className="mx-auto size-12 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-5 font-display text-xl font-bold">3D view unavailable</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Your browser couldn’t start WebGL. Try a WebGL-capable browser or enable hardware
            acceleration to explore the demo globe and its event details.
          </p>
        </div>
      </div>
    );
  }

  const rgba = (sentiment: Sentiment, alpha: number) => `rgba(${cssChannels(palette[sentiment])}, ${alpha})`;

  return (
    <div ref={containerRef} className="relative h-full min-h-[420px] w-full" data-scene-ready={globeReady || undefined}>
      {!globeReady && <div className="absolute inset-0 z-10 bg-background/40"><GlobeLoading /></div>}
      {webGLSupported && dimensions.width > 0 && dimensions.height > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl={earthAsset.url}
          backgroundColor={`rgba(${cssChannels(palette.transparent)}, 0)`}
          showAtmosphere
          atmosphereColor={`rgb(${cssChannels(palette.atmosphere)})`}
          atmosphereAltitude={0.12}
          showGraticules
          pointsData={events}
          pointLat={(item) => (item as AnalyzedNewsEvent).location.latitude}
          pointLng={(item) => (item as AnalyzedNewsEvent).location.longitude}
          pointColor={(item) => {
            const event = item as AnalyzedNewsEvent;
            return rgba(getSentiment(event.sentiment), 0.72 + getHotspotIntensity(event) * 0.28);
          }}
          pointAltitude={(item) => 0.003 + getHotspotIntensity(item as AnalyzedNewsEvent) * 0.006}
          pointRadius={(item) => 0.2 + getHotspotIntensity(item as AnalyzedNewsEvent) * 0.62}
          pointResolution={20}
          pointsTransitionDuration={450}
          pointLabel={(item: object) => {
            const event = item as AnalyzedNewsEvent;
            return createElement(
              "div",
              { className: "max-w-64 rounded-lg border bg-popover p-3 text-popover-foreground shadow-xl" },
              createElement("p", { className: "font-system text-[9px] uppercase tracking-widest text-signal" }, `Demo data · ${event.category}`),
              createElement("p", { className: "mt-2 text-xs font-semibold leading-5" }, getPrimaryArticle(event).title),
              createElement("p", { className: "mt-2 text-[11px] text-muted-foreground" }, `${event.location.name} · ${event.articleCount} article${event.articleCount === 1 ? "" : "s"}`),
            );
          }}
          onPointClick={(item) => onSelect((item as AnalyzedNewsEvent).id)}
          onGlobeClick={onClose}
          htmlElementsData={events}
          htmlLat={(item) => (item as AnalyzedNewsEvent).location.latitude}
          htmlLng={(item) => (item as AnalyzedNewsEvent).location.longitude}
          htmlAltitude={(item) => 0.003 + getHotspotIntensity(item as AnalyzedNewsEvent) * 0.006}
          htmlTransitionDuration={250}
          htmlElementVisibilityModifier={(element, isVisible) => {
            element.style.pointerEvents = isVisible ? "auto" : "none";
            element.style.opacity = isVisible ? "1" : "0";
          }}
          htmlElement={(item) => {
            const event = item as AnalyzedNewsEvent;
            const button = document.createElement("button");
            button.type = "button";
            button.className = "globe-hotspot-target";
            button.dataset["sentiment"] = getSentiment(event.sentiment);
            button.style.setProperty("--hotspot-opacity", `${0.35 + getHotspotIntensity(event) * 0.5}`);
            button.setAttribute("aria-label", `Open globe event: ${getPrimaryArticle(event).title}`);
            button.title = `${event.location.name} · Demo data`;
            button.addEventListener("click", (clickEvent) => {
              clickEvent.stopPropagation();
              onSelect(event.id);
            });
            return button;
          }}
          onGlobeReady={() => setGlobeReady(true)}
        />
      )}
      <div className="pointer-events-none absolute bottom-7 left-1/2 flex max-w-[calc(100%-48px)] -translate-x-1/2 items-center gap-2 rounded-sm border bg-background/90 px-3 py-2 text-center font-system text-[9px] uppercase text-muted-foreground">
        <MousePointer2 className="size-3 text-signal" aria-hidden="true" />
        Drag to orbit · Scroll to zoom · Select a signal
      </div>
    </div>
  );
}
