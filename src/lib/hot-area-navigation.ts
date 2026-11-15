import { getHotspotIntensity } from "@/lib/news-analysis";
import { VERY_HOT_INTENSITY } from "@/lib/hotspot-focus";
import type { AnalyzedNewsEvent } from "@/types/news";

/** Rank only map-ready events; filters are applied by the caller. */
export function rankHotAreas(events: readonly AnalyzedNewsEvent[]): AnalyzedNewsEvent[] {
  return events.filter((event) => {
    const { latitude, longitude } = event.location;
    return Number.isFinite(latitude) && Math.abs(latitude) <= 90
      && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
  }).sort((a, b) => getHotspotIntensity(b) - getHotspotIntensity(a)
    || Date.parse(b.occurredAt) - Date.parse(a.occurredAt)
    || a.id.localeCompare(b.id));
}

export function rankVeryHotAreas(events: readonly AnalyzedNewsEvent[]): AnalyzedNewsEvent[] {
  return rankHotAreas(events).filter((event) => getHotspotIntensity(event) >= VERY_HOT_INTENSITY);
}

export function nextHotArea(areas: readonly AnalyzedNewsEvent[], currentId: string | null) {
  if (areas.length === 0) return null;
  const currentIndex = areas.findIndex((event) => event.id === currentId);
  return areas[(currentIndex + 1) % areas.length] ?? null;
}
