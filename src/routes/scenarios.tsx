import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FlaskConical, GitBranch, Globe2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/scenarios")({
  head: () => ({
    meta: [
      { title: "Scenario Lab — SitRep" },
      { name: "description", content: "Scenario Lab is the next SitRep feature: branching crisis simulations and illustrative response reports." },
      { property: "og:title", content: "Scenario Lab — SitRep" },
      { property: "og:description", content: "A forthcoming branching crisis simulation from SitRep." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScenarioLab,
});

function ScenarioLab() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-5 text-foreground">
      <div className="globe-vignette pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-xl animate-fade-up border-y border-signal/30 p-8 text-center sm:p-12">
        <Link to="/" className="absolute left-5 top-5 flex items-center gap-2 rounded-md text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <ArrowLeft className="size-3.5" /> Globe
        </Link>
        <div className="mx-auto flex size-16 items-center justify-center rounded-sm border border-signal/25 bg-signal/8">
          <FlaskConical className="size-7 text-signal" aria-hidden="true" />
        </div>
        <p className="mt-6 font-system text-[9px] uppercase tracking-[0.22em] text-signal">SitRep · Coming next</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">Scenario Lab</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">
          A branching crisis simulation where you can test how you would respond. This homepage build includes the destination only; scenarios are not available yet.
        </p>
        <div className="mx-auto mt-6 flex max-w-sm items-center gap-3 rounded-lg border bg-background/30 p-3 text-left">
          <GitBranch className="size-5 shrink-0 text-signal" />
          <p className="text-[11px] leading-5 text-muted-foreground">Future candidate reports will be illustrative scenario performance, never validated hiring assessments.</p>
        </div>
        <Button asChild className="mt-7">
          <Link to="/"><Globe2 className="size-4" /> Return to the demo globe</Link>
        </Button>
      </div>
    </div>
  );
}
