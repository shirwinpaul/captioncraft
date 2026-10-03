import { describe, expect, it } from "vitest";
import { PLATFORMS, PLATFORM_IDS } from "@/config/platforms";
import { parseGeneration } from "@/lib/ai/output";
import {
  cleanHashtags,
  countChars,
  enforceCaption,
  hashtagCap,
  measurePost,
  normalizeHashtag,
  truncateToFit,
} from "@/lib/platform-rules";
import { generateRequestSchema, type GenerateRequest } from "@/lib/schemas";

const manyTags = Array.from({ length: 30 }, (_, i) => `#tag${i}`);

function captionRequest(platform: string, hashtagCount: number): GenerateRequest {
  return generateRequestSchema.parse({
    mode: "captions",
    platform,
    tones: ["happy"],
    language: "english",
    emoji: true,
    image: "data:image/jpeg;base64,AAAA",
    length: "long",
    hashtagCount,
    hashtagStyles: [],
  });
}

function aiCaptions(text: string, hashtags: string[]) {
  return JSON.stringify({ photoVibe: "A sunset", captions: Array.from({ length: 5 }, () => ({ text, hashtags, tone: "x" })) });
}

const opts = (final: boolean) => ({ count: 5, final, degraded: false });

describe("platform config", () => {
  it("Instagram allows at most 5 hashtags", () => {
    expect(PLATFORMS.instagram.hashtags.max).toBeLessThanOrEqual(5);
  });

  it("X has a 280 character limit", () => {
    expect(PLATFORMS.x.charLimit).toBe(280);
  });

  it("WhatsApp and Snapchat don't use hashtags", () => {
    expect(PLATFORMS.whatsapp.hashtags.enabled).toBe(false);
    expect(PLATFORMS.snapchat.hashtags.enabled).toBe(false);
  });

  it("every platform's default is within its min/max", () => {
    for (const id of PLATFORM_IDS) {
      const { min, max, default: def } = PLATFORMS[id].hashtags;
      expect(def).toBeGreaterThanOrEqual(min);
      expect(def).toBeLessThanOrEqual(max);
    }
  });
});

describe("hashtag limits", () => {
  it("hashtagCap never exceeds the platform max", () => {
    expect(hashtagCap("instagram", 30)).toBe(5);
    expect(hashtagCap("x", 10)).toBe(2);
    expect(hashtagCap("whatsapp", 5)).toBe(0);
    expect(hashtagCap("instagram", -3)).toBe(0);
  });

  it("Instagram output never has more than 5 hashtags, even if the AI returns 30", () => {
    const result = parseGeneration(captionRequest("instagram", 30), aiCaptions("Sunset vibes", manyTags), opts(false));
    expect(result.ok).toBe(true);
    if (result.ok) for (const item of result.value.items) expect(item.hashtags.length).toBeLessThanOrEqual(5);
  });

  it("platforms without hashtags get none", () => {
    const result = parseGeneration(captionRequest("snapchat", 5), aiCaptions("lol", manyTags), opts(false));
    expect(result.ok && result.value.items.every((i) => i.hashtags.length === 0)).toBe(true);
  });

  it("normalizes and de-duplicates tags", () => {
    expect(normalizeHashtag("Golden Hour!")).toBe("#GoldenHour");
    expect(normalizeHashtag("#2024")).toBeNull();
    expect(normalizeHashtag("#சென்னை")).toBe("#சென்னை");
    expect(cleanHashtags(["#Ooty", "ooty", "#travel"], 5)).toEqual(["#Ooty", "#travel"]);
    expect(cleanHashtags(["#Ooty"], 0)).toEqual([]);
  });
});

describe("X 280-character limit", () => {
  it("counts emoji and CJK as 2", () => {
    expect(countChars("hi 😊", "x-weighted")).toBe(5);
    expect(countChars("日本", "x-weighted")).toBe(4);
    expect(countChars("👩‍👩‍👧", "x-weighted")).toBe(2);
  });

  it("measures caption + hashtags together", () => {
    const text = "a".repeat(275);
    expect(measurePost("x", text, []).over).toBe(false);
    expect(measurePost("x", text, ["#sunset"]).over).toBe(true);
  });

  it("asks the AI to retry when an X caption is too long", () => {
    expect(parseGeneration(captionRequest("x", 2), aiCaptions("word ".repeat(80), ["#a"]), opts(false)).ok).toBe(false);
  });

  it("on the final try, every X post is cut to fit 280 including hashtags", () => {
    const long = "Sunsets 🌅 and coffee ☕ ".repeat(40);
    const result = parseGeneration(captionRequest("x", 2), aiCaptions(long, ["#sunset", "#coffee"]), opts(true));
    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const item of result.value.items) {
        expect(measurePost("x", item.text, item.hashtags).count).toBeLessThanOrEqual(280);
        expect(item.charCount).toBeLessThanOrEqual(280);
      }
    }
  });

  it("enforceCaption drops hashtags before cutting text", () => {
    const text = "a".repeat(276);
    const fixed = enforceCaption("x", { text, hashtags: ["#one", "#two"] });
    expect(fixed.text).toBe(text);
    expect(fixed.hashtags).toEqual([]);
  });

  it("truncateToFit adds an ellipsis and respects the limit", () => {
    const out = truncateToFit("the quick brown fox jumps over the lazy dog", 20);
    expect(countChars(out)).toBeLessThanOrEqual(20);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("titles", () => {
  it("YouTube needs a title; a missing one is filled in on the final try", () => {
    const req = captionRequest("youtube", 3);
    expect(parseGeneration(req, aiCaptions("My trip. It was fun.", []), opts(false)).ok).toBe(false);
    const result = parseGeneration(req, aiCaptions("My trip. It was fun.", []), opts(true));
    expect(result.ok && result.value.items.every((i) => i.title && countChars(i.title) <= 100)).toBe(true);
  });
});
