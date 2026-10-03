import { STORAGE_KEYS } from "@/config/site";
import { createStore } from "@/lib/storage";

export type ThemePreference = "light" | "dark" | "system";

const THEMES: ThemePreference[] = ["light", "dark", "system"];

export const themeStore = createStore<ThemePreference>({
  key: STORAGE_KEYS.theme,
  fallback: "system",
  parse: (raw) => (THEMES.includes(raw as ThemePreference) ? (raw as ThemePreference) : undefined),
});

export function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Apply a preference to <html>. CSS reads the `.dark` class. */
export function applyTheme(preference: ThemePreference) {
  if (typeof document === "undefined") return;
  const dark = preference === "dark" || (preference === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

export function setTheme(preference: ThemePreference) {
  themeStore.set(preference);
  applyTheme(preference);
}

/**
 * Runs in <head> before first paint so the page never flashes the wrong theme.
 * Must stay dependency-free and in sync with applyTheme().
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p="system",r=localStorage.getItem(${JSON.stringify(
  STORAGE_KEYS.theme,
)});if(r)p=JSON.parse(r);var d=p==="dark"||(p!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;
