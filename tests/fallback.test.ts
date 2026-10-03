import { describe, expect, it, vi } from "vitest";
import { AllProvidersFailedError, ProviderError, SafetyBlockedError } from "@/lib/ai/errors";
import { extractJson, runWithFallback, type OutputParser, type ProviderAttempt } from "@/lib/ai/fallback";

// Fake providers only: no SDKs or network.
const LIMITS = { attemptTimeoutMs: 50, totalBudgetMs: 1_000, minAttemptMs: 5, invalidOutputRetries: 1 };
const GOOD = '{"ok":true}';

function attempt(provider: "gemini" | "groq", call: ProviderAttempt["call"], extra: Partial<ProviderAttempt> = {}): ProviderAttempt {
  return { provider, label: provider, prompt: { system: "sys", user: "user" }, degraded: false, call, ...extra };
}

const reject = (error: unknown) => async (): Promise<string> => {
  throw error;
};

/** Accepts `{"ok":true}` only. */
const parse: OutputParser<string> = (raw) => {
  try {
    const json = extractJson(raw) as { ok?: boolean };
    return json.ok ? { ok: true, value: raw } : { ok: false, error: "ok must be true" };
  } catch {
    return { ok: false, error: "not JSON" };
  }
};

describe("runWithFallback", () => {
  it("uses the primary provider when it works", async () => {
    const groq = vi.fn();
    const result = await runWithFallback({ attempts: [attempt("gemini", async () => GOOD), attempt("groq", groq)], parse, limits: LIMITS });
    expect(result.attempt.provider).toBe("gemini");
    expect(groq).not.toHaveBeenCalled();
  });

  it.each([
    ["429", new ProviderError("rate_limit", "slow down", 429)],
    ["5xx", new ProviderError("server", "oops", 503)],
  ])("falls back to Groq on %s", async (_, error) => {
    const result = await runWithFallback({
      attempts: [attempt("gemini", reject(error)), attempt("groq", async () => GOOD)],
      parse,
      limits: LIMITS,
    });
    expect(result.attempt.provider).toBe("groq");
  });

  it("falls back on timeout", async () => {
    const slow = () => new Promise<string>((resolve) => setTimeout(() => resolve(GOOD), 500));
    const result = await runWithFallback({ attempts: [attempt("gemini", slow), attempt("groq", async () => GOOD)], parse, limits: LIMITS });
    expect(result.attempt.provider).toBe("groq");
  });

  it("retries once with the validation error appended, then succeeds", async () => {
    const call = vi.fn<ProviderAttempt["call"]>().mockResolvedValueOnce("not json at all").mockResolvedValueOnce(GOOD);
    const result = await runWithFallback({ attempts: [attempt("gemini", call)], parse, limits: LIMITS });
    expect(result.attempt.provider).toBe("gemini");
    expect(call).toHaveBeenCalledTimes(2);
    expect(call.mock.calls[1][0].user).toContain("not JSON");
  });

  it("moves to the next provider after invalid JSON twice", async () => {
    const gemini = vi.fn<ProviderAttempt["call"]>().mockResolvedValue("{}");
    const result = await runWithFallback({ attempts: [attempt("gemini", gemini), attempt("groq", async () => GOOD)], parse, limits: LIMITS });
    expect(gemini).toHaveBeenCalledTimes(2);
    expect(result.attempt.provider).toBe("groq");
  });

  it("tells the parser when it's the final try", async () => {
    const finals: boolean[] = [];
    await runWithFallback({
      attempts: [attempt("gemini", async () => "bad")],
      parse: (raw, ctx) => {
        finals.push(ctx.final);
        return ctx.final ? { ok: true, value: raw } : { ok: false, error: "bad" };
      },
      limits: LIMITS,
    });
    expect(finals).toEqual([false, true]);
  });

  it("throws AllProvidersFailedError when everything fails", async () => {
    const down = reject(new ProviderError("server", "down", 500));
    await expect(runWithFallback({ attempts: [attempt("gemini", down), attempt("groq", down)], parse, limits: LIMITS })).rejects.toBeInstanceOf(
      AllProvidersFailedError,
    );
  });

  it("stops at a safety block without trying other providers", async () => {
    const groq = vi.fn();
    await expect(
      runWithFallback({
        attempts: [attempt("gemini", reject(new ProviderError("safety", "blocked"))), attempt("groq", groq)],
        parse,
        limits: LIMITS,
      }),
    ).rejects.toBeInstanceOf(SafetyBlockedError);
    expect(groq).not.toHaveBeenCalled();
  });

  it("adds a notice when the visitor's own key is rejected", async () => {
    const result = await runWithFallback({
      attempts: [attempt("gemini", reject(new ProviderError("auth", "bad key", 401)), { byok: true }), attempt("gemini", async () => GOOD)],
      parse,
      limits: LIMITS,
    });
    expect(result.notices.join(" ")).toMatch(/key/i);
  });

  it("gives up when the time budget is used up", async () => {
    let time = 0;
    const slowFail = async (): Promise<string> => {
      time += 2_000;
      throw new ProviderError("server", "x", 500);
    };
    await expect(
      runWithFallback({ attempts: [attempt("gemini", slowFail), attempt("groq", async () => GOOD)], parse, limits: LIMITS, now: () => time }),
    ).rejects.toBeInstanceOf(AllProvidersFailedError);
  });
});

describe("extractJson", () => {
  it("handles code fences and surrounding prose", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Sure! Here you go: {"a":2} Enjoy.')).toEqual({ a: 2 });
    expect(() => extractJson("no json here")).toThrow();
  });
});
