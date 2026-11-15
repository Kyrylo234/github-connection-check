import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReasoningFeedback } from "@/lib/reasoning-feedback.functions";
import type { ScenarioSession } from "@/types/scenario";

export function ReasoningFeedback({ session }: { session: ScenarioSession }) {
  const review = useServerFn(getReasoningFeedback);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const requestReview = async () => {
    if (session.scenarioId !== "cyberattack" && session.scenarioId !== "supply-chain") return;
    setBusy(true);
    setError(null);
    try {
      const result = await review({ data: { scenarioId: session.scenarioId, history: session.history, report: session.situationReport } });
      setFeedback(result.feedback);
      setError(result.error);
    } catch { setError("AI feedback could not be reached. Your report is still saved."); }
    finally { setBusy(false); }
  };
  return (
    <section className="border-b border-report-rule p-5 sm:p-8" aria-label="AI reasoning feedback">
      <h2 className="font-display text-3xl font-bold">Reasoning feedback</h2>
      <p className="mt-2 text-[11px] leading-5">Optional AI review of justification, trade-offs and uncertainty. It does not change scores or recommend hiring. Your fictional report and choices are sent to Lovable AI; workspace credits apply.</p>
      {!feedback && <Button onClick={requestReview} disabled={busy} className="scenario-print-hidden mt-4 rounded-none font-system text-xs">{busy ? <Loader2 className="animate-spin" /> : <MessageSquare />}{busy ? "Reviewing reasoning…" : "Request AI feedback"}</Button>}
      {error && <p role="alert" className="mt-4 text-xs font-semibold text-sentiment-negative">{error}</p>}
      {feedback && <div className="mt-5 whitespace-pre-wrap text-xs leading-6" aria-live="polite">{feedback}</div>}
    </section>
  );
}