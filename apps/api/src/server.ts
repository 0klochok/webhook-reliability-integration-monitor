import { serve } from "@hono/node-server";
import {
  createDashboardRepository,
  createDatabaseClient,
  createWebhookEventRepository
} from "@webhook-monitor/db";
import { createBullMqDeliveryQueue } from "@webhook-monitor/queue";

import { createApp } from "./app.js";
import { loadApiConfig, loadLocalApiEnv } from "./config.js";

loadLocalApiEnv({ allowExampleFallback: true });

const config = loadApiConfig();
const database = createDatabaseClient({
  allowExampleFallback: true
});
const deliveryQueue = createBullMqDeliveryQueue();
const app = createApp({
  config,
  webhookEvents: createWebhookEventRepository(database.db),
  dashboard: createDashboardRepository(database.db),
  deliveryQueue
});

const server = serve(
  {
    fetch: app.fetch,
    hostname: config.host,
    port: config.port
  },
  (info) => {
    console.log(`webhook-reliability-api listening on http://${info.address}:${info.port}`);
    console.log(`dashboard available at http://${info.address}:${info.port}/dashboard`);
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
    Promise.all([database.close(), deliveryQueue.close()])
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
