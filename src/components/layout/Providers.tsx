"use client";

import { MotionConfig } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { SettingsProvider } from "@/components/layout/SettingsDialog";
import { ToastProvider } from "@/components/ui/Toast";
import { applyTheme, themeStore } from "@/lib/theme";

/** Keeps <html class="dark"> in sync with the stored preference, the OS setting and other tabs. */
function ThemeSync() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    // Read the store directly (not via a hook) so hydration's fallback value never flips the theme.
    const sync = () => applyTheme(themeStore.getSnapshot());
    sync();
    media.addEventListener("change", sync);
    const unsubscribe = themeStore.subscribe(sync);
    return () => {
      media.removeEventListener("change", sync);
      unsubscribe();
    };
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    // Respect the OS "reduce motion" setting for every Framer Motion animation.
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <SettingsProvider>
          <ThemeSync />
          {children}
        </SettingsProvider>
      </ToastProvider>
    </MotionConfig>
  );
}
