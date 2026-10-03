import type { Metadata } from "next";
import { CreateStudio } from "@/components/create/CreateStudio";
import { STUDIO_MODES, type StudioMode } from "@/types";

export const metadata: Metadata = {
  title: "Create captions",
  description: "Upload a photo and get AI captions and hashtags for any platform, in English, Tamil, Tanglish or Hindi.",
};

export default async function CreatePage({ searchParams }: PageProps<"/create">) {
  const { mode } = await searchParams;
  const initialMode: StudioMode = STUDIO_MODES.includes(mode as StudioMode) ? (mode as StudioMode) : "captions";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 sm:px-6 sm:pt-10">
      {/* key: a client-side link to another ?mode= remounts with that tab selected. */}
      <CreateStudio key={initialMode} initialMode={initialMode} />
    </div>
  );
}
