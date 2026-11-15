import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Clock3, GitBranch, Network, ShieldAlert } from "lucide-react";
import type { CSSProperties } from "react";

import { ScenarioShell } from "@/components/scenario-lab/ScenarioShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { scenarios } from "@/data/scenarios";
import { SCENARIO_DIMENSIONS } from "@/types/scenario";

export const Route = createFileRoute("/scenarios/")({
  head: () => ({
    meta: [
      { title: "Scenario Lab — SitRep" },
      { name: "description", content: "Play two fictional SitRep crisis exercises and receive an illustrative, deterministic response report." },
      { property: "og:title", content: "Scenario Lab — SitRep" },
      { property: "og:description", content: "Branching cyberattack and supply-chain crisis simulations with choice-linked feedback and printable demo reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScenarioLab,
});

const scenarioIcons = [Building2, Network];

function ScenarioLab() {
  return (
    <ScenarioShell>
      <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12">
        <section className="grid gap-6 border-b border-signal/25 pb-9 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div className="animate-fade-up">
            <p className="font-system text-[10px] uppercase text-signal">Scenario Lab / Fictional exercises</p>
            <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold leading-[0.95] sm:text-6xl">Make the call. Live with the consequence.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">Begin with a calm world. Read each simulated incident as it arrives on the globe, make the call, then finish with a written situation report for leadership.</p>
          </div>
          <div className="flex gap-3 border-l-2 border-signal/50 pl-4">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-signal" aria-hidden="true" />
            <p className="text-[11px] leading-5 text-muted-foreground"><strong className="text-foreground">Illustrative demonstration only.</strong> Scores describe choices in these fictional exercises. They are not validated hiring assessments and must not drive real recruitment decisions.</p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Available scenarios">
          {scenarios.map((scenario, index) => {
            const Icon = scenarioIcons[index] ?? GitBranch;
            return (
              <Card key={scenario.id} className="animate-fade-up stagger flex flex-col rounded-none border-signal/25 bg-card/55 shadow-none" style={{ "--i": index + 1 } as CSSProperties}>
                <CardHeader className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex size-11 items-center justify-center border border-signal/35 bg-signal/6"><Icon className="size-5 text-signal" aria-hidden="true" /></span>
                    <span className="font-system text-[9px] uppercase text-signal">{scenario.code}</span>
                  </div>
                  <h2 className="mt-5 font-display text-4xl font-bold leading-none">{scenario.title}</h2>
                  <p className="mt-3 text-xs leading-6 text-muted-foreground">{scenario.summary}</p>
                </CardHeader>
                <CardContent className="flex-1 px-5 pb-5 sm:px-6">
                  <dl className="grid grid-cols-2 gap-px border bg-border">
                    <div className="bg-background p-3"><dt className="font-system text-[9px] uppercase text-muted-foreground">Your role</dt><dd className="mt-1 text-[11px] font-semibold leading-5">{scenario.role}</dd></div>
                    <div className="bg-background p-3"><dt className="font-system text-[9px] uppercase text-muted-foreground">Structure</dt><dd className="mt-1 text-[11px] font-semibold leading-5">3 globe incidents<br />+ written SitRep</dd></div>
                  </dl>
                  <div className="mt-4 flex items-center gap-4 font-system text-[9px] uppercase text-muted-foreground"><span className="flex items-center gap-1.5"><Clock3 className="size-3.5" /> {scenario.estimatedMinutes} min</span><span className="flex items-center gap-1.5"><GitBranch className="size-3.5" /> Branching</span></div>
                </CardContent>
                <CardFooter className="border-t p-5 sm:p-6">
                  <Button asChild className="w-full rounded-none font-system text-xs uppercase"><Link to="/scenarios/$id" params={{ id: scenario.id }}>Read briefing <ArrowRight /></Link></Button>
                </CardFooter>
              </Card>
            );
          })}
        </section>

        <section className="mt-9 border-y py-6" aria-labelledby="scoring-heading">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.5fr] lg:items-center">
            <div><p className="font-system text-[9px] uppercase text-signal">Transparent scoring</p><h2 id="scoring-heading" className="mt-1 font-display text-3xl font-bold">No black box. No AI.</h2></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SCENARIO_DIMENSIONS.map((dimension) => <div key={dimension.id} className="border-l border-signal/35 pl-3"><p className="font-system text-xl text-signal">{Math.round(dimension.weight * 100)}%</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{dimension.label}</p></div>)}
            </div>
          </div>
          <p className="mt-5 text-[10px] leading-5 text-muted-foreground">Every choice has authored points for all four dimensions. The final written SitRep uses a visible fixed rubric, not AI. Progress stays only in this browser tab; replaying clears the exercise.</p>
        </section>
      </div>
    </ScenarioShell>
  );
}
