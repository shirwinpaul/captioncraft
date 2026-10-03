"use client";

import { AlertIcon, KeyIcon, RefreshIcon } from "@/components/icons/Icons";
import { useSettings } from "@/components/layout/SettingsDialog";
import { Button } from "@/components/ui/Button";

/** Friendly error card. Offers Settings when adding your own key would help. */
export function ErrorPanel({
  code,
  message,
  onRetry,
  onBack,
  backLabel = "Back",
}: {
  code: string;
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
  backLabel?: string;
}) {
  const { openSettings } = useSettings();
  const suggestKey = code === "busy" || code === "not_configured" || code === "invalid_key" || code === "rate_limited";
  const emoji = code === "safety" ? "🙈" : code === "rate_limited" ? "⏳" : code === "network" ? "📡" : "😮‍💨";

  return (
    <div role="alert" className="rounded-3xl border border-border bg-surface p-6 text-center shadow-soft sm:p-8">
      <span className="text-5xl" aria-hidden="true">
        {emoji}
      </span>
      <h2 className="mt-3 flex items-center justify-center gap-2 font-display text-xl font-bold">
        <AlertIcon size={20} className="text-danger" /> {code === "safety" ? "Let's try another photo" : "That didn't work"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-fg-muted">{message}</p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        {onRetry && code !== "safety" && (
          <Button onClick={onRetry}>
            <RefreshIcon size={18} /> Try again
          </Button>
        )}
        {suggestKey && (
          <Button variant="secondary" onClick={openSettings}>
            <KeyIcon size={18} /> Add your Gemini key
          </Button>
        )}
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            {backLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
