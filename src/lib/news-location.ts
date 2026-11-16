import gazetteer from "@/data/news-gazetteer.json";
import type { AnalyzedNewsEvent } from "@/types/news";

const normalize = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const countries = gazetteer.countries as Record<string, { name: string; names: string[]; lat: number; lng: number }>;

/** Exact gazetteer match, scoped by ISO country. Unknown or ambiguous places stay null. */
export function resolveNewsLocation(name: string | null, code: string | null): AnalyzedNewsEvent["location"] | null {
  if (!name || !code) return null;
  const country = countries[code.toUpperCase()];
  if (!country) return null;
  const normalized = normalize(name);
  if (country.names.some(alias => normalize(alias) === normalized)) return { name: `${country.name} (national centre)`, country: country.name, latitude: country.lat, longitude: country.lng };
  const matches = gazetteer.cities.filter(city => city.code === code.toUpperCase() && city.names.some(alias => normalize(alias) === normalized));
  const city = matches.length === 1 ? matches[0] : null;
  return city ? { name: city.name, country: country.name, latitude: city.lat, longitude: city.lng } : null;
}
