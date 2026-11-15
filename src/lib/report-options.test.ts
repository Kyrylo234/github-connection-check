import { expect, it } from "vitest";
import { formatPriorities, movePriority, parsePriorities } from "./report-options";

it("moves a selected priority above the preceding item and saves its order", () => {
  const result = movePriority(["Costs", "Patient safety", "Delivery"], 1, -1);
  expect(result).toEqual(["Patient safety", "Costs", "Delivery"]);
  expect(parsePriorities(formatPriorities(result))).toEqual(result);
});

it("keeps the first priority in place when moving up", () => {
  expect(movePriority(["Safety", "Costs"], 0, -1)).toEqual(["Safety", "Costs"]);
});