import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), read: vi.fn(), update: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.read }) }), update: (value: unknown) => { mocks.update(value); return { eq: async () => ({ error: null }) }; } }),
  rpc: mocks.rpc,
} }));
import { fetchPublisherNews } from "./publisher-news.server";
describe("shared publisher cache", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.read.mockResolvedValue({ data: null, error: null }); });
  it("never fetches publishers when another visitor owns the shared lease", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    const result = await fetchPublisherNews();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.snapshot).toBeNull();
    expect(result.error).toContain("in progress");
    vi.unstubAllGlobals();
  });
  it("reuses cached articles when publishers return not modified", async () => {
    const cached = {
      articles: [{ id: "bbc-story", title: "World report", description: "", source: "BBC News", publishedAt: "2026-11-15T10:00:00Z", isDemo: false }],
      errors: [], fetchedAt: "2026-11-15T10:00:00Z", validators: { "BBC News": { etag: '"bbc-v1"' } },
    };
    mocks.read.mockResolvedValue({ data: { snapshot: cached, next_refresh_at: "2026-11-15T10:00:00Z" }, error: null });
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    const fetchMock = vi.fn().mockResolvedValue({ status: 304 });
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchPublisherNews();
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: expect.objectContaining({ "If-None-Match": '"bbc-v1"' }) }));
    expect(result.snapshot?.articles).toEqual(cached.articles);
    expect(result.snapshot?.validators?.["BBC News"]?.etag).toBe('"bbc-v1"');
    vi.unstubAllGlobals();
  });
  it("exposes total publisher failure and keeps the demo fallback available", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    const result = await fetchPublisherNews();
    expect(result.snapshot).toBeNull();
    expect(result.error).toContain("BBC News: HTTP 503");
    expect(mocks.update).toHaveBeenCalledWith({ last_error: expect.stringContaining("HTTP 503"), next_refresh_at: expect.any(String) });
    vi.unstubAllGlobals();
  });
});
