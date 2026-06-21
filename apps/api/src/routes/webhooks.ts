import type { Hono } from "hono";

import { ingestWebhook, type IngestWebhookDependencies } from "../services/ingest-webhook.js";

const headersToRecord = (headers: Headers): Record<string, string | undefined> => {
  const result: Record<string, string | undefined> = {};

  headers.forEach((value, key) => {
    result[key] = value;
  });

  return result;
};

export const registerWebhookRoutes = (app: Hono, dependencies: IngestWebhookDependencies): void => {
  app.post("/webhooks/:provider", async (context) => {
    const result = await ingestWebhook(dependencies, {
      providerParam: context.req.param("provider"),
      rawBody: await context.req.text(),
      headers: headersToRecord(context.req.raw.headers)
    });

    return context.json(result.body, result.statusCode);
  });
};
