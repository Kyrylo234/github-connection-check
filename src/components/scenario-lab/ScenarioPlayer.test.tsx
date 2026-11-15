import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ScenarioPlayer } from "@/components/scenario-lab/ScenarioPlayer";
import { scenarios } from "@/data/scenarios";
import { SCENARIO_EVENT_DELAY_MS } from "@/lib/scenario-session";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
  ClientOnly: () => null,
}));
vi.mock("@/components/scenario-lab/ScenarioShell", () => ({
  ScenarioShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  vi.useRealTimers();
});

describe("ScenarioPlayer hook stability", () => {
  it.each(scenarios)("plays $id from restoration through completion without changing hook order", (scenario) => {
    vi.useFakeTimers();
    render(<ScenarioPlayer scenario={scenario} />);
    fireEvent.click(screen.getByRole("button", { name: /Begin global monitoring/i }));
    expect(screen.getByRole("heading", { name: "The world is calm" })).toBeInTheDocument();

    let nodeId = scenario.entryNodeId;
    for (let step = 0; step < scenario.decisionCount; step++) {
      const node = scenario.nodes[nodeId];
      if (!node) throw new Error(`Missing incident ${nodeId}`);
      const choice = node.choices[0];
      if (!choice) throw new Error("Missing decision");
      act(() => vi.advanceTimersByTime(SCENARIO_EVENT_DELAY_MS));
      expect(screen.getByRole("heading", { name: node.title })).toBeInTheDocument();
      expect(screen.getByRole("complementary", { name: "The Briefing" })).toBeInTheDocument();
      expect(screen.queryByRole("group", { name: "Available decisions" })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      expect(screen.queryByRole("complementary", { name: "The Briefing" })).not.toBeInTheDocument();
      expect(screen.getByRole("group", { name: "Available decisions" })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: new RegExp(choice.label) }));
      if (choice.nextNodeId) {
        expect(screen.getByRole("heading", { name: choice.label })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /Return to global monitoring/i }));
      }
      nodeId = choice.nextNodeId ?? nodeId;
    }

    fireEvent.change(screen.getByLabelText("Your situation report"), {
      target: { value: "Situation: The incident is contained. Priority risk remains service disruption. We preserved evidence, informed leadership and customers, and will verify recovery with the team. Further exposure is uncertain and requires investigation. Next steps: Confirm the scope, maintain monitoring and send leadership another update after the recovery checks." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Submit report & complete exercise/i }));
    expect(screen.getByRole("heading", { name: "Your report is ready" })).toBeInTheDocument();
  });
});