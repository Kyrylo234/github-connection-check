import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

export const getReasoningFeedback = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({
    scenarioId: z.enum(["cyberattack", "supply-chain"]),
    history: z.array(z.object({ nodeId: z.string().max(100), choiceId: z.string().max(100) })).length(3),
    report: z.string().min(1).max(1800),
  }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env["GEMINI_API_KEY"];
    if (!key) return { feedback: null, error: "AI feedback is not configured yet." };
    const { reviewReasoning } = await import("@/lib/reasoning-feedback.server");
    return reviewReasoning(getRequest(), key, data);
  });