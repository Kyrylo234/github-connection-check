import { useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOCAL_MODEL_DOWNLOAD, LOCAL_MODEL_NAME } from "@/lib/local-llm";
import type { ScenarioSession } from "@/types/scenario";

export function ReasoningFeedback({ session }: { session: ScenarioSession }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const requestReview = async () => {
    if (session.scenarioId !== "cyberattack" && session.scenarioId !== "supply-chain") return;
    setBusy(true);
    setError(null);
    try {
      const { reviewReasoningLocally } = await import("@/lib/local-reasoning-feedback");
      setFeedback(await reviewReasoningLocally(session, setProgress));
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Local feedback failed. Your report is still saved."); }
    finally { setBusy(false); }
  };
  return (
    <section className="border-b border-report-rule p-5 sm:p-8" aria-label="AI reasoning feedback">
      <h2 className="font-display text-3xl font-bold">Reasoning feedback</h2>
      <p className="mt-2 text-[11px] leading-5">Optional review with {LOCAL_MODEL_NAME} in this browser. {LOCAL_MODEL_DOWNLOAD}. It does not change scores or recommend hiring. Your report stays on this device.</p>
      {!feedback && <Button onClick={requestReview} disabled={busy} className="scenario-print-hidden mt-4 rounded-none font-system text-xs">{busy ? <Loader2 className="animate-spin" /> : <MessageSquare />}{busy ? "Running local review…" : "Request local feedback"}</Button>}
      {busy && progress !== null && <p role="status" className="mt-2 text-xs">Loading local model: {Math.round(progress)}%</p>}
      {error && <p role="alert" className="mt-4 text-xs font-semibold text-sentiment-negative">{error}</p>}
      {feedback && <div className="mt-5 whitespace-pre-wrap text-xs leading-6" aria-live="polite">{feedback}</div>}
    </section>
  );
}
