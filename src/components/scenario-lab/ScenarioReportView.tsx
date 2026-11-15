import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileWarning, Printer, RotateCcw } from "lucide-react";
import { useMemo } from "react";

import { ScenarioShell } from "@/components/scenario-lab/ScenarioShell";
import { Button } from "@/components/ui/button";
import { useScenarioSession } from "@/hooks/use-scenario-session";
import { calculateScenarioReport, getReportBand } from "@/lib/scenario-scoring";
import type { Scenario } from "@/types/scenario";
import { SCENARIO_DIMENSIONS } from "@/types/scenario";

export function ScenarioReportView({ scenario }: { scenario: Scenario }) {
  const navigate = useNavigate();
  const { session, hydrated, replay } = useScenarioSession(scenario);
  const report = useMemo(() => {
    if (session.status !== "complete") return null;
    try {
      return calculateScenarioReport(scenario, session.history);
    } catch {
      return null;
    }
  }, [scenario, session]);

  const replayScenario = () => {
    replay();
    void navigate({ to: "/scenarios/$id", params: { id: scenario.id } });
  };

  if (!hydrated) {
    return <ScenarioShell><div className="flex min-h-[60vh] items-center justify-center px-4"><p className="font-system text-xs uppercase text-signal">Retrieving local report…</p></div></ScenarioShell>;
  }

  if (!report || !session.completedAt) {
    return (
      <ScenarioShell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <FileWarning className="mx-auto size-8 text-signal" aria-hidden="true" />
          <h1 className="mt-5 font-display text-4xl font-bold">No completed report in this tab</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Complete all three decisions to generate a report. Reports are stored only in the current browser tab.</p>
          <Button asChild className="mt-7 rounded-none font-system text-xs uppercase"><Link to="/scenarios/$id" params={{ id: scenario.id }}>Open exercise</Link></Button>
        </div>
      </ScenarioShell>
    );
  }

  const completed = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(session.completedAt));

  return (
    <ScenarioShell>
      <div className="scenario-report-page mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="scenario-print-hidden mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="-ml-3 rounded-none font-system text-xs"><Link to="/scenarios"><ArrowLeft /> Scenario Lab</Link></Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={replayScenario} className="rounded-none font-system text-xs uppercase"><RotateCcw /> Replay</Button>
            <Button onClick={() => window.print()} className="rounded-none font-system text-xs uppercase"><Printer /> Print / Save as PDF</Button>
          </div>
        </div>

        <article className="scenario-report border-2 border-report-rule bg-report-paper" aria-label="Illustrative scenario report">
          <header className="flex flex-col gap-5 border-b-2 border-report-rule p-5 sm:flex-row sm:items-start sm:justify-between sm:p-8">
            <div>
              <p className="font-system text-[10px] font-semibold uppercase">SitRep / Scenario Lab</p>
              <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Response report</h1>
              <p className="mt-2 text-xs font-semibold">{scenario.title} · {scenario.code}</p>
            </div>
            <div className="border border-report-rule px-4 py-3 sm:text-right">
              <p className="font-system text-[9px] font-semibold uppercase">Demonstration candidate</p>
              <p className="mt-1 font-system text-[10px]">{completed} UTC</p>
              <p className="mt-1 font-system text-[10px]">REF {scenario.id.toUpperCase()}-LOCAL</p>
            </div>
          </header>

          <div className="border-b border-report-rule bg-secondary/45 px-5 py-3 text-[11px] font-semibold leading-5 sm:px-8">
            ILLUSTRATIVE DEMONSTRATION ONLY — not a validated assessment and not suitable for real hiring decisions.
          </div>

          <section className="grid border-b border-report-rule md:grid-cols-[0.8fr_1.5fr]" aria-labelledby="overall-score">
            <div className="flex items-center gap-5 border-b border-report-rule p-5 md:border-b-0 md:border-r sm:p-8">
              <div><p id="overall-score" className="font-system text-7xl leading-none sm:text-8xl">{report.overall}</p><p className="mt-1 font-system text-xs font-semibold">/ 100 OVERALL</p></div>
              <div><p className="font-display text-2xl font-bold">{getReportBand(report.overall)}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Within this fictional scenario only</p></div>
            </div>
            <div className="p-5 sm:p-8">
              <h2 className="font-display text-2xl font-bold">Recruiter-facing summary</h2>
              <p className="mt-3 text-xs leading-6">{report.summary}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                <div><dt className="font-system text-[9px] font-semibold uppercase text-muted-foreground">Role played</dt><dd className="mt-1 font-semibold">{scenario.role}</dd></div>
                <div><dt className="font-system text-[9px] font-semibold uppercase text-muted-foreground">Decisions completed</dt><dd className="mt-1 font-semibold">3 / 3</dd></div>
              </dl>
            </div>
          </section>

          <section className="border-b border-report-rule p-5 sm:p-8" aria-labelledby="dimension-heading">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div><p className="font-system text-[9px] font-semibold uppercase">Section 01</p><h2 id="dimension-heading" className="mt-1 font-display text-3xl font-bold">Dimension breakdown</h2></div>
              <p className="font-system text-[9px] font-semibold uppercase">Authored points · Weighted deterministically</p>
            </div>
            <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {SCENARIO_DIMENSIONS.map((dimension) => {
                const score = report.dimensions[dimension.id];
                return (
                  <div key={dimension.id}>
                    <div className="flex items-end justify-between gap-3"><p className="text-xs font-semibold">{dimension.label} <span className="font-system text-[9px] text-muted-foreground">/ {Math.round(dimension.weight * 100)}%</span></p><p className="font-system text-xl">{score}</p></div>
                    <div className="mt-2 h-2 border border-report-rule bg-background/30" role="meter" aria-label={dimension.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}><div className="h-full bg-signal" style={{ width: `${score}%` }} /></div>
                  </div>
                );
              })}
            </div>
            <p className="mt-5 text-[10px] leading-5 text-muted-foreground">Overall = Judgment × 30% + Ethics × 25% + Communication × 25% + Risk Management × 20%. Dimension values are the mean authored points across the three choices, rounded to whole numbers.</p>
          </section>

          <section className="border-b border-report-rule p-5 sm:p-8" aria-labelledby="decision-heading">
            <p className="font-system text-[9px] font-semibold uppercase">Section 02</p>
            <h2 id="decision-heading" className="mt-1 font-display text-3xl font-bold">Decision record & consequences</h2>
            <ol className="mt-5 divide-y divide-report-rule border-y border-report-rule">
              {report.decisions.map((decision) => (
                <li key={decision.node.id} className="print-break-avoid py-5">
                  <div className="grid gap-3 sm:grid-cols-[80px_1fr]">
                    <p className="font-system text-[10px] font-semibold uppercase">Decision {String(decision.step).padStart(2, "0")}</p>
                    <div>
                      <h3 className="font-display text-2xl font-bold">{decision.choice.label}</h3>
                      <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Scene: {decision.node.title}</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div><p className="font-system text-[9px] font-semibold uppercase">Outcome</p><p className="mt-1 text-[11px] leading-5">{decision.choice.consequence}</p></div>
                        <div><p className="font-system text-[9px] font-semibold uppercase">Choice-linked feedback</p><p className="mt-1 text-[11px] leading-5">{decision.choice.feedback}</p></div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="grid gap-5 p-5 sm:grid-cols-2 sm:p-8" aria-labelledby="interpretation-heading">
            <div><p className="font-system text-[9px] font-semibold uppercase">Section 03</p><h2 id="interpretation-heading" className="mt-1 font-display text-3xl font-bold">Interpretation</h2></div>
            <div className="text-[11px] leading-5">
              <p><strong>Strongest pattern:</strong> {report.strongest.label}, {report.strongest.score}/100.</p>
              <p className="mt-2"><strong>Development theme:</strong> {report.development.label}, {report.development.score}/100.</p>
              <p className="mt-3 text-muted-foreground">This mock report describes one authored response path. It does not measure job performance, personality or future potential and must not be used to rank or select applicants.</p>
            </div>
          </section>
        </article>
        <p className="scenario-print-hidden mt-5 text-center text-[10px] leading-5 text-muted-foreground">To save a copy, choose “Save as PDF” in your browser’s print dialog.</p>
      </div>
    </ScenarioShell>
  );
}
