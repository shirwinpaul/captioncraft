import { z } from "zod";
import { LANGUAGE_IDS } from "@/config/languages";
import { CAPTION_LENGTHS, PLATFORM_IDS } from "@/config/platforms";
import { ALL_TONE_IDS, CAPTION_TONE_IDS, MAX_TONES } from "@/config/tones";
import { HASHTAG_STYLES } from "@/types";

/*
 * Zod schemas for everything crossing a trust boundary:
 *  - API request bodies (browser → our server)
 *  - AI model output (provider → our server)
 */

export const CONTEXT_MAX = 150;
export const ABOUT_MAX = 300;
export const COMMENT_MAX = 600;
/** Results per normal generation, and per "More like this". */
export const RESULT_COUNT = 5;
export const VARIATION_COUNT = 3;

const MSG = {
  imageTooLarge: "That photo is too large to send. Please try a smaller one.",
  imageFormat: "The photo couldn't be read. Please upload it again.",
  aboutMissing: "Tell us a little about yourself.",
  commentMissing: "Paste the comment you received.",
} as const;

/** Validation messages that are safe and helpful to show to the user. */
export const FRIENDLY_VALIDATION_MESSAGES: ReadonlySet<string> = new Set(Object.values(MSG));

/** ~2.2 MB of JPEG. The browser sends ≤1.5 MB, so this only stops abuse. */
const MAX_IMAGE_CHARS = 3_000_000;

export const imageDataUrlSchema = z
  .string()
  .max(MAX_IMAGE_CHARS, MSG.imageTooLarge)
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/, MSG.imageFormat);

/** Remove control characters (keeps newlines) and trim. */
const cleanText = (max: number) =>
  z
    .string()
    .max(max * 2) // generous before cleaning; the real limit is checked after
    .transform((s) => s.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "").trim())
    .pipe(z.string().max(max));

const variationSchema = z
  .object({
    text: z.string().max(6000),
    hashtags: z.array(z.string().max(100)).max(30).default([]),
    title: z.string().max(300).optional(),
  })
  .optional();

const shared = {
  language: z.enum(LANGUAGE_IDS),
  emoji: z.boolean(),
  platform: z.enum(PLATFORM_IDS),
  /** When set, generate 3 fresh variations of this text instead of 5 new results. */
  variationOf: variationSchema,
};

export const captionRequestSchema = z.object({
  mode: z.literal("captions"),
  ...shared,
  image: imageDataUrlSchema,
  tones: z.array(z.enum(CAPTION_TONE_IDS)).min(1).max(MAX_TONES),
  length: z.enum(CAPTION_LENGTHS),
  hashtagCount: z.number().int().min(0).max(30),
  hashtagStyles: z.array(z.enum(HASHTAG_STYLES)).max(HASHTAG_STYLES.length),
  context: cleanText(CONTEXT_MAX).default(""),
});

export const bioRequestSchema = z.object({
  mode: z.literal("bio"),
  ...shared,
  image: imageDataUrlSchema.optional(),
  tones: z.array(z.enum(CAPTION_TONE_IDS)).min(1).max(MAX_TONES),
  about: cleanText(ABOUT_MAX).pipe(z.string().min(2, MSG.aboutMissing)),
});

export const replyRequestSchema = z.object({
  mode: z.literal("reply"),
  ...shared,
  tones: z.array(z.enum(ALL_TONE_IDS)).min(1).max(MAX_TONES),
  comment: cleanText(COMMENT_MAX).pipe(z.string().min(1, MSG.commentMissing)),
});

export const generateRequestSchema = z.discriminatedUnion("mode", [
  captionRequestSchema,
  bioRequestSchema,
  replyRequestSchema,
]);

export type CaptionRequest = z.infer<typeof captionRequestSchema>;
export type BioRequest = z.infer<typeof bioRequestSchema>;
export type ReplyRequest = z.infer<typeof replyRequestSchema>;
export type GenerateRequest = z.infer<typeof generateRequestSchema>;
/** What the browser sends (before Zod defaults/transforms run). */
export type GenerateRequestInput = z.input<typeof generateRequestSchema>;
export type GenerationMode = GenerateRequest["mode"];

// ---------------------------------------------------------------------------
// AI output. Kept a little lenient (e.g. charCount may be missing or wrong):
// the server recomputes counts and enforces platform limits afterwards.
// ---------------------------------------------------------------------------

const aiText = z.string().trim().min(1).max(6000);
const aiTone = z.string().trim().max(120).catch("");

export function captionOutputSchema(count: number) {
  return z.object({
    photoVibe: z.string().trim().min(1).max(400),
    captions: z
      .array(
        z.object({
          text: aiText,
          hashtags: z.array(z.string()).max(40).default([]),
          tone: aiTone,
          charCount: z.number().optional(),
          title: z.string().trim().max(400).optional(),
        }),
      )
      .length(count),
  });
}

export function bioOutputSchema(count: number) {
  return z.object({
    bios: z.array(z.object({ text: aiText, tone: aiTone, charCount: z.number().optional() })).length(count),
  });
}

export function replyOutputSchema(count: number) {
  return z.object({
    /** True when the comment was abusive/harassing; replies are then calm or "no reply" suggestions. */
    abusive: z.boolean().catch(false),
    replies: z.array(z.object({ text: aiText, tone: aiTone })).length(count),
  });
}

/** One generated item as the browser receives it (same shape for captions, bios and replies). */
export const resultItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  hashtags: z.array(z.string()),
  title: z.string().optional(),
  tone: z.string(),
  charCount: z.number(),
});

export type ResultItem = z.infer<typeof resultItemSchema>;

export interface GenerationResult {
  mode: GenerationMode;
  items: ResultItem[];
  /** Captions only: what the AI saw in the photo. */
  photoVibe?: string;
  /** Extra guidance for the user, e.g. "This comment looks abusive…". */
  note?: string;
}

export interface GenerationMeta {
  provider: "gemini" | "groq" | "mock";
  /** True when the photo couldn't be analysed and the text-only fallback was used. */
  degraded: boolean;
  notices: string[];
}

export type GenerateResponse =
  | { ok: true; result: GenerationResult; meta: GenerationMeta }
  | { ok: false; error: { code: ApiErrorCode; message: string } };

export type ApiErrorCode =
  | "bad_request"
  | "rate_limited"
  | "busy"
  | "safety"
  | "invalid_key"
  | "too_large"
  | "not_configured";
