import { pipeline, type TextGenerationPipeline } from "@huggingface/transformers";

const MODEL = "onnx-community/SmolLM2-360M-Instruct-ONNX";
type Message = { role: "system" | "user"; content: string };
type Request = { id: number; messages: Message[]; maxTokens: number };

let generator: TextGenerationPipeline | null = null;
let loading: Promise<TextGenerationPipeline> | null = null;

async function getGenerator() {
  if (generator) return generator;
  loading ??= pipeline("text-generation", MODEL, {
    device: "webgpu",
    dtype: "q4",
    progress_callback: (progress) => {
      if (progress.status === "progress") {
        self.postMessage({ type: "progress", progress: progress.progress });
      }
    },
  });
  try {
    generator = await loading;
    return generator;
  } finally {
    loading = null;
  }
}

self.onmessage = async (event: MessageEvent<Request>) => {
  const { id, messages, maxTokens } = event.data;
  try {
    const model = await getGenerator();
    const output = await model(messages, { max_new_tokens: maxTokens, min_new_tokens: 32, do_sample: false });
    const generated = output[0]?.generated_text;
    const text = Array.isArray(generated) ? generated.at(-1)?.content : generated;
    if (typeof text !== "string" || !text.trim()) throw new Error("The local model returned no text.");
    self.postMessage({ type: "result", id, text: text.trim() });
  } catch (error) {
    self.postMessage({ type: "error", id, error: error instanceof Error ? error.message : "Local model failed." });
  }
};
