import { getHotspotIntensity } from "@/lib/news-analysis";
import type { AnalyzedNewsEvent } from "@/types/news";

// Visual intensity, not the World Tension Index.
export const VERY_HOT_INTENSITY = 0.8;
export const HOTSPOT_FOCUS_HOLD_MS = 8000;

export function findNewHotspot(
  previous: readonly AnalyzedNewsEvent[],
  incoming: readonly AnalyzedNewsEvent[],
): AnalyzedNewsEvent | null {
  const known = new Map(previous.map((event) => [event.id, event]));
  const candidates = incoming.filter((event) => {
    const { latitude, longitude } = event.location;
    if (event.isDemo || !Number.isFinite(latitude) || !Number.isFinite(longitude)
      || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return false;
    const intensity = getHotspotIntensity(event);
    if (intensity < VERY_HOT_INTENSITY) return false;
    const old = known.get(event.id);
    if (!old) return true;
    const oldArticleIds = new Set(old.articles.map((article) => article.id));
    return event.articles.some((article) => !oldArticleIds.has(article.id))
      || intensity - getHotspotIntensity(old) >= 0.1;
  });
  return candidates.sort((a, b) => getHotspotIntensity(b) - getHotspotIntensity(a)
    || Date.parse(b.occurredAt) - Date.parse(a.occurredAt)
    || a.id.localeCompare(b.id))[0] ?? null;
}