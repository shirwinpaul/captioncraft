import { STORAGE_KEYS } from "@/config/site";
import { createStore } from "@/lib/storage";

/**
 * Bring Your Own Key: the user's personal Gemini key lives ONLY in this
 * browser's localStorage. It is sent with each AI request in a header and is
 * never stored or logged by the server.
 */
export const geminiKeyStore = createStore<string>({
  key: STORAGE_KEYS.geminiKey,
  fallback: "",
  parse: (raw) => (typeof raw === "string" && isPlausibleApiKey(raw) ? raw : undefined),
});

/** Loose shape check shared by the client and the server: no spaces, sane length. */
export function isPlausibleApiKey(value: string): boolean {
  return /^[\x21-\x7e]{20,200}$/.test(value);
}

/** Gemini keys from AI Studio usually start with "AIza". Used only for a gentle hint. */
export function looksLikeGeminiKey(value: string): boolean {
  return /^AIza[0-9A-Za-z_-]{30,}$/.test(value);
}

/** Show "AIza…x9Q2" instead of the full key. */
export function maskKey(value: string): string {
  if (value.length <= 10) return "••••";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}
