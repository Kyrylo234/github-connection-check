import { describe, expect, it } from "vitest";

import { getScenario, scenarios } from "@/data/scenarios";
import { calculateScenarioReport, calculateWeightedScore } from "@/lib/scenario-scoring";
import { applyScenarioChoice, createScenarioSession, startScenarioSession } from "@/lib/scenario-session";
import type { Scenario, ScenarioSession } from "@/types/scenario";

function choose(session: ScenarioSession, scenario: Scenario, choiceId: string): ScenarioSession {
  const next = applyScenarioChoice(scenario, session, session.currentNodeId, choiceId, "2026-11-15T12:00:00.000Z");
  if (!next) throw new Error("Expected choice to be accepted");
  return next;
}

describe("Scenario content", () => {
  it.each(scenarios.map((scenario) => [scenario.id, scenario] as const))("%s offers three choices in every scene and completes in three decisions", (_id, scenario) => {
    for (const node of Object.values(scenario.nodes)) expect(node.choices).toHaveLength(3);

    let session = startScenarioSession(createScenarioSession(scenario), "2026-11-15T11:00:00.000Z");
    const paths = {
      cyberattack: ["isolate-segment", "coordinate-notification", "coordinated-disclosure"],
      "supply-chain": ["qualify-alternate", "verified-split", "joint-fair-plan"],
    };
    for (const choiceId of paths[scenario.id as keyof typeof paths]) {
      session = choose(session, scenario, choiceId);
    }
    expect(session.status).toBe("complete");
    expect(session.history).toHaveLength(3);
  });

  it("the first cyberattack decisions lead to three different next scenes", () => {
    const scenario = getScenario("cyberattack")!;
    const nextScenes = scenario.nodes[scenario.entryNodeId]!.choices.map((choice) => choice.nextNodeId);
    expect(new Set(nextScenes).size).toBe(3);
    expect(nextScenes).toEqual(["cyber-02-contained", "cyber-02-shutdown", "cyber-02-exposed"]);
  });

  it("the first supply-chain decisions lead to three different next scenes", () => {
    const scenario = getScenario("supply-chain")!;
    const nextScenes = scenario.nodes[scenario.entryNodeId]!.choices.map((choice) => choice.nextNodeId);
    expect(new Set(nextScenes).size).toBe(3);
    expect(nextScenes).toEqual(["supply-02-alternate", "supply-02-airlift", "supply-02-waiting"]);
  });
});

describe("Deterministic scenario scoring", () => {
  it("uses Judgment 30%, Ethics 25%, Communication 25% and Risk Management 20%", () => {
    expect(calculateWeightedScore({ judgment: 80, ethics: 60, communication: 40, riskManagement: 20 })).toBe(53);
  });

  it("calculates the cyberattack report from the actual selected choices", () => {
    const scenario = getScenario("cyberattack")!;
    let session = startScenarioSession(createScenarioSession(scenario));
    session = choose(session, scenario, "isolate-segment");
    session = choose(session, scenario, "coordinate-notification");
    session = choose(session, scenario, "coordinated-disclosure");

    const report = calculateScenarioReport(scenario, session.history);
    expect(report.dimensions).toEqual({ judgment: 92, ethics: 92, communication: 85, riskManagement: 92 });
    expect(report.overall).toBe(90);
    expect(report.decisions.map((decision) => decision.choice.id)).toEqual(["isolate-segment", "coordinate-notification", "coordinated-disclosure"]);
    expect(report.decisions[0]!.choice.consequence).toContain("Exfiltration stops");
  });

  it("repeating the same supply-chain path produces the same report", () => {
    const scenario = getScenario("supply-chain")!;
    const play = () => {
      let session = startScenarioSession(createScenarioSession(scenario));
      session = choose(session, scenario, "qualify-alternate");
      session = choose(session, scenario, "verified-split");
      session = choose(session, scenario, "joint-fair-plan");
      return calculateScenarioReport(scenario, session.history);
    };
    expect(play()).toEqual(play());
    expect(play().decisions[2]!.choice.feedback).toContain("transparent criteria");
  });

  it("rejects a history that skips the branch produced by the first choice", () => {
    const scenario = getScenario("cyberattack")!;
    expect(() => calculateScenarioReport(scenario, [
      { nodeId: "cyber-01", choiceId: "isolate-segment" },
      { nodeId: "cyber-02-shutdown", choiceId: "holding-and-phased-restore" },
      { nodeId: "cyber-03", choiceId: "coordinated-disclosure" },
    ])).toThrow("does not follow the scenario path");
  });
});
