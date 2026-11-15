export type SentimentPrediction = { label: string; score: number };
type Pending = { resolve: (scores: SentimentPrediction[]) => void; reject: (error: Error) => void; onProgress: ((progress: number) => void) | undefined };
const pending = new Map<number, Pending>();
let worker: Worker | null = null;
let nextId = 0;

export const SENTIMENT_MODEL_NAME = "RoBERTa sentiment classifier";
export const SENTIMENT_MODEL_DOWNLOAD = "About 126 MB on first use; cached by your browser";

export function classifySentimentLocally(text: string, onProgress?: (progress: number) => void): Promise<SentimentPrediction[]> {
  if (typeof Worker === "undefined") return Promise.reject(new Error("This browser cannot run the local sentiment model."));
  worker ??= new Worker(new URL("./local-sentiment.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (event: MessageEvent<{ type: string; id?: number; scores?: SentimentPrediction[]; error?: string; progress?: number }>) => {
    const message = event.data;
    if (message.type === "progress") {
      for (const request of pending.values()) request.onProgress?.(message.progress ?? 0);
      return;
    }
    if (message.id === undefined) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.type === "result" && message.scores) request.resolve(message.scores);
    else request.reject(new Error(message.error ?? "Local sentiment analysis failed."));
  };
  worker.onerror = () => {
    for (const request of pending.values()) request.reject(new Error("Local sentiment worker failed."));
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress });
    worker!.postMessage({ id, text });
  });
}
