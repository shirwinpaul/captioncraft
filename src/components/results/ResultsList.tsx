"use client";

import { useState } from "react";
import { ResultCard, type ResultContext } from "@/components/results/ResultCard";
import { useToast } from "@/components/ui/Toast";
import { requestSide } from "@/hooks/useGeneration";
import type { GenerateRequestInput, ResultItem } from "@/lib/schemas";

export interface ListedItem extends ResultItem {
  /** Set on "More like this" results: the id of the card they came from. */
  parentId?: string;
}

/**
 * The 5 result cards plus their "More like this" variations, which are
 * inserted right after the card they came from.
 */
export function ResultsList({
  items,
  onItemsChange,
  ctx,
  variationRequest,
}: {
  items: ListedItem[];
  onItemsChange: (updater: (items: ListedItem[]) => ListedItem[]) => void;
  ctx: ResultContext;
  /** Builds the API request for "More like this" on an item. */
  variationRequest: (item: ResultItem) => GenerateRequestInput;
}) {
  const toast = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function moreLikeThis(item: ListedItem) {
    if (loadingId) return;
    setLoadingId(item.id);
    const result = await requestSide(variationRequest(item), (message) => toast(message, "error"));
    setLoadingId(null);
    if (!result) return;
    // Variations attach to the top-level card, after any earlier variations of it.
    const rootId = item.parentId ?? item.id;
    const fresh = result.items.map((r) => ({ ...r, parentId: rootId }));
    onItemsChange((list) => {
      let insertAt = list.findIndex((i) => i.id === rootId) + 1;
      while (insertAt < list.length && list[insertAt].parentId === rootId) insertAt++;
      return [...list.slice(0, insertAt), ...fresh, ...list.slice(insertAt)];
    });
    toast(`${fresh.length} new variations added ✨`);
  }

  let topIndex = -1;
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        if (!item.parentId) topIndex++;
        return (
          <ResultCard
            key={item.id}
            item={item}
            index={item.parentId ? i : topIndex}
            ctx={ctx}
            isVariation={Boolean(item.parentId)}
            onChange={(next) => onItemsChange((list) => list.map((x) => (x.id === next.id ? { ...x, ...next } : x)))}
            onMoreLikeThis={() => moreLikeThis(item)}
            loadingMore={loadingId === item.id}
          />
        );
      })}
    </div>
  );
}
