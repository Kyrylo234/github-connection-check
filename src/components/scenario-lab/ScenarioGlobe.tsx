import { useEffect, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { Globe2 } from "lucide-react";

import earthTexture from "@/assets/earth-dark.jpg";
import type { ScenarioLocation } from "@/types/scenario";

export interface ScenarioMapEvent {
  id: string;
  title: string;
  location: ScenarioLocation;
  severity: number;
  active: boolean;
}

interface ScenarioGlobeProps {
  events: ScenarioMapEvent[];
  focusedEventId: string | null;
}

function readPalette() {
  const styles = getComputedStyle(document.documentElement);
  return {
    positive: styles.getPropertyValue("--sentiment-positive-rgb").trim().split(/\s+/).join(", "),
    negative: styles.getPropertyValue("--sentiment-negative-rgb").trim().split(/\s+/).join(", "),
    atmosphere: styles.getPropertyValue("--atmosphere-rgb").trim().split(/\s+/).join(", "),
  };
}

function browserSupportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function ScenarioGlobe({ events, focusedEventId }: ScenarioGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [ready, setReady] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null);
  const [palette] = useState(readPalette);

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
    if (!ready || !globeRef.current) return;
    const controls = globeRef.current.controls();
    controls.autoRotate = !focusedEventId;
    controls.autoRotateSpeed = 0.28;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 150;
    controls.maxDistance = 620;
  }, [focusedEventId, ready]);

  useEffect(() => {
    if (!ready || !globeRef.current) return;
    const focused = events.find((event) => event.id === focusedEventId);
    const aspect = dimensions.height / Math.max(dimensions.width, 1);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    globeRef.current.pointOfView(
      focused
        ? { lat: focused.location.latitude, lng: focused.location.longitude, altitude: Math.min(3.4, 1.65 * Math.max(1, aspect * 0.7)) }
        : { lat: 25, lng: 22, altitude: Math.min(4, 2.2 * Math.max(1, aspect * 0.75)) },
      reducedMotion ? 0 : focused ? 1100 : 800,
    );
  }, [events, focusedEventId, ready, dimensions.height, dimensions.width]);

  if (webGLSupported === false) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center p-8 text-center">
        <div>
          <Globe2 className="mx-auto size-12 text-signal" aria-hidden="true" />
          <h2 className="mt-5 font-display text-2xl font-bold">3D view unavailable</h2>
          <p className="mx-auto mt-3 max-w-md text-xs leading-6 text-muted-foreground">The exercise remains fully playable. Incident locations appear in each written briefing; enable WebGL to see the globe.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full min-h-[420px] w-full" data-scenario-globe-ready={ready || undefined}>
      {!ready && <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/35 font-system text-[10px] uppercase text-signal">Opening global monitoring…</div>}
      {webGLSupported && dimensions.width > 0 && dimensions.height > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl={earthTexture}
          backgroundColor="rgba(0, 0, 0, 0)"
          showAtmosphere
          atmosphereColor={`rgb(${palette.atmosphere})`}
          atmosphereAltitude={0.12}
          showGraticules
          pointsData={events}
          pointLat={(item) => (item as ScenarioMapEvent).location.latitude}
          pointLng={(item) => (item as ScenarioMapEvent).location.longitude}
          pointColor={(item) => (item as ScenarioMapEvent).active ? `rgba(${palette.negative}, 0.95)` : `rgba(${palette.positive}, 0.5)`}
          pointAltitude={(item) => (item as ScenarioMapEvent).active ? 0.018 : 0.007}
          pointRadius={(item) => (item as ScenarioMapEvent).active ? 0.65 : 0.32}
          pointResolution={20}
          pointsTransitionDuration={500}
          ringsData={events.filter((event) => event.active)}
          ringLat={(item) => (item as ScenarioMapEvent).location.latitude}
          ringLng={(item) => (item as ScenarioMapEvent).location.longitude}
          ringColor={() => (time: number) => `rgba(${palette.negative}, ${Math.max(0, 0.75 - time / 1600)})`}
          ringMaxRadius={5}
          ringPropagationSpeed={2.2}
          ringRepeatPeriod={1100}
          onGlobeReady={() => setReady(true)}
        />
      )}
      <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap border bg-background/90 px-3 py-2 font-system text-[9px] uppercase text-muted-foreground">Drag to orbit · Scroll to zoom</div>
    </div>
  );
}
