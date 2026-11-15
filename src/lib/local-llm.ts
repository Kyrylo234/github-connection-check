type Message = { role: "system" | "user"; content: string };
type Pending = { resolve: (text: string) => void; reject: (error: Error) => void; onProgress: ((progress: number) => void) | undefined };
const pending = new Map<number, Pending>();
let worker: Worker | null = null;
let nextId = 0;

export const LOCAL_MODEL_NAME = "SmolLM2 360M";
export const LOCAL_MODEL_DOWNLOAD = "About 400 MB on first use; cached by your browser";

export function canRunLocalModel() {
  return typeof navigator !== "undefined" && "gpu" in navigator && typeof Worker !== "undefined";
}

export function generateLocally(messages: Message[], maxTokens: number, onProgress?: (progress: number) => void): Promise<string> {
  if (!canRunLocalModel()) return Promise.reject(new Error("This browser needs WebGPU to run the local model."));
  worker ??= new Worker(new URL("./local-llm.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (event: MessageEvent<{ type: string; id?: number; text?: string; error?: string; progress?: number }>) => {
    const message = event.data;
    if (message.type === "progress") {
      for (const request of pending.values()) request.onProgress?.(message.progress ?? 0);
      return;
    }
    if (message.id === undefined) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.type === "result" && message.text) request.resolve(message.text);
    else request.reject(new Error(message.error ?? "Local model failed."));
  };
  worker.onerror = () => {
    for (const request of pending.values()) request.reject(new Error("Local model worker failed."));
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress });
    worker!.postMessage({ id, messages, maxTokens });
  });
}
