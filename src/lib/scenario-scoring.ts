import type {
  DecisionRecord,
  DimensionId,
  DimensionScores,
  Scenario,
  ScenarioChoice,
  ScenarioNode,
} from "@/types/scenario";
import { SCENARIO_DIMENSIONS } from "@/types/scenario";
import { calculateWeightedScore } from "@/lib/scenario-scoring-core";
import { assessSituationReport, type SituationReportAssessment } from "@/lib/situation-report";

export { calculateWeightedScore } from "@/lib/scenario-scoring-core";

export interface ReportDecision {
  step: number;
  node: ScenarioNode;
  choice: ScenarioChoice;
}

export interface ScenarioReport {
  overall: number;
  dimensions: DimensionScores;
  decisionDimensions: DimensionScores;
  decisions: ReportDecision[];
  writing: SituationReportAssessment;
  strongest: { id: DimensionId; label: string; score: number };
  development: { id: DimensionId; label: string; score: number };
  summary: string;
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

export function calculateScenarioReport(
  scenario: Scenario,
  history: DecisionRecord[],
  situationReport: string,
): ScenarioReport {
  const decisions = resolveDecisions(scenario, history);
  const decisionDimensions = Object.fromEntries(
    SCENARIO_DIMENSIONS.map((dimension) => [
      dimension.id,
      Math.round(
        decisions.reduce((total, decision) => total + decision.choice.scores[dimension.id], 0) / decisions.length,
      ),
    ]),
  ) as DimensionScores;
  const writing = assessSituationReport(scenario, situationReport);
  const dimensions = Object.fromEntries(
    SCENARIO_DIMENSIONS.map((dimension) => [
      dimension.id,
      Math.round(decisionDimensions[dimension.id] * 0.75 + writing.dimensions[dimension.id] * 0.25),
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
    decisionDimensions,
    decisions,
    writing,
    strongest,
    development,
    summary: `Across ${decisions.length} fictional decisions and a written situation report, the strongest pattern was ${strongest.label.toLowerCase()} (${strongest.score}/100). The clearest development theme was ${development.label.toLowerCase()} (${development.score}/100). Decision choices contribute 75% of each dimension and the fixed writing rubric contributes 25%.`,
  };
}

export function getReportBand(score: number): string {
  if (score >= 85) return "Strong response pattern";
  if (score >= 70) return "Considered response pattern";
  if (score >= 50) return "Mixed response pattern";
  return "High-risk response pattern";
}
