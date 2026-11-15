import { createFileRoute, notFound } from "@tanstack/react-router";

import { ScenarioPlayer } from "@/components/scenario-lab/ScenarioPlayer";
import { getScenario } from "@/data/scenarios";

export const Route = createFileRoute("/scenarios/$id")({
  loader: ({ params }) => {
    const scenario = getScenario(params.id);
    if (!scenario) throw notFound();
    return { scenarioId: scenario.id };
  },
  head: ({ loaderData }) => {
    const scenario = getScenario(loaderData?.scenarioId ?? "");
    const title = scenario ? `${scenario.title} — SitRep Scenario Lab` : "Scenario unavailable — SitRep";
    const description = scenario ? `Play the fictional ${scenario.title} crisis exercise as ${scenario.role}. Three branching decisions with deterministic, illustrative feedback.` : "This SitRep scenario is unavailable.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ScenarioPlayRoute,
});

function ScenarioPlayRoute() {
  const { scenarioId } = Route.useLoaderData();
  const scenario = getScenario(scenarioId)!;
  return <ScenarioPlayer scenario={scenario} />;
}
