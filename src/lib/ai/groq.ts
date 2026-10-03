import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { GROQ_CONFIG } from "@/config/ai";
import { ProviderError, isAbortError, kindFromStatus } from "@/lib/ai/errors";
import type { ProviderAttempt, PromptText } from "@/lib/ai/fallback";

export function groqAttempt(options: {
  apiKey: string;
  model: string;
  prompt: PromptText;
  /** Only for vision models. */
  image?: string;
  /** True when this is the text-only stand-in for a photo request. */
  degraded: boolean;
}): ProviderAttempt {
  const { apiKey, model, prompt, image, degraded } = options;
  return {
    provider: "groq",
    label: image ? "groq vision" : "groq text",
    prompt,
    degraded,
    call: async ({ system, user }, signal) => {
      // We handle retries and fallback ourselves.
      const client = new Groq({ apiKey, maxRetries: 0 });
      // Some Groq vision models reject a system message alongside an image, so fold it into the user turn.
      const messages: ChatCompletionMessageParam[] = image
        ? [
            {
              role: "user",
              content: [
                { type: "text", text: `${system}\n\n---\n\n${user}` },
                { type: "image_url", image_url: { url: image } },
              ],
            },
          ]
        : [
            { role: "system", content: system },
            { role: "user", content: user },
          ];

      try {
        const completion = await client.chat.completions.create(
          {
            model,
            messages,
            temperature: GROQ_CONFIG.temperature,
            max_completion_tokens: GROQ_CONFIG.maxCompletionTokens,
            response_format: { type: "json_object" },
            // Per-model reasoning controls (see config); spread last so config wins.
            ...(GROQ_CONFIG.modelParams[model] ?? {}),
          },
          { signal },
        );
        const choice = completion.choices[0];
        // Not in the SDK type, but Groq can return it.
        if ((choice?.finish_reason as string | undefined) === "content_filter") throw new ProviderError("safety", "Groq content filter");
        const text = choice?.message?.content;
        if (!text?.trim()) throw new ProviderError("empty", `Empty response (finish: ${choice?.finish_reason ?? "none"})`);
        return text;
      } catch (error) {
        if (error instanceof ProviderError) throw error;
        if (error instanceof Groq.APIConnectionTimeoutError) throw new ProviderError("timeout", "Groq timed out");
        if (error instanceof Groq.APIUserAbortError || isAbortError(error)) throw new ProviderError("timeout", "Groq request aborted");
        if (error instanceof Groq.APIError && error.status !== undefined) {
          throw new ProviderError(kindFromStatus(error.status), `Groq API error ${error.status}`, error.status);
        }
        throw new ProviderError("network", "Groq request failed");
      }
    },
  };
}
