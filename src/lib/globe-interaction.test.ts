import { describe, expect, it } from "vitest";
import { isHotspotPointerEvent } from "@/lib/globe-interaction";

describe("globe pointer isolation", () => {
  it("ignores the deferred globe callback from a hotspot press", () => {
    const hotspot = document.createElement("button");
    hotspot.className = "globe-hotspot-target";
    const pointerUp = new Event("pointerup", { bubbles: true });
    hotspot.dispatchEvent(pointerUp);
    let selected: string | null = "event-1";
    if (!isHotspotPointerEvent(pointerUp)) selected = null;
    expect(selected).toBe("event-1");
  });

  it("also isolates presses on children of a hotspot", () => {
    const hotspot = document.createElement("button");
    hotspot.className = "globe-hotspot-target";
    const child = document.createElement("span");
    hotspot.append(child);
    expect(isHotspotPointerEvent({ target: child })).toBe(true);
  });

  it("still allows a separate canvas press to dismiss the briefing", () => {
    const canvas = document.createElement("canvas");
    let selected: string | null = "event-1";
    if (!isHotspotPointerEvent({ target: canvas })) selected = null;
    expect(selected).toBeNull();
    expect(isHotspotPointerEvent({ target: null })).toBe(false);
  });
});