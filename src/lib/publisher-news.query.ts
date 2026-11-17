import { queryOptions } from "@tanstack/react-query";
import { getNewsMapEvents } from "./news-archive.functions";
import { getPublisherNews, getPublisherNewsVersion } from "./publisher-news.functions";
import type { NewsMapArchiveFilters } from "./news-archive.server";

export const publisherNewsOptions = queryOptions({
  queryKey: ["publisher-news"], queryFn: () => getPublisherNews(), staleTime: Infinity,
  retry: false,
});

export const publisherNewsVersionOptions = queryOptions({
  queryKey: ["publisher-news-version"], queryFn: () => getPublisherNewsVersion(),
  staleTime: 60_000, refetchInterval: 60_000, refetchIntervalInBackground: false, retry: false,
});

export const newsMapArchiveOptions = (filters: NewsMapArchiveFilters) => queryOptions({
  queryKey: ["news-map-archive", filters],
  queryFn: () => getNewsMapEvents({ data: filters }),
  staleTime: 60_000,
  retry: false,
});
