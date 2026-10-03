import { GROQ_CONFIG } from "@/config/ai";
import { NotConfiguredError } from "@/lib/ai/errors";
import { runWithFallback, type ProviderAttempt } from "@/lib/ai/fallback";
import { geminiAttempt } from "@/lib/ai/gemini";
import { groqAttempt } from "@/lib/ai/groq";
import { isMockEnabled, mockResponse } from "@/lib/ai/mock";
import { parseGeneration } from "@/lib/ai/output";
import { buildPrompt } from "@/lib/prompts";
import type { GenerateRequest, GenerationMeta, GenerationResult } from "@/lib/schemas";

/**
 * Server-side entry point: build the provider chain for this request and run it.
 *
 * Chain (skipping anything without a key):
 *   1. Gemini with the visitor's own key (BYOK)
 *   2. Gemini with the app's key
 *   3. Groq vision model (if the request has a photo)
 *   4. Groq text model: for photo requests this is the "degraded" mode that
 *      only sees the user's context; for Bio / Replies it's a normal fallback.
 *
 * Privacy: the image only lives in this request's memory. Nothing here logs
 * the image, the prompt or the user's key.
 */
export function buildAttempts(req: GenerateRequest, keys: { userGemini?: string; gemini?: string; groq?: string }): ProviderAttempt[] {
  const image = req.mode === "reply" ? undefined : req.image;
  const withImage = buildPrompt(req, { canSeeImage: true });
  const attempts: ProviderAttempt[] = [];

  if (keys.userGemini) attempts.push(geminiAttempt({ apiKey: keys.userGemini, prompt: withImage, image, byok: true }));
  if (keys.gemini) attempts.push(geminiAttempt({ apiKey: keys.gemini, prompt: withImage, image }));

  if (keys.groq) {
    if (image && GROQ_CONFIG.visionModel) {
      attempts.push(groqAttempt({ apiKey: keys.groq, model: GROQ_CONFIG.visionModel, prompt: withImage, image, degraded: false }));
    }
    // A caption without its photo is degraded; for Bio the photo was optional anyway.
    const degraded = req.mode === "captions";
    const prompt = image ? buildPrompt(req, { canSeeImage: false }) : withImage;
    attempts.push(groqAttempt({ apiKey: keys.groq, model: GROQ_CONFIG.textModel, prompt, degraded }));
  }
  return attempts;
}

export async function generate(
  req: GenerateRequest,
  options: { userGeminiKey?: string },
): Promise<{ result: GenerationResult; meta: GenerationMeta }> {
  const { count } = buildPrompt(req, { canSeeImage: true });

  if (isMockEnabled()) {
    const parsed = parseGeneration(req, mockResponse(req, count), { count, final: true, degraded: false });
    if (!parsed.ok) throw new Error(`Mock output invalid: ${parsed.error}`);
    return { result: parsed.value, meta: { provider: "mock", degraded: false, notices: ["Development mock output (MOCK_AI=true)."] } };
  }

  const attempts = buildAttempts(req, {
    userGemini: options.userGeminiKey,
    gemini: process.env.GEMINI_API_KEY?.trim() || undefined,
    groq: process.env.GROQ_API_KEY?.trim() || undefined,
  });
  if (attempts.length === 0) throw new NotConfiguredError();

  const success = await runWithFallback({
    attempts,
    parse: (raw, { final, attempt }) => parseGeneration(req, raw, { count, final, degraded: attempt.degraded }),
    // Log only which provider failed and why: never prompts, images or keys.
    onFailure: (attempt, reason) => console.warn(`[ai] ${attempt.label} failed: ${reason}`),
  });

  const notices = [...success.notices];
  if (success.attempt.degraded) {
    notices.push("Photo analysis is temporarily unavailable, so these captions are based only on your context.");
  }
  return {
    result: success.value,
    meta: { provider: success.attempt.provider, degraded: success.attempt.degraded, notices },
  };
}
