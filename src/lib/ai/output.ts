import { PLATFORMS } from "@/config/platforms";
import { extractJson, type ParseOutcome } from "@/lib/ai/fallback";
import {
  cleanHashtags,
  countChars,
  enforceCaption,
  findCaptionIssues,
  hashtagCap,
  measurePost,
  truncateToFit,
} from "@/lib/platform-rules";
import {
  bioOutputSchema,
  captionOutputSchema,
  replyOutputSchema,
  type GenerateRequest,
  type GenerationResult,
  type ResultItem,
} from "@/lib/schemas";

/**
 * Turn raw model text into a validated GenerationResult.
 * JSON or schema problems → { ok: false } (the caller retries / falls back).
 * Platform-rule problems → { ok: false } on the first try, repaired on the final try.
 */

export const DEGRADED_VIBE = "Photo analysis is temporarily unavailable, so these captions are based on your context.";

let counter = 0;
function newId(): string {
  counter = (counter + 1) % 1_000_000;
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `r${Date.now()}-${counter}`;
}

function zodMessage(issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>): string {
  return issues
    .slice(0, 5)
    .map((i) => `${i.path.map(String).join(".") || "root"}: ${i.message}`)
    .join("; ");
}

export function parseGeneration(
  req: GenerateRequest,
  raw: string,
  options: { count: number; final: boolean; degraded: boolean },
): ParseOutcome<GenerationResult> {
  let json: unknown;
  try {
    json = extractJson(raw);
  } catch {
    return { ok: false, error: "The response was not valid JSON." };
  }

  switch (req.mode) {
    case "captions": {
      const parsed = captionOutputSchema(options.count).safeParse(json);
      if (!parsed.success) return { ok: false, error: zodMessage(parsed.error.issues) };
      const platform = PLATFORMS[req.platform];
      const cap = hashtagCap(req.platform, req.hashtagCount);
      const issues: string[] = [];

      const items: ResultItem[] = parsed.data.captions.map((c, index) => {
        let draft = {
          text: c.text,
          // Extra tags are trimmed silently; Instagram can never exceed 5 because cap ≤ platform max.
          hashtags: cleanHashtags(c.hashtags, cap),
          title: platform.title ? c.title : undefined,
        };
        const found = findCaptionIssues(req.platform, draft, index);
        if (found.length) {
          if (options.final) draft = { ...draft, ...enforceCaption(req.platform, draft) };
          else issues.push(...found);
        }
        return {
          id: newId(),
          text: draft.text,
          hashtags: draft.hashtags,
          ...(draft.title ? { title: draft.title } : {}),
          tone: c.tone,
          charCount: measurePost(req.platform, draft.text, draft.hashtags).count,
        };
      });

      if (issues.length) return { ok: false, error: issues.join(" ") };
      return {
        ok: true,
        value: { mode: "captions", items, photoVibe: options.degraded ? DEGRADED_VIBE : parsed.data.photoVibe },
      };
    }

    case "bio": {
      const parsed = bioOutputSchema(options.count).safeParse(json);
      if (!parsed.success) return { ok: false, error: zodMessage(parsed.error.issues) };
      const limit = PLATFORMS[req.platform].bio.limit;
      const issues: string[] = [];
      const items: ResultItem[] = parsed.data.bios.map((b, index) => {
        let text = b.text;
        if (countChars(text) > limit) {
          if (options.final) text = truncateToFit(text, limit);
          else issues.push(`Bio ${index + 1} is ${countChars(text)} characters; the limit is ${limit}.`);
        }
        return { id: newId(), text, hashtags: [], tone: b.tone, charCount: countChars(text) };
      });
      if (issues.length) return { ok: false, error: issues.join(" ") };
      return { ok: true, value: { mode: "bio", items } };
    }

    case "reply": {
      const parsed = replyOutputSchema(options.count).safeParse(json);
      if (!parsed.success) return { ok: false, error: zodMessage(parsed.error.issues) };
      const items: ResultItem[] = parsed.data.replies.map((r) => ({
        id: newId(),
        text: r.text,
        hashtags: [],
        tone: r.tone,
        charCount: countChars(r.text),
      }));
      return {
        ok: true,
        value: {
          mode: "reply",
          items,
          note: parsed.data.abusive
            ? "This comment looks hurtful. You never owe anyone a reply: hiding, restricting or reporting it is always OK."
            : undefined,
        },
      };
    }
  }
}
