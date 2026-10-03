import { PLATFORMS } from "@/config/platforms";
import type { GenerateRequest } from "@/lib/schemas";

/**
 * Development-only sample output (MOCK_AI=true), so the UI can be built
 * without spending API quota. Returned as raw JSON text, exactly like a model,
 * so it goes through the same parsing and rule enforcement.
 */
export function mockResponse(req: GenerateRequest, count: number): string {
  const emoji = req.emoji ? " ✨" : "";
  const range = Array.from({ length: count }, (_, i) => i + 1);

  switch (req.mode) {
    case "captions": {
      const tags = ["#GoldenHour", "#WeekendVibes", "#TravelDiaries", "#Wanderlust", "#Sunset"];
      const platform = PLATFORMS[req.platform];
      return JSON.stringify({
        photoVibe: "(Mock) A person watching a warm sunset over the hills",
        captions: range.map((n) => ({
          text: `Sample caption ${n}${req.variationOf ? " (variation)" : ""}: chasing light and good company${emoji}`,
          hashtags: tags,
          tone: req.tones.join(" + "),
          title: platform.title ? `Sample title ${n}: golden hour in the hills` : undefined,
          charCount: 0,
        })),
      });
    }
    case "bio":
      return JSON.stringify({
        bios: range.map((n) => ({ text: `Sample bio ${n} · coffee, code & sunsets${emoji}`, tone: req.tones.join(" + ") })),
      });
    case "reply":
      return JSON.stringify({
        abusive: false,
        replies: range.map((n) => ({ text: `Sample reply ${n}: thank you so much!${emoji}`, tone: req.tones.join(" + ") })),
      });
  }
}

export function isMockEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.MOCK_AI === "true";
}
