import { describe, expect, it } from "vitest";
import { demoNewsEvents } from "@/data/demoNews";
import { findNewHotspot } from "./hotspot-focus";
import type { AnalyzedNewsEvent } from "@/types/news";

const base = demoNewsEvents[0];
if (!base) throw new Error("Missing fixture");
const live = (overrides: Partial<AnalyzedNewsEvent> = {}): AnalyzedNewsEvent => ({
  ...base,
  id: "incoming",
  isDemo: false,
  sentiment: -1,
  severity: 1,
  articleCount: 4,
  ...overrides,
});

describe("new publisher stories", () => {
  it("focuses a newly arriving live event", () => {
    expect(findNewHotspot([], [live()])?.id).toBe("incoming");
  });
  it("does not mistake demo fixtures for live arrivals", () => {
    expect(findNewHotspot([], [live({ isDemo: true })])).toBeNull();
  });
  it("does not refocus unchanged events", () => {
    expect(findNewHotspot([live()], [live()])).toBeNull();
  });
  it("includes lower-intensity arrivals", () => {
    expect(findNewHotspot([], [live({ sentiment: 0.1, severity: 0.1, articleCount: 1 })])?.id).toBe(
      "incoming",
    );
  });
  it("does not focus an existing area merely because its intensity changes", () => {
    expect(findNewHotspot([live({ sentiment: -0.2, articleCount: 1 })], [live()])).toBeNull();
  });
  it("recognizes fresh articles in an already hot area", () => {
    const fresh = {
      id: "new-article",
      title: "New report",
      source: "Test",
      publishedAt: base.occurredAt,
      isDemo: false,
    };
    expect(findNewHotspot([live()], [live({ articles: [...base.articles, fresh] })])?.id).toBe(
      "incoming",
    );
  });
  it("chooses the hottest arrival in a batch", () => {
    expect(
      findNewHotspot([], [live({ id: "warm", sentiment: -0.95, articleCount: 1 }), live()])?.id,
    ).toBe("incoming");
  });
  it("ignores an unchanged hotter area when a cooler area gets fresh news", () => {
    const cool = live({ id: "cool", sentiment: -0.3, articleCount: 1 });
    const newArticle = { ...base.articles[0]!, id: "fresh" };
    expect(
      findNewHotspot(
        [live(), cool],
        [live(), { ...cool, articles: [...cool.articles, newArticle] }],
      )?.id,
    ).toBe("cool");
  });
  it("does not count a story moved between clusters as new", () => {
    expect(findNewHotspot([live()], [live({ id: "reclustered" })])).toBeNull();
  });
  it("never focuses an unknown or invalid location", () => {
    expect(
      findNewHotspot([], [live({ location: { ...base.location, latitude: NaN } })]),
    ).toBeNull();
  });
});
