/**
 * AI provider configuration: the ONE place for model IDs and provider settings.
 *
 * Model IDs were checked against the official docs on 2026-10-01:
 *   Gemini models ........ https://ai.google.dev/gemini-api/docs/models
 *   Gemini free tier ..... https://ai.google.dev/gemini-api/docs/pricing
 *   Groq vision models ... https://console.groq.com/docs/vision
 *   Groq models .......... https://console.groq.com/docs/models
 *   Groq deprecations .... https://console.groq.com/docs/deprecations
 *
 * Providers retire models regularly. If generations start failing with 404 /
 * "model not found" errors in the server logs, re-check those pages and update
 * the IDs below. Nothing else in the codebase hard-codes a model ID.
 */

export const GEMINI_CONFIG = {
  /** Primary model: latest stable Flash model, free tier, accepts images. */
  model: "gemini-3.8-flash",
  /**
   * Gemini 3.x models always "think"; LOW keeps latency down. Captions don't
   * need deep reasoning. (Allowed for this model: LOW | MEDIUM | HIGH.)
   */
  thinkingLevel: "LOW",
  /** Google recommends the default temperature (1.0) for Gemini 3 models. */
  temperature: 1,
  /** Includes thinking tokens, so leave generous headroom. */
  maxOutputTokens: 8192,
} as const;

export const GROQ_CONFIG = {
  /**
   * Vision fallback. At the time of writing this is Groq's ONLY model that
   * accepts images (the Llama 4 vision models were deprecated in 2026).
   * Set to `null` if Groq drops vision support: the app will then skip
   * straight to the text-only model below.
   */
  visionModel: "qwen/qwen3.8-27b" as string | null,
  /**
   * Text-only last resort, used when no vision model is available. It only
   * sees the user's optional context, and the UI tells the user that photo
   * analysis was temporarily unavailable.
   */
  textModel: "openai/gpt-oss-120b",
  temperature: 0.8,
  /**
   * Groq's free tier allows ~8K tokens per minute per model, and it counts
   * max_completion_tokens against that budget up front. An image costs ~2K
   * tokens, so keep this modest.
   */
  maxCompletionTokens: 4000,
  /** Extra request params per model (Groq's reasoning controls differ by model). */
  modelParams: {
    // Qwen: "none" = fast instruct mode. JSON mode requires reasoning_format hidden|parsed.
    "qwen/qwen3.8-27b": { reasoning_effort: "none", reasoning_format: "hidden" },
    // gpt-oss always reasons; "low" is the fastest setting. Keep reasoning out of the reply.
    "openai/gpt-oss-120b": { reasoning_effort: "low", include_reasoning: false },
  } as Record<string, Record<string, unknown>>,
} as const;

export const AI_LIMITS = {
  /** Fall back to the next provider if one attempt takes longer than this. */
  attemptTimeoutMs: 25_000,
  /** Hard budget for one API request across all providers and retries. */
  totalBudgetMs: 55_000,
  /** Don't start a new attempt with less time than this left. */
  minAttemptMs: 4_000,
  /** When the AI returns invalid JSON, retry this many times (with the error appended). */
  invalidOutputRetries: 1,
} as const;

/** Must stay above AI_LIMITS.totalBudgetMs. Used as `maxDuration` on AI routes. */
export const AI_ROUTE_MAX_DURATION_SECONDS = 60;

export const RATE_LIMIT = {
  windowMs: 60 * 60 * 1000,
  /** Generations per IP per hour using the app's shared free keys. */
  maxRequests: Number(process.env.RATE_LIMIT_PER_HOUR) || 20,
  /** People using their own Gemini key mostly spend their own quota, so they get more room. */
  maxRequestsWithOwnKey: 60,
} as const;

/** Header that carries a user's own Gemini key (Bring Your Own Key). */
export const BYOK_HEADER = "x-user-gemini-key";

/** Where users can create a free Gemini API key. */
export const GEMINI_KEY_URL = "https://aistudio.google.com/apikey";
