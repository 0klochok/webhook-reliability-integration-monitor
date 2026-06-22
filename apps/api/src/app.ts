import { Hono } from "hono";
import { createLogger, resolveCorrelationId, type Logger } from "@webhook-monitor/core";

import type { ApiConfig } from "./config.js";
import { registerDashboardRoutes, type DashboardRouteDependencies } from "./dashboard/routes.js";
import { ApiError, toApiError } from "./errors.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerWebhookRoutes } from "./routes/webhooks.js";
import {
  createInMemoryWebhookRateLimiter,
  type WebhookRateLimiter
} from "./services/rate-limit.js";
import { createErrorResponse } from "./services/response-shapes.js";
import type { IngestWebhookDependencies } from "./services/ingest-webhook.js";
import type { ApiApp } from "./types.js";

export interface CreateAppDependencies
  extends Omit<IngestWebhookDependencies, "logger">, Omit<DashboardRouteDependencies, "logger"> {
  readonly config: ApiConfig;
  readonly logger?: Logger;
  readonly databaseReadiness?: () => Promise<void>;
  readonly queueReadiness?: () => Promise<void>;
  readonly webhookRateLimiter?: WebhookRateLimiter;
}

export const createApp = (dependencies: CreateAppDependencies): ApiApp => {
  const logger =
    dependencies.logger ??
    createLogger({
      service: dependencies.config.serviceName,
      level: dependencies.config.logLevel
    });
  const webhookRateLimiter =
    dependencies.webhookRateLimiter ??
    createInMemoryWebhookRateLimiter({
      windowMs: dependencies.config.webhookRateLimitWindowMs,
      maxRequests: dependencies.config.webhookRateLimitMaxRequests,
      clock: dependencies.clock
    });
  const app: ApiApp = new Hono();

  app.use("*", async (context, next) => {
    const correlationId = resolveCorrelationId(context.req.header("x-request-id"));
    context.set("correlationId", correlationId);
    context.header("x-request-id", correlationId);
    await next();
  });

  app.onError((error, context) => {
    const apiError = toApiError(error);
    const correlationId = context.get("correlationId");

    logger[apiError.statusCode >= 500 ? "error" : "warn"]("API request failed.", {
      correlationId,
      errorCode: apiError.code,
      eventId: apiError.eventId,
      error: apiError
    });

    return context.json(
      createErrorResponse({
        code: apiError.code,
        message: apiError.publicMessage,
        eventId: apiError.eventId,
        correlationId,
        issues: apiError.issues
      }),
      apiError.statusCode
    );
  });

  app.notFound((context) => {
    const error = new ApiError({
      code: "not_found",
      statusCode: 404,
      publicMessage: "The requested API route was not found."
    });

    return context.json(
      createErrorResponse({
        code: error.code,
        message: error.publicMessage,
        correlationId: context.get("correlationId")
      }),
      error.statusCode
    );
  });

  registerHealthRoutes(app, {
    config: dependencies.config,
    databaseReadiness: dependencies.databaseReadiness,
    queueReadiness: dependencies.queueReadiness,
    logger
  });
  registerWebhookRoutes(app, {
    ...dependencies,
    logger,
    webhookRateLimiter
  });
  registerDashboardRoutes(app, {
    ...dependencies,
    logger
  });

  return app;
};
