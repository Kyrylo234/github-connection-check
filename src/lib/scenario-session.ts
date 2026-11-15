import type { Scenario, ScenarioSession } from "@/types/scenario";

export function createScenarioSession(scenario: Scenario): ScenarioSession {
  return {
    version: 1,
    scenarioId: scenario.id,
    status: "briefing",
    currentNodeId: scenario.entryNodeId,
    history: [],
    startedAt: null,
    completedAt: null,
  };
}

export function startScenarioSession(
  session: ScenarioSession,
  startedAt = new Date().toISOString(),
): ScenarioSession {
  if (session.status !== "briefing") return session;
  return { ...session, status: "playing", startedAt };
}

export function applyScenarioChoice(
  scenario: Scenario,
  session: ScenarioSession,
  nodeId: string,
  choiceId: string,
  completedAt = new Date().toISOString(),
): ScenarioSession | null {
  if (session.status !== "playing" || session.currentNodeId !== nodeId) return null;
  const node = scenario.nodes[nodeId];
  const choice = node?.choices.find((candidate) => candidate.id === choiceId);
  if (!node || !choice) return null;

  const complete = choice.nextNodeId === null;
  return {
    ...session,
    status: complete ? "complete" : "playing",
    currentNodeId: choice.nextNodeId ?? node.id,
    history: [...session.history, { nodeId, choiceId }],
    completedAt: complete ? completedAt : null,
  };
}

export function isScenarioSession(value: unknown, scenario: Scenario): value is ScenarioSession {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ScenarioSession>;
  return (
    candidate.version === 1 &&
    candidate.scenarioId === scenario.id &&
    (candidate.status === "briefing" || candidate.status === "playing" || candidate.status === "complete") &&
    typeof candidate.currentNodeId === "string" &&
    Boolean(scenario.nodes[candidate.currentNodeId]) &&
    Array.isArray(candidate.history) &&
    candidate.history.every(
      (entry) => entry && typeof entry.nodeId === "string" && typeof entry.choiceId === "string",
    ) &&
    (typeof candidate.startedAt === "string" || candidate.startedAt === null) &&
    (typeof candidate.completedAt === "string" || candidate.completedAt === null)
  );
}
