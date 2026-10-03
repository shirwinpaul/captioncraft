"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { CopyIcon, HashIcon, SparklesIcon, StarIcon, TrashIcon } from "@/components/icons/Icons";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { LANGUAGES } from "@/config/languages";
import { PLATFORMS, PLATFORM_IDS, type PlatformId } from "@/config/platforms";
import { useStore } from "@/hooks/useStore";
import { cn } from "@/lib/cn";
import { copyText } from "@/lib/clipboard";
import {
  FAVOURITE_KINDS,
  clearFavourites,
  favouritesStore,
  removeFavourite,
  type Favourite,
  type FavouriteKind,
} from "@/lib/favourites";
import { composePost } from "@/lib/platform-rules";

type KindFilter = FavouriteKind | "all";
type PlatformFilter = PlatformId | "all";

const KIND_LABELS: Record<KindFilter, string> = { all: "All", caption: "Captions", bio: "Bios", reply: "Replies" };
const KIND_NOUN: Record<FavouriteKind, string> = { caption: "caption", bio: "bio", reply: "reply" };

/** Same text "Copy all" produces on the results screen: title + caption + hashtags. */
function fullText(f: Favourite): string {
  const body = composePost(f.platform, f.text, f.hashtags);
  return f.title ? `${f.title}\n\n${body}` : body;
}

function FilterChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors",
        selected ? "border-brand bg-brand-soft text-brand-soft-fg" : "border-border bg-surface text-fg-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

export function FavouritesView() {
  const favourites = useStore(favouritesStore);
  const toast = useToast();
  const [kind, setKind] = useState<KindFilter>("all");
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [confirmClear, setConfirmClear] = useState(false);

  // Only offer platform filters that have saved items.
  const usedPlatforms = PLATFORM_IDS.filter((id) => favourites.some((f) => f.platform === id));
  const activePlatform = platform !== "all" && usedPlatforms.includes(platform) ? platform : "all";
  const visible = favourites.filter(
    (f) => (kind === "all" || f.kind === kind) && (activePlatform === "all" || f.platform === activePlatform),
  );

  async function copy(text: string, what: string) {
    const ok = await copyText(text);
    toast(ok ? "Copied! ✅" : `Couldn't copy the ${what}. Please select and copy it manually.`, ok ? "success" : "error");
  }

  function remove(f: Favourite) {
    removeFavourite(f.id);
    toast(`Removed ${KIND_NOUN[f.kind]}`, "info");
  }

  function clearAll() {
    clearFavourites();
    setConfirmClear(false);
    toast("All favourites cleared", "info");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="text-gradient">Favourites</span> ⭐
          </h1>
          <p className="mt-1 text-fg-muted">Saved only in this browser. Photos are never stored.</p>
        </div>
        {favourites.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
            <TrashIcon size={15} /> Clear all
          </Button>
        )}
      </header>

      {favourites.length === 0 ? (
        <div className="glass rounded-3xl px-6 py-14 text-center shadow-soft">
          <div className="mx-auto mb-4 inline-flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand-soft-fg">
            <StarIcon size={26} />
          </div>
          <h2 className="font-display text-xl font-bold">No favourites yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-fg-muted">Tap ⭐ Save on any caption, bio or reply and it will show up here.</p>
          <ButtonLink href="/create" className="mt-6">
            <SparklesIcon size={18} /> Write some captions
          </ButtonLink>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <div role="group" aria-label="Filter by type" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              {(["all", ...FAVOURITE_KINDS] as const).map((k) => (
                <FilterChip key={k} selected={kind === k} onClick={() => setKind(k)}>
                  {KIND_LABELS[k]}
                  <span className="tabular-nums opacity-70">
                    {k === "all" ? favourites.length : favourites.filter((f) => f.kind === k).length}
                  </span>
                </FilterChip>
              ))}
            </div>
            {usedPlatforms.length > 1 && (
              <div role="group" aria-label="Filter by platform" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
                <FilterChip selected={activePlatform === "all"} onClick={() => setPlatform("all")}>
                  All platforms
                </FilterChip>
                {usedPlatforms.map((id) => (
                  <FilterChip key={id} selected={activePlatform === id} onClick={() => setPlatform(id)}>
                    <PlatformIcon id={id} size="sm" className="-ml-2 rounded-full" />
                    {PLATFORMS[id].name}
                  </FilterChip>
                ))}
              </div>
            )}
          </div>

          {visible.length === 0 ? (
            <p className="rounded-2xl bg-surface-2 px-4 py-6 text-center text-fg-muted">Nothing saved matches these filters.</p>
          ) : (
            <ul className="space-y-4">
              <AnimatePresence initial={false}>
                {visible.map((f) => {
                  const lang = LANGUAGES[f.language].htmlLang;
                  return (
                    <motion.li
                      key={f.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.22 }}
                    >
                      <article className="rounded-3xl border border-border bg-surface p-4 shadow-soft sm:p-5">
                        <header className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-fg-muted">
                          <PlatformIcon id={f.platform} size="sm" className="rounded-full" />
                          <span>{PLATFORMS[f.platform].name}</span>
                          <span aria-hidden>·</span>
                          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-brand-soft-fg">{KIND_LABELS[f.kind].slice(0, -1)}</span>
                          <span aria-hidden>·</span>
                          <span>{LANGUAGES[f.language].label}</span>
                          {f.tone && (
                            <>
                              <span aria-hidden>·</span>
                              <span className="truncate">{f.tone}</span>
                            </>
                          )}
                          <time className="ml-auto" dateTime={new Date(f.createdAt).toISOString()}>
                            {new Date(f.createdAt).toLocaleDateString()}
                          </time>
                        </header>

                        {f.title && (
                          <p lang={lang} className="mb-2 font-semibold">
                            {f.title}
                          </p>
                        )}
                        <p lang={lang} className="whitespace-pre-wrap wrap-break-word leading-relaxed">
                          {f.text}
                        </p>
                        {f.hashtags.length > 0 && (
                          <p lang={lang} className="mt-2 text-sm font-medium text-brand">
                            {f.hashtags.join(" ")}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
                          <Button variant="soft" size="sm" onClick={() => copy(f.text, KIND_NOUN[f.kind])}>
                            <CopyIcon size={15} /> Copy {KIND_NOUN[f.kind]}
                          </Button>
                          {f.hashtags.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => copy(f.hashtags.join(" "), "hashtags")}>
                              <HashIcon size={15} /> Copy hashtags
                            </Button>
                          )}
                          {(f.hashtags.length > 0 || f.title) && (
                            <Button variant="ghost" size="sm" onClick={() => copy(fullText(f), "text")}>
                              <CopyIcon size={15} /> Copy all
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => remove(f)} className="ml-auto" aria-label={`Delete this ${KIND_NOUN[f.kind]}`}>
                            <TrashIcon size={15} /> Delete
                          </Button>
                        </div>
                      </article>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </>
      )}

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear all favourites?"
        description={`This deletes all ${favourites.length} saved items from this browser. It can't be undone.`}
      >
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmClear(false)}>
            Keep them
          </Button>
          <Button variant="danger" onClick={clearAll}>
            <TrashIcon size={16} /> Clear all
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

