"use client";

import { useState, type ReactNode } from "react";
import { ErrorPanel } from "@/components/create/ErrorPanel";
import { GeneratingAnimation } from "@/components/create/GeneratingAnimation";
import { PencilIcon, RefreshIcon } from "@/components/icons/Icons";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import { Notices, ResultsActions } from "@/components/results/ResultsHeader";
import type { ResultContext } from "@/components/results/ResultCard";
import { ResultsList, type ListedItem } from "@/components/results/ResultsList";
import { Button } from "@/components/ui/Button";
import { PLATFORM_LIST, type PlatformId } from "@/config/platforms";
import { useGeneration } from "@/hooks/useGeneration";
import { celebrateOnce } from "@/lib/celebrate";
import { cn } from "@/lib/cn";
import type { GenerateRequestInput, ResultItem } from "@/lib/schemas";

/** Labelled block in the Bio / Reply forms. */
export function FormSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-display text-lg font-bold">{title}</h3>
        {hint && <p className="text-sm text-fg-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** Compact, horizontally scrolling platform chooser. */
export function PlatformChips({
  value,
  onChange,
  name,
  describe,
}: {
  value: PlatformId;
  onChange: (id: PlatformId) => void;
  name: string;
  describe?: (id: PlatformId) => string;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Platform</legend>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {PLATFORM_LIST.map((p) => (
          <label key={p.id} className="relative shrink-0">
            <input
              type="radio"
              name={name}
              checked={p.id === value}
              onChange={() => onChange(p.id)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex h-12 cursor-pointer items-center gap-2 rounded-full border bg-surface pl-1.5 pr-4 text-sm font-semibold transition-colors",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                p.id === value ? "border-brand ring-1 ring-brand" : "border-border hover:border-border-strong",
              )}
            >
              <PlatformIcon id={p.id} size="sm" className="rounded-full" />
              <span>
                {p.name}
                {describe && <span className="block text-[11px] font-normal leading-tight text-fg-muted">{describe(p.id)}</span>}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Form → loading → results flow shared by Bio and Comment Replies.
 * `renderForm` gets a `submit(request)` callback.
 */
export function ModeShell({
  ctx,
  renderForm,
  resultsTitle,
}: {
  ctx: Omit<ResultContext, "platform" | "language" | "toneLabel">;
  renderForm: (submit: (request: GenerateRequestInput, ctx: Omit<ResultContext, "mode">) => void) => ReactNode;
  resultsTitle: string;
}) {
  const { state, run, cancel, reset } = useGeneration();
  const [items, setItems] = useState<ListedItem[]>([]);
  const [last, setLast] = useState<{ request: GenerateRequestInput; ctx: ResultContext } | null>(null);

  async function submit(request: GenerateRequestInput, partial: Omit<ResultContext, "mode">) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const outcome = await run(request);
    if (outcome) {
      setLast({ request, ctx: { ...partial, mode: ctx.mode } });
      setItems(outcome.result.items);
      void celebrateOnce();
    }
  }

  const photo = last?.request.mode === "bio" ? last.request.image : undefined;

  if (state.status === "loading") return <GeneratingAnimation photoUrl={photo} onCancel={cancel} />;
  if (state.status === "error") {
    return (
      <ErrorPanel
        code={state.code}
        message={state.message}
        onRetry={last ? () => void submit(last.request, last.ctx) : undefined}
        onBack={reset}
        backLabel="Edit inputs"
      />
    );
  }

  if (state.status === "success" && last) {
    return (
      <div className="space-y-5">
        <h2 className="font-display text-2xl font-extrabold">{resultsTitle}</h2>
        <Notices notices={[state.result.note, ...state.meta.notices]} />
        <ResultsList
          items={items}
          onItemsChange={setItems}
          ctx={last.ctx}
          variationRequest={(item: ResultItem) => ({ ...last.request, variationOf: { text: item.text, hashtags: [] } })}
        />
        <ResultsActions>
          <Button onClick={() => void submit({ ...last.request, variationOf: undefined }, last.ctx)}>
            <RefreshIcon size={17} /> Regenerate all
          </Button>
          <Button variant="secondary" onClick={reset}>
            <PencilIcon size={17} /> Edit inputs
          </Button>
        </ResultsActions>
      </div>
    );
  }

  // Keep the form mounted-state simple: inputs live in the parent, so going back keeps them.
  return <>{renderForm((request, partial) => void submit(request, partial))}</>;
}
