import { describe, expect, it } from "vitest";
import { archiveRows } from "./news-archive.server";
import { resolveNewsLocation } from "./news-location";
import type { NewsArticle } from "@/types/news";

const article: NewsArticle = {
  id: "https://example.com/a", url: "https://example.com/a", title: "Flood in Japan",
  description: "<p>Homes flooded</p>", source: "BBC News", publishedAt: "2026-11-15T10:00:00Z", isDemo: false,
};

describe("live archive assessments", () => {
  it("stores article text, link, impact and heuristic map location together", () => {
    const rows = archiveRows([article, { ...article, id: "https://example.com/b", title: "Markets recover" }], []);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: article.id, url: article.url, title: article.title, description: "Homes flooded",
      sentiment: -0.7, severity: 0.8, location_country: "Japan", latitude: 36, longitude: 138,
      analysis_method: "Heuristic fallback", analysis_confidence: null,
    });
  });

  it("stores Gemini values and resolved coordinates without inventing AI coordinates", () => {
    const location = resolveNewsLocation("Paris", "FR");
    const rows = archiveRows([{ ...article, title: "Local report" }], [{
      articleId: article.id, eventLocationName: "Paris", countryCode: "FR", location,
      sentiment: -0.4, severity: 0.6, confidence: 0.9, rationale: "People were harmed",
      analyzedAt: "2026-11-15T11:00:00Z",
    }]);
    expect(rows[0]).toMatchObject({
      sentiment: -0.4, severity: 0.6, location_name: "Paris", location_country: "France",
      latitude: location?.latitude, longitude: location?.longitude,
      analysis_method: "Gemini AI", analysis_confidence: 0.9, analysis_rationale: "People were harmed",
    });
  });
});
