import { serve } from "@hono/node-server";
import { createDatabaseClient, createWebhookEventRepository } from "@webhook-monitor/db";
import { createNoopDeliveryQueue } from "@webhook-monitor/queue";

import { createApp } from "./app.js";
import { loadApiConfig, loadLocalApiEnv } from "./config.js";

loadLocalApiEnv({ allowExampleFallback: true });

const config = loadApiConfig();
const database = createDatabaseClient({
  allowExampleFallback: true
});
const app = createApp({
  config,
  webhookEvents: createWebhookEventRepository(database.db),
  deliveryQueue: createNoopDeliveryQueue()
});

const server = serve(
  {
    fetch: app.fetch,
    hostname: config.host,
    port: config.port
  },
  (info) => {
    console.log(`webhook-reliability-api listening on http://${info.address}:${info.port}`);
  }
);

let isShuttingDown = false;

const shutdown = (signal: NodeJS.Signals): void => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`Received ${signal}; shutting down webhook-reliability-api.`);

  server.close(() => {
    database
      .close()
      .then(() => {
        process.exit(0);
      })
      .catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : "Failed to close database client.");
        process.exit(1);
      });
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
