import { queryOptions } from "@tanstack/react-query";
import { getPublisherNews, getPublisherNewsVersion } from "./publisher-news.functions";

export const publisherNewsOptions = queryOptions({
  queryKey: ["publisher-news"], queryFn: () => getPublisherNews(), staleTime: Infinity,
  retry: false,
});

export const publisherNewsVersionOptions = queryOptions({
  queryKey: ["publisher-news-version"], queryFn: () => getPublisherNewsVersion(),
  staleTime: 30_000, refetchInterval: 30_000, refetchIntervalInBackground: false, retry: false,
});
