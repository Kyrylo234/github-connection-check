import { describe, expect, it } from "vitest";

import { getScenario } from "@/data/scenarios";
import { applyScenarioChoice, createScenarioSession, startScenarioSession } from "@/lib/scenario-session";

describe("Local scenario session", () => {
  it("starts with no choices and records the selected branch", () => {
    const scenario = getScenario("cyberattack")!;
    const initial = createScenarioSession(scenario);
    expect(initial).toMatchObject({ status: "briefing", currentNodeId: "cyber-01", history: [] });

    const playing = startScenarioSession(initial, "2026-11-15T11:00:00.000Z");
    const next = applyScenarioChoice(scenario, playing, "cyber-01", "shutdown-all");
    expect(next).toMatchObject({ status: "playing", currentNodeId: "cyber-02-shutdown", history: [{ nodeId: "cyber-01", choiceId: "shutdown-all" }] });
  });

  it("replay creates a clean briefing with no score-bearing history", () => {
    const scenario = getScenario("supply-chain")!;
    let session = startScenarioSession(createScenarioSession(scenario));
    session = applyScenarioChoice(scenario, session, "supply-01", "airlift-stock")!;
    session = applyScenarioChoice(scenario, session, "supply-02-airlift", "emergency-consolidate")!;
    session = applyScenarioChoice(scenario, session, "supply-03", "joint-fair-plan", "2026-11-15T12:00:00.000Z")!;
    expect(session.status).toBe("complete");
    expect(session.history).toHaveLength(3);

    const replayed = createScenarioSession(scenario);
    expect(replayed).toEqual({ version: 1, scenarioId: "supply-chain", status: "briefing", currentNodeId: "supply-01", history: [], startedAt: null, completedAt: null });
  });

  it("does not accept a choice from a different scene", () => {
    const scenario = getScenario("cyberattack")!;
    const playing = startScenarioSession(createScenarioSession(scenario));
    expect(applyScenarioChoice(scenario, playing, "cyber-03", "coordinated-disclosure")).toBeNull();
  });
});
