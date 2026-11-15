import { describe, expect, it } from "vitest";
import { isHotspotPointerEvent, selectHotspotOnPointerUp, shouldIgnoreGlobeClick } from "@/lib/globe-interaction";

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

  it("opens a briefing on pointer release without requiring a second click", () => {
    const hotspot = document.createElement("button");
    hotspot.className = "globe-hotspot-target";
    const pointerUp = new Event("pointerup", { bubbles: true, cancelable: true });
    hotspot.dispatchEvent(pointerUp);
    const selected: string[] = [];
    expect(selectHotspotOnPointerUp(pointerUp, "event-1", (eventId) => selected.push(eventId))).toBe(true);
    expect(selected).toEqual(["event-1"]);
    expect(pointerUp.cancelBubble).toBe(true);
  });

  it("does not turn an ordinary canvas release into a hotspot selection", () => {
    const canvas = document.createElement("canvas");
    const selected: string[] = [];
    expect(selectHotspotOnPointerUp({ target: canvas, stopPropagation: () => {} }, "event-1", (eventId) => selected.push(eventId))).toBe(false);
    expect(selected).toEqual([]);
  });

  it("ignores the renderer's delayed canvas callback after a hotspot press", () => {
    const canvas = document.createElement("canvas");
    expect(shouldIgnoreGlobeClick({ target: canvas }, 1000, 1250)).toBe(true);
    expect(shouldIgnoreGlobeClick({ target: canvas }, 1000, 1500)).toBe(false);
  });
});
