import { pipeline, type TextClassificationPipeline } from "@huggingface/transformers";

const MODEL = "Xenova/twitter-roberta-base-sentiment-latest";
let classifier: TextClassificationPipeline | null = null;
let loading: Promise<TextClassificationPipeline> | null = null;

async function getClassifier() {
  if (classifier) return classifier;
  loading ??= pipeline("text-classification", MODEL, {
    device: "wasm",
    dtype: "q8",
    progress_callback: progress => {
      if (progress.status === "progress") self.postMessage({ type: "progress", progress: progress.progress });
    },
  });
  try {
    classifier = await loading;
    return classifier;
  } finally {
    loading = null;
  }
}

self.onmessage = async (event: MessageEvent<{ id: number; text: string }>) => {
  const { id, text } = event.data;
  try {
    const model = await getClassifier();
    const scores = await model(text, { top_k: null });
    self.postMessage({ type: "result", id, scores });
  } catch (error) {
    self.postMessage({ type: "error", id, error: error instanceof Error ? error.message : "Local sentiment analysis failed." });
  }
};
