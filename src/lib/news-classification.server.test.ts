import { describe, expect, it, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), stream: vi.fn(), rows: [] as unknown[] }));
const article = { id: "a", title: "Attack in Japan", description: "Report", source: "BBC", publishedAt: "2026-11-15T10:00:00Z", isDemo: false };
vi.mock("ai", () => ({ Output: { object: vi.fn() }, streamText: mocks.stream }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  rpc: mocks.rpc,
  from: (table: string) => ({ select: () => ({
    in: async () => ({ data: mocks.rows, error: null }),
    eq: () => ({ maybeSingle: async () => ({ data: table === "publisher_news_cache" ? { snapshot: { articles: [{ id: "a", title: "Attack in Japan", description: "Report", source: "BBC", publishedAt: "2026-11-15T10:00:00Z", isDemo: false }] } } : null, error: null }) }),
  }), update: () => ({ eq: async () => ({ error: null }) }) }),
} }));
import { analyzeNewsBatch, contentHash } from "./news-classification.server";
describe("hosted news cache and protections", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.rows = []; });
  it("skips billed calls for identical URL and content", async () => {
    mocks.rows = [{ article_id: "a", content_hash: await contentHash(article), analysis: { articleId: "a", sentiment: -0.7 } }];
    const result = await analyzeNewsBatch(new Request("https://example.com"), "test-key", [{ id: "a", title: article.title, description: article.description }]);
    expect(result.results).toHaveLength(1); expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.stream).not.toHaveBeenCalled();
  });
  it("honours a persisted paused budget before contacting AI", async () => {
    mocks.rpc.mockResolvedValue({ data: "AI credits unavailable", error: null });
    const result = await analyzeNewsBatch(new Request("https://example.com"), "test-key", [{ id: "a", title: article.title, description: article.description }]);
    expect(result.error).toBe("AI credits unavailable"); expect(mocks.stream).not.toHaveBeenCalled();
  });
  it("rejects arbitrary visitor article text", async () => {
    const result = await analyzeNewsBatch(new Request("https://example.com"), "test-key", [{ id: "a", title: "Injected title", description: "" }]);
    expect(result.error).toContain("current fetched"); expect(mocks.stream).not.toHaveBeenCalled();
  });
  it("returns fallback instead of throwing on malformed structured output", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    mocks.stream.mockReturnValue({ output: Promise.resolve({ results: "broken" }) });
    const result = await analyzeNewsBatch(new Request("https://example.com"), "test-key", [{ id: "a", title: article.title, description: article.description }]);
    expect(result.error).toContain("invalid or incomplete"); expect(result.results).toEqual([]);
  });
});