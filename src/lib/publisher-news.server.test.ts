import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), read: vi.fn(), update: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.read }) }), update: (value: unknown) => { mocks.update(value); return { eq: async () => ({ error: null }) }; } }),
  rpc: mocks.rpc,
} }));
import { fetchPublisherNews } from "./publisher-news.server";
describe("shared publisher cache", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.read.mockResolvedValue({ data: null, error: null }); });
  it("never fetches publishers when another visitor owns the ten-minute lease", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    const result = await fetchPublisherNews();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.snapshot).toBeNull();
    expect(result.error).toContain("in progress");
    vi.unstubAllGlobals();
  });
  it("exposes total publisher failure and keeps the demo fallback available", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    const result = await fetchPublisherNews();
    expect(result.snapshot).toBeNull();
    expect(result.error).toContain("BBC News: HTTP 503");
    expect(mocks.update).toHaveBeenCalledWith({ last_error: expect.stringContaining("HTTP 503") });
    vi.unstubAllGlobals();
  });
});