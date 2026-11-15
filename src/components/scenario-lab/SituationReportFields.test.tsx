import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SituationReportFields } from "./SituationReportFields";

afterEach(cleanup);

it("remains usable when the action recap has not been supplied", () => {
  expect(() => render(<SituationReportFields value="" onChange={vi.fn()} scenarioId="supply-chain" />)).not.toThrow();
  expect(screen.getByRole("textbox", { name: "Next steps and uncertainty" })).toBeEnabled();
});

it("still accepts the actual recorded actions", () => {
  expect(() => render(<SituationReportFields value="" onChange={vi.fn()} scenarioId="supply-chain" actions={["Qualify the alternate and triage demand"]} />)).not.toThrow();
  expect(screen.getByRole("textbox", { name: "Next steps and uncertainty" })).toBeEnabled();
});