import { useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScenarioSession } from "@/types/scenario";

export function ReasoningFeedback({ session }: { session: ScenarioSession }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const requestReview = async () => {
    if (session.scenarioId !== "cyberattack" && session.scenarioId !== "supply-chain") return;
    setBusy(true);
    setError(null);
    try {
      const { getReasoningFeedback } = await import("@/lib/reasoning-feedback.functions");
      const result = await getReasoningFeedback({ data: { scenarioId: session.scenarioId as "cyberattack" | "supply-chain", history: session.history, report: session.situationReport } });
      if (result.error) throw new Error(result.error);
      setFeedback(result.feedback);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Gemini feedback failed. Your report and scores are unchanged."); }
    finally { setBusy(false); }
  };
  return (
    <section className="border-b border-report-rule p-5 sm:p-8" aria-label="AI reasoning feedback">
      <h2 className="font-display text-3xl font-bold">Reasoning feedback</h2>
      <p className="mt-2 text-[11px] leading-5">Optional Gemini review sends your report and decisions to Google when requested. On the free tier, Google may use this content to improve its products. It does not change scores or recommend hiring.</p>
      {!feedback && <Button onClick={requestReview} disabled={busy} className="scenario-print-hidden mt-4 rounded-none font-system text-xs">{busy ? <Loader2 className="animate-spin" /> : <MessageSquare />}{busy ? "Running Gemini review…" : "Request Gemini feedback"}</Button>}
      {error && <p role="alert" className="mt-4 text-xs font-semibold text-sentiment-negative">{error}</p>}
      {feedback && <div className="mt-5 whitespace-pre-wrap text-xs leading-6" aria-live="polite">{feedback}</div>}
    </section>
  );
}
