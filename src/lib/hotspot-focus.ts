import { getHotspotIntensity } from "@/lib/news-analysis";
import type { AnalyzedNewsEvent } from "@/types/news";

// Used by the separate idle tour; new-arrival focus has no intensity threshold.
export const VERY_HOT_INTENSITY = 0.8;
export const HOTSPOT_FOCUS_HOLD_MS = 8000;

/** Select the hottest located area containing a newly seen publisher story. */
export function findNewHotspot(
  previous: readonly AnalyzedNewsEvent[],
  incoming: readonly AnalyzedNewsEvent[],
): AnalyzedNewsEvent | null {
  const knownArticleIds = new Set(
    previous.flatMap((event) => event.articles.map((article) => article.id)),
  );
  const candidates = incoming.filter((event) => {
    const { latitude, longitude } = event.location;
    if (
      event.isDemo ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    )
      return false;
    return event.articles.some((article) => !knownArticleIds.has(article.id));
  });
  return (
    candidates.sort(
      (a, b) =>
        getHotspotIntensity(b) - getHotspotIntensity(a) ||
        Date.parse(b.occurredAt) - Date.parse(a.occurredAt) ||
        a.id.localeCompare(b.id),
    )[0] ?? null
  );
}
