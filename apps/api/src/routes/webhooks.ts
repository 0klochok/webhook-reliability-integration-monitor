import { isProviderId } from "@webhook-monitor/core";

import { ingestWebhook, type IngestWebhookDependencies } from "../services/ingest-webhook.js";
import { readBoundedTextBody } from "../services/body-reader.js";
import { createErrorResponse } from "../services/response-shapes.js";
import type { WebhookRateLimiter } from "../services/rate-limit.js";
import type { ApiApp } from "../types.js";

export interface WebhookRouteDependencies extends IngestWebhookDependencies {
  readonly webhookRateLimiter: WebhookRateLimiter;
}

const headersToRecord = (headers: Headers): Record<string, string | undefined> => {
  const result: Record<string, string | undefined> = {};

  headers.forEach((value, key) => {
    result[key] = value;
  });

  return result;
};

const resolveClientKey = (headers: Headers): string => {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || headers.get("x-real-ip")?.trim() || "unknown-client";
};

export const registerWebhookRoutes = (
  app: ApiApp,
  dependencies: WebhookRouteDependencies
): void => {
  app.post("/webhooks/:provider", async (context) => {
    const providerParam = context.req.param("provider");
    const correlationId = context.get("correlationId");

    if (!isProviderId(providerParam)) {
      return context.json(
        createErrorResponse({
          code: "unsupported_provider",
          message: "Unsupported webhook provider.",
          correlationId
        }),
        404
      );
    }

    const rateLimit = dependencies.webhookRateLimiter.check({
      providerId: providerParam,
      clientKey: resolveClientKey(context.req.raw.headers)
    });

    if (!rateLimit.allowed) {
      dependencies.logger.warn("Webhook ingress rate limit exceeded.", {
        correlationId,
        providerId: providerParam,
        errorCode: "rate_limited",
        rateLimitKeyHash: rateLimit.keyHash
      });
      context.header("Retry-After", String(rateLimit.retryAfterSeconds));

      return context.json(
        createErrorResponse({
          code: "rate_limited",
          message: "Too many webhook requests. Try again later.",
          correlationId
        }),
        429
      );
    }

    const rawBody = await readBoundedTextBody({
      request: context.req.raw,
      maxBytes: dependencies.config.webhookMaxBodyBytes
    });

    const result = await ingestWebhook(dependencies, {
      providerParam,
      rawBody,
      headers: headersToRecord(context.req.raw.headers),
      correlationId
    });

    return context.json(result.body, result.statusCode);
  });
};
