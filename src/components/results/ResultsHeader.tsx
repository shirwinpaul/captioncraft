"use client";

import type { ReactNode } from "react";
import { InfoIcon } from "@/components/icons/Icons";

/** Notices from the server (e.g. "photo analysis unavailable") and the AI's note. */
export function Notices({ notices }: { notices: Array<string | undefined> }) {
  const list = notices.filter((n): n is string => Boolean(n));
  if (list.length === 0) return null;
  return (
    <div className="space-y-2">
      {list.map((notice) => (
        <p key={notice} className="flex items-start gap-2 rounded-2xl bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
          <InfoIcon size={18} className="mt-0.5 shrink-0" /> {notice}
        </p>
      ))}
    </div>
  );
}

/** Sticky bar of global actions under the results. */
export function ResultsActions({ children }: { children: ReactNode }) {
  return (
    <div className="glass sticky bottom-0 z-20 -mx-4 flex flex-wrap justify-center gap-2 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:static sm:mx-0 sm:rounded-full sm:p-2 sm:shadow-soft">
      {children}
    </div>
  );
}
