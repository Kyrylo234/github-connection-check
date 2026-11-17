import type { AnalyzedNewsEvent } from "@/types/news";
import {
  normalizeLocationName,
  resolveNewsLocation,
  validateExternalLocation,
  type ExternalLocationCandidate,
} from "./news-location";

type Location = AnalyzedNewsEvent["location"];

export interface LocationResolution {
  location: Location | null;
  confidence: number | null;
  source: "local" | "cache" | "external" | null;
  error: string | null;
}

const developmentCache = new Map<
  string,
  { location: Location; confidence: number }
>();

function cacheKey(name: string, code: string) {
  return `${code.toUpperCase()}:${normalizeLocationName(name)}`;
}

function localResult(location: Location): LocationResolution {
  return { location, confidence: 1, source: "local", error: null };
}

async function readCachedLocation(key: string): Promise<LocationResolution | null> {
  const development = developmentCache.get(key);
  if (development) {
    return {
      location: development.location,
      confidence: development.confidence,
      source: "cache",
      error: null,
    };
  }
  if (
    process.env["NODE_ENV"] === "development" &&
    !process.env["SUPABASE_SECRET_KEY"] &&
    !process.env["SUPABASE_SERVICE_ROLE_KEY"]
  )
    return null;

  try {
    const { supabaseAdmin } = await import("./supabase-admin.server");
    const { data, error } = await supabaseAdmin
      .from("news_location_cache")
      .select("location_name,location_country,latitude,longitude,confidence")
      .eq("cache_key", key)
      .maybeSingle();
    if (error || !data) return null;
    return {
      location: {
        name: data.location_name,
        country: data.location_country,
        latitude: data.latitude,
        longitude: data.longitude,
      },
      confidence: data.confidence,
      source: "cache",
      error: null,
    };
  } catch {
    return null;
  }
}

async function writeCachedLocation(key: string, location: Location, confidence: number) {
  developmentCache.set(key, { location, confidence });
  if (
    process.env["NODE_ENV"] === "development" &&
    !process.env["SUPABASE_SECRET_KEY"] &&
    !process.env["SUPABASE_SERVICE_ROLE_KEY"]
  )
    return null;
  try {
    const { supabaseAdmin } = await import("./supabase-admin.server");
    const { error } = await supabaseAdmin.from("news_location_cache").upsert({
      cache_key: key,
      location_name: location.name,
      location_country: location.country,
      latitude: location.latitude,
      longitude: location.longitude,
      confidence,
      source: "external",
      expires_at: null,
    });
    return error ? "Location resolved, but the geocoder cache could not be saved." : null;
  } catch {
    return "Location resolved, but the geocoder cache is unavailable.";
  }
}

export async function resolveNewsLocationWithFallback(
  name: string | null,
  code: string | null,
): Promise<LocationResolution> {
  if (!name || !code)
    return {
      location: null,
      confidence: null,
      source: null,
      error: "A place name and ISO country code are required.",
    };
  const local = resolveNewsLocation(name, code);
  if (local) return localResult(local);
  const key = cacheKey(name, code);
  const cached = await readCachedLocation(key);
  if (cached) return cached;

  const userAgent = process.env["GEOCODER_USER_AGENT"];
  if (!userAgent)
    return {
      location: null,
      confidence: null,
      source: null,
      error: "External geocoder disabled; set GEOCODER_USER_AGENT to enable the fallback.",
    };
  const endpoint = process.env["GEOCODER_URL"] ?? "https://nominatim.openstreetmap.org/search";
  try {
    const url = new URL(endpoint);
    if (!["http:", "https:"].includes(url.protocol))
      return {
        location: null,
        confidence: null,
        source: null,
        error: "External geocoder URL must use HTTP or HTTPS.",
      };
    url.searchParams.set("q", name);
    url.searchParams.set("countrycodes", code.toLowerCase());
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": userAgent },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok)
      return {
        location: null,
        confidence: null,
        source: null,
        error: `External geocoder returned HTTP ${response.status}.`,
      };
    const candidates = (await response.json()) as unknown;
    if (!Array.isArray(candidates))
      return {
        location: null,
        confidence: null,
        source: null,
        error: "External geocoder returned an invalid response.",
      };
    const validated = candidates
      .map((candidate) =>
        candidate && typeof candidate === "object"
          ? validateExternalLocation(candidate as ExternalLocationCandidate, name, code)
          : null,
      )
      .find((result): result is NonNullable<typeof result> => Boolean(result));
    if (!validated)
      return {
        location: null,
        confidence: null,
        source: null,
        error: "External geocoder returned no country-verified match.",
      };
    const cacheError = await writeCachedLocation(key, validated.location, validated.confidence);
    return { ...validated, source: "external", error: cacheError };
  } catch {
    return {
      location: null,
      confidence: null,
      source: null,
      error: "External geocoder unavailable; heuristic fallback remains active.",
    };
  }
}
