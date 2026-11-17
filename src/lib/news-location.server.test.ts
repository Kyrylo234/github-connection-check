import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("./supabase-admin.server", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: mocks.maybeSingle }),
      }),
      upsert: mocks.upsert,
    }),
  },
}));

import { resolveNewsLocationWithFallback } from "./news-location.server";

describe("server location resolution", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("GEOCODER_USER_AGENT", "SitRep test");
    vi.stubEnv("GEOCODER_URL", "https://geocoder.example.test/search");
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    mocks.upsert.mockResolvedValue({ error: null });
  });

  it("uses the local gazetteer before contacting the external geocoder", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(resolveNewsLocationWithFallback("France", "FR")).resolves.toMatchObject({
      source: "local",
      location: { country: "France" },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates and caches a country-scoped external result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            lat: "48.85341",
            lon: "2.3488",
            name: "Testville",
            display_name: "Testville, Paris, France",
            address: { city: "Paris", country: "France", country_code: "fr" },
          },
        ],
      }),
    );
    await expect(resolveNewsLocationWithFallback("Testville", "FR")).resolves.toMatchObject({
      source: "external",
      confidence: 0.85,
      location: { latitude: 48.85341, longitude: 2.3488, country: "France" },
    });
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        cache_key: "FR:testville",
        source: "external",
      }),
    );
  });

  it("uses an indefinite durable cache entry before contacting the provider", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: {
        location_name: "Testville",
        location_country: "France",
        latitude: 48.85341,
        longitude: 2.3488,
        confidence: 0.85,
        expires_at: null,
      },
      error: null,
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(resolveNewsLocationWithFallback("Testville", "FR")).resolves.toMatchObject({
      source: "cache",
      location: { latitude: 48.85341, longitude: 2.3488 },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails explicitly when the external fallback is not configured", async () => {
    vi.stubEnv("GEOCODER_USER_AGENT", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(resolveNewsLocationWithFallback("Atlantis", "FR")).resolves.toMatchObject({
      location: null,
      error: expect.stringContaining("GEOCODER_USER_AGENT"),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
