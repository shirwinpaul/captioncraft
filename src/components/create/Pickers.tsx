"use client";

import { motion } from "framer-motion";
import { CheckIcon } from "@/components/icons/Icons";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import { LANGUAGE_LIST, type LanguageId } from "@/config/languages";
import { PLATFORM_LIST, type PlatformId } from "@/config/platforms";
import type { Tone } from "@/config/tones";
import { cn } from "@/lib/cn";

/*
 * Choice pickers shared by the caption wizard and the Bio / Reply modes.
 * They are native radio / checkbox inputs underneath, so keyboard and screen
 * reader support comes for free; the visuals live on the sibling <span>.
 */

const FOCUS_RING = "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring";

export function PlatformPicker({
  value,
  onChange,
  name = "platform",
  legend = "Platform",
}: {
  value: PlatformId;
  onChange: (id: PlatformId) => void;
  name?: string;
  legend?: string;
}) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 lg:grid-cols-3">
        {PLATFORM_LIST.map((platform) => {
          const selected = platform.id === value;
          return (
            <label key={platform.id} className="relative">
              <input
                type="radio"
                name={name}
                value={platform.id}
                checked={selected}
                onChange={() => onChange(platform.id)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex h-full cursor-pointer items-center gap-3 rounded-2xl border bg-surface p-3.5 transition-[border-color,box-shadow,transform] active:scale-[0.98]",
                  selected ? "border-brand shadow-soft ring-1 ring-brand" : "border-border hover:border-border-strong",
                  FOCUS_RING,
                )}
              >
                <PlatformIcon id={platform.id} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{platform.name}</span>
                  <span className="block text-xs text-fg-muted">{platform.tagline}</span>
                </span>
                <SelectedDot selected={selected} />
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function TonePicker<T extends string>({
  tones,
  value,
  onChange,
  max,
  legend = "Tone",
}: {
  tones: readonly (Tone & { id: T })[];
  value: readonly T[];
  onChange: (ids: T[]) => void;
  max: number;
  legend?: string;
}) {
  const full = value.length >= max;
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {tones.map((tone) => {
          const selected = value.includes(tone.id);
          // Single-choice mode (max 1): picking a new tone replaces the old one.
          const disabled = !selected && full && max > 1;
          return (
            <label key={tone.id} className="relative">
              <input
                type="checkbox"
                checked={selected}
                disabled={disabled}
                onChange={() => {
                  if (selected) {
                    if (value.length > 1) onChange(value.filter((id) => id !== tone.id));
                  } else {
                    onChange(max === 1 ? [tone.id] : [...value, tone.id]);
                  }
                }}
                className="peer sr-only"
              />
              <motion.span
                animate={{ scale: selected ? [1, 1.12, 1] : 1 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors",
                  selected
                    ? "border-transparent bg-brand-gradient text-white shadow-glow"
                    : "border-border bg-surface text-fg hover:border-border-strong",
                  disabled && "cursor-not-allowed opacity-45",
                  FOCUS_RING,
                )}
              >
                <span aria-hidden="true">{tone.emoji}</span> {tone.label}
              </motion.span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function LanguagePicker({
  value,
  onChange,
  name = "language",
}: {
  value: LanguageId;
  onChange: (id: LanguageId) => void;
  name?: string;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Language</legend>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {LANGUAGE_LIST.map((language) => {
          const selected = language.id === value;
          return (
            <label key={language.id} className="relative">
              <input
                type="radio"
                name={name}
                value={language.id}
                checked={selected}
                onChange={() => onChange(language.id)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex h-full cursor-pointer items-start gap-3 rounded-2xl border bg-surface p-4 transition-[border-color,box-shadow] active:scale-[0.98]",
                  selected ? "border-brand shadow-soft ring-1 ring-brand" : "border-border hover:border-border-strong",
                  FOCUS_RING,
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">
                    {language.label}
                    {language.native !== language.label && (
                      <span className="ml-2 text-sm font-normal text-fg-muted">{language.native}</span>
                    )}
                  </span>
                  <span lang={language.htmlLang} className="mt-1 block text-sm italic text-fg-muted">
                    “{language.sample}”
                  </span>
                </span>
                <SelectedDot selected={selected} />
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function SelectedDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
        selected ? "border-transparent bg-brand-gradient text-white" : "border-border-strong",
      )}
    >
      {selected && <CheckIcon size={14} />}
    </span>
  );
}
