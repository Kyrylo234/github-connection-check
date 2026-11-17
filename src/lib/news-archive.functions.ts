import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { readNewsArchive, readNewsMapEvents } from "./news-archive.server";

export const getNewsArchivePage = createServerFn({ method: "GET" })
  .validator(z.object({ page: z.number().int().min(1).max(10001) }))
  .handler(({ data }) => readNewsArchive(data.page - 1));

export const getNewsMapEvents = createServerFn({ method: "GET" })
  .validator(z.object({
    sentiment: z.enum(["all", "positive", "neutral", "negative"]),
    timeRange: z.number().finite().min(1),
    minimumSeverity: z.number().finite().min(0).max(1),
    snapshotAt: z.string().datetime(),
  }))
  .handler(({ data }) => readNewsMapEvents(data));
