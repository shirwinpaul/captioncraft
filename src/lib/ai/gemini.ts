import { ApiError, FinishReason, GoogleGenAI, type Part, type ThinkingLevel } from "@google/genai";
import { GEMINI_CONFIG } from "@/config/ai";
import { ProviderError, isAbortError, kindFromStatus } from "@/lib/ai/errors";
import type { ProviderAttempt, PromptText } from "@/lib/ai/fallback";

const SAFETY_FINISH = new Set<string>([
  FinishReason.SAFETY,
  FinishReason.PROHIBITED_CONTENT,
  FinishReason.IMAGE_SAFETY,
  FinishReason.IMAGE_PROHIBITED_CONTENT,
  FinishReason.BLOCKLIST,
  FinishReason.SPII,
]);

/** Split a data URL into the parts Gemini wants. */
export function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const match = /^data:([^;]+);base64,([\s\S]*)$/.exec(dataUrl);
  if (!match) throw new ProviderError("bad_request", "Malformed image data URL");
  return { mimeType: match[1], data: match[2] };
}

export function geminiAttempt(options: {
  apiKey: string;
  prompt: PromptText;
  image?: string;
  byok?: boolean;
}): ProviderAttempt {
  const { apiKey, prompt, image, byok } = options;
  return {
    provider: "gemini",
    label: byok ? "gemini (visitor key)" : "gemini",
    prompt,
    degraded: false,
    byok,
    call: async ({ system, user }, signal) => {
      const ai = new GoogleGenAI({ apiKey });
      const parts: Part[] = [];
      if (image) parts.push({ inlineData: parseDataUrl(image) });
      parts.push({ text: user });

      try {
        const response = await ai.models.generateContent({
          model: GEMINI_CONFIG.model,
          contents: [{ role: "user", parts }],
          config: {
            systemInstruction: system,
            responseMimeType: "application/json",
            temperature: GEMINI_CONFIG.temperature,
            maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
            thinkingConfig: { thinkingLevel: GEMINI_CONFIG.thinkingLevel as ThinkingLevel },
            abortSignal: signal,
          },
        });

        if (response.promptFeedback?.blockReason) throw new ProviderError("safety", "Prompt blocked");
        const finish = response.candidates?.[0]?.finishReason;
        if (finish && SAFETY_FINISH.has(finish)) throw new ProviderError("safety", `Finish reason ${finish}`);
        const text = response.text;
        if (!text?.trim()) throw new ProviderError("empty", `Empty response (finish: ${finish ?? "none"})`);
        return text;
      } catch (error) {
        if (error instanceof ProviderError) throw error;
        if (error instanceof ApiError) {
          // Gemini reports an invalid key as 400 API_KEY_INVALID.
          const kind = /API_KEY_INVALID|API key not valid/i.test(error.message) ? "auth" : kindFromStatus(error.status);
          throw new ProviderError(kind, `Gemini API error ${error.status}`, error.status);
        }
        if (isAbortError(error)) throw new ProviderError("timeout", "Gemini request aborted");
        throw new ProviderError("network", "Gemini request failed");
      }
    },
  };
}
