import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { Queue } from "bullmq";
import { Redis } from "ioredis";

import { assertLocalRedisUrl, closeRedisConnection, resolveRedisUrl } from "../connection.js";
import { webhookDeliveryQueueName } from "../names.js";

const repoRoot = dirname(fileURLToPath(new URL("../../../../", import.meta.url)));

const parseEnvValue = (value: string): string => {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
};

const loadEnvFileIfExists = (path: string): void => {
  if (!existsSync(path)) {
    return;
  }

  const contents = readFileSync(path, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex < 1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = parseEnvValue(trimmed.slice(separatorIndex + 1));

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

const loadLocalQueueEnv = (): void => {
  loadEnvFileIfExists(join(repoRoot, ".env"));
  loadEnvFileIfExists(join(repoRoot, ".env.example"));
};

export const resetDeliveryQueue = async (): Promise<void> => {
  loadLocalQueueEnv();

  const redisUrl = resolveRedisUrl();
  assertLocalRedisUrl(redisUrl);
  const redisTarget = new URL(redisUrl).host;

  const connection = new Redis(redisUrl, {
    connectionName: "webhook-delivery-queue-reset",
    connectTimeout: 1_000,
    commandTimeout: 2_000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null
  });
  connection.on("error", () => undefined);
  const queue = new Queue(webhookDeliveryQueueName, {
    connection
  });
  queue.on("error", () => undefined);

  try {
    await queue.obliterate({ force: true });
  } catch (cause) {
    throw new Error(
      `Redis is unreachable at ${redisTarget}. Start local Redis with docker compose -f .\\infra\\docker-compose.yml up -d redis before resetting the queue.`,
      { cause }
    );
  } finally {
    await queue.close();
    await closeRedisConnection(connection);
  }
};

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectRun) {
  resetDeliveryQueue()
    .then(() => {
      console.log("Local BullMQ delivery queue reset.");
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
