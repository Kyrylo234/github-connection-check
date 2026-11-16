import { useEffect, useRef, useState } from "react";
import { findNewHotspot, HOTSPOT_FOCUS_HOLD_MS } from "@/lib/hotspot-focus";
import type { AnalyzedNewsEvent } from "@/types/news";
import { usePageActive } from "./use-page-active";

export function useHotspotFocus(
  sourceEvents: AnalyzedNewsEvent[],
  visibleEvents: AnalyzedNewsEvent[],
  enabled: boolean,
  selectedEventId: string | null,
  resetToken: number,
  updateVersion: string | null,
) {
  const previousSnapshot = useRef({ version: updateVersion, events: sourceEvents });
  const previousReset = useRef(resetToken);
  const [pending, setPending] = useState<AnalyzedNewsEvent | null>(null);
  const [focused, setFocused] = useState<AnalyzedNewsEvent | null>(null);
  const pageActive = usePageActive();

  useEffect(() => {
    const previous = previousSnapshot.current;
    previousSnapshot.current = { version: updateVersion, events: sourceEvents };
    if (!previous.version || !updateVersion || previous.version === updateVersion) return;
    const candidate = findNewHotspot(previous.events, sourceEvents);
    if (candidate) setPending({ ...candidate });
  }, [updateVersion, sourceEvents]);

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
    if (!pending) return;
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
