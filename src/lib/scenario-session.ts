import type { Scenario, ScenarioSession } from "@/types/scenario";
import { reportBody } from "@/lib/situation-report-draft";

export const SCENARIO_EVENT_DELAY_MS = 2400;
export const MINIMUM_SITUATION_REPORT_CHARACTERS = 300;
export const MAXIMUM_SITUATION_REPORT_CHARACTERS = 1800;

export function createScenarioSession(scenario: Scenario): ScenarioSession {
  return {
    version: 2,
    scenarioId: scenario.id,
    status: "briefing",
    currentNodeId: scenario.entryNodeId,
    history: [],
    situationReport: "",
    startedAt: null,
    completedAt: null,
  };
}

export function startScenarioSession(
  session: ScenarioSession,
  startedAt = new Date().toISOString(),
): ScenarioSession {
  if (session.status !== "briefing") return session;
  return { ...session, status: "standby", startedAt };
}

export function receiveScenarioEvent(session: ScenarioSession, nodeId: string): ScenarioSession {
  if (session.status !== "standby" || session.currentNodeId !== nodeId) return session;
  return { ...session, status: "reading" };
}

export function acknowledgeScenarioEvent(session: ScenarioSession, nodeId: string): ScenarioSession {
  if (session.status !== "reading" || session.currentNodeId !== nodeId) return session;
  return { ...session, status: "decision" };
}

export function continueScenarioMonitoring(session: ScenarioSession): ScenarioSession {
  if (session.status !== "debrief") return session;
  return { ...session, status: "standby" };
}

export function applyScenarioChoice(
  scenario: Scenario,
  session: ScenarioSession,
  nodeId: string,
  choiceId: string,
): ScenarioSession | null {
  if (session.status !== "decision" || session.currentNodeId !== nodeId) return null;
  const node = scenario.nodes[nodeId];
  const choice = node?.choices.find((candidate) => candidate.id === choiceId);
  if (!node || !choice) return null;

  const finalDecision = choice.nextNodeId === null;
  return {
    ...session,
    status: finalDecision ? "situation-report" : "debrief",
    currentNodeId: choice.nextNodeId ?? node.id,
    history: [...session.history, { nodeId, choiceId }],
  };
}

export function updateSituationReportDraft(session: ScenarioSession, text: string): ScenarioSession {
  if (session.status !== "situation-report") return session;
  return { ...session, situationReport: text.slice(0, MAXIMUM_SITUATION_REPORT_CHARACTERS) };
}

export function submitSituationReport(
  session: ScenarioSession,
  completedAt = new Date().toISOString(),
): ScenarioSession | null {
  const length = reportBody(session.situationReport).trim().length;
  if (
    session.status !== "situation-report" ||
    length < MINIMUM_SITUATION_REPORT_CHARACTERS ||
    length > MAXIMUM_SITUATION_REPORT_CHARACTERS
  ) {
    return null;
  }
  return { ...session, status: "complete", situationReport: session.situationReport.trim(), completedAt };
}

export function isScenarioSession(value: unknown, scenario: Scenario): value is ScenarioSession {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ScenarioSession>;
  const statuses: ScenarioSession["status"][] = [
    "briefing",
    "standby",
    "reading",
    "decision",
    "debrief",
    "situation-report",
    "complete",
  ];
  return (
    candidate.version === 2 &&
    candidate.scenarioId === scenario.id &&
    statuses.includes(candidate.status as ScenarioSession["status"]) &&
    typeof candidate.currentNodeId === "string" &&
    Boolean(scenario.nodes[candidate.currentNodeId]) &&
    Array.isArray(candidate.history) &&
    candidate.history.every(
      (entry) => entry && typeof entry.nodeId === "string" && typeof entry.choiceId === "string",
    ) &&
    typeof candidate.situationReport === "string" &&
    candidate.situationReport.length <= MAXIMUM_SITUATION_REPORT_CHARACTERS &&
    (typeof candidate.startedAt === "string" || candidate.startedAt === null) &&
    (typeof candidate.completedAt === "string" || candidate.completedAt === null)
  );
}
