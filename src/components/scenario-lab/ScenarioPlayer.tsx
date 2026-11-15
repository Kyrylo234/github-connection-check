import { lazy, Suspense, useEffect } from "react";
import { ClientOnly, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Globe2,
  MapPin,
  Radio,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import briefingRoom from "@/assets/briefing-room.jpg";
import { ScenarioShell } from "@/components/scenario-lab/ScenarioShell";
import type { ScenarioMapEvent } from "@/components/scenario-lab/ScenarioGlobe";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SituationReportFields } from "@/components/scenario-lab/SituationReportFields";
import { useScenarioSession } from "@/hooks/use-scenario-session";
import {
  MAXIMUM_SITUATION_REPORT_CHARACTERS,
  MINIMUM_SITUATION_REPORT_CHARACTERS,
  SCENARIO_EVENT_DELAY_MS,
} from "@/lib/scenario-session";
import type { Scenario, ScenarioNode } from "@/types/scenario";
import { reportBody } from "@/lib/situation-report-draft";

const ScenarioGlobe = lazy(() => import("@/components/scenario-lab/ScenarioGlobe"));

function GlobeFallback() {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-4">
      <Globe2 className="size-10 animate-pulse-soft text-signal" aria-hidden="true" />
      <p className="font-system text-[10px] uppercase text-signal">Opening global monitoring…</p>
    </div>
  );
}

function EventFacts({ node }: { node: ScenarioNode }) {
  return (
    <dl className="grid grid-cols-2 gap-px border border-report-rule bg-report-rule">
      <div className="bg-report-paper p-3">
        <dt className="font-system text-[9px] font-semibold uppercase text-muted-foreground">Location</dt>
        <dd className="mt-1 flex items-center gap-1.5 text-[11px] font-bold"><MapPin className="size-3.5 shrink-0" aria-hidden="true" />{node.event.location.name}, {node.event.location.country}</dd>
      </div>
      <div className="bg-report-paper p-3">
        <dt className="font-system text-[9px] font-semibold uppercase text-muted-foreground">Incident time</dt>
        <dd className="mt-1 font-system text-xs font-semibold">{node.event.timeLabel}</dd>
      </div>
      <div className="bg-report-paper p-3">
        <dt className="font-system text-[9px] font-semibold uppercase text-muted-foreground">Category</dt>
        <dd className="mt-1 text-[11px] font-semibold">{node.event.category}</dd>
      </div>
      <div className="bg-report-paper p-3">
        <dt className="font-system text-[9px] font-semibold uppercase text-muted-foreground">Severity</dt>
        <dd className="mt-1 font-system text-xs font-semibold text-sentiment-negative">{Math.round(node.event.severity * 100)} / 100</dd>
      </div>
    </dl>
  );
}

