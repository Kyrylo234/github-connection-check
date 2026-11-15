import { useCallback, useEffect, useRef, useState } from "react";
import { nextHotArea } from "@/lib/hot-area-navigation";
import type { AnalyzedNewsEvent } from "@/types/news";
import { usePageActive } from "./use-page-active";

export const IDLE_TOUR_START_MS = 12_000;
export const IDLE_TOUR_DWELL_MS = 10_000;
export const IDLE_TOUR_RESUME_MS = 20_000;

export function useIdleHotAreaTour(areas: readonly AnalyzedNewsEvent[], enabled: boolean) {
  const pageActive = usePageActive();
  const lastVisitedId = useRef<string | null>(null);
  const lastInteractionAt = useRef(-Infinity);
  const [tourId, setTourId] = useState<string | null>(null);
  const [interactionCount, setInteractionCount] = useState(0);

  const pauseForInteraction = useCallback(() => {
    const now = Date.now();
    if (now - lastInteractionAt.current < 500) return;
    lastInteractionAt.current = now;
    setTourId(null);
    setInteractionCount((count) => count + 1);
  }, []);

  useEffect(() => {
    const onDrag = (event: PointerEvent) => {
      if (event.buttons) pauseForInteraction();
    };
    window.addEventListener("pointerdown", pauseForInteraction);
    window.addEventListener("pointermove", onDrag);
    window.addEventListener("wheel", pauseForInteraction);
    window.addEventListener("keydown", pauseForInteraction);
    return () => {
      window.removeEventListener("pointerdown", pauseForInteraction);
      window.removeEventListener("pointermove", onDrag);
      window.removeEventListener("wheel", pauseForInteraction);
      window.removeEventListener("keydown", pauseForInteraction);
    };
  }, [pauseForInteraction]);

  useEffect(() => {
    if (!enabled || !pageActive || areas.length === 0) {
      setTourId(null);
      return;
    }
    if (areas.length === 1 && !tourId && lastVisitedId.current === areas[0]?.id) return;
    const delay = tourId ? IDLE_TOUR_DWELL_MS : interactionCount ? IDLE_TOUR_RESUME_MS : IDLE_TOUR_START_MS;
    const timer = window.setTimeout(() => {
      if (areas.length === 1 && tourId) {
        setTourId(null);
        return;
      }
      const next = nextHotArea(areas, lastVisitedId.current);
      if (!next) return;
      lastVisitedId.current = next.id;
      setTourId(next.id);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [areas, enabled, pageActive, tourId, interactionCount]);

  return {
    area: enabled && pageActive ? areas.find((event) => event.id === tourId) ?? null : null,
    pauseForInteraction,
  };
}
