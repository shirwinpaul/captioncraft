import Link from "next/link";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { Logo } from "@/components/layout/Logo";

export function Header() {
  return (
    <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/" aria-label="CaptionCraft home" className="rounded-full">
          <Logo />
        </Link>
        <HeaderActions />
      </div>
    </header>
  );
}
