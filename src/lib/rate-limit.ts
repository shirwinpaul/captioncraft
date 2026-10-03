/**
 * Sliding-window rate limiter kept in memory.
 *
 * BEST-EFFORT ONLY: on serverless (Vercel) each function instance has its own
 * memory and instances come and go, so a determined user can exceed the limit.
 * It still stops accidental loops and casual abuse. For a hard limit, swap the
 * Map for a shared store such as Upstash Redis.
 */

const MAX_TRACKED_KEYS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the oldest request leaves the window. */
  retryAfterSeconds: number;
}

export function createRateLimiter(options: { windowMs: number; now?: () => number }) {
  const { windowMs, now = Date.now } = options;
  const hits = new Map<string, number[]>();

  function check(key: string, limit: number): RateLimitResult {
    const time = now();
    const recent = (hits.get(key) ?? []).filter((t) => time - t < windowMs);

    if (recent.length >= limit) {
      hits.set(key, recent);
      return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - time) / 1000)) };
    }

    recent.push(time);
    // Map preserves insertion order: re-insert so the oldest keys are evicted first.
    hits.delete(key);
    hits.set(key, recent);
    if (hits.size > MAX_TRACKED_KEYS) {
      const oldest = hits.keys().next().value;
      if (oldest !== undefined) hits.delete(oldest);
    }
    return { allowed: true, remaining: limit - recent.length, retryAfterSeconds: 0 };
  }

  return { check };
}

/** Best guess at the client's IP. Vercel sets x-forwarded-for (and overwrites any client-sent value). */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
