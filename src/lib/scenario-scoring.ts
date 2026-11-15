import type {
  DecisionRecord,
  DimensionId,
  DimensionScores,
  Scenario,
  ScenarioChoice,
  ScenarioNode,
} from "@/types/scenario";
import { SCENARIO_DIMENSIONS } from "@/types/scenario";

export interface ReportDecision {
  step: number;
  node: ScenarioNode;
  choice: ScenarioChoice;
}

export interface ScenarioReport {
  overall: number;
  dimensions: DimensionScores;
  decisions: ReportDecision[];
  strongest: { id: DimensionId; label: string; score: number };
  development: { id: DimensionId; label: string; score: number };
  summary: string;
}

export function calculateWeightedScore(dimensions: DimensionScores): number {
  return Math.round(
    SCENARIO_DIMENSIONS.reduce((total, dimension) => total + dimensions[dimension.id] * dimension.weight, 0),
  );
}

function resolveDecisions(scenario: Scenario, history: DecisionRecord[]): ReportDecision[] {
  if (history.length !== scenario.decisionCount) {
    throw new Error(`Expected ${scenario.decisionCount} decisions; received ${history.length}.`);
  }

  let nodeId: string | null = scenario.entryNodeId;

  return history.map((record, index) => {
    if (!nodeId || record.nodeId !== nodeId) {
      throw new Error("Decision history does not follow the scenario path.");
    }
    const node = scenario.nodes[nodeId];
    if (!node || node.step !== index + 1) {
      throw new Error("Decision history contains an invalid scene.");
    }
    const choice = node.choices.find((candidate) => candidate.id === record.choiceId);
    if (!choice) {
      throw new Error("Decision history contains a choice outside its scene.");
    }
    nodeId = choice.nextNodeId;
    return { step: node.step, node, choice };
  });
}

export function calculateScenarioReport(scenario: Scenario, history: DecisionRecord[]): ScenarioReport {
  const decisions = resolveDecisions(scenario, history);
  const dimensions = Object.fromEntries(
    SCENARIO_DIMENSIONS.map((dimension) => [
      dimension.id,
      Math.round(
        decisions.reduce((total, decision) => total + decision.choice.scores[dimension.id], 0) / decisions.length,
      ),
    ]),
  ) as DimensionScores;

  const ranked = SCENARIO_DIMENSIONS.map((dimension) => ({
    ...dimension,
    score: dimensions[dimension.id],
  })).sort((a, b) => b.score - a.score);
  const strongest = ranked[0]!;
  const development = ranked.at(-1)!;
  const overall = calculateWeightedScore(dimensions);

  return {
    overall,
    dimensions,
    decisions,
    strongest,
    development,
    summary: `Across ${decisions.length} fictional decisions, the strongest pattern was ${strongest.label.toLowerCase()} (${strongest.score}/100). The clearest development theme was ${development.label.toLowerCase()} (${development.score}/100). The decision record below shows the choices and consequences behind these values.`,
  };
}

export function getReportBand(score: number): string {
  if (score >= 85) return "Strong response pattern";
  if (score >= 70) return "Considered response pattern";
  if (score >= 50) return "Mixed response pattern";
  return "High-risk response pattern";
}
