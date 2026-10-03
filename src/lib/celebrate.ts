import { SESSION_KEYS } from "@/config/site";

/** Confetti burst, but only on the first successful generation of this visit. */
export async function celebrateOnce(): Promise<void> {
  try {
    if (sessionStorage.getItem(SESSION_KEYS.celebrated)) return;
    sessionStorage.setItem(SESSION_KEYS.celebrated, "1");
  } catch {
    // Storage blocked: still celebrate, it just might happen again.
  }
  const { default: confetti } = await import("canvas-confetti");
  const colors = ["#7c3aed", "#db2777", "#ea580c", "#f59e0b", "#a78bfa"];
  const base = { particleCount: 70, spread: 70, startVelocity: 45, colors, disableForReducedMotion: true, zIndex: 70 };
  void confetti({ ...base, angle: 60, origin: { x: 0, y: 0.75 } });
  void confetti({ ...base, angle: 120, origin: { x: 1, y: 0.75 } });
}
