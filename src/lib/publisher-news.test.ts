import { describe, it, expect } from "vitest";
import { NEWS_CACHE_MINUTES, deduplicateNews, locateNews, parsePublisherFeed } from "./publisher-news";
import type { NewsArticle } from "@/types/news";
const article = (title: string): NewsArticle => ({ id: "https://example.com/a", url: "https://example.com/a", title, source: "France News", publishedAt: "2026-11-15T10:00:00Z", isDemo: false });
describe("publisher news", () => {
  it("keeps the agreed ten-minute cache interval", () => expect(NEWS_CACHE_MINUTES).toBe(10));
  it("normalizes dates and deduplicates URL tracking variants", () => {
    const xml = '<rss><channel><item><title>Flood in Japan</title><link>https://example.com/a?utm_source=rss</link><pubDate>Sun, 15 Nov 2026 10:00:00 GMT</pubDate><description>Flood report</description></item></channel></rss>';
    const result = parsePublisherFeed(xml, "BBC News");
    expect(result[0]).toMatchObject({ id: "https://example.com/a", publishedAt: "2026-11-15T10:00:00.000Z", category: "Climate", isDemo: false });
    expect(deduplicateNews([...result, ...result])).toHaveLength(1);
  });
  it("does not pin publisher origin or vague country mentions", () => {
    expect(locateNews(article("Markets recover"))).toBeNull();
    expect(locateNews(article("France discusses aid"))).toBeNull();
  });
  it("uses an explicit location and transparent negative keywords", () => {
    expect(locateNews(article("Flood in Japan"))).toMatchObject({ location: { country: "Japan", latitude: 36, longitude: 138 }, sentiment: -0.7, severity: 0.8 });
  });
  it("leaves multi-country stories unpinned", () => expect(locateNews(article("Talks in France about Ukraine"))).toBeNull());
  it("strips escaped publisher HTML without rendering it", () => {
    const articles = parsePublisherFeed('<rss><channel><item><title>News</title><link>https://example.com</link><pubDate>Sun, 15 Nov 2026 10:00:00 GMT</pubDate><description>&lt;p&gt;Plain report&lt;/p&gt;</description></item></channel></rss>', "BBC");
    expect(articles[0]?.description).toBe("Plain report");
  });
  it("rejects unsafe URLs and entity declarations", () => {
    expect(parsePublisherFeed('<rss><channel><item><title>Test</title><link>javascript:alert(1)</link><pubDate>Sun, 15 Nov 2026 10:00:00 GMT</pubDate></item></channel></rss>', "BBC")).toEqual([]);
    expect(() => parsePublisherFeed('<!DOCTYPE rss><rss/>', "BBC")).toThrow();
  });
});