import { serve } from "@hono/node-server";
import { createLogger, redactObject } from "@webhook-monitor/core";
import {
  checkDatabaseConnection,
  createDashboardRepository,
  createDatabaseClient,
  createWebhookEventRepository
} from "@webhook-monitor/db";
import { createBullMqDeliveryQueue } from "@webhook-monitor/queue";

import { createApp } from "./app.js";
import { loadApiConfig, loadLocalApiEnv } from "./config.js";

loadLocalApiEnv({ allowExampleFallback: true });

const config = loadApiConfig();
const logger = createLogger({
  service: config.serviceName,
  level: config.logLevel
});
const database = createDatabaseClient({
  databaseUrl: config.databaseUrl,
  allowExampleFallback: true
});
const deliveryQueue = createBullMqDeliveryQueue({
  redisUrl: config.redisUrl
});
const app = createApp({
  config,
  webhookEvents: createWebhookEventRepository(database.db),
  dashboard: createDashboardRepository(database.db),
  deliveryQueue,
  databaseReadiness: () => checkDatabaseConnection(database),
  queueReadiness: () => deliveryQueue.checkReadiness(),
  logger
});

const server = serve(
  {
    fetch: app.fetch,
    hostname: config.host,
    port: config.port
  },
  (info) => {
    logger.info("API server listening.", {
      address: info.address,
      port: info.port,
      dashboardPath: "/dashboard"
    });
  }
);

let isShuttingDown = false;

const shutdown = (signal: NodeJS.Signals): void => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info("API shutdown started.", { signal });

  server.close(() => {
    Promise.all([database.close(), deliveryQueue.close()])
      .then(() => {
        logger.info("API shutdown completed.");
        process.exit(0);
      })
      .catch((error: unknown) => {
        logger.error("API shutdown failed.", {
          errorCode: "internal_error",
          error: error instanceof Error ? error : undefined,
          diagnostics: redactObject({
            DATABASE_URL: config.databaseUrl,
            REDIS_URL: config.redisUrl
          })
        });
        process.exit(1);
      });
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
