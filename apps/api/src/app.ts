import { Hono } from "hono";

import type { ApiConfig } from "./config.js";
import { ApiError, toApiError } from "./errors.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerWebhookRoutes } from "./routes/webhooks.js";
import { createErrorResponse } from "./services/response-shapes.js";
import type { IngestWebhookDependencies } from "./services/ingest-webhook.js";

export interface CreateAppDependencies extends IngestWebhookDependencies {
  readonly config: ApiConfig;
}

export const createApp = (dependencies: CreateAppDependencies): Hono => {
  const app = new Hono();

  app.onError((error, context) => {
    const apiError = toApiError(error);

    return context.json(
      createErrorResponse({
        code: apiError.code,
        message: apiError.publicMessage,
        eventId: apiError.eventId,
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
        message: error.publicMessage
      }),
      error.statusCode
    );
  });

  registerHealthRoutes(app, dependencies.config);
  registerWebhookRoutes(app, dependencies);

  return app;
};
