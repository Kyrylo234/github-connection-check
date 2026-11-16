import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  read: vi.fn(),
  update: vi.fn(),
  readAnalysis: vi.fn(),
  analyze: vi.fn(),
  archive: vi.fn(),
  reconcile: vi.fn(),
}));
vi.mock("./supabase-admin.server", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: mocks.read }) }),
      update: (value: unknown) => {
        mocks.update(value);
        return { eq: async () => ({ error: null }) };
      },
    }),
    rpc: mocks.rpc,
  },
}));
vi.mock("./news-classification.server", () => ({
  readNewsAnalysis: mocks.readAnalysis,
  analyzeNewsBatch: mocks.analyze,
}));
vi.mock("./news-archive.server", () => ({
  archivePublisherArticles: mocks.archive,
  reconcileLiveArchive: mocks.reconcile,
}));
import { fetchPublisherNews } from "./publisher-news.server";
describe("shared publisher cache", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.read.mockResolvedValue({ data: null, error: null });
    mocks.readAnalysis.mockResolvedValue({ results: [], error: null, lastUpdatedAt: null });
    mocks.reconcile.mockResolvedValue(undefined);
    mocks.archive.mockResolvedValue(undefined);
  });
  it("never fetches publishers when another visitor owns the shared lease", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchPublisherNews();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.snapshot).toBeNull();
    expect(result.error).toContain("in progress");
    vi.unstubAllGlobals();
  });
  it("stores and archives only stories with a reliable map location", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    const xml =
      "<rss><channel><item><title>Flood in Japan</title><link>https://example.com/located</link><pubDate>Sun, 15 Nov 2026 10:00:00 GMT</pubDate></item><item><title>Flood in Yemen</title><link>https://example.com/yemen</link><pubDate>Sun, 15 Nov 2026 10:00:30 GMT</pubDate></item><item><title>Markets recover</title><link>https://example.com/vague</link><pubDate>Sun, 15 Nov 2026 10:01:00 GMT</pubDate></item></channel></rss>";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => xml }));
    const result = await fetchPublisherNews();
    expect(result.snapshot?.articles.map((article) => article.id)).toEqual([
      "https://example.com/yemen",
      "https://example.com/located",
    ]);
    const saved = mocks.update.mock.calls.find(([value]) => value.snapshot)?.[0];
    expect(saved.snapshot.articles.map((article: { id: string }) => article.id)).toEqual([
      "https://example.com/yemen",
      "https://example.com/located",
    ]);
    expect(mocks.archive).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "https://example.com/yemen" }),
        expect.objectContaining({ id: "https://example.com/located" }),
      ]),
    );
    expect(mocks.reconcile).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
  it("analyzes unlocated headlines before already mappable ones", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    const xml =
      "<rss><channel><item><title>Flood in Egypt</title><link>https://example.com/mapped</link><pubDate>Mon, 16 Nov 2026 10:04:00 GMT</pubDate></item><item><title>Officials announce measures</title><link>https://example.com/a</link><pubDate>Mon, 16 Nov 2026 10:03:00 GMT</pubDate></item><item><title>Leaders discuss agreement</title><link>https://example.com/b</link><pubDate>Mon, 16 Nov 2026 10:02:00 GMT</pubDate></item><item><title>Storm disrupts travel</title><link>https://example.com/c</link><pubDate>Mon, 16 Nov 2026 10:01:00 GMT</pubDate></item></channel></rss>";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => xml }));
    await fetchPublisherNews();
    expect(mocks.analyze).toHaveBeenCalledOnce();
    expect(mocks.analyze.mock.calls[0]?.[2].map((article: { id: string }) => article.id)).toEqual([
      "https://example.com/a",
      "https://example.com/b",
      "https://example.com/c",
    ]);
  });
  it("exposes total publisher failure and keeps the demo fallback available", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    const result = await fetchPublisherNews();
    expect(result.snapshot).toBeNull();
    expect(result.error).toContain("BBC News: HTTP 503");
    expect(mocks.update).toHaveBeenCalledWith({
      last_error: expect.stringContaining("HTTP 503"),
      next_refresh_at: expect.any(String),
    });
    vi.unstubAllGlobals();
  });
});
