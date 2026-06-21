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

export interface RecordingDeliveryQueue extends DeliveryQueuePort {
  readonly calls: ReadonlyArray<EnqueueDeliveryInput>;
  failNext(error?: Error): void;
}

export interface CreateApiTestHarnessInput {
  readonly client: DatabaseClient;
  readonly config?: Partial<ApiConfig>;
  readonly clock?: () => Date;
}

const defaultTestConfig: ApiConfig = {
  host: "localhost",
  port: 3000,
  serviceName: "webhook-reliability-api",
  stripeSampleWebhookSecret: "whsec_local_test_secret",
  signatureTimestampToleranceSeconds: 300
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
      clock: input.clock
    }),
    config,
    deliveryQueue,
    webhookEvents
  };
};
