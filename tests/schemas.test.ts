import { describe, expect, it } from "vitest";
import {
  bioOutputSchema,
  captionOutputSchema,
  generateRequestSchema,
  replyOutputSchema,
  RESULT_COUNT,
} from "@/lib/schemas";

const IMAGE = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

const captionRequest = {
  mode: "captions",
  platform: "instagram",
  tones: ["happy", "chill"],
  language: "english",
  emoji: true,
  image: IMAGE,
  length: "short",
  hashtagCount: 3,
  hashtagStyles: ["popular"],
};

describe("generateRequestSchema", () => {
  it("accepts a valid caption request and defaults context to empty", () => {
    const parsed = generateRequestSchema.parse(captionRequest);
    expect(parsed.mode).toBe("captions");
    if (parsed.mode === "captions") expect(parsed.context).toBe("");
  });

  it("rejects more than 3 tones", () => {
    const result = generateRequestSchema.safeParse({ ...captionRequest, tones: ["happy", "funny", "chill", "poetic"] });
    expect(result.success).toBe(false);
  });

  it("rejects a non-image data URL", () => {
    const result = generateRequestSchema.safeParse({ ...captionRequest, image: "data:text/html;base64,PGgxPg==" });
    expect(result.success).toBe(false);
  });

  it("rejects context over 150 characters", () => {
    const result = generateRequestSchema.safeParse({ ...captionRequest, context: "a".repeat(151) });
    expect(result.success).toBe(false);
  });

  it("strips control characters from user text", () => {
    const parsed = generateRequestSchema.parse({ ...captionRequest, context: "  trip\u0007 to Ooty\u0000 " });
    if (parsed.mode === "captions") expect(parsed.context).toBe("trip to Ooty");
  });

  it("requires a comment for replies and allows photo-less bios", () => {
    const base = { platform: "x", tones: ["polite"], language: "tamil", emoji: false };
    expect(generateRequestSchema.safeParse({ ...base, mode: "reply", comment: "   " }).success).toBe(false);
    expect(generateRequestSchema.safeParse({ ...base, mode: "reply", comment: "nice pic" }).success).toBe(true);
    expect(generateRequestSchema.safeParse({ ...base, tones: ["happy"], mode: "bio", about: "Priya, designer" }).success).toBe(true);
  });

  it("rejects an unknown mode or platform", () => {
    expect(generateRequestSchema.safeParse({ ...captionRequest, mode: "essay" }).success).toBe(false);
    expect(generateRequestSchema.safeParse({ ...captionRequest, platform: "myspace" }).success).toBe(false);
  });
});

describe("AI output schemas", () => {
  const caption = { text: "Golden hour", hashtags: ["#sunset"], tone: "Aesthetic", charCount: 11 };

  it("requires exactly 5 captions and a photoVibe", () => {
    const schema = captionOutputSchema(RESULT_COUNT);
    expect(schema.safeParse({ photoVibe: "A beach at sunset", captions: Array(5).fill(caption) }).success).toBe(true);
    expect(schema.safeParse({ photoVibe: "A beach at sunset", captions: Array(4).fill(caption) }).success).toBe(false);
    expect(schema.safeParse({ captions: Array(5).fill(caption) }).success).toBe(false);
  });

  it("is lenient about a missing tone or charCount", () => {
    const parsed = captionOutputSchema(1).parse({ photoVibe: "x", captions: [{ text: "hi", tone: 42 }] });
    expect(parsed.captions[0].tone).toBe("");
    expect(parsed.captions[0].hashtags).toEqual([]);
  });

  it("rejects empty caption text", () => {
    expect(captionOutputSchema(1).safeParse({ photoVibe: "x", captions: [{ text: "  " }] }).success).toBe(false);
  });

  it("validates bios and replies", () => {
    expect(bioOutputSchema(2).safeParse({ bios: [{ text: "a" }, { text: "b" }] }).success).toBe(true);
    const replies = replyOutputSchema(1).parse({ abusive: "yes", replies: [{ text: "Thanks!" }] });
    expect(replies.abusive).toBe(false); // a non-boolean falls back to false
  });
});
