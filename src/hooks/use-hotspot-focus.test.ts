import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { demoNewsEvents } from "@/data/demoNews";
import type { AnalyzedNewsEvent } from "@/types/news";
import { useHotspotFocus } from "./use-hotspot-focus";

const base = demoNewsEvents[0];
if (!base) throw new Error("Missing fixture");
const hot: AnalyzedNewsEvent = {
  ...base,
  id: "live-hot",
  isDemo: false,
  sentiment: -1,
  severity: 1,
  articleCount: 4,
};
afterEach(() => vi.useRealTimers());

it("holds new arrivals while reading and focuses for eight seconds after closing", () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(
    ({ source, selected, version }) => useHotspotFocus(source, source, true, selected, 0, version),
    {
      initialProps: {
        source: [] as AnalyzedNewsEvent[],
        selected: "reading" as string | null,
        version: "v1" as string | null,
      },
    },
  );
  rerender({ source: [hot], selected: "reading", version: "v2" });
  expect(result.current).toBeNull();
  rerender({ source: [hot], selected: null, version: "v2" });
  expect(result.current?.id).toBe("live-hot");
  act(() => vi.advanceTimersByTime(7999));
  expect(result.current?.id).toBe("live-hot");
  act(() => vi.advanceTimersByTime(1));
  expect(result.current).toBeNull();
});

it("focuses an arrival automatically while the page is active", () => {
  const { result, rerender } = renderHook(
    ({ source, version }) => useHotspotFocus(source, source, true, null, 0, version),
    { initialProps: { source: [] as AnalyzedNewsEvent[], version: "v1" as string | null } },
  );
  rerender({ source: [hot], version: "v2" });
  expect(result.current?.id).toBe("live-hot");
});

it("waits while a publisher article is open in another tab", () => {
  const { result, rerender } = renderHook(
    ({ source, version }) => useHotspotFocus(source, source, true, null, 0, version),
    { initialProps: { source: [] as AnalyzedNewsEvent[], version: "v1" as string | null } },
  );
  act(() => window.dispatchEvent(new Event("blur")));
  rerender({ source: [hot], version: "v2" });
  expect(result.current).toBeNull();
  act(() => window.dispatchEvent(new Event("focus")));
  expect(result.current?.id).toBe("live-hot");
});

it("does not treat filter changes or initial loading as new arrivals", () => {
  const { result, rerender } = renderHook(
    ({ visible }) => useHotspotFocus([hot], visible, true, null, 0, "v1"),
    { initialProps: { visible: [] as AnalyzedNewsEvent[] } },
  );
  rerender({ visible: [hot] });
  expect(result.current).toBeNull();
  const loading = renderHook(
    ({ source, version }) => useHotspotFocus(source, source, true, null, 0, version),
    { initialProps: { source: [] as AnalyzedNewsEvent[], version: null as string | null } },
  );
  loading.rerender({ source: [hot], version: "v1" });
  expect(loading.result.current).toBeNull();
});

it("respects pause and reset", () => {
  const { result, rerender } = renderHook(
    ({ source, enabled, reset, version }) =>
      useHotspotFocus(source, source, enabled, null, reset, version),
    {
      initialProps: {
        source: [] as AnalyzedNewsEvent[],
        enabled: false,
        reset: 0,
        version: "v1" as string | null,
      },
    },
  );
  rerender({ source: [hot], enabled: false, reset: 0, version: "v2" });
  expect(result.current).toBeNull();
  rerender({ source: [hot], enabled: true, reset: 0, version: "v2" });
  expect(result.current?.id).toBe("live-hot");
  rerender({ source: [hot], enabled: true, reset: 1, version: "v2" });
  expect(result.current).toBeNull();
});

it("focuses only areas with unseen stories and ignores unchanged version updates", () => {
  const warm = { ...hot, id: "warm", sentiment: -0.7, severity: 0.8, articleCount: 1 };
  const { result, rerender } = renderHook(
    ({ source, version }) => useHotspotFocus(source, source, true, null, 0, version),
    { initialProps: { source: [warm, hot], version: "v1" } },
  );
  expect(result.current).toBeNull();
  rerender({ source: [warm, hot], version: "v2" });
  expect(result.current).toBeNull();
  const freshArticle = { ...hot.articles[0]!, id: "new-story" };
  rerender({
    source: [{ ...warm, articles: [...warm.articles, freshArticle] }, hot],
    version: "v3",
  });
  expect(result.current?.id).toBe("warm");
});
