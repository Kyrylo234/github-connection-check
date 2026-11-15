import { queryOptions } from "@tanstack/react-query";
import { getPublisherNews } from "./publisher-news.functions";

export const publisherNewsOptions = queryOptions({
  queryKey: ["publisher-news"], queryFn: () => getPublisherNews(), staleTime: 60_000,
  refetchInterval: 10 * 60_000, retry: false,
});