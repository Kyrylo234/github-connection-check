import { describe, expect, it, vi } from "vitest";

const askGemini = vi.hoisted(() => vi.fn());
vi.mock("@/lib/gemini.server", () => ({ askGemini }));

import { reviewReasoning } from "./reasoning-feedback.server";
import { getScenario } from "@/data/scenarios";
import type { ScenarioChoice } from "@/types/scenario";

const scenario = getScenario("cyberattack")!;
const history = [] as { nodeId: string; choiceId: string }[];
let nodeId: string | null = scenario.entryNodeId;
while (nodeId) {
  const choice: ScenarioChoice = scenario.nodes[nodeId]!.choices[0]!;
  history.push({ nodeId, choiceId: choice.id });
  nodeId = choice.nextNodeId;
}

describe("Scenario Lab Gemini feedback", () => {
  it("returns optional feedback without a score", async () => {
    askGemini.mockResolvedValueOnce(JSON.stringify({ feedback: "Evidence of reasoning: clear next step." }));
    const result = await reviewReasoning(new Request("https://example.com", { headers: { "x-forwarded-for": "test-one" } }), "secret", {
      scenarioId: "cyberattack", history, report: "A short candidate response",
    });
    expect(result).toEqual({ feedback: "Evidence of reasoning: clear next step.", error: null });
    expect(result).not.toHaveProperty("score");
    expect(askGemini).toHaveBeenCalledOnce();
  });

  it("keeps scores untouched when the provider fails", async () => {
    askGemini.mockRejectedValueOnce(Object.assign(new Error("quota"), { statusCode: 429 }));
    const result = await reviewReasoning(new Request("https://example.com", { headers: { "x-forwarded-for": "test-two" } }), "secret", {
      scenarioId: "cyberattack", history, report: "Another candidate response",
    });
    expect(result.feedback).toBeNull();
    expect(result.error).toContain("free-tier limit");
    expect(result).not.toHaveProperty("score");
  });
});
