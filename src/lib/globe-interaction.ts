/** HTML hotspots sit above the canvas, but the renderer also sees their pointer-up. */
export function isHotspotPointerEvent(event: Pick<Event, "target">): boolean {
  return event.target instanceof Element && event.target.closest(".globe-hotspot-target") !== null;
}

/** Select on release as globe movement can prevent the browser's subsequent click. */
export function selectHotspotOnPointerUp(
  event: Pick<Event, "target" | "stopPropagation">,
  eventId: string,
  onSelect: (eventId: string) => void,
): boolean {
  if (!isHotspotPointerEvent(event)) return false;
  event.stopPropagation();
  onSelect(eventId);
  return true;
}

/** The globe renderer may report a hotspot press later as a canvas click. */
export function shouldIgnoreGlobeClick(event: Pick<Event, "target">, lastHotspotPressAt: number, now: number): boolean {
  return isHotspotPointerEvent(event) || now - lastHotspotPressAt < 400;
}
