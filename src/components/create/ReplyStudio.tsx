"use client";

import { useId, useState } from "react";
import { FormSection, ModeShell, PlatformChips } from "@/components/create/ModeShell";
import { LanguagePicker, TonePicker } from "@/components/create/Pickers";
import { ChevronRightIcon, SparklesIcon } from "@/components/icons/Icons";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { ALL_TONES, MAX_TONES, QUICK_REPLY_TONE_IDS, describeTones, type Tone, type ToneId } from "@/config/tones";
import { useStore } from "@/hooks/useStore";
import { cn } from "@/lib/cn";
import { replyPrefsStore, type ReplyPrefs } from "@/lib/prefs";
import { COMMENT_MAX } from "@/lib/schemas";

const TONES = ALL_TONES as readonly (Tone & { id: ToneId })[];
const QUICK = TONES.filter((t) => QUICK_REPLY_TONE_IDS.includes(t.id));
const OTHERS = TONES.filter((t) => !QUICK_REPLY_TONE_IDS.includes(t.id));

/** Comment Reply Generator: paste a comment → 5 safe reply options. */
export function ReplyStudio() {
  const prefs = useStore(replyPrefsStore);
  const [comment, setComment] = useState("");
  const [showMore, setShowMore] = useState(false);
  // Always show the full list if a saved tone isn't in the quick row, so it's never hidden.
  const forced = prefs.tones.some((id) => !QUICK_REPLY_TONE_IDS.includes(id));
  const moreTones = showMore || forced;
  const commentId = useId();
  const patch = (changes: Partial<ReplyPrefs>) => replyPrefsStore.set({ ...prefs, ...changes });
  const canSubmit = comment.trim().length > 0;

  return (
    <ModeShell
      ctx={{ mode: "reply" }}
      resultsTitle="Reply ideas"
      renderForm={(submit) => (
        <form
          className="space-y-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) return;
            submit(
              {
                mode: "reply",
                platform: prefs.platform,
                tones: prefs.tones,
                language: prefs.language,
                emoji: prefs.emoji,
                comment: comment.trim(),
              },
              { platform: prefs.platform, language: prefs.language, toneLabel: describeTones(prefs.tones) },
            );
          }}
        >
          <header>
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Comment Replies</h2>
            <p className="mt-1 text-fg-muted">Paste a comment you got and pick a vibe. We&apos;ll suggest 5 replies.</p>
          </header>

          <FormSection title="The comment">
            <label htmlFor={commentId} className="sr-only">
              Comment you received
            </label>
            <textarea
              id={commentId}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={COMMENT_MAX}
              rows={3}
              required
              placeholder="e.g. Wow, where is this place? Looks unreal 😍"
              className="w-full resize-y rounded-2xl border border-border-strong bg-surface px-4 py-3 text-base placeholder:text-fg-subtle focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <p className="text-right text-xs text-fg-muted">
              {comment.length}/{COMMENT_MAX}
            </p>
          </FormSection>

          <FormSection title="Reply tone" hint={`Quick picks, or open more tones. Up to ${MAX_TONES}.`}>
            <TonePicker
              legend="Quick reply tones"
              tones={moreTones ? [...QUICK, ...OTHERS] : QUICK}
              value={prefs.tones}
              max={MAX_TONES}
              onChange={(tones) => patch({ tones })}
            />
            {!forced && (
            <button
              type="button"
              onClick={() => setShowMore(!moreTones)}
              aria-expanded={moreTones}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
            >
              {moreTones ? "Fewer tones" : "More tones"}
              <ChevronRightIcon size={16} className={cn("transition-transform", moreTones && "rotate-90")} />
            </button>
            )}
          </FormSection>

          <FormSection title="Language">
            <LanguagePicker name="reply-language" value={prefs.language} onChange={(language) => patch({ language })} />
          </FormSection>

          <FormSection title="Where was it posted?">
            <PlatformChips name="reply-platform" value={prefs.platform} onChange={(platform) => patch({ platform })} />
          </FormSection>

          <Toggle checked={prefs.emoji} onChange={(emoji) => patch({ emoji })} label="Emojis" />

          <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-fg-muted">
            We never write abusive replies. If a comment is hurtful, you&apos;ll get calm options, including not replying at all.
          </p>

          <Button type="submit" size="xl" className="w-full" disabled={!canSubmit}>
            <SparklesIcon size={20} /> Generate Replies
          </Button>
        </form>
      )}
    />
  );
}
