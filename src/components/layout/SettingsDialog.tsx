"use client";

import { createContext, useContext, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  CheckIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  MonitorIcon,
  MoonIcon,
  ShieldIcon,
  SunIcon,
} from "@/components/icons/Icons";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { GEMINI_KEY_URL } from "@/config/ai";
import { useStore } from "@/hooks/useStore";
import { geminiKeyStore, isPlausibleApiKey, looksLikeGeminiKey, maskKey } from "@/lib/byok";
import { cn } from "@/lib/cn";
import { setTheme, themeStore, type ThemePreference } from "@/lib/theme";

const SettingsContext = createContext<{ openSettings: () => void }>({ openSettings: () => {} });

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ openSettings: () => setOpen(true) }), []);
  return (
    <SettingsContext value={value}>
      {children}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Settings"
        description="Saved in this browser only."
      >
        <div className="space-y-8">
          <ThemeSetting />
          <GeminiKeySetting />
        </div>
      </Dialog>
    </SettingsContext>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: ReactNode }[] = [
  { value: "light", label: "Light", icon: <SunIcon size={18} /> },
  { value: "dark", label: "Dark", icon: <MoonIcon size={18} /> },
  { value: "system", label: "System", icon: <MonitorIcon size={18} /> },
];

function ThemeSetting() {
  const theme = useStore(themeStore);
  return (
    <fieldset>
      <legend className="mb-3 font-semibold">Appearance</legend>
      <div className="grid grid-cols-3 gap-2">
        {THEME_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 text-sm font-medium transition-colors",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
              theme === option.value
                ? "border-brand bg-brand-soft text-brand-soft-fg"
                : "border-border text-fg-muted hover:border-border-strong hover:text-fg",
            )}
          >
            <input
              type="radio"
              name="theme"
              value={option.value}
              checked={theme === option.value}
              onChange={() => setTheme(option.value)}
              className="sr-only"
            />
            {option.icon}
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function GeminiKeySetting() {
  const savedKey = useStore(geminiKeyStore);
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  function save(event: FormEvent) {
    event.preventDefault();
    const key = draft.trim();
    if (!isPlausibleApiKey(key)) {
      setError("That doesn't look like an API key. Paste the full key with no spaces.");
      return;
    }
    geminiKeyStore.set(key);
    setDraft("");
    setError(null);
    setHint(
      looksLikeGeminiKey(key)
        ? null
        : "Saved. Heads up: Gemini keys usually start with \"AIza\", so double-check it if generations fail.",
    );
    toast("Key saved in this browser 🔑");
  }

  function remove() {
    geminiKeyStore.reset();
    setHint(null);
    toast("Key removed", "info");
  }

  return (
    <section aria-labelledby="byok-heading">
      <h3 id="byok-heading" className="flex items-center gap-2 font-semibold">
        <KeyIcon size={18} className="text-brand" /> Your own Gemini key <span className="font-normal text-fg-muted">(optional)</span>
      </h3>
      <p className="mt-1.5 text-sm text-fg-muted">
        Seeing &ldquo;our free AI is busy&rdquo;? Add your own free Gemini key and your generations use your own
        free quota instead of the shared one.
      </p>

      {savedKey ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-success/30 bg-success-soft px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-success">
            <CheckIcon size={18} /> Using your key <code className="font-mono">{maskKey(savedKey)}</code>
          </p>
          <Button variant="secondary" size="sm" onClick={remove}>
            Remove key
          </Button>
        </div>
      ) : (
        <form onSubmit={save} className="mt-4">
          <label htmlFor="gemini-key" className="text-sm font-medium">
            Gemini API key
          </label>
          <div className="mt-1.5 flex gap-2">
            <div className="relative flex-1">
              <input
                id="gemini-key"
                type={visible ? "text" : "password"}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setError(null);
                }}
                placeholder="AIza…"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "gemini-key-error" : undefined}
                className="h-11 w-full rounded-xl border border-border-strong bg-surface px-3.5 pr-11 font-mono text-sm outline-none transition-shadow placeholder:text-fg-subtle focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/20 focus-visible:outline-none"
              />
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? "Hide key" : "Show key"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-fg-muted hover:text-fg"
              >
                {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            <Button type="submit" disabled={!draft.trim()}>
              Save
            </Button>
          </div>
          {error && (
            <p id="gemini-key-error" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
        </form>
      )}
      {hint && <p className="mt-2 text-sm text-warning">{hint}</p>}

      <div className="mt-5 rounded-2xl bg-surface-2 p-4">
        <p className="text-sm font-semibold">Get a free key in about a minute</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-fg-muted">
          <li>
            Open{" "}
            <a
              href={GEMINI_KEY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-brand underline underline-offset-2"
            >
              Google AI Studio <ExternalLinkIcon size={14} />
              <span className="sr-only">(opens in a new tab)</span>
            </a>{" "}
            and sign in with your Google account.
          </li>
          <li>Click &ldquo;Create API key&rdquo;.</li>
          <li>Copy the key and paste it above.</li>
        </ol>
      </div>

      <p className="mt-4 flex gap-2 text-xs leading-relaxed text-fg-muted">
        <ShieldIcon size={16} className="mt-0.5 shrink-0 text-success" />
        Your key is stored only in this browser (localStorage). It&apos;s sent over HTTPS with each request and is
        never saved or logged on our server. Remove it any time.
      </p>
    </section>
  );
}
