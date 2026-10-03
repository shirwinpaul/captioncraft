import type { Metadata } from "next";
import { FavouritesView } from "@/components/favourites/FavouritesView";

export const metadata: Metadata = {
  title: "Favourites",
  description: "Your saved captions, bios and comment replies. Stored only in this browser.",
};

export default function FavouritesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 sm:px-6 sm:pt-10">
      <FavouritesView />
    </div>
  );
}
