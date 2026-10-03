export const SITE = {
  name: "CaptionCraft",
  tagline: "Your photo deserves the perfect caption ✨",
  description:
    "Upload a photo, pick your platform, vibe and language, and get AI captions and hashtags that match what's actually in your photo. Free, no sign-up.",
  author: "Anand Raj",
  privacyNote:
    "Your photo is sent to a free AI provider only to generate captions and is not saved by this app.",
} as const;

/** Every localStorage key the app uses, in one place. */
export const STORAGE_KEYS = {
  theme: "captioncraft:theme",
  geminiKey: "captioncraft:gemini-key",
  captionPrefs: "captioncraft:caption-prefs",
  bioPrefs: "captioncraft:bio-prefs",
  replyPrefs: "captioncraft:reply-prefs",
  favourites: "captioncraft:favourites",
} as const;

/** sessionStorage: confetti only on the first successful generation per visit. */
export const SESSION_KEYS = {
  celebrated: "captioncraft:celebrated",
} as const;
