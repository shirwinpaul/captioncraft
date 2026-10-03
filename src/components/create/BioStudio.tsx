"use client";

import { useId, useState } from "react";
import { FormSection, ModeShell, PlatformChips } from "@/components/create/ModeShell";
import { LanguagePicker, TonePicker } from "@/components/create/Pickers";
import { PhotoUpload } from "@/components/create/PhotoUpload";
import { SparklesIcon } from "@/components/icons/Icons";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { PLATFORMS } from "@/config/platforms";
import { CAPTION_TONES, MAX_TONES, describeTones } from "@/config/tones";
import { useStore } from "@/hooks/useStore";
import { bioPrefsStore, type BioPrefs } from "@/lib/prefs";
import { ABOUT_MAX } from "@/lib/schemas";
import type { PreparedPhoto } from "@/types";

/** Bio Generator: platform, "about you", tone, language, emoji, optional photo → 5 bios within the limit. */
export function BioStudio() {
  const prefs = useStore(bioPrefsStore);
  const [about, setAbout] = useState("");
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [showPhoto, setShowPhoto] = useState(false);
  const aboutId = useId();
  const patch = (changes: Partial<BioPrefs>) => bioPrefsStore.set({ ...prefs, ...changes });
  const canSubmit = about.trim().length >= 2;

  return (
    <ModeShell
      ctx={{ mode: "bio" }}
      resultsTitle={`Your ${PLATFORMS[prefs.platform].bio.label}s`}
      renderForm={(submit) => (
        <form
          className="space-y-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) return;
            submit(
              {
                mode: "bio",
                platform: prefs.platform,
                tones: prefs.tones,
                language: prefs.language,
                emoji: prefs.emoji,
                about: about.trim(),
                ...(photo ? { image: photo.dataUrl } : {}),
              },
              { platform: prefs.platform, language: prefs.language, toneLabel: describeTones(prefs.tones) },
            );
          }}
        >
          <header>
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Bio Generator</h2>
            <p className="mt-1 text-fg-muted">Five fresh bios that fit your platform&apos;s character limit.</p>
          </header>

          <FormSection title="Platform">
            <PlatformChips
              name="bio-platform"
              value={prefs.platform}
              onChange={(platform) => patch({ platform })}
              describe={(id) => `max ${PLATFORMS[id].bio.limit} chars`}
            />
          </FormSection>

          <FormSection title="About you" hint="Name, what you do, what you love. A few words is enough.">
            <label htmlFor={aboutId} className="sr-only">
              About you
            </label>
            <textarea
              id={aboutId}
              value={about}
              onChange={(event) => setAbout(event.target.value)}
              maxLength={ABOUT_MAX}
              rows={3}
              required
              placeholder="e.g. Priya, UX designer in Chennai, loves filter coffee, street photography and cats"
              className="w-full resize-y rounded-2xl border border-border-strong bg-surface px-4 py-3 text-base placeholder:text-fg-subtle focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <p className="text-right text-xs text-fg-muted">
              {about.length}/{ABOUT_MAX}
            </p>
          </FormSection>

          <FormSection title="Tone" hint={`Pick 1 to ${MAX_TONES}.`}>
            <TonePicker tones={CAPTION_TONES} value={prefs.tones} max={MAX_TONES} onChange={(tones) => patch({ tones })} />
          </FormSection>

          <FormSection title="Language">
            <LanguagePicker name="bio-language" value={prefs.language} onChange={(language) => patch({ language })} />
          </FormSection>

          <Toggle checked={prefs.emoji} onChange={(emoji) => patch({ emoji })} label="Emojis" />

          <FormSection title="Photo (optional)" hint="A profile picture can inspire the vibe. The AI never identifies anyone.">
            {showPhoto || photo ? (
              <PhotoUpload photo={photo} onChange={setPhoto} />
            ) : (
              <Button variant="secondary" onClick={() => setShowPhoto(true)}>
                Add a photo
              </Button>
            )}
          </FormSection>

          <Button type="submit" size="xl" className="w-full" disabled={!canSubmit}>
            <SparklesIcon size={20} /> Generate Bios
          </Button>
        </form>
      )}
    />
  );
}
