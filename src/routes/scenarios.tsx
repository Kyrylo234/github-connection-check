import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/scenarios")({
  component: ScenarioLayout,
});

function ScenarioLayout() {
  return <Outlet />;
}
