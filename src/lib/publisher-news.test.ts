import { describe, it, expect } from "vitest";
import countryCentres from "@/data/news-country-centres.json";
import gazetteer from "@/data/news-gazetteer.json";
import {
  NEWS_CACHE_MINUTES,
  articleEventImpact,
  articleSeverity,
  deduplicateNews,
  locateNews,
  newsArticlesVersion,
  newsSnapshotVersion,
  parsePublisherFeed,
} from "./publisher-news";
import type { NewsArticle } from "@/types/news";
const article = (title: string): NewsArticle => ({
  id: "https://example.com/a",
  url: "https://example.com/a",
  title,
  source: "France News",
  publishedAt: "2026-11-15T10:00:00Z",
  isDemo: false,
});
describe("publisher news", () => {
  it("keeps heuristic country centres aligned with the hosted gazetteer", () => {
    for (const [code, country] of Object.entries(gazetteer.countries)) {
      expect(countryCentres[code as keyof typeof countryCentres]).toEqual({
        name: country.name,
        lat: country.lat,
        lng: country.lng,
      });
    }
  });
  it("refreshes the shared publisher snapshot at most every two minutes", () =>
    expect(NEWS_CACHE_MINUTES).toBe(2));
  it("reads Global Voices creator credit and UN Geneva's European publication dates", () => {
    const globalVoices = parsePublisherFeed(
      '<rss><channel><item><title>Flood in Mozambique</title><link>https://globalvoices.org/story</link><dc:creator>Reporter Name</dc:creator><pubDate>Mon, 16 Nov 2026 08:38:21 +0000</pubDate></item></channel></rss>',
      "Global Voices",
    );
    expect(globalVoices[0]).toMatchObject({ author: "Reporter Name", publishedAt: "2026-11-16T08:38:21.000Z" });
    const unGeneva = parsePublisherFeed(
      '<rss><channel><item><title>UN briefing in Geneva</title><link>https://www.ungeneva.org/en/news-media/story</link><pubDate>Fri, 13 Nov 2026 17:48:28 CET</pubDate></item><item><title>Summer update</title><link>https://www.ungeneva.org/en/news-media/summer</link><pubDate>Mon, 16 Nov 2026 17:48:28 CEST</pubDate></item></channel></rss>',
      "UN Geneva",
    );
    expect(unGeneva.map(article => article.publishedAt)).toEqual(["2026-11-13T16:48:28.000Z", "2026-11-16T15:48:28.000Z"]);
  });
  it("keeps the content version stable across unchanged refreshes", () => {
    const articles = [article("Flood in Japan")];
    const first = { articles, fetchedAt: "2026-11-15T10:00:00Z", errors: [] };
    const checkedAgain = { ...first, fetchedAt: "2026-11-15T10:02:00Z" };
    expect(newsSnapshotVersion(first)).toBe(newsSnapshotVersion(checkedAgain));
    expect(newsArticlesVersion(first)).toBe(
      newsArticlesVersion({ ...first, errors: ["Feed temporarily unavailable"] }),
    );
    expect(newsSnapshotVersion(first)).not.toBe(
      newsSnapshotVersion({ ...first, errors: ["Feed temporarily unavailable"] }),
    );
    expect(newsSnapshotVersion({ ...first, articles: [article("Flood in Korea")] })).not.toBe(
      newsSnapshotVersion(first),
    );
    expect(
      newsSnapshotVersion({
        ...first,
        unmappedSignals: [
          { occurredAt: first.fetchedAt, sentiment: -0.7, severity: 0.8, articleCount: 1 },
        ],
      }),
    ).not.toBe(newsSnapshotVersion(first));
  });
  it("normalizes dates and deduplicates URL tracking variants", () => {
    const xml =
      "<rss><channel><item><title>Flood in Japan</title><link>https://example.com/a?utm_source=rss</link><pubDate>Sun, 15 Nov 2026 10:00:00 GMT</pubDate><description>Flood report</description></item></channel></rss>";
    const result = parsePublisherFeed(xml, "BBC News");
    expect(result[0]).toMatchObject({
      id: "https://example.com/a",
      publishedAt: "2026-11-15T10:00:00.000Z",
      category: "Climate",
      isDemo: false,
    });
    expect(deduplicateNews([...result, ...result])).toHaveLength(1);
  });
  it("does not pin publisher origin or vague country mentions", () => {
    expect(locateNews(article("Markets recover"))).toBeNull();
    expect(locateNews(article("France discusses aid"))).toBeNull();
  });
  it("uses an explicit location and transparent negative keywords", () => {
    expect(locateNews(article("Flood in Japan"))).toMatchObject({
      location: { country: "Japan", latitude: 36, longitude: 138 },
      sentiment: -0.7,
      severity: 0.8,
    });
  });
  it("pins explicit country phrases beyond the original short list", () => {
    for (const country of [
      "Bangladesh",
      "Thailand",
      "Egypt",
      "Spain",
      "Kenya",
      "Ecuador",
      "Haiti",
      "Yemen",
    ]) {
      expect(locateNews(article(`Flood in ${country}`))?.location.country).toBe(country);
    }
    expect(locateNews(article("Flood in the UK"))?.location.country).toBe("United Kingdom");
  });
  it("rejects ambiguous countries and headlines mentioning multiple countries", () => {
    expect(locateNews(article("Flood in Georgia"))).toBeNull();
    expect(locateNews(article("Aid in Spain after floods in France"))).toBeNull();
    expect(locateNews(article("Ecuador's president discusses a US base"))).toBeNull();
  });
  it("recognizes a longer country name without mistaking its suffix for another country", () => {
    expect(locateNews(article("Flood in Papua New Guinea"))?.location.country).toBe(
      "Papua New Guinea",
    );
    expect(locateNews(article("Flood in Papua New Guinea and Guinea"))).toBeNull();
  });
  it("treats the Gaza mass funeral and its RSS summary as severe negative impact", () => {
    const story = {
      ...article("Jerusalem Daily: Mass funeral in Gaza as Netanyahu clings to power"),
      description:
        "A mass funeral was held in Gaza for 70 Palestinians whose bodies were trapped under the rubble.",
    };
    expect(articleEventImpact(story)).toBe(-0.7);
    expect(articleSeverity(story)).toBe(0.8);
    expect(locateNews(story)).toMatchObject({
      location: { country: "Palestine" },
      sentiment: -0.7,
      severity: 0.8,
    });
  });
  it("uses direct harm in a short description when the title is vague", () => {
    const story = {
      ...article("Update in Japan"),
      description: "Seven people were killed and dozens injured.",
    };
    expect(articleEventImpact(story)).toBe(-0.7);
    expect(articleSeverity(story)).toBe(0.8);
    expect(locateNews(story)?.sentiment).toBe(-0.7);
  });
  it("leaves multi-country stories unpinned", () =>
    expect(locateNews(article("Talks in France about Ukraine"))).toBeNull());
  it("strips escaped publisher HTML without rendering it", () => {
    const articles = parsePublisherFeed(
      "<rss><channel><item><title>News</title><link>https://example.com</link><pubDate>Sun, 15 Nov 2026 10:00:00 GMT</pubDate><description>&lt;p&gt;Plain report&lt;/p&gt;</description></item></channel></rss>",
      "BBC",
    );
    expect(articles[0]?.description).toBe("Plain report");
  });
  it("rejects unsafe URLs and entity declarations", () => {
    expect(
      parsePublisherFeed(
        "<rss><channel><item><title>Test</title><link>javascript:alert(1)</link><pubDate>Sun, 15 Nov 2026 10:00:00 GMT</pubDate></item></channel></rss>",
        "BBC",
      ),
    ).toEqual([]);
    expect(() => parsePublisherFeed("<!DOCTYPE rss><rss/>", "BBC")).toThrow();
  });
});
