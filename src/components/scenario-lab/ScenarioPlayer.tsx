import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, FileText, GitBranch, ShieldAlert, UserRound } from "lucide-react";

import { ScenarioShell } from "@/components/scenario-lab/ScenarioShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useScenarioSession } from "@/hooks/use-scenario-session";
import type { Scenario } from "@/types/scenario";

export function ScenarioPlayer({ scenario }: { scenario: Scenario }) {
  const navigate = useNavigate();
  const { session, hydrated, start, choose } = useScenarioSession(scenario);
  const node = scenario.nodes[session.currentNodeId] ?? scenario.nodes[scenario.entryNodeId]!;

  if (!hydrated) {
    return (
      <ScenarioShell>
        <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4">
          <p className="font-system text-xs uppercase text-signal">Restoring local exercise…</p>
        </div>
      </ScenarioShell>
    );
  }

  if (session.status === "complete") {
    return (
      <ScenarioShell>
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="border-y border-signal/35 py-10 text-center">
            <FileText className="mx-auto size-8 text-signal" aria-hidden="true" />
            <p className="mt-5 font-system text-[10px] uppercase text-signal">Exercise complete</p>
            <h1 className="mt-2 font-display text-4xl font-bold">Your report is ready</h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted-foreground">Your three decisions for {scenario.title} are saved in this browser tab.</p>
            <Button asChild size="lg" className="mt-7 rounded-none font-system text-xs uppercase">
              <Link to="/results/$id" params={{ id: scenario.id }}>Open final report <ArrowRight /></Link>
            </Button>
          </div>
        </div>
      </ScenarioShell>
    );
  }

  if (session.status === "briefing") {
    return (
      <ScenarioShell>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <Button asChild variant="ghost" size="sm" className="mb-7 -ml-3 rounded-none font-system text-xs">
            <Link to="/scenarios"><ArrowLeft /> Scenario selection</Link>
          </Button>
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
            <section className="animate-fade-up">
              <p className="font-system text-[10px] uppercase text-signal">{scenario.code} · Fictional exercise</p>
              <h1 className="mt-3 max-w-2xl font-display text-5xl font-bold leading-[0.95] sm:text-6xl">{scenario.title}</h1>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-foreground/85">{scenario.briefing}</p>
              <div className="mt-8 border-l-2 border-signal/60 pl-4">
                <p className="font-system text-[10px] uppercase text-signal">Your orders</p>
                <ul className="mt-3 space-y-2">
                  {scenario.objectives.map((objective) => (
                    <li key={objective} className="flex gap-3 text-xs leading-6 text-muted-foreground"><Check className="mt-1 size-3.5 shrink-0 text-signal" aria-hidden="true" />{objective}</li>
                  ))}
                </ul>
              </div>
              <Button onClick={start} size="lg" className="mt-9 rounded-none px-7 font-system text-xs uppercase">Begin exercise <ArrowRight /></Button>
            </section>
            <aside className="h-fit border-y border-signal/30 bg-card/60 py-6 sm:px-6" aria-label="Role briefing">
              <div className="flex items-start gap-4 px-4 sm:px-0">
                <UserRound className="mt-1 size-5 shrink-0 text-signal" aria-hidden="true" />
                <div>
                  <p className="font-system text-[10px] uppercase text-muted-foreground">Assigned role</p>
                  <h2 className="mt-1 font-display text-2xl font-bold">{scenario.role}</h2>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{scenario.organisation}</p>
                </div>
              </div>
              <dl className="mx-4 mt-6 grid grid-cols-2 gap-px border bg-border sm:mx-0">
                <div className="bg-background p-4"><dt className="font-system text-[9px] uppercase text-muted-foreground">Decisions</dt><dd className="mt-1 font-system text-xl text-signal">03 linked</dd></div>
                <div className="bg-background p-4"><dt className="font-system text-[9px] uppercase text-muted-foreground">Est. time</dt><dd className="mt-1 font-system text-xl text-signal">{scenario.estimatedMinutes} min</dd></div>
              </dl>
              <div className="mx-4 mt-6 flex gap-3 border border-border p-4 sm:mx-0">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden="true" />
                <p className="text-[11px] leading-5 text-muted-foreground">Choices and results stay in this browser tab. No login, AI grading or hiring recommendation is used.</p>
              </div>
            </aside>
          </div>
        </div>
      </ScenarioShell>
    );
  }

  const previousRecord = session.history.at(-1);
  const previousNode = previousRecord ? scenario.nodes[previousRecord.nodeId] : undefined;
  const previousChoice = previousNode?.choices.find((choice) => choice.id === previousRecord?.choiceId);

  const makeChoice = (choiceId: string) => {
    const next = choose(node.id, choiceId);
    if (next?.status === "complete") {
      void navigate({ to: "/results/$id", params: { id: scenario.id } });
    }
  };

  return (
    <ScenarioShell>
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="-ml-3 rounded-none font-system text-xs"><Link to="/scenarios"><ArrowLeft /> Exit exercise</Link></Button>
          <p className="font-system text-[10px] uppercase text-signal">{scenario.code} · Fictional</p>
        </div>
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between font-system text-[10px] uppercase">
            <span className="text-muted-foreground">Decision {node.step} of {scenario.decisionCount}</span>
            <span className="text-signal">{Math.round((node.step / scenario.decisionCount) * 100)}%</span>
          </div>
          <Progress value={(node.step / scenario.decisionCount) * 100} className="h-1 rounded-none" aria-label={`Decision ${node.step} of ${scenario.decisionCount}`} />
          <ol className="mt-3 grid grid-cols-3 gap-2" aria-label="Exercise progress">
            {Array.from({ length: scenario.decisionCount }, (_, index) => (
              <li key={index} className={`font-system text-[9px] uppercase ${index + 1 <= node.step ? "text-signal" : "text-muted-foreground"}`}>{String(index + 1).padStart(2, "0")} {index + 1 < node.step ? "/ Decided" : index + 1 === node.step ? "/ Current" : "/ Pending"}</li>
            ))}
          </ol>
        </div>

        <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1.65fr)_minmax(240px,0.75fr)]">
          <section className="animate-fade-up" aria-labelledby="scene-title">
            {previousChoice && (
              <div className="mb-6 border-l-2 border-signal bg-signal/6 p-4" aria-label="Previous decision outcome">
                <p className="font-system text-[9px] uppercase text-signal">Previous decision / {previousChoice.label}</p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">{previousChoice.consequence}</p>
              </div>
            )}
            <p className="font-system text-[10px] uppercase text-signal">Situation update / {String(node.step).padStart(2, "0")}</p>
            <h1 id="scene-title" className="mt-2 font-display text-4xl font-bold sm:text-5xl">{node.title}</h1>
            <p className="mt-4 text-sm leading-7 text-foreground/85">{node.situation}</p>
            <div className="mt-7 space-y-3" role="group" aria-label="Available decisions">
              {node.choices.map((choice, index) => (
                <button
                  type="button"
                  key={choice.id}
                  onClick={() => makeChoice(choice.id)}
                  className="group flex w-full items-start gap-4 border border-border bg-card/55 p-4 text-left transition-colors hover:border-signal/65 hover:bg-accent/45 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:p-5"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center border border-signal/35 font-system text-xs text-signal">{String.fromCharCode(65 + index)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-xl font-bold">{choice.label}</span>
                    <span className="mt-1 block text-[11px] leading-5 text-muted-foreground">{choice.description}</span>
                  </span>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-signal" aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>

          <aside className="h-fit border-t border-signal/30 pt-5 lg:sticky lg:top-6" aria-label="Decision record">
            <div className="flex items-center gap-2"><GitBranch className="size-4 text-signal" aria-hidden="true" /><h2 className="font-display text-xl font-bold">Decision record</h2></div>
            <p className="mt-1 text-[10px] leading-5 text-muted-foreground">Your selections determine the next situation and final report.</p>
            {session.history.length === 0 ? (
              <p className="mt-5 border-y py-5 font-system text-[10px] uppercase text-muted-foreground">No decisions logged</p>
            ) : (
              <ol className="mt-4 space-y-4">
                {session.history.map((record, index) => {
                  const recordNode = scenario.nodes[record.nodeId];
                  const recordChoice = recordNode?.choices.find((choice) => choice.id === record.choiceId);
                  return (
                    <li key={`${record.nodeId}-${record.choiceId}`} className="border-l border-signal/40 pl-3">
                      <p className="font-system text-[9px] uppercase text-signal">Decision {index + 1}</p>
                      <p className="mt-1 text-xs font-semibold leading-5">{recordChoice?.label}</p>
                    </li>
                  );
                })}
              </ol>
            )}
            <div className="mt-6 border-t pt-4"><p className="font-system text-[9px] uppercase text-muted-foreground">Role</p><p className="mt-1 text-xs leading-5">{scenario.role}</p></div>
          </aside>
        </div>
      </div>
    </ScenarioShell>
  );
}
