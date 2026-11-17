import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — SitRep" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="font-system text-sm text-signal">← Back to globe</Link>
        <section className="briefing-document mt-6 border border-report-rule bg-report-paper" aria-label="Settings">
          <div className="border-b border-report-rule px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <Settings2 className="size-5 text-signal" aria-hidden="true" />
              <h1 className="font-display text-3xl font-bold uppercase">Settings</h1>
            </div>
          </div>
          <div className="px-5 py-5 sm:px-7">
            <p className="text-sm leading-6 text-muted-foreground">
              Headlines via BBC News, The Guardian, Al Jazeera, Global Voices, UN Geneva RSS.
              Rights remain with publishers under their respective terms. Gemini scores event
              impact and suggests place names; exact gazetteer matches supply coordinates.
              Uncertain places remain unpinned.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
