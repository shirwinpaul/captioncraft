"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SparklesIcon } from "@/components/icons/Icons";
import { Button } from "@/components/ui/Button";

const PHOTO_MESSAGES = [
  "Reading your photo's vibe…",
  "Spotting colours, light and mood…",
  "Finding the perfect words…",
  "Sprinkling in some personality…",
  "Picking hashtags that fit…",
  "Almost there…",
];

const TEXT_MESSAGES = ["Getting the vibe…", "Finding the perfect words…", "Polishing every line…", "Almost there…"];

/** Loading screen while the AI works: scanning photo (if any) + rotating fun messages. */
export function GeneratingAnimation({ photoUrl, onCancel }: { photoUrl?: string; onCancel?: () => void }) {
  const messages = photoUrl ? PHOTO_MESSAGES : TEXT_MESSAGES;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((i) => Math.min(i + 1, messages.length - 1)), 2600);
    return () => window.clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center py-8 text-center" role="status" aria-live="polite">
      {photoUrl ? (
        <div className="relative w-56 overflow-hidden rounded-3xl border border-border shadow-soft sm:w-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt="" className="aspect-square w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-fuchsia-500/10 to-transparent" />
          <span
            aria-hidden="true"
            className="absolute inset-x-0 h-1 animate-scan bg-brand-gradient shadow-[0_0_24px_6px_rgb(219_39_119/0.55)]"
          />
        </div>
      ) : (
        <motion.span
          animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="inline-flex size-20 items-center justify-center rounded-3xl bg-brand-gradient text-white shadow-glow"
        >
          <SparklesIcon size={36} />
        </motion.span>
      )}

      <div className="mt-8 h-8">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="font-display text-xl font-bold"
          >
            {messages[index]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="size-2.5 rounded-full bg-brand"
            animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.15 }}
          />
        ))}
      </div>
      <p className="mt-6 text-sm text-fg-muted">This usually takes 5–15 seconds.</p>
      {onCancel && (
        <Button variant="ghost" size="sm" className="mt-3" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
  );
}