export function ScenarioPlayer({ scenario }: { scenario: Scenario }) {
  const navigate = useNavigate();
  const {
    session,
    hydrated,
    start,
    receiveEvent,
    acknowledgeEvent,
    continueMonitoring,
    choose,
    updateReportDraft,
    submitReport,
  } = useScenarioSession(scenario);
  const node = scenario.nodes[session.currentNodeId] ?? scenario.nodes[scenario.entryNodeId]!;

  useEffect(() => {
    if (!hydrated || session.status !== "standby") return;
    const timer = window.setTimeout(() => receiveEvent(node.id), SCENARIO_EVENT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [hydrated, node.id, receiveEvent, session.status]);

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
            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted-foreground">Your three decisions and written situation report are saved in this browser tab.</p>
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
              <Button onClick={start} size="lg" className="mt-9 rounded-none px-7 font-system text-xs uppercase">Begin global monitoring <ArrowRight /></Button>
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
                <div className="bg-background p-4"><dt className="font-system text-[9px] uppercase text-muted-foreground">Exercise</dt><dd className="mt-1 font-system text-lg text-signal">03 incidents</dd></div>
                <div className="bg-background p-4"><dt className="font-system text-[9px] uppercase text-muted-foreground">Final task</dt><dd className="mt-1 font-system text-lg text-signal">Written SitRep</dd></div>
              </dl>
              <div className="mx-4 mt-6 flex gap-3 border border-border p-4 sm:mx-0">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden="true" />
                <p className="text-[11px] leading-5 text-muted-foreground">Timed events are fictional and generated locally. No login, live feed, AI grading or hiring recommendation is used.</p>
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
  const displayNode = session.status === "debrief" && previousNode ? previousNode : node;
  const hasActiveEvent = ["reading", "decision", "debrief", "situation-report"].includes(session.status);

  // Derive this small event list without a hook: briefing/restoration/completion
  // return above, so a hook here would change hook order during transitions.
  const mapEvents: ScenarioMapEvent[] = (() => {
    const nextEvents: ScenarioMapEvent[] = [];
    const seen = new Set<string>();
    for (const record of session.history) {
      const historicNode = scenario.nodes[record.nodeId];
      if (!historicNode || seen.has(historicNode.id)) continue;
      seen.add(historicNode.id);
      nextEvents.push({
        id: historicNode.id,
        title: historicNode.title,
        location: historicNode.event.location,
        severity: historicNode.event.severity,
        active: hasActiveEvent && displayNode.id === historicNode.id,
      });
    }
    if (hasActiveEvent && !seen.has(displayNode.id)) {
      nextEvents.push({ id: displayNode.id, title: displayNode.title, location: displayNode.event.location, severity: displayNode.event.severity, active: true });
    }
    return nextEvents;
  })();

  const progress = session.status === "situation-report"
    ? 90
    : Math.round(((session.history.length + (hasActiveEvent ? 0.35 : 0)) / scenario.decisionCount) * 80);
  const writtenBody = reportBody(session.situationReport).trim();
  const reportLength = writtenBody.length;
  const wordCount = writtenBody ? writtenBody.split(/\s+/).length : 0;

  const submitWrittenReport = () => {
    if (submitReport()) void navigate({ to: "/results/$id", params: { id: scenario.id } });
  };

  return (
    <ScenarioShell>
      <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="-ml-3 rounded-none font-system text-xs"><Link to="/scenarios"><ArrowLeft /> Exit exercise</Link></Button>
          <div className="flex items-center gap-3 font-system text-[9px] uppercase">
            <span className="text-muted-foreground">{scenario.code}</span>
            <span className="flex items-center gap-1.5 text-signal"><span className="size-1.5 animate-pulse-soft rounded-full bg-signal" /> Fictional timed feed</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3 font-system text-[10px] uppercase">
            <span className="text-muted-foreground">{session.status === "situation-report" ? "Final task / Written situation report" : `Incident ${Math.min(node.step, scenario.decisionCount)} of ${scenario.decisionCount}`}</span>
            <span className="text-signal">{session.status === "standby" ? "Monitoring" : session.status === "debrief" ? "Consequence logged" : session.status === "situation-report" ? "Decisions complete" : "Response in progress"}</span>
          </div>
          <Progress value={progress} className="h-1 rounded-none" aria-label="Scenario progress" />
          <ol className="mt-3 grid grid-cols-4 gap-2" aria-label="Exercise progress">
            {Array.from({ length: scenario.decisionCount }, (_, index) => {
              const complete = index < session.history.length;
              const current = !complete && index === session.history.length && session.status !== "situation-report";
              return <li key={index} className={`font-system text-[9px] uppercase ${complete || current ? "text-signal" : "text-muted-foreground"}`}>{String(index + 1).padStart(2, "0")} / {complete ? "Decided" : current ? "Active" : "Pending"}</li>;
            })}
            <li className={`font-system text-[9px] uppercase ${session.status === "situation-report" ? "text-signal" : "text-muted-foreground"}`}>04 / Written SitRep</li>
          </ol>
        </div>

        <div className="relative mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.75fr)]">
          <section className="scenario-globe-frame relative min-h-[520px] overflow-hidden border border-signal/20 lg:min-h-[650px]" aria-label="Scenario world globe">
            <img src={briefingRoom} alt="" width={1920} height={1088} className="briefing-room-image" />
            <div className="briefing-room-shade pointer-events-none absolute inset-0" />
            <div className="absolute inset-0 isolate z-0">
              <ClientOnly fallback={<GlobeFallback />}>
                <Suspense fallback={<GlobeFallback />}>
                  <ScenarioGlobe events={mapEvents} focusedEventId={hasActiveEvent ? displayNode.id : null} />
                </Suspense>
              </ClientOnly>
            </div>
            <div className="pointer-events-none absolute left-5 top-5 z-10 border bg-background/90 px-3 py-2">
              <p className="font-system text-[9px] uppercase text-signal">{hasActiveEvent ? "Incident focus" : "Global monitoring"}</p>
              <p className="mt-1 max-w-64 text-[11px] font-semibold">{hasActiveEvent ? `${displayNode.event.location.name}, ${displayNode.event.location.country}` : "Normal operations · No active incidents"}</p>
            </div>
            <div className="pointer-events-none absolute right-5 top-5 z-10 hidden border bg-background/90 px-3 py-2 text-right sm:block">
              <p className="font-system text-[9px] uppercase text-muted-foreground">Feed status</p>
              <p className="mt-1 font-system text-[10px] uppercase text-signal">Simulation only</p>
            </div>
          </section>

          <div key={session.status} className={session.status === "reading" || session.status === "decision" || session.status === "debrief" || session.status === "situation-report"
            ? "absolute inset-x-3 top-5 z-20 min-w-0 max-h-[65vh] overflow-y-auto sm:left-auto sm:right-5 sm:w-[380px] xl:sticky xl:inset-x-auto xl:top-5 xl:max-h-none xl:w-auto xl:overflow-visible"
            : "min-w-0 xl:sticky xl:top-5"}>
            {session.status === "standby" && (
              <aside className="flex min-h-[420px] flex-col items-center justify-center border-y border-signal/30 bg-card/50 px-7 py-10 text-center" aria-label="Global monitoring status">
                <span className="relative flex size-24 items-center justify-center rounded-full border border-signal/30">
                  <span className="absolute inset-3 animate-pulse-soft rounded-full border border-signal/30" />
                  <Radio className="size-8 text-signal" aria-hidden="true" />
                </span>
                <p className="mt-7 font-system text-[10px] uppercase text-signal">Global channels open</p>
                <h1 className="mt-2 font-display text-4xl font-bold">{session.history.length === 0 ? "The world is calm" : "Monitoring continues"}</h1>
                <p className="mt-4 max-w-sm text-xs leading-6 text-muted-foreground">No decision is required. The next fictional incident will appear on the globe automatically.</p>
                <div className="mt-6 flex items-center gap-2 font-system text-[9px] uppercase text-muted-foreground"><Clock3 className="size-3.5" /> Listening for situation updates</div>
              </aside>
            )}

            {session.status === "reading" && (
              <aside aria-label="The Briefing" className="animate-fade-up border-report-rule bg-report-paper p-5 text-foreground sm:p-6">
                <div className="flex items-center justify-between gap-3 border-b border-report-rule pb-4">
                  <p className="font-system text-[10px] font-bold uppercase">Incoming situation report / {String(node.step).padStart(2, "0")}</p>
                  <Radio className="size-4 text-sentiment-negative" aria-hidden="true" />
                </div>
                <h1 className="mt-5 font-display text-4xl font-bold leading-none">{node.title}</h1>
                <p className="mt-4 text-xs font-medium leading-6">{node.situation}</p>
                <div className="mt-5"><EventFacts node={node} /></div>
                <Button onClick={() => acknowledgeEvent(node.id)} className="mt-6 w-full rounded-none font-system text-xs uppercase">Next <ArrowRight /></Button>
              </aside>
            )}

            {session.status === "decision" && (
              <aside aria-label="Decisions" className="animate-fade-up border-report-rule bg-report-paper p-5 text-foreground sm:p-6">
                <p className="font-system text-[10px] font-bold uppercase">Decision required / {String(node.step).padStart(2, "0")}</p>
                <h1 className="mt-2 font-display text-3xl font-bold">{node.title}</h1>
                <div className="mt-5 space-y-3" role="group" aria-label="Available decisions">
                  {node.choices.map((choice, index) => (
                    <button
                      type="button"
                      key={choice.id}
                      onClick={() => choose(node.id, choice.id)}
                      className="group flex w-full items-start gap-3 border border-report-rule bg-transparent p-3 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center border border-report-rule font-system text-xs">{String.fromCharCode(65 + index)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-xl font-bold">{choice.label}</span>
                        <span className="mt-1 block text-[10px] font-medium leading-5 text-muted-foreground">{choice.description}</span>
                      </span>
                      <ArrowRight className="mt-1 size-4 shrink-0" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </aside>
            )}

            {session.status === "debrief" && previousChoice && previousNode && (
              <aside aria-label="The Briefing" className="animate-fade-up border-report-rule bg-report-paper p-5 text-foreground sm:p-6">
                <div className="flex items-center gap-2 border-b border-report-rule pb-4"><CheckCircle2 className="size-5" aria-hidden="true" /><p className="font-system text-[10px] font-bold uppercase">Decision logged / Consequence</p></div>
                <h1 className="mt-5 font-display text-3xl font-bold">{previousChoice.label}</h1>
                <div className="mt-5">
                  <p className="font-system text-[9px] font-bold uppercase text-muted-foreground">Outcome</p>
                  <p className="mt-2 text-xs font-medium leading-6">{previousChoice.consequence}</p>
                </div>
                <div className="mt-5 border-t border-report-rule pt-4">
                  <p className="font-system text-[9px] font-bold uppercase text-muted-foreground">Decision note</p>
                  <p className="mt-2 text-[11px] font-medium leading-5">{previousChoice.feedback}</p>
                </div>
                <Button onClick={continueMonitoring} className="mt-6 w-full rounded-none font-system text-xs uppercase">Return to global monitoring <ArrowRight /></Button>
              </aside>
            )}

            {session.status === "situation-report" && (
              <aside aria-label="The Briefing" className="animate-fade-up border-report-rule bg-report-paper p-5 text-foreground sm:p-6">
                <p className="font-system text-[10px] font-bold uppercase">Final task / Written situation report</p>
                <h1 className="mt-2 font-display text-4xl font-bold">Brief leadership</h1>
                <p className="mt-3 text-[11px] font-semibold leading-5">Rank your priorities, identify affected people, and give leadership a short response on next steps and uncertainty.</p>
                <div className="mt-4 border-y border-report-rule py-3">
                  <p className="font-system text-[9px] font-bold uppercase text-muted-foreground">Fixed rubric · No AI</p>
                  <p className="mt-1 text-[10px] font-medium leading-4">Core situation · Priority risk · Decisions and next steps · Stakeholders · Uncertainty · Concise length</p>
                </div>
                <SituationReportFields
                  scenarioId={scenario.id}
                  actions={session.history.flatMap((record) => {
                    const choice = scenario.nodes[record.nodeId]?.choices.find((item) => item.id === record.choiceId);
                    return choice ? [choice.label] : [];
                  })}
                  value={session.situationReport}
                  onChange={updateReportDraft}
                />
                <div className="mt-2 flex justify-between gap-3 font-system text-[9px] font-semibold text-muted-foreground">
                  <span>{wordCount} words total · Target 60–140</span>
                  <span>{reportLength} / {MAXIMUM_SITUATION_REPORT_CHARACTERS} characters</span>
                </div>
                {reportLength < MINIMUM_SITUATION_REPORT_CHARACTERS && <p className="mt-3 text-[10px] font-semibold leading-4 text-muted-foreground">Add {MINIMUM_SITUATION_REPORT_CHARACTERS - reportLength} more characters to submit a substantive brief.</p>}
                <Button disabled={reportLength < MINIMUM_SITUATION_REPORT_CHARACTERS} onClick={submitWrittenReport} className="mt-5 w-full rounded-none font-system text-xs uppercase">Submit report & complete exercise <ArrowRight /></Button>
                <p className="mt-3 text-[10px] font-semibold leading-4 text-muted-foreground">The rubric checks included briefing elements, not writing quality or real-world competence. Illustrative only.</p>
              </aside>
            )}
          </div>
        </div>
      </div>
    </ScenarioShell>
  );
}
