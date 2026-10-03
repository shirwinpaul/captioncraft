/**
 * Platform rules: caption style, character limits, hashtag ranges and bio limits.
 *
 * ⚠️ MAINTAINERS: social platforms change these rules often. For example,
 * Instagram cut hashtags from 30 to 5 per post/Reel in December 2025. Re-check
 * every platform's help centre every few months and update this file. It is
 * the single source of truth for the UI, the AI prompts and the server-side
 * enforcement (see src/lib/platform-rules.ts).
 *
 * Last reviewed: 2026-10-01.
 */

export const PLATFORM_IDS = [
  "instagram",
  "facebook",
  "x",
  "linkedin",
  "threads",
  "youtube",
  "whatsapp",
  "snapchat",
  "pinterest",
] as const;

export type PlatformId = (typeof PLATFORM_IDS)[number];

export const CAPTION_LENGTHS = ["short", "medium", "long"] as const;
export type CaptionLength = (typeof CAPTION_LENGTHS)[number];

/**
 * How a platform counts characters.
 * - "codepoints": one per Unicode code point (a safe, slightly conservative count).
 * - "x-weighted": X's rule. Most Latin, Tamil and Devanagari characters count 1;
 *   emoji, CJK and other characters count 2.
 */
export type CharCountMode = "codepoints" | "x-weighted";

export interface HashtagRule {
  /** False = the platform doesn't use hashtags; the UI hides hashtag controls. */
  enabled: boolean;
  min: number;
  default: number;
  max: number;
  /** What the UI calls them, e.g. Threads has "topic tags". */
  noun: { one: string; many: string };
}

export interface PlatformRule {
  id: PlatformId;
  name: string;
  /** Short hint on the platform card. */
  tagline: string;
  /** Style guidance passed to the AI. */
  styleGuide: string;
  /** What the main text is called on this platform. */
  captionLabel: "Caption" | "Post" | "Description" | "Status";
  /** Max characters for the full post (caption + hashtags). null = no practical limit. */
  charLimit: number | null;
  countMode: CharCountMode;
  /** Text placed between the caption and its hashtags when copying "all". */
  hashtagSeparator: string;
  hashtags: HashtagRule;
  /** Platforms that also need a title (YouTube, Pinterest). */
  title: { limit: number; label: string } | null;
  /** What short / medium / long means on this platform (for the AI). */
  lengthGuide: Record<CaptionLength, string>;
  bio: { limit: number; label: string; guide: string };
}

const HASHTAGS = { one: "hashtag", many: "hashtags" };
const NO_HASHTAGS: HashtagRule = { enabled: false, min: 0, default: 0, max: 0, noun: HASHTAGS };

