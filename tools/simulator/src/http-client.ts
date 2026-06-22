import { createCorrelationId } from "@webhook-monitor/core";

import type { SimulatorConfig } from "./config.js";

export interface SimulatorHttpRequest {
  readonly method: "GET" | "POST";
  readonly path: string;
  readonly headers?: Record<string, string>;
  readonly body?: string;
}

export interface SimulatorHttpResponse {
  readonly status: number;
  readonly ok: boolean;
  readonly headers: Record<string, string>;
  readonly bodyText: string;
  readonly body: unknown;
}

export interface SimulatorHttpClient {
  request(input: SimulatorHttpRequest): Promise<SimulatorHttpResponse>;
}

export type FetchLike = (
  input: string,
  init: RequestInit
) => Promise<Pick<Response, "status" | "ok" | "headers" | "text">>;

export class SimulatorHttpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SimulatorHttpError";
  }
}

export const redactSecrets = (value: string, secrets: readonly string[]): string => {
  let redacted = value;

  for (const secret of secrets) {
    if (secret) {
      redacted = redacted.split(secret).join("[redacted]");
    }
  }

  return redacted;
};

const parseJsonBody = (bodyText: string): unknown => {
  if (!bodyText.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(bodyText) as unknown;
  } catch {
    return undefined;
  }
};

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";

const toSafeErrorMessage = (
  error: unknown,
  input: SimulatorHttpRequest,
  url: string,
  config: SimulatorConfig
): string => {
  if (isAbortError(error)) {
    return `Request timed out after ${config.timeoutMs}ms while calling ${input.method} ${url}.`;
  }

  const rawMessage = error instanceof Error ? error.message : "Unknown HTTP error.";
  const redacted = redactSecrets(rawMessage, [config.stripeSampleWebhookSecret]);

  return `Local API is unreachable at ${config.apiBaseUrl}. Start pnpm dev:api and retry. ${redacted}`;
};

export const createSimulatorHttpClient = (
  config: SimulatorConfig,
  fetchImpl: FetchLike = fetch
): SimulatorHttpClient => ({
  request: async (input) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    const url = `${config.apiBaseUrl}${input.path}`;
    const headers = {
      ...input.headers,
      "x-request-id": input.headers?.["x-request-id"] ?? createCorrelationId()
    };

    try {
      const response = await fetchImpl(url, {
        method: input.method,
        headers,
        body: input.body,
        signal: controller.signal
      });
      const bodyText = await response.text();
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status: response.status,
        ok: response.ok,
        headers: responseHeaders,
        bodyText,
        body: parseJsonBody(bodyText)
      };
    } catch (error) {
      throw new SimulatorHttpError(toSafeErrorMessage(error, input, url, config));
    } finally {
      clearTimeout(timeout);
    }
  }
});
