import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { demoNewsEvents } from "@/data/demoNews";
import { IDLE_TOUR_DWELL_MS, IDLE_TOUR_RESUME_MS, IDLE_TOUR_START_MS, useIdleHotAreaTour } from "./use-idle-hot-area-tour";

const areas = demoNewsEvents.slice(0, 2);
afterEach(() => vi.useRealTimers());

describe("idle hot area tour", () => {
  it("starts after idling and visits each area in order", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useIdleHotAreaTour(areas, true));
    act(() => vi.advanceTimersByTime(IDLE_TOUR_START_MS - 1));
    expect(result.current.area).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.area?.id).toBe(areas[0]?.id);
    act(() => vi.advanceTimersByTime(IDLE_TOUR_DWELL_MS));
    expect(result.current.area?.id).toBe(areas[1]?.id);
  });

  it("stops while a briefing or new arrival has priority", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ enabled }) => useIdleHotAreaTour(areas, enabled),
      { initialProps: { enabled: true } });
    act(() => vi.advanceTimersByTime(IDLE_TOUR_START_MS));
    expect(result.current.area).not.toBeNull();
    rerender({ enabled: false });
    expect(result.current.area).toBeNull();
    act(() => vi.advanceTimersByTime(IDLE_TOUR_DWELL_MS * 2));
    expect(result.current.area).toBeNull();
    rerender({ enabled: true });
    act(() => vi.advanceTimersByTime(IDLE_TOUR_START_MS));
    expect(result.current.area?.id).toBe(areas[1]?.id);
  });

  it("waits after user interaction", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useIdleHotAreaTour(areas, true));
    act(() => window.dispatchEvent(new Event("pointerdown")));
    act(() => vi.advanceTimersByTime(IDLE_TOUR_RESUME_MS - 1));
    expect(result.current.area).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.area).not.toBeNull();
  });

  it("visits a single area once, then resumes orbit", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useIdleHotAreaTour(areas.slice(0, 1), true));
    act(() => vi.advanceTimersByTime(IDLE_TOUR_START_MS));
    expect(result.current.area?.id).toBe(areas[0]?.id);
    act(() => vi.advanceTimersByTime(IDLE_TOUR_DWELL_MS));
    expect(result.current.area).toBeNull();
    act(() => vi.advanceTimersByTime(IDLE_TOUR_START_MS * 2));
    expect(result.current.area).toBeNull();
  });

  it("pauses while the tab is in the background", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useIdleHotAreaTour(areas, true));
    act(() => window.dispatchEvent(new Event("blur")));
    act(() => vi.advanceTimersByTime(IDLE_TOUR_START_MS * 2));
    expect(result.current.area).toBeNull();
    act(() => window.dispatchEvent(new Event("focus")));
    act(() => vi.advanceTimersByTime(IDLE_TOUR_START_MS));
    expect(result.current.area?.id).toBe(areas[0]?.id);
  });
});
