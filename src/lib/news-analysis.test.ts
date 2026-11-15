import { describe, expect, it } from "vitest";

import { demoNewsEvents } from "@/data/demoNews";
import {
  calculateTensionIndex,
  filterNewsEvents,
  getHotspotIntensity,
  getSentiment,
  type TensionReading,
} from "@/lib/news-analysis";
import type { AnalyzedNewsEvent } from "@/types/news";

function event(overrides: Partial<AnalyzedNewsEvent> = {}): AnalyzedNewsEvent {
  return {
    id: "test-event",
    location: { name: "Testville", country: "Demo", latitude: 0, longitude: 0 },
    category: "Society",
    sentiment: -0.8,
    severity: 0.5,
    occurredAt: "2026-11-15T09:00:00.000Z",
    articles: [
      {
        id: "test-article",
        title: "Test demo article",
        source: "Demo source",
        publishedAt: "2026-11-15T09:00:00.000Z",
        isDemo: true,
      },
    ],
    articleCount: 1,
    isDemo: true,
    ...overrides,
  };
}

const reading = (score: number, band: TensionReading["band"]): TensionReading => ({
  score,
  band,
  totalArticles: 1,
  negativeEvents: 1,
});

describe("World Pulse demo fixture", () => {
  it("contains exactly 35 fictional events at valid coordinates", () => {
    expect(demoNewsEvents).toHaveLength(35);
    for (const item of demoNewsEvents) {
      expect(item.isDemo).toBe(true);
      expect(item.articles.every((article) => article.isDemo)).toBe(true);
      expect(item.location.latitude).toBeGreaterThanOrEqual(-90);
      expect(item.location.latitude).toBeLessThanOrEqual(90);
      expect(item.location.longitude).toBeGreaterThanOrEqual(-180);
      expect(item.location.longitude).toBeLessThanOrEqual(180);
    }
  });
});

describe("sentiment and time filters", () => {
  it("includes the minimum severity boundary and excludes lower severity", () => {
    const events = [event({ id: "below", severity: 0.49 }), event({ id: "boundary", severity: 0.5 }), event({ id: "above", severity: 0.9 })];
    expect(filterNewsEvents(events, "all", "30d", undefined, 0.5).map((item) => item.id)).toEqual(["boundary", "above"]);
  });

  it("keeps all severities at zero and combines severity with sentiment and time", () => {
    const events = [event({ id: "zero", severity: 0 }), event({ id: "severe", severity: 1 }), event({ id: "positive", severity: 1, sentiment: 0.8 }), event({ id: "old", severity: 1, occurredAt: "2026-11-14T08:00:00.000Z" })];
    expect(filterNewsEvents(events, "all", "30d", undefined, 0)).toHaveLength(4);
    expect(filterNewsEvents(events, "negative", "24h", undefined, 1).map((item) => item.id)).toEqual(["severe"]);
  });

  it("uses positive, neutral and negative bands around zero", () => {
    expect(getSentiment(0.21)).toBe("positive");
    expect(getSentiment(0.2)).toBe("neutral");
    expect(getSentiment(-0.2)).toBe("neutral");
    expect(getSentiment(-0.21)).toBe("negative");
  });

  it("returns only negative events inside the selected 24 hours", () => {
    const events = [
      event({ id: "recent-negative" }),
      event({ id: "old-negative", occurredAt: "2026-11-14T08:00:00.000Z" }),
      event({ id: "recent-positive", sentiment: 0.8 }),
    ];
    expect(filterNewsEvents(events, "negative", "24h").map((item) => item.id)).toEqual([
      "recent-negative",
    ]);
  });
});

describe("hotspot intensity", () => {
  it("increases when the same event has a four-article cluster", () => {
    const singleArticle = getHotspotIntensity(event({ sentiment: 0.8 }));
    const clustered = getHotspotIntensity(event({ sentiment: 0.8, articleCount: 4 }));
    expect(clustered).toBeGreaterThan(singleArticle);
  });
});

describe("experimental World Tension Index", () => {
  it("is zero for an empty selected event set", () => {
    expect(calculateTensionIndex([])).toEqual({
      score: 0,
      band: "Low",
      totalArticles: 0,
      negativeEvents: 0,
    });
  });

  it("is zero when selected events have no negative sentiment", () => {
    expect(calculateTensionIndex([event({ sentiment: 0.8 })]).score).toBe(0);
  });

  it("uses negative sentiment magnitude and severity transparently", () => {
    expect(calculateTensionIndex([event()])).toEqual(reading(68, "High"));
  });

  it("increases pressure for a four-article event cluster", () => {
    expect(calculateTensionIndex([event({ articleCount: 4 })]).score).toBe(88);
  });
});
