export const SCENARIO_DIMENSIONS = [
  { id: "judgment", label: "Judgment", weight: 0.3 },
  { id: "ethics", label: "Ethics", weight: 0.25 },
  { id: "communication", label: "Communication", weight: 0.25 },
  { id: "riskManagement", label: "Risk Management", weight: 0.2 },
] as const;

export type DimensionId = (typeof SCENARIO_DIMENSIONS)[number]["id"];
export type DimensionScores = Record<DimensionId, number>;

export interface ScenarioChoice {
  id: string;
  label: string;
  description: string;
  consequence: string;
  feedback: string;
  nextNodeId: string | null;
  scores: DimensionScores;
}

export interface ScenarioNode {
  id: string;
  step: number;
  title: string;
  situation: string;
  choices: ScenarioChoice[];
}

export interface Scenario {
  id: string;
  code: string;
  title: string;
  summary: string;
  role: string;
  organisation: string;
  briefing: string;
  objectives: string[];
  estimatedMinutes: number;
  decisionCount: number;
  entryNodeId: string;
  nodes: Record<string, ScenarioNode>;
}

export interface DecisionRecord {
  nodeId: string;
  choiceId: string;
}

export interface ScenarioSession {
  version: 1;
  scenarioId: string;
  status: "briefing" | "playing" | "complete";
  currentNodeId: string;
  history: DecisionRecord[];
  startedAt: string | null;
  completedAt: string | null;
}
