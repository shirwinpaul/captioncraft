"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState, type DragEvent } from "react";
import { AlertIcon, CameraIcon, ImageIcon, ShieldIcon, TrashIcon, UploadIcon } from "@/components/icons/Icons";
import { Button } from "@/components/ui/Button";
import { SITE } from "@/config/site";
import { cn } from "@/lib/cn";
import { ACCEPT_ATTRIBUTE, ImageProcessingError, prepareImage } from "@/lib/image";
import type { PreparedPhoto } from "@/types";

/** Step 1: drag & drop, file picker or phone camera → converted, resized preview. */
export function PhotoUpload({
  photo,
  onChange,
  onPicked,
}: {
  photo: PreparedPhoto | null;
  onChange: (photo: PreparedPhoto | null) => void;
  /** Called after a new photo is ready (the wizard uses it to move on). */
  onPicked?: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file || busy) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await prepareImage(file));
      onPicked?.();
    } catch (err) {
      setError(err instanceof ImageProcessingError ? err.message : "Something went wrong reading that photo. Please try another.");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    void handleFile(event.dataTransfer.files[0]);
  }

  const inputs = (
    <>
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = ""; // allow picking the same file again
        }}
      />
      {/* `capture` opens the camera directly on phones; desktops just show a file picker. */}
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </>
  );

  return (
    <div className="space-y-4">
      {inputs}
      <AnimatePresence mode="wait" initial={false}>
        {photo ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="overflow-hidden rounded-3xl border border-border bg-surface shadow-soft"
          >
            <div className="relative flex max-h-[min(55dvh,460px)] justify-center bg-surface-2">
              {/* A local data URL: next/image would add nothing here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.dataUrl}
                alt={`Your uploaded photo: ${photo.name}`}
                className="max-h-[min(55dvh,460px)] w-auto object-contain"
              />
              {busy && <ProcessingOverlay />}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <p className="min-w-0 truncate text-sm text-fg-muted">
                <span className="font-semibold text-fg">{photo.name}</span> · {photo.width}×{photo.height} ·{" "}
                {Math.max(1, Math.round(photo.bytes / 1024))} KB
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => fileInput.current?.click()} disabled={busy}>
                  <ImageIcon size={16} /> Change photo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    onChange(null);
                  }}
                  disabled={busy}
                >
                  <TrashIcon size={16} /> Remove
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-colors",
              dragging ? "border-brand bg-brand-soft" : "border-border-strong bg-surface",
            )}
          >
            {busy && <ProcessingOverlay />}
            <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
              <UploadIcon size={30} />
            </span>
            <div>
              <p className="font-display text-xl font-bold">Drop your photo here</p>
              <p className="mt-1 text-sm text-fg-muted">JPG, PNG, WebP or HEIC · up to 15 MB</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button size="lg" onClick={() => fileInput.current?.click()} disabled={busy}>
                <ImageIcon size={18} /> Choose photo
              </Button>
              <Button variant="secondary" size="lg" onClick={() => cameraInput.current?.click()} disabled={busy}>
                <CameraIcon size={18} /> Take photo
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          <AlertIcon size={18} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}

      <p className="flex items-start gap-2 text-sm text-fg-muted">
        <ShieldIcon size={18} className="mt-0.5 shrink-0 text-success" /> {SITE.privacyNote}
      </p>
    </div>
  );
}

function ProcessingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface/85 backdrop-blur-sm" role="status">
      <span className="size-10 animate-spin rounded-full border-4 border-brand-soft border-t-brand" aria-hidden="true" />
      <span className="text-sm font-semibold">Preparing your photo…</span>
    </div>
  );
}
