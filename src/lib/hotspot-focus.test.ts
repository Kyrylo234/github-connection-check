import { describe, expect, it } from "vitest";
import { demoNewsEvents } from "@/data/demoNews";
import { findNewHotspot, hottestVisibleHotspot } from "./hotspot-focus";
import type { AnalyzedNewsEvent } from "@/types/news";

const base = demoNewsEvents[0];
if (!base) throw new Error("Missing fixture");
const live = (overrides: Partial<AnalyzedNewsEvent> = {}): AnalyzedNewsEvent => ({
  ...base, id: "incoming", isDemo: false, sentiment: -1, severity: 1, articleCount: 4, ...overrides,
});

describe("new very hot areas", () => {
  it("focuses a newly arriving very hot live event", () => {
    expect(findNewHotspot([], [live()])?.id).toBe("incoming");
  });
  it("does not mistake demo fixtures for live arrivals", () => {
    expect(findNewHotspot([], [live({ isDemo: true })])).toBeNull();
  });
  it("does not refocus unchanged events", () => {
    expect(findNewHotspot([live()], [live()])).toBeNull();
  });
  it("ignores arrivals below 0.8 visual intensity", () => {
    expect(findNewHotspot([], [live({ sentiment: 0.1, severity: 0.1, articleCount: 1 })])).toBeNull();
  });
  it("focuses an existing area when new articles make it very hot", () => {
    expect(findNewHotspot([live({ sentiment: -0.2, articleCount: 1 })], [live()])?.id).toBe("incoming");
  });
  it("recognizes fresh articles in an already hot area", () => {
    const fresh = { id: "new-article", title: "New report", source: "Test", publishedAt: base.occurredAt, isDemo: false };
    expect(findNewHotspot([live()], [live({ articles: [...base.articles, fresh] })])?.id).toBe("incoming");
  });
  it("chooses the hottest arrival in a batch", () => {
    expect(findNewHotspot([], [live({ id: "warm", sentiment: -0.95, articleCount: 1 }), live()])?.id).toBe("incoming");
  });
  it("never focuses an unknown or invalid location", () => {
    expect(findNewHotspot([], [live({ location: { ...base.location, latitude: NaN } })])).toBeNull();
  });
});

describe("hottest area after a publisher update", () => {
  it("uses the hottest visible live location even below the arrival threshold", () => {
    const ordinary = live({ id: "ordinary", sentiment: -0.7, severity: 0.8, articleCount: 1 });
    expect(hottestVisibleHotspot([ordinary, live()], [ordinary])?.id).toBe("ordinary");
  });
  it("excludes demo and unlocated stories", () => {
    expect(hottestVisibleHotspot([live({ isDemo: true }), live({ id: "unlocated", location: { ...base.location, latitude: NaN } })],
      [live({ isDemo: true }), live({ id: "unlocated", location: { ...base.location, latitude: NaN } })])).toBeNull();
  });
});
