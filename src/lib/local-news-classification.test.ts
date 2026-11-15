import { describe, expect, it } from "vitest";
import { sentimentFromPredictions } from "./local-news-classification";
import { headlineSeverity } from "./publisher-news";

describe("browser-local sentiment scores", () => {
  it("maps the three model probabilities to a signed sentiment and confidence", () => {
    expect(sentimentFromPredictions([
      { label: "negative", score: 0.8 }, { label: "neutral", score: 0.15 }, { label: "positive", score: 0.05 },
    ])).toEqual({ sentiment: -0.75, confidence: 0.8 });
    expect(sentimentFromPredictions([
      { label: "negative", score: 0.05 }, { label: "neutral", score: 0.1 }, { label: "positive", score: 0.85 },
    ]).sentiment).toBeCloseTo(0.8);
    expect(sentimentFromPredictions([
      { label: "negative", score: 0.05 }, { label: "neutral", score: 0.7 }, { label: "positive", score: 0.25 },
    ])).toEqual({ sentiment: 0, confidence: 0.7 });
  });
  it("rejects missing or invalid probabilities", () => {
    expect(() => sentimentFromPredictions([{ label: "negative", score: 1 }])).toThrow();
    expect(() => sentimentFromPredictions([
      { label: "negative", score: -0.1 }, { label: "neutral", score: 0.5 }, { label: "positive", score: 0.6 },
    ])).toThrow();
  });
  it("keeps severity grounded in headline terms, regardless of location", () => {
    expect(headlineSeverity("Earthquake kills residents")).toBe(0.8);
    expect(headlineSeverity("Peace agreement signed")).toBe(0.3);
    expect(headlineSeverity("Leaders meet for talks")).toBe(0.2);
  });
});
