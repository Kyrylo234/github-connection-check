import gazetteer from "@/data/news-gazetteer.json";
import type { AnalyzedNewsEvent } from "@/types/news";

export const normalizeLocationName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const countries = gazetteer.countries as Record<
  string,
  { name: string; names: string[]; lat: number; lng: number }
>;

/** Exact gazetteer match, scoped by ISO country. Unknown or ambiguous places stay null. */
export function resolveNewsLocation(
  name: string | null,
  code: string | null,
): AnalyzedNewsEvent["location"] | null {
  if (!name || !code) return null;
  const country = countries[code.toUpperCase()];
  if (!country) return null;
  const normalized = normalizeLocationName(name);
  if (country.names.some((alias) => normalizeLocationName(alias) === normalized))
    return {
      name: `${country.name} (national centre)`,
      country: country.name,
      latitude: country.lat,
      longitude: country.lng,
    };
  const matches = gazetteer.cities.filter(
    (city) =>
      city.code === code.toUpperCase() &&
      city.names.some((alias) => normalizeLocationName(alias) === normalized),
  );
  const city = matches.length === 1 ? matches[0] : null;
  return city
    ? { name: city.name, country: country.name, latitude: city.lat, longitude: city.lng }
    : null;
}

export interface ExternalLocationCandidate {
  lat?: unknown;
  lon?: unknown;
  name?: unknown;
  display_name?: unknown;
  type?: unknown;
  address?: {
    country?: unknown;
    country_code?: unknown;
    city?: unknown;
    town?: unknown;
    village?: unknown;
    municipality?: unknown;
    county?: unknown;
    state_district?: unknown;
    suburb?: unknown;
  };
}

export interface ValidatedExternalLocation {
  location: AnalyzedNewsEvent["location"];
  confidence: number;
}

const localityFields = [
  "name",
  "city",
  "town",
  "village",
  "municipality",
  "county",
  "state_district",
  "suburb",
] as const;

/** Accept only bounded coordinates from a result that is scoped to the requested country. */
export function validateExternalLocation(
  candidate: ExternalLocationCandidate,
  name: string,
  code: string,
): ValidatedExternalLocation | null {
  const latitude =
    typeof candidate.lat === "string" || typeof candidate.lat === "number"
      ? Number(candidate.lat)
      : NaN;
  const longitude =
    typeof candidate.lon === "string" || typeof candidate.lon === "number"
      ? Number(candidate.lon)
      : NaN;
  const address = candidate.address;
  const countryCode =
    typeof address?.country_code === "string" ? address.country_code.toUpperCase() : "";
  const country = typeof address?.country === "string" ? address.country.trim() : "";
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    countryCode !== code.toUpperCase() ||
    !country
  )
    return null;

  const normalizedName = normalizeLocationName(name);
  const names = localityFields
    .map((field) => (field === "name" ? candidate.name : address?.[field]))
    .filter((value): value is string => typeof value === "string")
    .map(normalizeLocationName);
  const displayName =
    typeof candidate.display_name === "string" ? normalizeLocationName(candidate.display_name) : "";
  const exact = names.includes(normalizedName);
  if (!exact && !displayName.includes(normalizedName)) return null;
  const matchedName = names.find((value) => value === normalizedName) ?? name.trim();
  return {
    location: { name: matchedName, country, latitude, longitude },
    confidence: exact ? 0.85 : 0.7,
  };
}
