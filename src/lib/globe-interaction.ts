/** HTML hotspots sit above the canvas, but the renderer also sees their pointer-up. */
export function isHotspotPointerEvent(event: Pick<Event, "target">): boolean {
  return event.target instanceof Element && event.target.closest(".globe-hotspot-target") !== null;
}