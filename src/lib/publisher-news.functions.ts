import { createServerFn } from "@tanstack/react-start";
import { fetchPublisherNews } from "./publisher-news.server";
import { readNewsAnalysis } from "./news-classification.server";

/** Public read: fixed, allowlisted feeds only, no visitor-controlled URL or cache writes. */
export const getPublisherNews = createServerFn({ method: "GET" }).handler(async () => {
  const response = await fetchPublisherNews();
  return { ...response, ...(response.snapshot ? { analysis: await readNewsAnalysis(response.snapshot.articles) } : {}) };
});