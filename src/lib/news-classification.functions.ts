import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { analysisInputSchema } from "./news-classification";
import { analyzeNewsBatch } from "./news-classification.server";

export const analyzeNews = createServerFn({ method: "POST" })
  .inputValidator(input => analysisInputSchema.parse(input))
  .handler(({ data }) => analyzeNewsBatch(getRequest(), process.env['LOVABLE_API_KEY'], data));