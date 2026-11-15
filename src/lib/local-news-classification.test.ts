import { describe, expect, it } from "vitest";
import { parseLocalClassification } from "./local-news-classification";

const response = (overrides: Record<string, unknown> = {}) => JSON.stringify({ results: [{
  articleId: "story-1", eventLocationName: "Japan", countryCode: "JP", sentiment: -0.8,
  severity: 0.9, confidence: 0.8, rationale: "Reported harm in Japan", ...overrides,
}] });

describe("browser-local news output", () => {
  it("accepts a validated location from the gazetteer", () => {
    expect(parseLocalClassification(response(), "story-1").location).toMatchObject({ country: "Japan", latitude: 36 });
  });
  it("keeps uncertain or invented places off the map", () => {
    expect(parseLocalClassification(response({ confidence: 0.5 }), "story-1").location).toBeNull();
    expect(parseLocalClassification(response({ eventLocationName: "Atlantis" }), "story-1").location).toBeNull();
  });
  it("rejects malformed, mismatched and extra model output", () => {
    expect(() => parseLocalClassification("No JSON", "story-1")).toThrow();
    expect(() => parseLocalClassification(response(), "story-2")).toThrow();
    expect(() => parseLocalClassification(response({ coordinates: [1, 2] }), "story-1")).toThrow();
    expect(() => parseLocalClassification(response({ severity: -1 }), "story-1")).toThrow();
  });
  it("accepts a valid classification after echoed input", () => {
    expect(parseLocalClassification('{"title":"Earthquake in Japan"}\n' + response(), "story-1").location?.country).toBe("Japan");
  });
});
