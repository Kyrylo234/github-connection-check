import { describe, expect, it } from "vitest";

import { getScenario } from "@/data/scenarios";
import { assessSituationReport } from "@/lib/situation-report";

describe("Written situation report rubric", () => {
  it("scores each operational briefing element deterministically without AI", () => {
    const scenario = getScenario("cyberattack")!;
    const text = "Situation: a cyber attack caused a customer data breach and records were copied before the team contained access and isolated the database. Priority risk: customers face further data exposure, operations face service disruption and regulators require accurate notice. Actions taken: the response team preserved evidence and coordinated containment. Next steps: we will continue investigation, monitor access, verify scope, support customers and update leadership and the regulator. Uncertainty: the total records affected remain unknown and the intrusion scope is unconfirmed. Communication: all public statements will distinguish verified facts from pending investigation findings while the team reviews service restoration and customer protection each hour.";
    const first = assessSituationReport(scenario, text);
    const second = assessSituationReport(scenario, text);
    expect(first).toEqual(second);
    expect(first.criteria.map((criterion) => criterion.id)).toEqual(["situation", "risk", "action", "stakeholders", "uncertainty", "clarity"]);
    expect(first.criteria.slice(0, 5).every((criterion) => criterion.score === 20)).toBe(true);
  });

  it("awards full concise-length points only between 60 and 140 words", () => {
    const scenario = getScenario("cyberattack")!;
    const sixtyWords = Array.from({ length: 60 }, () => "update").join(" ");
    const fiftyWords = Array.from({ length: 50 }, () => "update").join(" ");
    expect(assessSituationReport(scenario, sixtyWords).criteria.find((criterion) => criterion.id === "clarity")?.score).toBe(20);
    expect(assessSituationReport(scenario, fiftyWords).criteria.find((criterion) => criterion.id === "clarity")?.score).toBe(14);
  });

  it("gives missing uncertainty no points rather than inferring meaning", () => {
    const scenario = getScenario("supply-chain")!;
    const assessment = assessSituationReport(scenario, "Hospitals need supplies. The team will verify stock and coordinate delivery updates for customers and leadership.");
    expect(assessment.criteria.find((criterion) => criterion.id === "uncertainty")?.score).toBe(0);
  });
});
