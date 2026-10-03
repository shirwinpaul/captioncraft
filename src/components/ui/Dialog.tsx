"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "@/components/icons/Icons";
import { IconButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/**
 * Modal built on the native <dialog> element, which gives us focus trapping,
 * Esc-to-close and an inert background for free.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Sync the `open` prop with the imperative dialog API.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onClick={(event) => {
        // A click on the dialog element itself (not its content) is a click on the backdrop.
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "m-auto max-h-[min(90dvh,760px)] w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-3xl border border-border bg-surface p-0 text-fg shadow-2xl",
        "open:animate-dialog-in",
        className,
      )}
    >
      <div className="flex max-h-[min(90dvh,760px)] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="font-display text-xl font-bold">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-fg-muted">
                {description}
              </p>
            )}
          </div>
          <IconButton aria-label="Close" onClick={onClose} className="-mr-2 -mt-1">
            <CloseIcon />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </dialog>
  );
}
