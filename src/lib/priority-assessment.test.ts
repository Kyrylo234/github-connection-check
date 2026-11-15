import { expect, it } from "vitest";
import { assessPriorities } from "./priority-assessment";
import { formatPriorities, getReportOptions } from "./report-options";
import { parseReportDraft, serializeReportDraft } from "./situation-report-draft";

it.each(["cyberattack", "supply-chain"])("grades %s priority order rather than keyword coverage", (id) => {
  const options = getReportOptions(id).priorities;
  const report = (items: string[]) => serializeReportDraft({ ...parseReportDraft(""), priority: formatPriorities(items) });
  expect(assessPriorities(id, report(options)).score).toBe(100);
  expect(assessPriorities(id, report([...options].reverse())).score).toBe(0);
  const swapped = [...options];
  const first = swapped.shift();
  if (!first) throw new Error("Missing priority");
  swapped.splice(1, 0, first);
  expect(assessPriorities(id, report(swapped)).score).toBe(90);
  expect(assessPriorities(id, report(options.slice(1))).score).toBe(0);
});