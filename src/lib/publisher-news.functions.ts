import { createServerFn } from "@tanstack/react-start";
import { fetchPublisherNews } from "./publisher-news.server";

/** Public read: fixed, allowlisted feeds only, no visitor-controlled URL or cache writes. */
export const getPublisherNews = createServerFn({ method: "GET" }).handler(async () => fetchPublisherNews());