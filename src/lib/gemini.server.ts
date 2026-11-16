const MODEL = "gemini-3.5-flash";

/** Server-only Gemini request. Keys and provider errors never reach the browser. */
export async function askGemini(apiKey: string, instructions: string, evidence: unknown, signal?: AbortSignal): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instructions }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(evidence) }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 4096,
        thinkingConfig: { thinkingLevel: "low" } },
    }),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    const error = new Error(response.status === 429 ? "Gemini free-tier limit reached. Try again later." :
      [401, 403].includes(response.status) ? "Gemini access is unavailable. Check the server API key." :
      "Gemini analysis is temporarily unavailable.");
    Object.assign(error, { statusCode: response.status });
    throw error;
  }
  const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map(part => part.text ?? "").join("").trim();
  if (!text) throw new Error("Gemini returned no usable response.");
  return text;
}
