import { BYOK_HEADER, RATE_LIMIT } from "@/config/ai";
import { AllProvidersFailedError, NotConfiguredError, SafetyBlockedError } from "@/lib/ai/errors";
import { generate } from "@/lib/ai/generate";
import { isPlausibleApiKey } from "@/lib/byok";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { FRIENDLY_VALIDATION_MESSAGES, generateRequestSchema, type ApiErrorCode, type GenerateResponse } from "@/lib/schemas";

/**
 * POST /api/generate: captions, bios and comment replies.
 * Privacy: the request body (photo included) is processed in memory only and
 * never stored or logged.
 */

// Must stay above AI_LIMITS.totalBudgetMs (see AI_ROUTE_MAX_DURATION_SECONDS in
// src/config/ai.ts). Segment config has to be a literal, so it's repeated here.
export const maxDuration = 60;

/** Below Vercel's 4.5 MB request body limit. */
const MAX_BODY_BYTES = 4_000_000;

const limiter = createRateLimiter({ windowMs: RATE_LIMIT.windowMs });

const MESSAGES: Record<ApiErrorCode, string> = {
  bad_request: "Something about that request wasn't right. Please check your inputs and try again.",
  rate_limited: "You've made a lot of requests. Please take a short break and try again later.",
  busy: "Our free AI is busy — try again in a minute, or add your own free Gemini key in Settings.",
  safety: "The AI couldn't process this photo for safety reasons. Please try a different photo.",
  invalid_key: "That Gemini key doesn't look right. Please check it in Settings.",
  too_large: "That photo is too large to send. Please try a smaller one.",
  not_configured:
    "The AI isn't set up yet on this server. Add your own free Gemini key in Settings, or ask the site owner to add API keys.",
};

function fail(code: ApiErrorCode, status: number, message = MESSAGES[code], headers?: HeadersInit) {
  const body: GenerateResponse = { ok: false, error: { code, message } };
  return Response.json(body, { status, headers });
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return fail("too_large", 413);

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return fail("bad_request", 400);
  }
  if (raw.length > MAX_BODY_BYTES) return fail("too_large", 413);

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail("bad_request", 400);
  }

  const parsed = generateRequestSchema.safeParse(json);
  if (!parsed.success) {
    // Only our own hand-written messages are shown; never echo user input back.
    const friendly = parsed.error.issues.map((i) => i.message).find((m) => FRIENDLY_VALIDATION_MESSAGES.has(m));
    return fail("bad_request", 400, friendly);
  }

  const userKeyHeader = request.headers.get(BYOK_HEADER)?.trim();
  if (userKeyHeader && !isPlausibleApiKey(userKeyHeader)) return fail("invalid_key", 400);
  const userGeminiKey = userKeyHeader || undefined;

  const limit = limiter.check(
    getClientIp(request.headers),
    userGeminiKey ? RATE_LIMIT.maxRequestsWithOwnKey : RATE_LIMIT.maxRequests,
  );
  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterSeconds / 60);
    return fail(
      "rate_limited",
      429,
      `You've reached the hourly limit. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}, or add your own free Gemini key in Settings for more room.`,
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  try {
    const { result, meta } = await generate(parsed.data, { userGeminiKey });
    const body: GenerateResponse = { ok: true, result, meta };
    return Response.json(body);
  } catch (error) {
    if (error instanceof SafetyBlockedError) return fail("safety", 422);
    if (error instanceof NotConfiguredError) {
      console.error("[ai] No GEMINI_API_KEY or GROQ_API_KEY configured.");
      return fail("not_configured", 503);
    }
    if (error instanceof AllProvidersFailedError) {
      console.warn(`[ai] all providers failed: ${error.failures.join(" | ")}`);
      return fail("busy", 503);
    }
    console.error("[ai] unexpected error:", error instanceof Error ? error.name : "unknown");
    return fail("busy", 503);
  }
}
