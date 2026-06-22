import { createMemoryLogger } from "@webhook-monitor/core";
import {
  createDashboardRepository,
  createWebhookEventRepository,
  type DatabaseClient
} from "@webhook-monitor/db";
import {
  createDeliveryQueueJobId,
  type DeliveryQueuePort,
  type EnqueueDeliveryInput
} from "@webhook-monitor/queue";

import { createApp } from "../app.js";
import type { ApiConfig } from "../config.js";
import type { WebhookRateLimiter } from "../services/rate-limit.js";

export interface RecordingDeliveryQueue extends DeliveryQueuePort {
  readonly calls: ReadonlyArray<EnqueueDeliveryInput>;
  failNext(error?: Error): void;
}

export interface CreateApiTestHarnessInput {
  readonly client: DatabaseClient;
  readonly config?: Partial<ApiConfig>;
  readonly clock?: () => Date;
  readonly databaseReadiness?: () => Promise<void>;
  readonly queueReadiness?: () => Promise<void>;
  readonly webhookRateLimiter?: WebhookRateLimiter;
}

const defaultTestConfig: ApiConfig = {
  nodeEnv: "test",
  host: "localhost",
  port: 3000,
  serviceName: "webhook-reliability-api",
  databaseUrl: "postgres://webhook_monitor:webhook_monitor_password@localhost:5432/webhook_monitor",
  redisUrl: "redis://localhost:6379",
  stripeSampleWebhookSecret: "whsec_local_test_secret",
  signatureTimestampToleranceSeconds: 300,
  webhookMaxBodyBytes: 1_048_576,
  webhookRateLimitWindowMs: 60_000,
  webhookRateLimitMaxRequests: 120,
  logLevel: "silent"
};

export const createRecordingDeliveryQueue = (): RecordingDeliveryQueue => {
  const calls: EnqueueDeliveryInput[] = [];
  let nextError: Error | undefined;

  return {
    calls,
    failNext(error = new Error("Recording delivery queue failed.")) {
      nextError = error;
    },
    enqueueDelivery: async (input) => {
      if (nextError) {
        const error = nextError;
        nextError = undefined;
        throw error;
      }

      calls.push(input);

      return {
        queued: true,
        queueJobId: createDeliveryQueueJobId(input)
      };
    }
  };
};

export const createApiTestHarness = (input: CreateApiTestHarnessInput) => {
  const webhookEvents = createWebhookEventRepository(input.client.db);
  const deliveryQueue = createRecordingDeliveryQueue();
  const config = {
    ...defaultTestConfig,
    ...input.config
  };

  return {
    app: createApp({
      config,
      webhookEvents,
      dashboard: createDashboardRepository(input.client.db),
      deliveryQueue,
      clock: input.clock,
      databaseReadiness: input.databaseReadiness ?? (async () => undefined),
      queueReadiness: input.queueReadiness ?? (async () => undefined),
      webhookRateLimiter: input.webhookRateLimiter,
      logger: createMemoryLogger({
        service: config.serviceName,
        level: "silent"
      })
    }),
    config,
    deliveryQueue,
    webhookEvents
  };
};
