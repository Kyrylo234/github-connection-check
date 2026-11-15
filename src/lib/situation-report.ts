import { calculateWeightedScore } from "@/lib/scenario-scoring-core";
import type { DimensionScores, Scenario } from "@/types/scenario";

export interface SituationReportCriterion {
  id: "situation" | "risk" | "action" | "stakeholders" | "uncertainty" | "clarity";
  label: string;
  score: number;
  maxScore: 20;
  feedback: string;
}

export interface SituationReportAssessment {
  text: string;
  dimensions: DimensionScores;
  overall: number;
  criteria: SituationReportCriterion[];
}

const ACTION_TERMS = [
  ["next", "will", "continue", "immediate"],
  ["monitor", "notify", "restore", "verify", "update", "allocate", "support", "preserve", "review", "coordinate", "contain", "isolat"],
];
const UNCERTAINTY_TERMS = ["uncertain", "unknown", "unconfirmed", "not yet", "remain", "investigat", "scope", "pending"];

function coverage(text: string, groups: string[][]): number {
  const matched = groups.filter((alternatives) => alternatives.some((term) => text.includes(term))).length;
  return Math.round((matched / groups.length) * 20);
}

function average(...scores: number[]): number {
  return Math.round((scores.reduce((total, score) => total + score, 0) / scores.length) * 5);
}

function feedback(score: number, success: string, improvement: string): string {
  return score >= 15 ? success : improvement;
}

export function assessSituationReport(scenario: Scenario, text: string): SituationReportAssessment {
  const normalised = text.toLowerCase();
  const wordCount = normalised.trim() ? normalised.trim().split(/\s+/).length : 0;
  const situation = coverage(normalised, scenario.reportTask.situationTerms);
  const risk = coverage(normalised, scenario.reportTask.riskTerms);
  const action = coverage(normalised, ACTION_TERMS);
  const stakeholders = coverage(normalised, scenario.reportTask.stakeholderTerms);
  const uncertainty = coverage(normalised, [UNCERTAINTY_TERMS]);
  const clarity = wordCount >= 60 && wordCount <= 140 ? 20 : wordCount >= 45 && wordCount <= 180 ? 14 : 8;

  const criteria: SituationReportCriterion[] = [
    { id: "situation", label: "Core situation", score: situation, maxScore: 20, feedback: feedback(situation, "The event, affected system and operational position are identifiable.", "Name the incident, what is affected and the current operational position more explicitly.") },
    { id: "risk", label: "Priority risk", score: risk, maxScore: 20, feedback: feedback(risk, "The report identifies material harm and why it matters.", "State the most important risk and its operational or human consequence.") },
    { id: "action", label: "Decisions and next steps", score: action, maxScore: 20, feedback: feedback(action, "Actions and forward steps are visible in the report.", "Separate actions already taken from specific next steps and ownership.") },
    { id: "stakeholders", label: "Stakeholder impact", score: stakeholders, maxScore: 20, feedback: feedback(stakeholders, "Relevant affected people or partners are considered.", "Identify who is affected or needs coordinated information.") },
    { id: "uncertainty", label: "Uncertainty", score: uncertainty, maxScore: 20, feedback: feedback(uncertainty, "Unknowns or unresolved scope are acknowledged.", "State what remains unknown instead of implying complete certainty.") },
    { id: "clarity", label: "Briefing length", score: clarity, maxScore: 20, feedback: feedback(clarity, "The report fits the requested concise briefing length.", "Aim for 60–140 words with short, direct statements.") },
  ];

  const dimensions: DimensionScores = {
    judgment: average(situation, risk, action),
    ethics: average(stakeholders, uncertainty, risk),
    communication: average(clarity, action, uncertainty),
    riskManagement: average(risk, action, uncertainty),
  };

  return { text, dimensions, overall: calculateWeightedScore(dimensions), criteria };
}
