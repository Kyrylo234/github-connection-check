import { useEffect, useRef, useState } from "react";
import { findNewHotspot, HOTSPOT_FOCUS_HOLD_MS } from "@/lib/hotspot-focus";
import type { AnalyzedNewsEvent } from "@/types/news";

export function useHotspotFocus(
  sourceEvents: AnalyzedNewsEvent[],
  visibleEvents: AnalyzedNewsEvent[],
  enabled: boolean,
  selectedEventId: string | null,
  resetToken: number,
) {
  const previous = useRef(sourceEvents);
  const previousReset = useRef(resetToken);
  const [pending, setPending] = useState<AnalyzedNewsEvent | null>(null);
  const [focused, setFocused] = useState<AnalyzedNewsEvent | null>(null);
  const [pageActive, setPageActive] = useState(() => document.visibilityState !== "hidden");

  useEffect(() => {
    let windowFocused = true;
    const onBlur = () => {
      windowFocused = false;
      setPageActive(false);
    };
    const onFocus = () => {
      windowFocused = true;
      setPageActive(document.visibilityState !== "hidden");
    };
    const onVisibilityChange = () => setPageActive(windowFocused && document.visibilityState !== "hidden");
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const candidate = findNewHotspot(previous.current, sourceEvents);
    previous.current = sourceEvents;
    if (candidate && visibleEvents.some((event) => event.id === candidate.id)) setPending(candidate);
  }, [sourceEvents, visibleEvents]);

  useEffect(() => {
    if (previousReset.current === resetToken) return;
    previousReset.current = resetToken;
    setPending(null);
    setFocused(null);
  }, [resetToken]);

  useEffect(() => {
    if (!enabled || selectedEventId || !pageActive) {
      setFocused(null);
      return;
    }
    if (focused || !pending) return;
    if (visibleEvents.some((event) => event.id === pending.id)) setFocused(pending);
    setPending(null);
  }, [enabled, selectedEventId, pageActive, pending, focused, visibleEvents]);

  useEffect(() => {
    if (!focused) return;
    if (!visibleEvents.some((event) => event.id === focused.id)) {
      setFocused(null);
      return;
    }
    const timer = window.setTimeout(() => setFocused(null), HOTSPOT_FOCUS_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [focused, visibleEvents]);

  return focused;
}
