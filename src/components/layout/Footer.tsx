import Link from "next/link";
import { HeartIcon, ShieldIcon } from "@/components/icons/Icons";
import { LogoMark } from "@/components/layout/Logo";
import { SITE } from "@/config/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md space-y-3">
          <p className="flex items-center gap-2 font-display text-lg font-bold">
            <LogoMark size={24} /> {SITE.name}
          </p>
          <p className="flex gap-2 text-sm text-fg-muted">
            <ShieldIcon size={18} className="mt-0.5 shrink-0 text-success" />
            {SITE.privacyNote}
          </p>
          <p className="text-xs text-fg-subtle">AI can make mistakes. Give captions a quick read before you post.</p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <nav aria-label="Footer" className="flex gap-4 text-sm font-medium">
            <Link href="/create" className="text-fg-muted hover:text-fg">
              Create
            </Link>
            <Link href="/create?mode=bio" className="text-fg-muted hover:text-fg">
              Bio
            </Link>
            <Link href="/create?mode=replies" className="text-fg-muted hover:text-fg">
              Replies
            </Link>
            <Link href="/favourites" className="text-fg-muted hover:text-fg">
              Favourites
            </Link>
          </nav>
          <p className="flex items-center gap-1.5 text-sm text-fg-muted">
            Built by <span className="font-semibold text-fg">{SITE.author}</span>
            <HeartIcon size={14} className="text-pink-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
