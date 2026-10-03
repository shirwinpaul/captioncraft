import { AI_LIMITS } from "@/config/ai";
import { retryNote } from "@/lib/prompts";
import { AllProvidersFailedError, ProviderError, SafetyBlockedError, isAbortError } from "@/lib/ai/errors";

/**
 * Provider-agnostic fallback runner (no SDK imports, so it's unit-testable
 * with fake providers).
 *
 * For each attempt in order:
 *   call → parse. Invalid output → retry the SAME provider once with the
 *   validation error appended. Still invalid, or a 429 / 5xx / timeout /
 *   network / auth / model error → move on to the next provider.
 *   A safety block stops everything (another provider won't help).
 */

export interface PromptText {
  system: string;
  user: string;
}

export interface ProviderAttempt {
  /** For logs and response meta. */
  provider: "gemini" | "groq";
  /** e.g. "gemini (your key)", "groq vision". Logged, never shown with secrets. */
  label: string;
  prompt: PromptText;
  /** This attempt can't see the photo (text-only fallback). */
  degraded: boolean;
  /** Uses the visitor's own key: an auth failure gets a friendly notice. */
  byok?: boolean;
  call: (prompt: PromptText, signal: AbortSignal) => Promise<string>;
}

export type ParseOutcome<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * @param final true on the last try for a provider: the parser should then
 * repair fixable rule problems (e.g. too long) instead of rejecting.
 */
export type OutputParser<T> = (raw: string, context: { final: boolean; attempt: ProviderAttempt }) => ParseOutcome<T>;

export interface FallbackOptions<T> {
  attempts: ProviderAttempt[];
  parse: OutputParser<T>;
  limits?: Record<"attemptTimeoutMs" | "totalBudgetMs" | "minAttemptMs" | "invalidOutputRetries", number>;
  now?: () => number;
  onFailure?: (attempt: ProviderAttempt, reason: string) => void;
}

export interface FallbackSuccess<T> {
  value: T;
  attempt: ProviderAttempt;
  notices: string[];
}

export async function runWithFallback<T>(options: FallbackOptions<T>): Promise<FallbackSuccess<T>> {
  const { attempts, parse, limits = AI_LIMITS, now = Date.now, onFailure } = options;
  const started = now();
  const failures: string[] = [];
  const notices: string[] = [];

  const fail = (attempt: ProviderAttempt, reason: string) => {
    failures.push(`${attempt.label}: ${reason}`);
    onFailure?.(attempt, reason);
  };

  for (const attempt of attempts) {
    let lastError: string | null = null;
    const tries = limits.invalidOutputRetries + 1;

    for (let i = 0; i < tries; i++) {
      const remaining = limits.totalBudgetMs - (now() - started);
      if (remaining < limits.minAttemptMs) {
        failures.push("time budget exhausted");
        throw new AllProvidersFailedError(failures);
      }

      const prompt = lastError ? { ...attempt.prompt, user: attempt.prompt.user + retryNote(lastError) } : attempt.prompt;
      let raw: string;
      try {
        raw = await withTimeout((signal) => attempt.call(prompt, signal), Math.min(limits.attemptTimeoutMs, remaining));
      } catch (error) {
        if (error instanceof ProviderError && error.kind === "safety") throw new SafetyBlockedError();
        const reason =
          error instanceof ProviderError ? `${error.kind}${error.status ? ` (${error.status})` : ""}` : isAbortError(error) ? "timeout" : "unknown error";
        if (attempt.byok && error instanceof ProviderError && error.kind === "auth") {
          notices.push("Your own Gemini key didn't work, so we used the shared free AI instead. Check the key in Settings.");
        }
        fail(attempt, reason);
        break; // provider error → next provider
      }

      const parsed = parse(raw, { final: i === tries - 1, attempt });
      if (parsed.ok) return { value: parsed.value, attempt, notices };
      lastError = parsed.error;
      if (i === tries - 1) fail(attempt, `invalid output: ${parsed.error.slice(0, 200)}`);
    }
  }

  throw new AllProvidersFailedError(failures);
}

/** Run `task` with an AbortSignal that fires after `ms`. Rejects with a timeout ProviderError. */
export async function withTimeout<T>(task: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new ProviderError("timeout", `Timed out after ${ms}ms`));
    }, ms);
  });
  try {
    // Race as well as abort: not every SDK honours the signal promptly.
    return await Promise.race([task(controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Models sometimes wrap JSON in ```json fences or add a sentence; pull out the object. */
export function extractJson(raw: string): unknown {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new SyntaxError("Response was not valid JSON.");
  }
}
