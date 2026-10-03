import type { ReactNode } from "react";
import type { PlatformId } from "@/config/platforms";
import { cn } from "@/lib/cn";

/**
 * ORIGINAL, generic glyphs that hint at each platform without using any
 * official logo or brand mark (camera, briefcase, pushpin, ...).
 */
const GLYPHS: Record<PlatformId, ReactNode> = {
  // Camera with a sparkle: "photo-first" sharing.
  instagram: (
    <>
      <path d="M3 9a2 2 0 0 1 2-2h2.5L9 5h6l1.5 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.5" />
      <path d="M18 10.2h.01" />
    </>
  ),
  // Friends & family.
  facebook: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.2A6.5 6.5 0 0 1 21.5 20" />
    </>
  ),
  // Megaphone: short, loud posts.
  x: (
    <>
      <path d="m3 10.5 14-6v15l-14-6z" />
      <path d="M7 14.3V17a2 2 0 0 0 4 0v-1" />
      <path d="M20 9.5v5" />
    </>
  ),
  // Briefcase: work life.
  linkedin: (
    <>
      <rect x="2.5" y="7" width="19" height="13" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2.5 13h19M11 13v1.5h2V13" />
    </>
  ),
  // A spool of thread.
  threads: (
    <>
      <path d="M5.5 3.5h11M5.5 20.5h11" />
      <rect x="7" y="5.5" width="8" height="13" rx="1" />
      <path d="M7 9.5l8 1.5M7 13.5l8 1.5" />
      <path d="M15 17.5c2.5 0 4.5.8 4.5 3" />
    </>
  ),
  // Video camera.
  youtube: (
    <>
      <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
      <path d="m15.5 10.5 6-3.5v10l-6-3.5z" />
    </>
  ),
  // Segmented "status" ring around an avatar dot.
  whatsapp: (
    <>
      <circle cx="12" cy="12" r="9" strokeDasharray="10.1 4.04" transform="rotate(-80 12 12)" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  // Stopwatch: moments that disappear.
  snapchat: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 10v3.5l2.5 2M10 2.5h4M12 2.5V6M18.5 6.5l1.5-1.5" />
    </>
  ),
  // Pushpin: saving ideas.
  pinterest: (
    <>
      <path d="M9 3h6l-1 6.5 3 3V15H7v-2.5l3-3z" />
      <path d="M12 15v6" />
    </>
  ),
};

/** Per-platform tint from the app's own palette (deliberately not brand colours). */
const TINTS: Record<PlatformId, string> = {
  instagram: "from-fuchsia-500/20 to-orange-400/20 text-fuchsia-700 dark:text-fuchsia-300",
  facebook: "from-indigo-500/20 to-violet-400/20 text-indigo-700 dark:text-indigo-300",
  x: "from-slate-500/20 to-violet-500/20 text-slate-800 dark:text-slate-200",
  linkedin: "from-sky-500/20 to-indigo-400/20 text-sky-800 dark:text-sky-300",
  threads: "from-violet-500/20 to-pink-400/20 text-violet-700 dark:text-violet-300",
  youtube: "from-rose-500/20 to-orange-400/20 text-rose-700 dark:text-rose-300",
  whatsapp: "from-emerald-500/20 to-teal-400/20 text-emerald-800 dark:text-emerald-300",
  snapchat: "from-amber-400/25 to-orange-400/20 text-amber-800 dark:text-amber-300",
  pinterest: "from-pink-500/20 to-rose-400/20 text-pink-700 dark:text-pink-300",
};

export function PlatformGlyph({ id, size = 22, className }: { id: PlatformId; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {GLYPHS[id]}
    </svg>
  );
}

/** Glyph inside a soft gradient tile. */
export function PlatformIcon({
  id,
  size = "md",
  className,
}: {
  id: PlatformId;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = size === "sm" ? "size-8 rounded-lg" : size === "lg" ? "size-14 rounded-2xl" : "size-11 rounded-xl";
  const glyph = size === "sm" ? 16 : size === "lg" ? 28 : 22;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-linear-to-br",
        box,
        TINTS[id],
        className,
      )}
    >
      <PlatformGlyph id={id} size={glyph} />
    </span>
  );
}
