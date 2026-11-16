import { afterEach, describe, expect, it, vi } from "vitest";

const rss = `<?xml version="1.0"?><rss><channel><item><title>Earthquake in Japan</title><link>https://example.com/story</link><pubDate>Sun, 15 Nov 2026 19:00:00 GMT</pubDate></item></channel></rss>`;

describe("local preview publisher cache", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("shares one fixed-feed refresh across concurrent visitors without a service key", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => rss, headers: new Headers() });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchPublisherNews } = await import("./publisher-news.server");
    const responses = await Promise.all([fetchPublisherNews(), fetchPublisherNews(), fetchPublisherNews()]);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(responses.every(response => response.snapshot?.articles.length === 1 && !response.error)).toBe(true);
    await fetchPublisherNews();
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
});
