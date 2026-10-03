"use client";

import { useId } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { Toggle } from "@/components/ui/Toggle";
import { PLATFORMS } from "@/config/platforms";
import { cn } from "@/lib/cn";
import type { CaptionPrefs } from "@/lib/prefs";
import { HASHTAG_STYLES, type HashtagStyle } from "@/types";

export const CONTEXT_MAX_LENGTH = 150;

const STYLE_LABELS: Record<HashtagStyle, { label: string; hint: string }> = {
  popular: { label: "Popular", hint: "broad, widely used" },
  niche: { label: "Niche", hint: "specific to the photo" },
  trending: { label: "Trending-style", hint: "commonly used for this topic" },
};

/** Step 5: optional extras. Everything has a sensible default. */
export function FineTune({
  prefs,
  onPrefsChange,
  context,
  onContextChange,
}: {
  prefs: CaptionPrefs;
  onPrefsChange: (patch: Partial<CaptionPrefs>) => void;
  context: string;
  onContextChange: (value: string) => void;
}) {
  const contextId = useId();
  const sliderId = useId();
  const platform = PLATFORMS[prefs.platform];
  const tags = platform.hashtags;

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor={contextId} className="mb-2 block font-semibold">
          Add context <span className="font-normal text-fg-muted">(optional)</span>
        </label>
        <input
          id={contextId}
          type="text"
          value={context}
          maxLength={CONTEXT_MAX_LENGTH}
          onChange={(event) => onContextChange(event.target.value)}
          placeholder="e.g. my birthday trip to Ooty"
          autoComplete="off"
          className="h-12 w-full rounded-2xl border border-border-strong bg-surface px-4 text-base placeholder:text-fg-subtle focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <p className="mt-1.5 text-right text-xs text-fg-muted" aria-live="polite">
          {context.length}/{CONTEXT_MAX_LENGTH}
        </p>
      </div>

      <Toggle
        checked={prefs.emoji}
        onChange={(emoji) => onPrefsChange({ emoji })}
        label="Emojis"
        description={prefs.emoji ? "Sprinkle in a few that fit the vibe 🎉" : "Plain text, no emojis"}
      />

      <Segmented
        name="length"
        label="Caption length"
        value={prefs.length}
        onChange={(length) => onPrefsChange({ length })}
        options={[
          { value: "short", label: "Short" },
          { value: "medium", label: "Medium" },
          { value: "long", label: "Long" },
        ]}
      />

      {tags.enabled ? (
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <label htmlFor={sliderId} className="font-semibold">
                Number of {tags.noun.many}
              </label>
              <span className="font-display text-xl font-bold text-brand">{prefs.hashtagCount}</span>
            </div>
            <input
              id={sliderId}
              type="range"
              min={tags.min}
              max={tags.max}
              step={1}
              value={prefs.hashtagCount}
              onChange={(event) => onPrefsChange({ hashtagCount: Number(event.target.value) })}
              aria-valuetext={`${prefs.hashtagCount} ${prefs.hashtagCount === 1 ? tags.noun.one : tags.noun.many}`}
              className="h-2 w-full cursor-pointer"
              disabled={tags.max === tags.min}
            />
            <p className="mt-1.5 text-xs text-fg-muted">
              {platform.name} allows {tags.min}–{tags.max} {tags.noun.many}.
            </p>
          </div>

          <fieldset disabled={prefs.hashtagCount === 0}>
            <legend className="mb-2 font-semibold">Hashtag style</legend>
            <div className="flex flex-wrap gap-2">
              {HASHTAG_STYLES.map((style) => {
                const selected = prefs.hashtagStyles.includes(style);
                return (
                  <label key={style} className="relative">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        onPrefsChange({
                          hashtagStyles: selected
                            ? prefs.hashtagStyles.filter((s) => s !== style)
                            : [...prefs.hashtagStyles, style],
                        })
                      }
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        "inline-flex min-h-11 cursor-pointer flex-col justify-center rounded-2xl border px-3.5 py-1.5 text-sm transition-colors",
                        "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                        "peer-disabled:cursor-not-allowed peer-disabled:opacity-45",
                        selected ? "border-brand bg-brand-soft text-brand-soft-fg" : "border-border bg-surface",
                      )}
                    >
                      <span className="font-semibold">{STYLE_LABELS[style].label}</span>
                      <span className="text-xs opacity-80">{STYLE_LABELS[style].hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-fg-muted">
              The AI can&apos;t see live trends, so “trending-style” means tags commonly used for this kind of photo.
            </p>
          </fieldset>
        </div>
      ) : (
        <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-fg-muted">
          {platform.name} doesn&apos;t use hashtags, so we&apos;ll skip them.
        </p>
      )}
    </div>
  );
}
