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

export interface ScenarioLocation {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface ScenarioEvent {
  location: ScenarioLocation;
  timeLabel: string;
  severity: number;
  category: string;
}

export interface ScenarioNode {
  id: string;
  step: number;
  title: string;
  situation: string;
  event: ScenarioEvent;
  choices: ScenarioChoice[];
}

export interface ScenarioReportTask {
  prompt: string;
  situationTerms: string[][];
  riskTerms: string[][];
  stakeholderTerms: string[][];
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
  reportTask: ScenarioReportTask;
  nodes: Record<string, ScenarioNode>;
}

export interface DecisionRecord {
  nodeId: string;
  choiceId: string;
}

export type ScenarioStatus =
  | "briefing"
  | "standby"
  | "reading"
  | "decision"
  | "debrief"
  | "situation-report"
  | "complete";

export interface ScenarioSession {
  version: 2;
  scenarioId: string;
  status: ScenarioStatus;
  currentNodeId: string;
  history: DecisionRecord[];
  situationReport: string;
  startedAt: string | null;
  completedAt: string | null;
}
