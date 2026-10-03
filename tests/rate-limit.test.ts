import { describe, expect, it } from "vitest";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit per window, then blocks until the window slides", () => {
    let time = 0;
    const limiter = createRateLimiter({ windowMs: 60_000, now: () => time });
    for (let i = 0; i < 3; i++) expect(limiter.check("ip", 3).allowed).toBe(true);
    const blocked = limiter.check("ip", 3);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
    expect(limiter.check("other-ip", 3).allowed).toBe(true);
    time = 60_001;
    expect(limiter.check("ip", 3).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
