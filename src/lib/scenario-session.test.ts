import { describe, expect, it } from "vitest";

import { getScenario } from "@/data/scenarios";
import {
  acknowledgeScenarioEvent,
  applyScenarioChoice,
  continueScenarioMonitoring,
  createScenarioSession,
  MINIMUM_SITUATION_REPORT_CHARACTERS,
  receiveScenarioEvent,
  SCENARIO_EVENT_DELAY_MS,
  startScenarioSession,
  submitSituationReport,
  updateSituationReportDraft,
} from "@/lib/scenario-session";
import type { Scenario, ScenarioSession } from "@/types/scenario";

function readyToChoose(session: ScenarioSession): ScenarioSession {
  return acknowledgeScenarioEvent(receiveScenarioEvent(session, session.currentNodeId), session.currentNodeId);
}

function choose(scenario: Scenario, session: ScenarioSession, choiceId: string): ScenarioSession {
  const next = applyScenarioChoice(scenario, session, session.currentNodeId, choiceId);
  if (!next) throw new Error("Expected choice to be accepted");
  return next;
}

describe("Globe-led local scenario session", () => {
  it("starts on a calm globe, then requires reading before a decision", () => {
    const scenario = getScenario("cyberattack")!;
    const initial = createScenarioSession(scenario);
    expect(initial).toMatchObject({ status: "briefing", currentNodeId: "cyber-01", history: [], situationReport: "" });
    expect(SCENARIO_EVENT_DELAY_MS).toBe(2400);

    const standby = startScenarioSession(initial, "2026-11-15T11:00:00.000Z");
    expect(standby.status).toBe("standby");
    expect(applyScenarioChoice(scenario, standby, "cyber-01", "shutdown-all")).toBeNull();

    const reading = receiveScenarioEvent(standby, "cyber-01");
    expect(reading.status).toBe("reading");
    expect(applyScenarioChoice(scenario, reading, "cyber-01", "shutdown-all")).toBeNull();

    const decision = acknowledgeScenarioEvent(reading, "cyber-01");
    const next = choose(scenario, decision, "shutdown-all");
    expect(next).toMatchObject({ status: "debrief", currentNodeId: "cyber-02-shutdown", history: [{ nodeId: "cyber-01", choiceId: "shutdown-all" }] });
    expect(continueScenarioMonitoring(next).status).toBe("standby");
  });

  it("moves to the final writing task after three decisions and completes only with a substantive report", () => {
    const scenario = getScenario("supply-chain")!;
    let session = startScenarioSession(createScenarioSession(scenario));
    for (const choiceId of ["airlift-stock", "emergency-consolidate", "joint-fair-plan"]) {
      session = readyToChoose(session);
      session = choose(scenario, session, choiceId);
      if (session.status === "debrief") session = continueScenarioMonitoring(session);
    }
    expect(session.status).toBe("situation-report");
    expect(session.history).toHaveLength(3);
    expect(submitSituationReport(session)).toBeNull();

    session = updateSituationReportDraft(session, "x".repeat(MINIMUM_SITUATION_REPORT_CHARACTERS));
    const completed = submitSituationReport(session, "2026-11-15T12:00:00.000Z");
    expect(completed).toMatchObject({ status: "complete", completedAt: "2026-11-15T12:00:00.000Z" });
  });

  it("replay creates a clean briefing with no decisions or written report", () => {
    const scenario = getScenario("supply-chain")!;
    expect(createScenarioSession(scenario)).toEqual({ version: 2, scenarioId: "supply-chain", status: "briefing", currentNodeId: "supply-01", history: [], situationReport: "", startedAt: null, completedAt: null });
  });

  it("does not accept a choice from a different scene", () => {
    const scenario = getScenario("cyberattack")!;
    const playing = readyToChoose(startScenarioSession(createScenarioSession(scenario)));
    expect(applyScenarioChoice(scenario, playing, "cyber-03", "coordinated-disclosure")).toBeNull();
  });
});
