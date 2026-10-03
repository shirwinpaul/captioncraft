/**
 * Tones the user can blend (pick 1-3). `guide` is passed to the AI so each tone
 * means the same thing every time.
 */

export interface Tone {
  id: string;
  label: string;
  emoji: string;
  guide: string;
}

export const CAPTION_TONES = [
  { id: "happy", label: "Happy", emoji: "😊", guide: "bright, upbeat and joyful" },
  { id: "funny", label: "Funny", emoji: "😂", guide: "genuinely funny: wordplay, relatable humour, light self-irony" },
  { id: "aesthetic", label: "Aesthetic", emoji: "✨", guide: "dreamy, visual, soft and stylish wording" },
  { id: "romantic", label: "Romantic", emoji: "❤️", guide: "warm, affectionate and tender, never cheesy overload" },
  { id: "inspirational", label: "Inspirational", emoji: "🌟", guide: "uplifting and hopeful, a fresh perspective" },
  { id: "motivational", label: "Motivational", emoji: "💪", guide: "energetic push to act, grind or improve" },
  { id: "savage", label: "Savage / Sassy", emoji: "😏", guide: "bold, sassy, unbothered confidence; playful, never insulting anyone" },
  { id: "chill", label: "Chill", emoji: "😌", guide: "relaxed, laid-back, low-effort cool" },
  { id: "nostalgic", label: "Nostalgic", emoji: "🥹", guide: "wistful, memory-filled, bittersweet warmth" },
  { id: "professional", label: "Professional", emoji: "💼", guide: "polished, credible and clear, still human" },
  { id: "heartfelt", label: "Heartfelt", emoji: "🥺", guide: "sincere, emotional and personal" },
  { id: "confident", label: "Confident", emoji: "😎", guide: "self-assured and bold without arrogance" },
  { id: "mysterious", label: "Mysterious", emoji: "🌙", guide: "intriguing, minimal reveal, a little enigmatic" },
  { id: "adventurous", label: "Adventurous", emoji: "🏔️", guide: "daring, wanderlust, exploration energy" },
  { id: "grateful", label: "Grateful", emoji: "🙏", guide: "thankful and appreciative" },
  { id: "sarcastic", label: "Sarcastic", emoji: "🙃", guide: "dry, ironic humour; light, never hurtful" },
  { id: "minimal", label: "Minimal", emoji: "◽", guide: "very few words, clean and understated" },
  { id: "festive", label: "Festive", emoji: "🎉", guide: "celebratory and party-ready, matching any occasion in the photo" },
  { id: "spiritual", label: "Spiritual", emoji: "🕉️", guide: "peaceful, reflective and soulful; respectful of all beliefs, never preachy" },
  { id: "poetic", label: "Poetic", emoji: "📜", guide: "lyrical and evocative, imagery and rhythm" },
] as const satisfies readonly Tone[];

/** Extra tones that only make sense for comment replies. */
export const REPLY_ONLY_TONES = [
  { id: "polite", label: "Polite", emoji: "🙂", guide: "courteous, kind and respectful" },
  { id: "witty", label: "Witty", emoji: "😄", guide: "clever, light and quick" },
] as const satisfies readonly Tone[];

export type CaptionToneId = (typeof CAPTION_TONES)[number]["id"];
export type ToneId = CaptionToneId | (typeof REPLY_ONLY_TONES)[number]["id"];

export const ALL_TONES: readonly Tone[] = [...CAPTION_TONES, ...REPLY_ONLY_TONES];

export const CAPTION_TONE_IDS = CAPTION_TONES.map((t) => t.id) as [CaptionToneId, ...CaptionToneId[]];
export const ALL_TONE_IDS = ALL_TONES.map((t) => t.id) as [ToneId, ...ToneId[]];

/** The quick row on the Comment Reply screen. */
export const QUICK_REPLY_TONE_IDS: ToneId[] = ["polite", "witty", "grateful", "professional"];

export const MAX_TONES = 3;

const TONE_MAP = new Map(ALL_TONES.map((t) => [t.id, t]));

export function getTone(id: string): Tone | undefined {
  return TONE_MAP.get(id);
}

/** "Funny 😂 + Chill 😌" style label for a list of tone ids. */
export function describeTones(ids: readonly string[]): string {
  return ids
    .map((id) => getTone(id)?.label ?? id)
    .join(" + ");
}
