import { randomUUID } from "node:crypto";

import { Queue } from "bullmq";

import { assertLocalRedisUrl, resolveRedisUrl } from "../connection.js";
import type { DeliveryJobData } from "../delivery-job.js";
import { webhookDeliveryQueueName } from "../names.js";

export const createTestQueueName = (suffix = randomUUID()): string =>
  `${webhookDeliveryQueueName}-test-${suffix}`;

export const assertSafeRedisTestUrl = (redisUrl = resolveRedisUrl()): void => {
  assertLocalRedisUrl(redisUrl);
};

export const obliterateLocalTestQueue = async (
  queue: Queue<DeliveryJobData>,
  redisUrl = resolveRedisUrl()
): Promise<void> => {
  assertSafeRedisTestUrl(redisUrl);
  await queue.obliterate({ force: true });
};
