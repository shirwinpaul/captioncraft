"use client";

import { motion } from "framer-motion";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { BioStudio } from "@/components/create/BioStudio";
import { CaptionStudio } from "@/components/create/CaptionStudio";
import { ReplyStudio } from "@/components/create/ReplyStudio";
import { ImageIcon, MessageIcon, UserIcon } from "@/components/icons/Icons";
import { cn } from "@/lib/cn";
import { STUDIO_MODES, type StudioMode } from "@/types";

const MODES = STUDIO_MODES;

const TABS: Record<StudioMode, { label: string; icon: ReactNode }> = {
  captions: { label: "Captions", icon: <ImageIcon size={17} /> },
  bio: { label: "Bio", icon: <UserIcon size={17} /> },
  replies: { label: "Comment Replies", icon: <MessageIcon size={17} /> },
};

/**
 * Tabs: Captions | Bio | Comment Replies. All three panels stay mounted
 * (just hidden), so switching tabs never loses a photo, inputs or results.
 */
export function CreateStudio({ initialMode }: { initialMode: StudioMode }) {
  const [mode, setMode] = useState<StudioMode>(initialMode);
  const tabRefs = useRef<Record<StudioMode, HTMLButtonElement | null>>({ captions: null, bio: null, replies: null });

  function select(next: StudioMode, focus = false) {
    setMode(next);
    if (focus) tabRefs.current[next]?.focus();
    // Shareable URL without a navigation.
    const url = next === "captions" ? "/create" : `/create?mode=${next}`;
    window.history.replaceState(null, "", url);
  }

  function onKeyDown(event: KeyboardEvent) {
    const i = MODES.indexOf(mode);
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    if (event.key in moves) {
      event.preventDefault();
      select(MODES[(i + moves[event.key] + MODES.length) % MODES.length], true);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      select(event.key === "Home" ? MODES[0] : MODES[MODES.length - 1], true);
    }
  }

  return (
    <div>
      <div role="tablist" aria-label="What do you want to write?" onKeyDown={onKeyDown} className="glass mb-8 grid grid-cols-3 gap-1 rounded-full p-1 shadow-soft">
        {MODES.map((m) => {
          const selected = m === mode;
          return (
            <button
              key={m}
              ref={(el) => {
                tabRefs.current[m] = el;
              }}
              role="tab"
              id={`tab-${m}`}
              aria-selected={selected}
              aria-controls={`panel-${m}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(m)}
              className={cn(
                "relative flex h-11 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-semibold transition-colors",
                selected ? "text-white" : "text-fg-muted hover:text-fg",
              )}
            >
              {selected && (
                <motion.span
                  layoutId="mode-pill"
                  className="absolute inset-0 rounded-full bg-brand-gradient shadow-glow"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              <span className="relative hidden sm:inline-flex">{TABS[m].icon}</span>
              <span className="relative">
                {m === "replies" ? (
                  <>
                    <span className="sm:hidden">Replies</span>
                    <span className="hidden sm:inline">{TABS[m].label}</span>
                  </>
                ) : (
                  TABS[m].label
                )}
              </span>
            </button>
          );
        })}
      </div>

      {MODES.map((m) => (
        <div key={m} role="tabpanel" id={`panel-${m}`} aria-labelledby={`tab-${m}`} hidden={m !== mode}>
          {m === "captions" ? <CaptionStudio /> : m === "bio" ? <BioStudio /> : <ReplyStudio />}
        </div>
      ))}
    </div>
  );
}
