import { createServerFn } from "@tanstack/react-start";
import { fetchPublisherNews } from "./publisher-news.server";
import { newsSnapshotVersion } from "./publisher-news";

/** Public read: fixed, allowlisted feeds only, no visitor-controlled URL or cache writes. */
export const getPublisherNews = createServerFn({ method: "GET" }).handler(async () => {
  return fetchPublisherNews();
});

/** Small response for frequent visible-tab checks; it also triggers a due shared refresh. */
export const getPublisherNewsVersion = createServerFn({ method: "GET" }).handler(async () => {
  const response = await fetchPublisherNews();
  return {
    version: newsSnapshotVersion(response.snapshot),
    fetchedAt: response.snapshot?.fetchedAt ?? null,
    nextRefreshAt: response.nextRefreshAt,
    stale: response.stale,
    error: response.error,
  };
});
