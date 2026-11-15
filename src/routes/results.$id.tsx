import { createFileRoute, notFound } from "@tanstack/react-router";

import { ScenarioReportView } from "@/components/scenario-lab/ScenarioReportView";
import { getScenario } from "@/data/scenarios";

export const Route = createFileRoute("/results/$id")({
  loader: ({ params }) => {
    const scenario = getScenario(params.id);
    if (!scenario) throw notFound();
    return { scenarioId: scenario.id };
  },
  head: ({ loaderData }) => {
    const scenario = getScenario(loaderData?.scenarioId ?? "");
    const title = scenario ? `${scenario.title} Report — SitRep` : "Scenario report unavailable — SitRep";
    const description = scenario ? `An illustrative SitRep response report for the fictional ${scenario.title} exercise, including actual choices, consequences and deterministic dimension scores.` : "This SitRep scenario report is unavailable.";
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
  component: ScenarioResultRoute,
});

function ScenarioResultRoute() {
  const { scenarioId } = Route.useLoaderData();
  const scenario = getScenario(scenarioId)!;
  return <ScenarioReportView scenario={scenario} />;
}
