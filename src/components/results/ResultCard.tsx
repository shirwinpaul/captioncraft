"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CloseIcon, CopyIcon, HashIcon, LayersIcon, RefreshIcon, StarIcon } from "@/components/icons/Icons";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { LANGUAGES, type LanguageId } from "@/config/languages";
import { PLATFORMS, type PlatformId } from "@/config/platforms";
import { useStore } from "@/hooks/useStore";
import { cn } from "@/lib/cn";
import { copyText } from "@/lib/clipboard";
import { favouritesStore, removeFavourite, saveFavourite, updateFavourite, type FavouriteKind } from "@/lib/favourites";
import { composePost, countChars, measurePost } from "@/lib/platform-rules";
import type { GenerationMode, ResultItem } from "@/lib/schemas";

const KIND: Record<GenerationMode, FavouriteKind> = { captions: "caption", bio: "bio", reply: "reply" };
const NOUN: Record<GenerationMode, string> = { captions: "caption", bio: "bio", reply: "reply" };

export interface ResultContext {
  mode: GenerationMode;
  platform: PlatformId;
  language: LanguageId;
  /** Fallback tone label for favourites, e.g. "Funny + Chill". */
  toneLabel: string;
}

/** Character count and limit for an item, according to its mode and platform. */
export function measureItem(ctx: ResultContext, item: Pick<ResultItem, "text" | "hashtags">) {
  if (ctx.mode === "captions") return measurePost(ctx.platform, item.text, item.hashtags);
  const count = countChars(item.text);
  const limit = ctx.mode === "bio" ? PLATFORMS[ctx.platform].bio.limit : null;
  return { count, limit, over: limit !== null && count > limit };
}

/** The full text for "Copy all": title (if any) + caption + hashtags. */
export function fullText(ctx: ResultContext, item: ResultItem): string {
  const body = composePost(ctx.platform, item.text, item.hashtags);
  return item.title ? `${item.title}\n\n${body}` : body;
}

export function ResultCard({
  item,
  index,
  ctx,
  isVariation,
  onChange,
  onMoreLikeThis,
  loadingMore,
}: {
  item: ResultItem;
  index: number;
  ctx: ResultContext;
  isVariation?: boolean;
  onChange: (item: ResultItem) => void;
  onMoreLikeThis?: () => void;
  loadingMore?: boolean;
}) {
  const toast = useToast();
  const favourites = useStore(favouritesStore);
  const saved = favourites.some((f) => f.id === item.id);
  const platform = PLATFORMS[ctx.platform];
  const lang = LANGUAGES[ctx.language].htmlLang;
  const { count, limit, over } = measureItem(ctx, item);
  const noun = NOUN[ctx.mode];

  async function copy(text: string, what: string) {
    const ok = await copyText(text);
    toast(ok ? "Copied! ✅" : `Couldn't copy the ${what}. Please select and copy it manually.`, ok ? "success" : "error");
  }

  function removeHashtag(tag: string) {
    const next = { ...item, hashtags: item.hashtags.filter((t) => t !== tag) };
    next.charCount = measureItem(ctx, next).count;
    onChange(next);
    if (saved) updateFavourite(item.id, { hashtags: next.hashtags });
  }

  function toggleFavourite() {
    if (saved) {
      removeFavourite(item.id);
      toast("Removed from favourites", "info");
      return;
    }
    saveFavourite({
      id: item.id,
      kind: KIND[ctx.mode],
      text: item.text,
      hashtags: item.hashtags,
      ...(item.title ? { title: item.title } : {}),
      platform: ctx.platform,
      language: ctx.language,
      tone: (item.tone || ctx.toneLabel).slice(0, 200),
      createdAt: Date.now(),
    });
    toast("Saved to favourites ⭐");
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 6) * 0.06, ease: "easeOut" }}
      aria-label={`${isVariation ? "Variation" : noun[0].toUpperCase() + noun.slice(1)} ${index + 1}`}
      className={cn(
        "rounded-3xl border bg-surface p-4 shadow-soft sm:p-5",
        isVariation ? "ml-3 border-dashed border-brand/40 sm:ml-8" : "border-border",
      )}
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-fg-muted">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-brand-soft text-brand-soft-fg">
            {isVariation ? <LayersIcon size={13} /> : index + 1}
          </span>
          {isVariation ? "More like this" : item.tone || ctx.toneLabel}
        </span>
        <span
          className={cn("rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums", over ? "bg-danger-soft text-danger" : "bg-surface-2 text-fg-muted")}
          aria-label={limit ? `${count} of ${limit} characters${over ? ", over the limit" : ""}` : `${count} characters`}
        >
          {count}
          {limit ? ` / ${limit}` : ""} {over && "· too long"}
        </span>
      </header>

      {item.title && platform.title && (
        <div className="mb-3 rounded-2xl bg-surface-2 px-3.5 py-2.5">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-fg-muted">
            <span>{platform.title.label}</span>
            <span className="tabular-nums">
              {countChars(item.title)} / {platform.title.limit}
            </span>
          </div>
          <p lang={lang} className="mt-1 font-semibold">
            {item.title}
          </p>
        </div>
      )}

      <p lang={lang} className="whitespace-pre-wrap wrap-break-word text-[15px] leading-relaxed sm:text-base">
        {item.text}
      </p>

      {item.hashtags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Hashtags (tap to remove)">
          <AnimatePresence initial={false}>
            {item.hashtags.map((tag) => (
              <motion.li
                key={tag}
                layout
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
              >
                <button
                  type="button"
                  onClick={() => removeHashtag(tag)}
                  aria-label={`Remove ${tag}`}
                  className="group inline-flex h-8 items-center gap-1 rounded-full bg-brand-soft pl-3 pr-2 text-sm font-medium text-brand-soft-fg transition-colors hover:brightness-95 dark:hover:brightness-125"
                >
                  <span lang={lang}>{tag}</span>
                  <CloseIcon size={14} className="opacity-60 group-hover:opacity-100" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
        <Button variant="soft" size="sm" onClick={() => copy(item.text, noun)}>
          <CopyIcon size={15} /> Copy {noun}
        </Button>
        {item.hashtags.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => copy(item.hashtags.join(" "), "hashtags")}>
            <HashIcon size={15} /> Copy hashtags
          </Button>
        )}
        {(item.hashtags.length > 0 || item.title) && (
          <Button variant="ghost" size="sm" onClick={() => copy(fullText(ctx, item), "text")}>
            <CopyIcon size={15} /> Copy all
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFavourite}
          aria-pressed={saved}
          className={cn(saved && "text-amber-600 dark:text-amber-400")}
        >
          <StarIcon size={15} filled={saved} /> {saved ? "Saved" : "Save"}
        </Button>
        {onMoreLikeThis && (
          <Button variant="ghost" size="sm" onClick={onMoreLikeThis} disabled={loadingMore}>
            <RefreshIcon size={15} className={cn(loadingMore && "animate-spin")} /> {loadingMore ? "Writing…" : "More like this"}
          </Button>
        )}
      </div>
    </motion.article>
  );
}
