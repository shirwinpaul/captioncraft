"use client";

import { useSyncExternalStore } from "react";
import type { Store } from "@/lib/storage";

/** Subscribe a component to a localStorage-backed store. */
export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
