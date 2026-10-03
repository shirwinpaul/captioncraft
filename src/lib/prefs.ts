import { z } from "zod";
import { LANGUAGE_IDS } from "@/config/languages";
import { CAPTION_LENGTHS, PLATFORM_IDS, PLATFORMS, clampHashtagCount, type PlatformId } from "@/config/platforms";
import { STORAGE_KEYS } from "@/config/site";
import { ALL_TONE_IDS, CAPTION_TONE_IDS, MAX_TONES } from "@/config/tones";
import { createStore } from "@/lib/storage";
import { HASHTAG_STYLES } from "@/types";

/**
 * Caption wizard choices remembered between visits (Steps 2-5).
 * The photo and the free-text context are deliberately NOT stored: both are
 * specific to one photo.
 */
export const captionPrefsSchema = z.object({
  platform: z.enum(PLATFORM_IDS),
  tones: z.array(z.enum(CAPTION_TONE_IDS)).min(1).max(MAX_TONES),
  language: z.enum(LANGUAGE_IDS),
  emoji: z.boolean(),
  length: z.enum(CAPTION_LENGTHS),
  hashtagCount: z.number().int().min(0).max(30),
  hashtagStyles: z.array(z.enum(HASHTAG_STYLES)).max(HASHTAG_STYLES.length),
});

export type CaptionPrefs = z.infer<typeof captionPrefsSchema>;

export const DEFAULT_CAPTION_PREFS: CaptionPrefs = {
  platform: "instagram",
  tones: ["happy"],
  language: "english",
  emoji: true,
  length: "medium",
  hashtagCount: PLATFORMS.instagram.hashtags.default,
  hashtagStyles: ["popular", "niche"],
};

export const captionPrefsStore = createStore<CaptionPrefs>({
  key: STORAGE_KEYS.captionPrefs,
  fallback: DEFAULT_CAPTION_PREFS,
  parse: (raw) => {
    const result = captionPrefsSchema.safeParse(raw);
    if (!result.success) return undefined;
    // Platform rules may have changed since this was saved; keep the count legal.
    return { ...result.data, hashtagCount: clampHashtagCount(result.data.platform, result.data.hashtagCount) };
  },
});

/** Switching platform resets the hashtag count to that platform's default. */
export function withPlatform(prefs: CaptionPrefs, platform: PlatformId): CaptionPrefs {
  if (prefs.platform === platform) return prefs;
  return { ...prefs, platform, hashtagCount: PLATFORMS[platform].hashtags.default };
}

// --- Bio and Comment Reply modes --------------------------------------------
// The "about you" text and pasted comments are not stored: they're personal
// and usually one-off.

export const bioPrefsSchema = z.object({
  platform: z.enum(PLATFORM_IDS),
  tones: z.array(z.enum(CAPTION_TONE_IDS)).min(1).max(MAX_TONES),
  language: z.enum(LANGUAGE_IDS),
  emoji: z.boolean(),
});
export type BioPrefs = z.infer<typeof bioPrefsSchema>;

export const bioPrefsStore = createStore<BioPrefs>({
  key: STORAGE_KEYS.bioPrefs,
  fallback: { platform: "instagram", tones: ["confident"], language: "english", emoji: true },
  parse: (raw) => bioPrefsSchema.safeParse(raw).data,
});

export const replyPrefsSchema = z.object({
  platform: z.enum(PLATFORM_IDS),
  tones: z.array(z.enum(ALL_TONE_IDS)).min(1).max(MAX_TONES),
  language: z.enum(LANGUAGE_IDS),
  emoji: z.boolean(),
});
export type ReplyPrefs = z.infer<typeof replyPrefsSchema>;

export const replyPrefsStore = createStore<ReplyPrefs>({
  key: STORAGE_KEYS.replyPrefs,
  fallback: { platform: "instagram", tones: ["polite"], language: "english", emoji: true },
  parse: (raw) => replyPrefsSchema.safeParse(raw).data,
});
