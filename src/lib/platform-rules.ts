import { PLATFORMS, type CharCountMode, type PlatformId } from "@/config/platforms";

/**
 * Platform rule enforcement shared by the server (validating AI output) and
 * the browser (live character counters). Pure functions, no I/O.
 */

const graphemeSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;

function graphemes(text: string): string[] {
  return graphemeSegmenter ? Array.from(graphemeSegmenter.segment(text), (s) => s.segment) : Array.from(text);
}

const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

/** X counts these code point ranges as 1; everything else (CJK, etc.) as 2. Matches twitter-text v3. */
function xWeight(codePoint: number): number {
  const light =
    (codePoint >= 0 && codePoint <= 4351) ||
    (codePoint >= 8192 && codePoint <= 8205) ||
    (codePoint >= 8208 && codePoint <= 8223) ||
    (codePoint >= 8242 && codePoint <= 8247);
  return light ? 1 : 2;
}

/** Count characters the way the platform does. */
export function countChars(text: string, mode: CharCountMode = "codepoints"): number {
  if (mode === "codepoints") return Array.from(text).length;
  let total = 0;
  for (const cluster of graphemes(text)) {
    // An emoji (even a multi-code-point sequence like 👩‍👩‍👧) counts as 2 on X.
    if (EMOJI.test(cluster)) total += 2;
    else for (const char of cluster) total += xWeight(char.codePointAt(0) ?? 0);
  }
  return total;
}

/** "#Golden Hour!" → "#GoldenHour". Returns null when nothing usable is left. */
export function normalizeHashtag(raw: string): string | null {
  // Letters, marks (needed for Tamil/Devanagari vowel signs), numbers and underscores only.
  const body = raw.replace(/^[#＃\s]+/, "").replace(/[^\p{L}\p{M}\p{N}_]/gu, "");
  if (!body || /^\d+$/.test(body)) return null;
  return `#${body.slice(0, 80)}`;
}

/** Normalize, de-duplicate (case-insensitive) and cap a hashtag list. */
export function cleanHashtags(raw: readonly string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (out.length >= max) break;
    const tag = normalizeHashtag(item);
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    out.push(tag);
  }
  return out;
}

/** The full post as it would be pasted: caption + separator + hashtags. */
export function composePost(platformId: PlatformId, text: string, hashtags: readonly string[]): string {
  const trimmed = text.trim();
  if (hashtags.length === 0) return trimmed;
  return `${trimmed}${PLATFORMS[platformId].hashtagSeparator}${hashtags.join(" ")}`;
}

/** Character count of the full post against the platform's limit. */
export function measurePost(platformId: PlatformId, text: string, hashtags: readonly string[]) {
  const platform = PLATFORMS[platformId];
  const count = countChars(composePost(platformId, text, hashtags), platform.countMode);
  return { count, limit: platform.charLimit, over: platform.charLimit !== null && count > platform.charLimit };
}

/** Max hashtags allowed for a request: the user's choice, never above the platform max. */
export function hashtagCap(platformId: PlatformId, requested: number): number {
  const rule = PLATFORMS[platformId].hashtags;
  if (!rule.enabled) return 0;
  return Math.max(0, Math.min(rule.max, Math.round(requested)));
}

/** Cut text to fit `limit` characters (platform counting), preferring a word boundary, adding "…". */
export function truncateToFit(text: string, limit: number, mode: CharCountMode = "codepoints"): string {
  if (countChars(text, mode) <= limit) return text;
  if (limit <= 1) return "";
  const parts = graphemes(text);
  let out = "";
  for (const part of parts) {
    if (countChars(out + part + "…", mode) > limit) break;
    out += part;
  }
  const lastSpace = out.lastIndexOf(" ");
  // Only back up to a space if that doesn't throw away too much.
  if (lastSpace > out.length * 0.6) out = out.slice(0, lastSpace);
  return `${out.trimEnd()}…`;
}

export interface CaptionDraft {
  text: string;
  hashtags: string[];
  title?: string;
}

/**
 * Check one caption against the platform rules.
 * Returns human-readable problems (fed back to the AI on retry), or [] if fine.
 */
export function findCaptionIssues(platformId: PlatformId, caption: CaptionDraft, index: number): string[] {
  const platform = PLATFORMS[platformId];
  const issues: string[] = [];
  const label = `Caption ${index + 1}`;
  const { count, limit, over } = measurePost(platformId, caption.text, caption.hashtags);
  if (over) issues.push(`${label} is ${count} characters including hashtags; the ${platform.name} limit is ${limit}.`);
  if (platform.title) {
    if (!caption.title?.trim()) issues.push(`${label} is missing a "title".`);
    else if (countChars(caption.title) > platform.title.limit)
      issues.push(`${label} title is longer than ${platform.title.limit} characters.`);
  }
  return issues;
}

/**
 * Last-resort enforcement after the AI's retry also broke a rule: hashtags are
 * dropped first (from the end), then the text is truncated. Guarantees the
 * result is within the limit.
 */
export function enforceCaption(platformId: PlatformId, caption: CaptionDraft): CaptionDraft {
  const platform = PLATFORMS[platformId];
  let { text, hashtags } = caption;
  let title = caption.title?.trim();

  if (platform.title) {
    if (!title) title = truncateToFit(text.split(/(?<=[.!?])\s|\n/)[0] ?? text, platform.title.limit);
    title = truncateToFit(title, platform.title.limit);
  } else {
    title = undefined;
  }

  const limit = platform.charLimit;
  if (limit !== null) {
    while (hashtags.length > 0 && measurePost(platformId, text, hashtags).over) hashtags = hashtags.slice(0, -1);
    if (measurePost(platformId, text, hashtags).over) text = truncateToFit(text, limit, platform.countMode);
  }
  return { text, hashtags, ...(title ? { title } : {}) };
}
