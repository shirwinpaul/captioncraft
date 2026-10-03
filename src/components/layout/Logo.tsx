import { cn } from "@/lib/cn";

/** Original CaptionCraft mark: a speech bubble with a sparkle, filled with the brand gradient. */
export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M7 3.5h18a4.5 4.5 0 0 1 4.5 4.5v11.5a4.5 4.5 0 0 1-4.5 4.5H15l-6.2 4.8a.6.6 0 0 1-1-.5v-4.3H7a4.5 4.5 0 0 1-4.5-4.5V8A4.5 4.5 0 0 1 7 3.5z"
        fill="url(#cc-brand-gradient)"
      />
      <path d="M16 7.6l1.7 4.4 4.4 1.7-4.4 1.7-1.7 4.4-1.7-4.4-4.4-1.7 4.4-1.7z" fill="#fff" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-display text-lg font-extrabold tracking-tight">
        Caption<span className="text-gradient">Craft</span>
      </span>
    </span>
  );
}

/** Shared SVG gradient definitions, rendered once in the root layout. */
export function SvgDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" className="pointer-events-none absolute">
      <defs>
        <linearGradient id="cc-brand-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="55%" stopColor="#db2777" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
    </svg>
  );
}
