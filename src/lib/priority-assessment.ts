import { getReportOptions, parsePriorities } from "@/lib/report-options";
import { parseReportDraft } from "@/lib/situation-report-draft";

export function assessPriorities(scenarioId: string, text: string) {
  const expected = getReportOptions(scenarioId).priorities;
  const submitted = parsePriorities(parseReportDraft(text).priority);
  const valid = submitted.length === expected.length && new Set(submitted).size === expected.length && submitted.every((item) => expected.includes(item));
  const rationale = scenarioId === "supply-chain"
    ? "Protect urgent patient care first, verify substitute quality, address delivery shortages, allocate fairly, then manage commercial costs."
    : "Stop additional exposure first, preserve evidence, maintain essential services, communicate accurately, then address reputation.";
  if (!valid) return { score: 0, submitted, expected, rationale, feedback: "A complete ranking is required; no order has been inferred from the default list." };
  let correct = 0;
  const total = expected.length * (expected.length - 1) / 2;
  for (let i = 0; i < expected.length; i++) {
    for (let j = i + 1; j < expected.length; j++) {
      const first = expected[i];
      const second = expected[j];
      if (first !== undefined && second !== undefined && submitted.indexOf(first) < submitted.indexOf(second)) correct++;
    }
  }
  const score = Math.round(correct / total * 100);
  return { score, submitted, expected, rationale, feedback: `${correct} of ${total} priority pairs match the authored exercise rubric. Alternative reasoning can still be discussed in the AI feedback; this is not a universal correct order.` };
}