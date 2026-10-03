import { BYOK_HEADER } from "@/config/ai";
import { geminiKeyStore } from "@/lib/byok";
import type { ApiErrorCode, GenerateRequestInput, GenerateResponse, GenerationMeta, GenerationResult } from "@/lib/schemas";

/** Thrown by `requestGeneration` with a message that is safe to show as-is. */
export class GenerationError extends Error {
  constructor(
    readonly code: ApiErrorCode | "network" | "aborted",
    message: string,
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

/** Browser → /api/generate. Adds the visitor's own Gemini key (if any) as a header. */
export async function requestGeneration(
  body: GenerateRequestInput,
  signal?: AbortSignal,
): Promise<{ result: GenerationResult; meta: GenerationMeta }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const userKey = geminiKeyStore.getSnapshot();
  if (userKey) headers[BYOK_HEADER] = userKey;

  let response: Response;
  try {
    response = await fetch("/api/generate", { method: "POST", headers, body: JSON.stringify(body), signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new GenerationError("aborted", "Cancelled.");
    throw new GenerationError("network", "Couldn't reach the server. Check your internet connection and try again.");
  }

  let data: GenerateResponse | null = null;
  try {
    data = (await response.json()) as GenerateResponse;
  } catch {
    // e.g. a platform error page (504 timeout) instead of our JSON
  }

  if (data?.ok) return { result: data.result, meta: data.meta };
  if (data && !data.ok) throw new GenerationError(data.error.code, data.error.message);
  if (response.status === 413) throw new GenerationError("too_large", "That photo is too large to send. Please try a smaller one.");
  throw new GenerationError(
    "busy",
    "Our free AI is busy — try again in a minute, or add your own free Gemini key in Settings.",
  );
}
