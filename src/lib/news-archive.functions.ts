import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { readNewsArchive } from "./news-archive.server";

export const getNewsArchivePage = createServerFn({ method: "GET" })
  .validator(z.object({ page: z.number().int().min(1).max(10001) }))
  .handler(({ data }) => readNewsArchive(data.page - 1));
