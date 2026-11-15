import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { FlaskConical, Globe2, Radio } from "lucide-react";

export function ScenarioShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="briefing-header scenario-print-hidden relative z-20 border-b">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" aria-label="SitRep home">
            <span className="hidden size-9 items-center justify-center rounded-sm border border-signal/40 bg-signal/8 sm:flex">
              <Globe2 className="size-5 text-signal" aria-hidden="true" />
            </span>
            <span className="font-display text-3xl font-bold leading-none">SitRep</span>
          </Link>
          <nav className="ml-3 flex h-full items-center gap-1 sm:ml-8" aria-label="Primary navigation">
            <Link to="/" className="flex h-full items-center gap-2 border-b border-transparent px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3">
              <Radio className="size-3.5" aria-hidden="true" /> Globe
            </Link>
            <Link to="/scenarios" className="flex h-full items-center gap-2 border-b border-signal px-2 text-xs font-medium text-foreground sm:px-3" aria-current="page">
              <FlaskConical className="size-3.5 text-signal" aria-hidden="true" /> Scenario Lab
            </Link>
          </nav>
          <p className="ml-auto hidden font-system text-[10px] uppercase text-signal md:block">Decision exercise / Local session</p>
        </div>
      </header>
      <main>{children}</main>
      <footer className="scenario-print-hidden mx-auto flex max-w-7xl flex-col gap-2 border-t px-4 py-5 text-[10px] leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>FICTIONAL TRAINING CONTENT · NO LIVE DATA · NO AI GRADING</p>
        <p>Illustrative only. Not a validated hiring assessment.</p>
      </footer>
    </div>
  );
}
