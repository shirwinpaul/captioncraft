"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { MoonIcon, SettingsIcon, SparklesIcon, StarIcon, SunIcon } from "@/components/icons/Icons";
import { useSettings } from "@/components/layout/SettingsDialog";
import { IconButton } from "@/components/ui/Button";
import { useStore } from "@/hooks/useStore";
import { cn } from "@/lib/cn";
import { favouritesStore } from "@/lib/favourites";
import { setTheme } from "@/lib/theme";

function NavLink({ href, children, badge }: { href: string; children: ReactNode; badge?: number }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors",
        active ? "bg-brand-soft text-brand-soft-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      {children}
      {badge ? (
        <span className="ml-0.5 min-w-5 rounded-full bg-brand-gradient px-1.5 text-center text-[11px] leading-5 text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

export function HeaderActions() {
  const { openSettings } = useSettings();
  const favouriteCount = useStore(favouritesStore).length;

  function toggleTheme() {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <nav aria-label="Main" className="flex items-center gap-0.5 sm:gap-1">
      <NavLink href="/create">
        <SparklesIcon size={18} />
        <span className="max-[400px]:sr-only">Create</span>
      </NavLink>
      <NavLink href="/favourites" badge={favouriteCount}>
        <StarIcon size={18} />
        <span className="sr-only sm:not-sr-only">Favourites</span>
      </NavLink>
      <IconButton aria-label="Settings" onClick={openSettings}>
        <SettingsIcon />
      </IconButton>
      <IconButton aria-label="Toggle dark mode" onClick={toggleTheme}>
        {/* The visible icon is switched by CSS, so it is right before hydration too. */}
        <MoonIcon className="dark:hidden" />
        <SunIcon className="hidden dark:block" />
      </IconButton>
    </nav>
  );
}
