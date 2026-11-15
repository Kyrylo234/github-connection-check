import { describe, expect, it } from "vitest";
import { demoNewsEvents } from "@/data/demoNews";
import { getHotspotIntensity } from "@/lib/news-analysis";
import { nextHotArea, rankHotAreas, rankVeryHotAreas } from "./hot-area-navigation";

const base = demoNewsEvents[0];
if (!base) throw new Error("Missing fixture");

describe("hot area navigation", () => {
  it("ranks visible map areas by the globe's visual intensity", () => {
    const low = { ...base, id: "low", sentiment: 0.1, articleCount: 1 };
    const high = { ...base, id: "high", sentiment: -0.9, articleCount: 4 };
    expect(getHotspotIntensity(high)).toBeGreaterThan(getHotspotIntensity(low));
    expect(rankHotAreas([low, high]).map((event) => event.id)).toEqual(["high", "low"]);
  });

  it("skips invalid locations and cycles back to the hottest area", () => {
    const invalid = { ...base, id: "invalid", location: { ...base.location, latitude: NaN } };
    const areas = rankHotAreas([base, invalid, demoNewsEvents[1]!]);
    expect(areas).toHaveLength(2);
    expect(nextHotArea(areas, null)).toBe(areas[0]);
    expect(nextHotArea(areas, areas[0]!.id)).toBe(areas[1]);
    expect(nextHotArea(areas, areas[1]!.id)).toBe(areas[0]);
    expect(nextHotArea([], null)).toBeNull();
  });

  it("limits the idle tour to very hot visible areas", () => {
    const warm = { ...base, id: "warm", sentiment: 0.1, severity: 0.1, articleCount: 1 };
    expect(rankVeryHotAreas([warm, base]).map((event) => event.id)).toEqual([base.id]);
  });
});
