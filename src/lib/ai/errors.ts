/** Why a provider call failed. Drives the fallback decision and what (little) we log. */
export type ProviderErrorKind =
  | "rate_limit" // 429
  | "server" // 5xx
  | "timeout"
  | "network"
  | "auth" // bad / missing key
  | "bad_request" // 400, unsupported model input, etc.
  | "not_found" // model retired
  | "safety" // provider blocked the image or text
  | "empty"; // no text in the response

export class ProviderError extends Error {
  constructor(
    readonly kind: ProviderErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export function kindFromStatus(status: number | undefined): ProviderErrorKind {
  if (status === 429) return "rate_limit";
  if (status === 401 || status === 403) return "auth";
  if (status === 404) return "not_found";
  if (status === 408) return "timeout";
  if (status !== undefined && status >= 500) return "server";
  return "bad_request";
}

/** Every provider failed (or the time budget ran out). Shown to users as "Our free AI is busy". */
export class AllProvidersFailedError extends Error {
  constructor(readonly failures: string[]) {
    super("All AI providers failed");
    this.name = "AllProvidersFailedError";
  }
}

/** A provider refused the photo/text for safety reasons. We don't retry elsewhere. */
export class SafetyBlockedError extends Error {
  constructor() {
    super("Blocked by provider safety filters");
    this.name = "SafetyBlockedError";
  }
}

/** No API keys are configured on the server. */
export class NotConfiguredError extends Error {
  constructor() {
    super("No AI provider keys configured");
    this.name = "NotConfiguredError";
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError" || /abort/i.test(error.message));
}
