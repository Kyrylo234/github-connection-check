import { describe, expect, it } from "vitest";
import {
  validateClassification,
  classifiedEvents,
  clusterNews,
  mappableArticles,
  selectStoriesForAnalysis,
  storySignals,
  type Classification,
} from "./news-classification";
import { resolveNewsLocation } from "./news-location";
import { calculateRecentTension } from "./news-analysis";
import type { NewsArticle } from "@/types/news";
const article: NewsArticle = {
  id: "a",
  title: "Attack in Japan",
  description: "Report",
  source: "BBC",
  publishedAt: "2026-11-15T10:00:00Z",
  isDemo: false,
};
const classification: Classification = {
  articleId: "a",
  eventLocationName: "Japan",
  countryCode: "JP",
  sentiment: -1,
  severity: 1,
  confidence: 0.9,
  rationale: "Event harms people",
  location: resolveNewsLocation("Japan", "JP"),
  analyzedAt: "2026-11-15T12:00:00Z",
};
describe("hosted news classification", () => {
  it("clamps finite AI numbers and rejects mismatched IDs and invalid JSON", () => {
    const row = {
      articleId: "a",
      eventLocationName: null,
      countryCode: null,
      sentiment: -4,
      severity: 2,
      confidence: 3,
      rationale: "Test",
    };
    expect(validateClassification({ results: [row] }, ["a"])[0]).toMatchObject({
      sentiment: -1,
      severity: 1,
      confidence: 1,
    });
    expect(validateClassification([row], ["a"])[0]).toMatchObject({
      sentiment: -1,
      severity: 1,
      confidence: 1,
    });
    expect(() => validateClassification({ results: [row] }, ["b"])).toThrow();
    expect(() => validateClassification("not json", ["a"])).toThrow();
    expect(() =>
      validateClassification({ results: [{ ...row, sentiment: NaN }] }, ["a"]),
    ).toThrow();
  });
  it("resolves real countries and cities without inventing unknown coordinates", () => {
    expect(resolveNewsLocation("Paris", "FR")).toMatchObject({
      country: "France",
      latitude: 48.85341,
      longitude: 2.3488,
    });
    expect(resolveNewsLocation("Atlantis", "FR")).toBeNull();
    expect(resolveNewsLocation("France", null)).toBeNull();
  });
  it("uses classified effects for tension even when location is unclear", () => {
    const unknown = { ...classification, location: null };
    const vague = { ...article, title: "Attack reported overnight" };
    expect(classifiedEvents([vague], [unknown])).toEqual([]);
    expect(
      calculateRecentTension(storySignals([vague], [unknown]), "2026-11-15T12:00:00Z").reading
        .score,
    ).toBe(100);
  });
  it("uses explicit heuristic locations when AI cannot supply a reliable location", () => {
    expect(classifiedEvents([article], [])[0]?.analysisMethod).toBe("Heuristic fallback");
    expect(
      classifiedEvents([article], [{ ...classification, confidence: 0.5 }])[0]?.analysisMethod,
    ).toBe("Heuristic fallback");
    expect(
      classifiedEvents([article], [{ ...classification, location: null }])[0]?.analysisMethod,
    ).toBe("Heuristic fallback");
  });
  it("keeps only stories with verified map locations for storage", () => {
    const vague = { ...article, id: "b", title: "Diplomatic talks continue" };
    expect(mappableArticles([article, vague], [])).toEqual([article]);
    expect(mappableArticles([article, vague], [{ ...classification, articleId: "b" }])).toEqual([
      article,
      vague,
    ]);
    expect(mappableArticles([article], [{ ...classification, location: null }])).toEqual([article]);
  });
  it("uses scarce AI capacity for stories without a heuristic pin first", () => {
    const mapped = { ...article, id: "mapped" };
    const vague = { ...article, id: "vague", title: "Officials announce new measures" };
    const other = { ...article, id: "other", title: "Leaders discuss new measures" };
    expect(
      selectStoriesForAnalysis([mapped, vague, other], new Set<string>(), 2).map((item) => item.id),
    ).toEqual(["vague", "other"]);
    expect(
      selectStoriesForAnalysis([mapped, vague, other], new Set(["vague"]), 2).map(
        (item) => item.id,
      ),
    ).toEqual(["other", "mapped"]);
  });
  it("clusters colocated stories using actual article count", () => {
    const events = classifiedEvents(
      [article, { ...article, id: "b" }],
      [classification, { ...classification, articleId: "b" }],
    );
    const cluster = clusterNews(events);
    expect(cluster).toHaveLength(1);
    expect(cluster[0]?.articleCount).toBe(2);
    expect(cluster[0]?.sentiment).toBe(-1);
  });
});
