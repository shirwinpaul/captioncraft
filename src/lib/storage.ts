/**
 * Tiny typed stores backed by localStorage / sessionStorage.
 *
 * Built for React's useSyncExternalStore: the server (and the first client
 * render) sees `fallback`, then React re-renders with the stored value. That
 * avoids hydration mismatches without setState-in-effect tricks.
 *
 * Storage can throw (private browsing, quota, disabled cookies), so every
 * access is guarded and falls back to an in-memory copy.
 */

type Listener = () => void;

export interface Store<T> {
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  subscribe: (listener: Listener) => () => void;
  set: (next: T | ((prev: T) => T)) => void;
  reset: () => void;
}

export function createStore<T>(options: {
  key: string;
  fallback: T;
  /** Validate whatever was stored; return undefined to use the fallback. */
  parse: (raw: unknown) => T | undefined;
  area?: "local" | "session";
}): Store<T> {
  const { key, fallback, parse, area = "local" } = options;
  const listeners = new Set<Listener>();
  let memoryRaw: string | null = null;
  let useMemory = false;
  let cachedRaw: string | null | undefined;
  let cachedValue: T = fallback;

  function storage(): Storage | null {
    if (typeof window === "undefined") return null;
    try {
      return area === "local" ? window.localStorage : window.sessionStorage;
    } catch {
      return null;
    }
  }

  function readRaw(): string | null {
    const s = storage();
    if (!s || useMemory) return memoryRaw;
    try {
      return s.getItem(key);
    } catch {
      return memoryRaw;
    }
  }

  function writeRaw(raw: string | null) {
    const s = storage();
    memoryRaw = raw;
    if (!s) {
      useMemory = true;
      return;
    }
    try {
      if (raw === null) s.removeItem(key);
      else s.setItem(key, raw);
      useMemory = false;
    } catch {
      useMemory = true;
    }
  }

  function emit() {
    for (const listener of listeners) listener();
  }

  function getSnapshot(): T {
    const raw = readRaw();
    // Return the same object while the raw value is unchanged, as useSyncExternalStore requires.
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedValue = fallback;
      if (raw !== null) {
        try {
          cachedValue = parse(JSON.parse(raw)) ?? fallback;
        } catch {
          cachedValue = fallback;
        }
      }
    }
    return cachedValue;
  }

  function subscribe(listener: Listener) {
    listeners.add(listener);
    // Keep other tabs in sync.
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) listener();
    };
    if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
    };
  }

  function set(next: T | ((prev: T) => T)) {
    const value = typeof next === "function" ? (next as (prev: T) => T)(getSnapshot()) : next;
    writeRaw(JSON.stringify(value));
    emit();
  }

  function reset() {
    writeRaw(null);
    emit();
  }

  return { getSnapshot, getServerSnapshot: () => fallback, subscribe, set, reset };
}
