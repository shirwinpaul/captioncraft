"use client";

import { cn } from "@/lib/cn";

/** A small single-choice control built from native radio buttons (arrow keys work for free). */
export function Segmented<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string;
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">{label}</legend>
      <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-full bg-surface-2 p-1">
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex h-10 cursor-pointer items-center justify-center rounded-full text-sm font-semibold transition-colors",
                "text-fg-muted peer-checked:bg-surface peer-checked:text-fg peer-checked:shadow-sm",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
