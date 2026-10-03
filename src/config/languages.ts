/** Output languages. `guide` is passed to the AI; `htmlLang` is set on generated text. */

export const LANGUAGE_IDS = ["english", "tamil", "tanglish", "hindi"] as const;
export type LanguageId = (typeof LANGUAGE_IDS)[number];

export interface Language {
  id: LanguageId;
  label: string;
  /** Name in its own script, shown on the card. */
  native: string;
  /** BCP 47 tag so browsers pick the right font and screen readers the right voice. */
  htmlLang: string;
  /** A short sample shown on the language card. */
  sample: string;
  guide: string;
}

export const LANGUAGES: Record<LanguageId, Language> = {
  english: {
    id: "english",
    label: "English",
    native: "English",
    htmlLang: "en",
    sample: "Golden hour hits different.",
    guide: "Natural, contemporary English, the way real people post today.",
  },
  tamil: {
    id: "tamil",
    label: "Tamil",
    native: "தமிழ்",
    htmlLang: "ta",
    sample: "மாலை வானம், மனசு நிறைய சந்தோஷம்",
    guide:
      "Write in Tamil script (தமிழ்) with correct spelling. Use natural modern Tamil that people actually post: warm and conversational rather than stiff or overly literary (unless the tone is Poetic). Do not write Tamil in English letters.",
  },
  tanglish: {
    id: "tanglish",
    label: "Tanglish",
    native: "Tamil in English letters",
    htmlLang: "ta-Latn",
    sample: "Semma vibe da, vera level view!",
    guide:
      "Tanglish: Tamil written in English (Latin) letters, exactly how people casually text in Tamil Nadu, naturally mixed with English words. Use common casual spellings such as 'semma', 'vera level', 'romba', 'enna', 'da', 'machi', 'nalla', 'sema mass'. Never use Tamil script. Keep it fun and authentic, not a word-by-word translation.",
  },
  hindi: {
    id: "hindi",
    label: "Hindi",
    native: "हिन्दी",
    htmlLang: "hi",
    sample: "सुनहरी शाम, दिल में सुकून",
    guide:
      "Write in Hindi using Devanagari script (हिन्दी) with correct spelling. Use natural, conversational Hindi that people actually post; common English words may appear in Devanagari. Do not write Hindi in English letters.",
  },
};

export const LANGUAGE_LIST: Language[] = LANGUAGE_IDS.map((id) => LANGUAGES[id]);