export const PLATFORMS: Record<PlatformId, PlatformRule> = {
  instagram: {
    id: "instagram",
    name: "Instagram",
    tagline: "Visual & casual · max 5 hashtags",
    styleGuide:
      "Casual, visual and scroll-stopping. Hook in the first line (only ~125 characters show before 'more'). Line breaks are fine. Sound like a real person, not a brand.",
    captionLabel: "Caption",
    charLimit: 2200,
    countMode: "codepoints",
    hashtagSeparator: "\n\n",
    // Instagram enforces a 5-hashtag maximum per post/Reel. NEVER raise max above 5.
    hashtags: { enabled: true, min: 0, default: 3, max: 5, noun: HASHTAGS },
    title: null,
    lengthGuide: {
      short: "one punchy line, under 60 characters",
      medium: "1-3 sentences, roughly 80-180 characters",
      long: "a story-style caption of 3-6 sentences with line breaks, roughly 250-600 characters",
    },
    bio: {
      limit: 150,
      label: "Instagram bio",
      guide: "Scannable; line breaks or emoji bullets are fine. Who you are + what you share + a small hook.",
    },
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    tagline: "Conversational · 0-3 hashtags",
    styleGuide:
      "Warm and conversational, like talking to friends and family. A question that invites comments works well. Hashtags are optional and used sparingly.",
    captionLabel: "Post",
    charLimit: 63206,
    countMode: "codepoints",
    hashtagSeparator: "\n\n",
    hashtags: { enabled: true, min: 0, default: 1, max: 3, noun: HASHTAGS },
    title: null,
    lengthGuide: {
      short: "one line, under 80 characters",
      medium: "2-3 sentences, about 100-250 characters",
      long: "a short personal story of 4-7 sentences, about 300-700 characters",
    },
    bio: {
      limit: 101,
      label: "Facebook bio (Intro)",
      guide: "One short, friendly line about who you are.",
    },
  },
  x: {
    id: "x",
    name: "X (Twitter)",
    tagline: "280 characters incl. hashtags",
    styleGuide:
      "Punchy, witty and concise. The 280-character limit INCLUDES hashtags, spaces and emojis (each emoji counts as 2). Avoid line-break-heavy formatting.",
    captionLabel: "Post",
    charLimit: 280,
    countMode: "x-weighted",
    hashtagSeparator: " ",
    hashtags: { enabled: true, min: 0, default: 1, max: 2, noun: HASHTAGS },
    title: null,
    lengthGuide: {
      short: "under 70 characters",
      medium: "about 100-180 characters",
      long: "about 180-250 characters, and never more than 280 including hashtags",
    },
    bio: {
      limit: 160,
      label: "X bio",
      guide: "One or two punchy lines with personality; separators like | or · are fine.",
    },
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    tagline: "Professional storytelling",
    styleGuide:
      "Professional but human storytelling: a hook first line, short paragraphs separated by blank lines, a takeaway or lesson, optionally a closing question. No slang overload and no humblebrags.",
    captionLabel: "Post",
    charLimit: 3000,
    countMode: "codepoints",
    hashtagSeparator: "\n\n",
    hashtags: { enabled: true, min: 0, default: 3, max: 5, noun: HASHTAGS },
    title: null,
    lengthGuide: {
      short: "1-2 sentences, under 200 characters",
      medium: "3-5 short lines or paragraphs, about 300-700 characters",
      long: "a story post with hook, context, insight and takeaway, about 800-1500 characters",
    },
    bio: {
      limit: 220,
      label: "LinkedIn headline",
      guide: "Headline style: role or value proposition | focus areas | a human touch. No buzzword salad.",
    },
  },
  threads: {
    id: "threads",
    name: "Threads",
    tagline: "Conversational · 1 topic tag",
    styleGuide:
      "Conversational and authentic, like starting a chat. Questions and light hot takes work well. Threads allows only ONE topic tag per post.",
    captionLabel: "Post",
    charLimit: 500,
    countMode: "codepoints",
    hashtagSeparator: "\n\n",
    hashtags: { enabled: true, min: 0, default: 1, max: 1, noun: { one: "topic tag", many: "topic tags" } },
    title: null,
    lengthGuide: {
      short: "under 80 characters",
      medium: "1-3 sentences, about 100-250 characters",
      long: "about 300-480 characters",
    },
    bio: {
      limit: 150,
      label: "Threads bio",
      guide: "Short and conversational; a little personality goes a long way.",
    },
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    tagline: "Title + description",
    styleGuide:
      "Write a YouTube TITLE (max 100 characters, curiosity-driven and searchable, no misleading clickbait) plus a DESCRIPTION as the caption text. The description opens with a strong 1-2 line summary (shown before 'more'), uses natural keywords and can end with a call to action. YouTube shows the first 3 hashtags above the title.",
    captionLabel: "Description",
    charLimit: 5000,
    countMode: "codepoints",
    hashtagSeparator: "\n\n",
    hashtags: { enabled: true, min: 0, default: 3, max: 3, noun: HASHTAGS },
    title: { limit: 100, label: "Title" },
    lengthGuide: {
      short: "1-2 sentences, under 200 characters",
      medium: "2-3 short paragraphs, about 300-600 characters",
      long: "3-5 short paragraphs with keywords and a call to action, about 700-1500 characters",
    },
    bio: {
      limit: 1000,
      label: "YouTube channel description",
      guide: "What the channel is about, who it's for and the upload vibe; can be a few short lines.",
    },
  },
  whatsapp: {
    id: "whatsapp",
    name: "WhatsApp Status",
    tagline: "Short & personal · no hashtags",
    styleGuide:
      "Short, personal and heartfelt or fun, written for friends and family who know you. It should feel like a status, not a public post. No hashtags.",
    captionLabel: "Status",
    // Conservative cap: WhatsApp allows longer text statuses, but photo captions should stay short.
    charLimit: 700,
    countMode: "codepoints",
    hashtagSeparator: "\n\n",
    hashtags: NO_HASHTAGS,
    title: null,
    lengthGuide: {
      short: "a few words, under 40 characters",
      medium: "one sentence, under 100 characters",
      long: "2-3 sentences, under 250 characters",
    },
    bio: {
      limit: 139,
      label: "WhatsApp About",
      guide: "A short, personal status line.",
    },
  },
  snapchat: {
    id: "snapchat",
    name: "Snapchat",
    tagline: "Very short & playful · no hashtags",
    styleGuide:
      "Very short, playful and spontaneous, like the caption bar on a Snap. No hashtags.",
    captionLabel: "Caption",
    charLimit: 250,
    countMode: "codepoints",
    hashtagSeparator: "\n\n",
    hashtags: NO_HASHTAGS,
    title: null,
    lengthGuide: {
      short: "under 30 characters",
      medium: "under 60 characters",
      long: "under 120 characters",
    },
    bio: {
      limit: 150,
      label: "Snapchat bio",
      guide: "Fun, short and casual.",
    },
  },
  pinterest: {
    id: "pinterest",
    name: "Pinterest",
    tagline: "Keyword-rich title + description",
    styleGuide:
      "SEO style: a keyword-rich, descriptive TITLE (max 100 characters) plus a helpful description (the caption text) that naturally includes words people search for: what it is, style, colours, season, ideas. Inspirational and useful, not a personal diary. Hashtags are optional.",
    captionLabel: "Description",
    charLimit: 500,
    countMode: "codepoints",
    hashtagSeparator: "\n\n",
    hashtags: { enabled: true, min: 0, default: 2, max: 3, noun: HASHTAGS },
    title: { limit: 100, label: "Pin title" },
    lengthGuide: {
      short: "one keyword-rich sentence, under 120 characters",
      medium: "2 sentences, about 150-300 characters",
      long: "3-4 sentences, about 300-450 characters (the limit is 500 including hashtags)",
    },
    bio: {
      limit: 160,
      label: "Pinterest profile About",
      guide: "What you pin and why people should follow; natural keywords help.",
    },
  },
};

export const PLATFORM_LIST: PlatformRule[] = PLATFORM_IDS.map((id) => PLATFORMS[id]);

export function getPlatform(id: PlatformId): PlatformRule {
  return PLATFORMS[id];
}

export function isPlatformId(value: unknown): value is PlatformId {
  return typeof value === "string" && (PLATFORM_IDS as readonly string[]).includes(value);
}

/** Clamp a requested hashtag count into the platform's allowed range. */
export function clampHashtagCount(platformId: PlatformId, requested: number): number {
  const rule = PLATFORMS[platformId].hashtags;
  if (!rule.enabled) return 0;
  if (!Number.isFinite(requested)) return rule.default;
  return Math.min(rule.max, Math.max(rule.min, Math.round(requested)));
}
