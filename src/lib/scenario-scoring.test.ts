import { describe, expect, it } from "vitest";

import { getScenario, scenarios } from "@/data/scenarios";
import { calculateScenarioReport, calculateWeightedScore } from "@/lib/scenario-scoring";
import { acknowledgeScenarioEvent, applyScenarioChoice, continueScenarioMonitoring, createScenarioSession, receiveScenarioEvent, startScenarioSession } from "@/lib/scenario-session";
import type { Scenario, ScenarioSession } from "@/types/scenario";

const CYBER_REPORT = "Situation: unauthorised access caused a customer data breach and records were copied before we contained access and isolated the affected segment. Priority risk: further customer data exposure, service disruption, loss of trust and regulatory harm. Actions taken: we preserved evidence, coordinated the response team and issued accurate customer and regulator updates. Next steps: the incident team will continue forensic investigation, verify the full access scope, monitor systems, restore services safely and provide support to affected customers. Leadership will receive a coordinated update after review. Uncertainty: the final number of records and complete intrusion scope remain unknown while the investigation continues, so no unconfirmed claims should be released.";

const SUPPLY_REPORT = "Situation: supplier disruption and freight delays created a medical supply shortage affecting hospital stock and patient monitoring deliveries. Priority risk: delayed essential devices could cause clinical harm, while unverified components create patient safety and quality risks. Actions taken: we qualified alternate suppliers, allocated scarce stock by patient need and gave hospital customers the same operating picture. Next steps: the team will verify capacity, monitor stock daily, coordinate urgent freight, update customers and review the allocation plan with leadership. We will support the most exposed hospitals first. Uncertainty: supplier recovery dates and final delivery timing remain unconfirmed, so the shortage scope and patient impact are still under investigation and require cautious communication.";

function choose(session: ScenarioSession, scenario: Scenario, choiceId: string): ScenarioSession {
  const ready = acknowledgeScenarioEvent(receiveScenarioEvent(session, session.currentNodeId), session.currentNodeId);
  const next = applyScenarioChoice(scenario, ready, session.currentNodeId, choiceId);
  if (!next) throw new Error("Expected choice to be accepted");
  return next.status === "debrief" ? continueScenarioMonitoring(next) : next;
}

describe("Scenario content", () => {
  it.each(scenarios.map((scenario) => [scenario.id, scenario] as const))("%s offers three geolocated choices in every scene and a final writing task", (_id, scenario) => {
    for (const node of Object.values(scenario.nodes)) {
      expect(node.choices).toHaveLength(3);
      expect(Number.isFinite(node.event.location.latitude)).toBe(true);
      expect(Number.isFinite(node.event.location.longitude)).toBe(true);
    }

    let session = startScenarioSession(createScenarioSession(scenario), "2026-11-15T11:00:00.000Z");
    const paths = {
      cyberattack: ["isolate-segment", "coordinate-notification", "coordinated-disclosure"],
      "supply-chain": ["qualify-alternate", "verified-split", "joint-fair-plan"],
    };
    for (const choiceId of paths[scenario.id as keyof typeof paths]) session = choose(session, scenario, choiceId);
    expect(session.status).toBe("situation-report");
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

  it("calculates the cyberattack report from actual choices and the submitted text", () => {
    const scenario = getScenario("cyberattack")!;
    let session = startScenarioSession(createScenarioSession(scenario));
    session = choose(session, scenario, "isolate-segment");
    session = choose(session, scenario, "coordinate-notification");
    session = choose(session, scenario, "coordinated-disclosure");

    const report = calculateScenarioReport(scenario, session.history, CYBER_REPORT);
    expect(report.decisionDimensions).toEqual({ judgment: 92, ethics: 92, communication: 85, riskManagement: 92 });
    expect(report.writing.text).toBe(CYBER_REPORT);
    expect(report.writing.criteria.every((criterion) => criterion.score === 20)).toBe(true);
    expect(report.dimensions).toEqual({ judgment: 94, ethics: 94, communication: 89, riskManagement: 94 });
    expect(report.overall).toBe(93);
    expect(report.decisions.map((decision) => decision.choice.id)).toEqual(["isolate-segment", "coordinate-notification", "coordinated-disclosure"]);
  });

  it("repeating the same supply-chain path and report produces the same result", () => {
    const scenario = getScenario("supply-chain")!;
    const play = () => {
      let session = startScenarioSession(createScenarioSession(scenario));
      session = choose(session, scenario, "qualify-alternate");
      session = choose(session, scenario, "verified-split");
      session = choose(session, scenario, "joint-fair-plan");
      return calculateScenarioReport(scenario, session.history, SUPPLY_REPORT);
    };
    expect(play()).toEqual(play());
    expect(play().decisions[2]!.choice.feedback).toContain("transparent criteria");
    expect(play().writing.overall).toBe(100);
  });

  it("rejects a history that skips the branch produced by the first choice", () => {
    const scenario = getScenario("cyberattack")!;
    expect(() => calculateScenarioReport(scenario, [
      { nodeId: "cyber-01", choiceId: "isolate-segment" },
      { nodeId: "cyber-02-shutdown", choiceId: "holding-and-phased-restore" },
      { nodeId: "cyber-03", choiceId: "coordinated-disclosure" },
    ], CYBER_REPORT)).toThrow("does not follow the scenario path");
  });
});
