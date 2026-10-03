"use client";

import { useState } from "react";
import { CaptionWizard } from "@/components/create/CaptionWizard";
import { ErrorPanel } from "@/components/create/ErrorPanel";
import { GeneratingAnimation } from "@/components/create/GeneratingAnimation";
import { CameraIcon, PencilIcon, RefreshIcon } from "@/components/icons/Icons";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import { Notices, ResultsActions } from "@/components/results/ResultsHeader";
import { ResultsList, type ListedItem } from "@/components/results/ResultsList";
import { Button } from "@/components/ui/Button";
import { LANGUAGES } from "@/config/languages";
import { PLATFORMS } from "@/config/platforms";
import { describeTones } from "@/config/tones";
import { useGeneration } from "@/hooks/useGeneration";
import { useStore } from "@/hooks/useStore";
import { celebrateOnce } from "@/lib/celebrate";
import { captionPrefsStore, type CaptionPrefs } from "@/lib/prefs";
import type { CaptionRequest, ResultItem } from "@/lib/schemas";
import type { PreparedPhoto } from "@/types";

export function buildCaptionRequest(
  photo: PreparedPhoto,
  prefs: CaptionPrefs,
  context: string,
  variationOf?: CaptionRequest["variationOf"],
) {
  return {
    mode: "captions" as const,
    image: photo.dataUrl,
    platform: prefs.platform,
    tones: prefs.tones,
    language: prefs.language,
    emoji: prefs.emoji,
    length: prefs.length,
    hashtagCount: prefs.hashtagCount,
    hashtagStyles: prefs.hashtagStyles,
    context: context.trim(),
    variationOf,
  };
}

/** Caption mode: owns the photo (memory only), the wizard position and the generation flow. */
export function CaptionStudio() {
  const prefs = useStore(captionPrefsStore);
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [context, setContext] = useState("");
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const { state, run, cancel, reset } = useGeneration();
  const [items, setItems] = useState<ListedItem[]>([]);
  // The settings the current results were made with (prefs may change afterwards).
  const [usedPrefs, setUsedPrefs] = useState<CaptionPrefs>(prefs);
  const [usedContext, setUsedContext] = useState("");

  function goTo(next: number) {
    setDirection(next >= step ? 1 : -1);
    setStep(next);
  }

  async function generate() {
    if (!photo) return goTo(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const snapshot = prefs;
    const ctx = context;
    const outcome = await run(buildCaptionRequest(photo, snapshot, ctx));
    if (outcome) {
      setUsedPrefs(snapshot);
      setUsedContext(ctx);
      setItems(outcome.result.items);
      void celebrateOnce();
    }
  }

  function changeOptions() {
    reset();
    setDirection(-1);
    setStep(1);
  }

  function newPhoto() {
    reset();
    setPhoto(null);
    setItems([]);
    setDirection(-1);
    setStep(0);
  }

  if (state.status === "loading") return <GeneratingAnimation photoUrl={photo?.dataUrl} onCancel={cancel} />;

  if (state.status === "error") {
    return (
      <ErrorPanel
        code={state.code}
        message={state.message}
        onRetry={generate}
        onBack={state.code === "safety" ? newPhoto : changeOptions}
        backLabel={state.code === "safety" ? "Choose another photo" : "Change options"}
      />
    );
  }

  if (state.status === "success" && photo) {
    const platform = PLATFORMS[usedPrefs.platform];
    const toneLabel = describeTones(usedPrefs.tones);
    return (
      <div className="space-y-5">
        <section className="flex items-center gap-4 rounded-3xl border border-border bg-surface p-3 shadow-soft sm:p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.dataUrl} alt="Your photo" className="size-20 shrink-0 rounded-2xl object-cover sm:size-24" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">AI sees</p>
            <p className="mt-0.5 font-medium">{state.result.photoVibe}</p>
            <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-fg-muted">
              <PlatformIcon id={platform.id} size="sm" className="size-6 rounded-md" /> {platform.name} · {toneLabel} ·{" "}
              {LANGUAGES[usedPrefs.language].label}
            </p>
          </div>
        </section>

        <h2 className="sr-only">Your captions</h2>
        <Notices notices={state.meta.notices} />

        <ResultsList
          items={items}
          onItemsChange={setItems}
          ctx={{ mode: "captions", platform: usedPrefs.platform, language: usedPrefs.language, toneLabel }}
          variationRequest={(item: ResultItem) =>
            buildCaptionRequest(photo, usedPrefs, usedContext, { text: item.text, hashtags: item.hashtags, title: item.title })
          }
        />

        <ResultsActions>
          <Button onClick={generate}>
            <RefreshIcon size={17} /> Regenerate all
          </Button>
          <Button variant="secondary" onClick={changeOptions}>
            <PencilIcon size={17} /> Change options
          </Button>
          <Button variant="secondary" onClick={newPhoto}>
            <CameraIcon size={17} /> New photo
          </Button>
        </ResultsActions>
      </div>
    );
  }

  return (
    <CaptionWizard
      step={step}
      direction={direction}
      onStepChange={goTo}
      photo={photo}
      onPhotoChange={(next) => {
        setPhoto(next);
        if (!next) goTo(0);
      }}
      prefs={prefs}
      onPrefsChange={captionPrefsStore.set}
      context={context}
      onContextChange={setContext}
      onGenerate={generate}
    />
  );
}
