/** HTML hotspots sit above the canvas, but the renderer also sees their pointer-up. */
export function isHotspotPointerEvent(event: Pick<Event, "target">): boolean {
  return event.target instanceof Element && event.target.closest(".globe-hotspot-target") !== null;
}

/** The globe renderer may report a hotspot press later as a canvas click. */
export function shouldIgnoreGlobeClick(event: Pick<Event, "target">, lastHotspotPressAt: number, now: number): boolean {
  return isHotspotPointerEvent(event) || now - lastHotspotPressAt < 400;
}
