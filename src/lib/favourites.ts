import { z } from "zod";
import { LANGUAGE_IDS } from "@/config/languages";
import { PLATFORM_IDS } from "@/config/platforms";
import { STORAGE_KEYS } from "@/config/site";
import { createStore } from "@/lib/storage";

export const FAVOURITE_KINDS = ["caption", "bio", "reply"] as const;
export type FavouriteKind = (typeof FAVOURITE_KINDS)[number];

/** Only text and a small label are stored, never photos. */
export const favouriteSchema = z.object({
  id: z.string().min(1).max(100),
  kind: z.enum(FAVOURITE_KINDS),
  text: z.string().max(6000),
  hashtags: z.array(z.string().max(100)).max(30),
  title: z.string().max(300).optional(),
  platform: z.enum(PLATFORM_IDS),
  language: z.enum(LANGUAGE_IDS),
  tone: z.string().max(200),
  createdAt: z.number(),
});

export type Favourite = z.infer<typeof favouriteSchema>;

const MAX_FAVOURITES = 300;
const EMPTY: Favourite[] = [];

export const favouritesStore = createStore<Favourite[]>({
  key: STORAGE_KEYS.favourites,
  fallback: EMPTY,
  parse: (raw) => {
    if (!Array.isArray(raw)) return undefined;
    // Keep valid entries and quietly drop anything corrupted.
    return raw.flatMap((item) => {
      const result = favouriteSchema.safeParse(item);
      return result.success ? [result.data] : [];
    });
  },
});

export function saveFavourite(favourite: Favourite) {
  favouritesStore.set((list) =>
    [favourite, ...list.filter((f) => f.id !== favourite.id)].slice(0, MAX_FAVOURITES),
  );
}

export function removeFavourite(id: string) {
  favouritesStore.set((list) => list.filter((f) => f.id !== id));
}

/** Update a saved item in place (e.g. after the user edits the text). No-op if not saved. */
export function updateFavourite(id: string, patch: Partial<Pick<Favourite, "text" | "hashtags" | "title">>) {
  favouritesStore.set((list) => (list.some((f) => f.id === id) ? list.map((f) => (f.id === id ? { ...f, ...patch } : f)) : list));
}

export function clearFavourites() {
  favouritesStore.set(EMPTY);
}
