"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon } from "@/components/icons/Icons";
import { FineTune } from "@/components/create/FineTune";
import { LanguagePicker, PlatformPicker, TonePicker } from "@/components/create/Pickers";
import { PhotoUpload } from "@/components/create/PhotoUpload";
import { Button } from "@/components/ui/Button";
import { CAPTION_TONES, MAX_TONES } from "@/config/tones";
import { withPlatform, type CaptionPrefs } from "@/lib/prefs";
import type { PreparedPhoto } from "@/types";

export const WIZARD_STEPS = [
  { id: "photo", title: "Upload your photo", subtitle: "The AI looks at it to write captions that actually match." },
  { id: "platform", title: "Where are you posting?", subtitle: "Each platform gets its own style and hashtag rules." },
  { id: "tone", title: "Pick your vibe", subtitle: `Choose 1 to ${MAX_TONES} tones. We'll blend them.` },
  { id: "language", title: "Choose a language", subtitle: "Captions are written natively, not translated." },
  { id: "finetune", title: "Fine-tune", subtitle: "All optional. The defaults work great." },
] as const;

export const LAST_STEP = WIZARD_STEPS.length - 1;

/** Steps 1-5 of the caption flow: one step per screen, animated, with a progress bar. */
export function CaptionWizard({
  step,
  direction,
  onStepChange,
  photo,
  onPhotoChange,
  prefs,
  onPrefsChange,
  context,
  onContextChange,
  onGenerate,
}: {
  step: number;
  /** 1 = moving forward, -1 = back. Drives the slide direction. */
  direction: number;
  onStepChange: (step: number) => void;
  photo: PreparedPhoto | null;
  onPhotoChange: (photo: PreparedPhoto | null) => void;
  prefs: CaptionPrefs;
  onPrefsChange: (next: CaptionPrefs) => void;
  context: string;
  onContextChange: (value: string) => void;
  onGenerate: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const current = WIZARD_STEPS[step];
  const canContinue = step !== 0 || photo !== null;
  const isLast = step === LAST_STEP;

  // Move focus to the new step's heading so keyboard and screen reader users follow along.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  function next() {
    if (!canContinue) return;
    if (isLast) onGenerate();
    else onStepChange(step + 1);
  }

  function onKeyDown(event: KeyboardEvent) {
    // Enter = Next, except where Enter already means something (buttons, links, IME composition).
    if (event.key !== "Enter" || event.nativeEvent.isComposing || event.shiftKey) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, textarea")) return;
    event.preventDefault();
    next();
  }

  const patch = (changes: Partial<CaptionPrefs>) => onPrefsChange({ ...prefs, ...changes });

  let body: ReactNode;
  switch (current.id) {
    case "photo":
      body = (
        <PhotoUpload photo={photo} onChange={onPhotoChange} onPicked={() => onStepChange(1)} />
      );
      break;
    case "platform":
      body = <PlatformPicker value={prefs.platform} onChange={(id) => onPrefsChange(withPlatform(prefs, id))} />;
      break;
    case "tone":
      body = <TonePicker tones={CAPTION_TONES} value={prefs.tones} max={MAX_TONES} onChange={(tones) => patch({ tones })} />;
      break;
    case "language":
      body = <LanguagePicker value={prefs.language} onChange={(language) => patch({ language })} />;
      break;
    case "finetune":
      body = <FineTune prefs={prefs} onPrefsChange={patch} context={context} onContextChange={onContextChange} />;
      break;
  }

  return (
    <div onKeyDown={onKeyDown}>
      <StepProgress step={step} />

      <div className="relative mt-6">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.section
            key={current.id}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 40 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            aria-labelledby={`step-${current.id}`}
          >
            <header className="mb-5">
              <h2
                id={`step-${current.id}`}
                ref={headingRef}
                tabIndex={-1}
                className="font-display text-2xl font-extrabold tracking-tight outline-none sm:text-3xl"
              >
                {current.title}
              </h2>
              <p className="mt-1 text-fg-muted">{current.subtitle}</p>
              {current.id === "tone" && (
                <p className="mt-1 text-sm font-semibold text-brand" aria-live="polite">
                  {prefs.tones.length}/{MAX_TONES} selected
                </p>
              )}
            </header>
            {body}
          </motion.section>
        </AnimatePresence>
      </div>

      {/* Sticky on phones so Next is always under the thumb. */}
      <div className="glass sticky bottom-0 z-20 -mx-4 mt-8 flex items-center gap-3 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        {step > 0 && (
          <Button variant="secondary" size="lg" onClick={() => onStepChange(step - 1)} className="px-5">
            <ChevronLeftIcon size={18} /> Back
          </Button>
        )}
        <Button size={isLast ? "xl" : "lg"} onClick={next} disabled={!canContinue} className="ml-auto flex-1 sm:flex-none">
          {isLast ? (
            <>
              <SparklesIcon size={20} /> Generate Captions
            </>
          ) : (
            <>
              Next <ChevronRightIcon size={18} />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function StepProgress({ step }: { step: number }) {
  const percent = ((step + 1) / WIZARD_STEPS.length) * 100;
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs font-semibold text-fg-muted">
        <span>
          Step {step + 1} of {WIZARD_STEPS.length}
        </span>
        <span className="hidden sm:inline">{WIZARD_STEPS[step].title}</span>
      </div>
      <div
        role="progressbar"
        aria-label="Progress"
        aria-valuemin={1}
        aria-valuemax={WIZARD_STEPS.length}
        aria-valuenow={step + 1}
        aria-valuetext={`Step ${step + 1} of ${WIZARD_STEPS.length}`}
        className="h-2 overflow-hidden rounded-full bg-surface-3"
      >
        <motion.div
          className="h-full rounded-full bg-brand-gradient"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />
      </div>
    </div>
  );
}
