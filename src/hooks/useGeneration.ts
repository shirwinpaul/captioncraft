"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GenerationError, requestGeneration } from "@/lib/api-client";
import type { GenerateRequestInput, GenerationMeta, GenerationResult } from "@/lib/schemas";

export type GenerationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; code: GenerationError["code"]; message: string }
  | { status: "success"; result: GenerationResult; meta: GenerationMeta };

/** One in-flight AI request at a time, cancellable, never throws into React. */
export function useGeneration() {
  const [state, setState] = useState<GenerationState>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const run = useCallback(async (body: GenerateRequestInput) => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setState({ status: "loading" });
    try {
      const { result, meta } = await requestGeneration(body, current.signal);
      if (current.signal.aborted) return null;
      setState({ status: "success", result, meta });
      return { result, meta };
    } catch (error) {
      if (current.signal.aborted) return null;
      const err = error instanceof GenerationError ? error : new GenerationError("busy", "Something went wrong. Please try again.");
      setState({ status: "error", code: err.code, message: err.message });
      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    controller.current?.abort();
    setState({ status: "idle" });
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, run, cancel, reset };
}

/**
 * Like `run`, but for side requests ("More like this") that must not replace
 * the main state. Returns null on failure and reports the message.
 */
export async function requestSide(
  body: GenerateRequestInput,
  onError: (message: string) => void,
): Promise<GenerationResult | null> {
  try {
    return (await requestGeneration(body)).result;
  } catch (error) {
    onError(error instanceof GenerationError ? error.message : "Something went wrong. Please try again.");
    return null;
  }
}
