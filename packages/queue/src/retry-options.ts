import {
  calculateRetryDelayMs,
  defaultRetryPolicy,
  retryPolicySchema,
  type RetryPolicy
} from "@webhook-monitor/core";
import type { JobsOptions } from "bullmq";

import { NonRetryableDeliveryError, QueueConfigurationError } from "./errors.js";

export const deliveryBackoffStrategyName = "capped-exponential" as const;

export interface RetryPolicyEnv {
  readonly DELIVERY_MAX_ATTEMPTS?: string;
  readonly DELIVERY_INITIAL_DELAY_MS?: string;
  readonly DELIVERY_BACKOFF_MULTIPLIER?: string;
  readonly DELIVERY_MAX_DELAY_MS?: string;
}

const parseIntegerEnv = (
  env: RetryPolicyEnv,
  key: keyof RetryPolicyEnv,
  fallback: number,
  options: {
    readonly minimum: number;
  }
): number => {
  const rawValue = env[key]?.trim();

  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value < options.minimum) {
    throw new QueueConfigurationError(`${key} must be an integer >= ${options.minimum}.`);
  }

  return value;
};

const parseNumberEnv = (
  env: RetryPolicyEnv,
  key: keyof RetryPolicyEnv,
  fallback: number,
  options: {
    readonly minimumExclusive: number;
  }
): number => {
  const rawValue = env[key]?.trim();

  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value) || value <= options.minimumExclusive) {
    throw new QueueConfigurationError(`${key} must be a number > ${options.minimumExclusive}.`);
  }

  return value;
};

export const createRetryPolicyFromEnv = (
  env: RetryPolicyEnv = process.env,
  basePolicy: RetryPolicy = defaultRetryPolicy
): RetryPolicy =>
  retryPolicySchema.parse({
    ...basePolicy,
    maxAttempts: parseIntegerEnv(env, "DELIVERY_MAX_ATTEMPTS", basePolicy.maxAttempts, {
      minimum: 1
    }),
    initialDelayMs: parseIntegerEnv(env, "DELIVERY_INITIAL_DELAY_MS", basePolicy.initialDelayMs, {
      minimum: 0
    }),
    backoffMultiplier: parseNumberEnv(
      env,
      "DELIVERY_BACKOFF_MULTIPLIER",
      basePolicy.backoffMultiplier,
      {
        minimumExclusive: 0
      }
    ),
    maxDelayMs: parseIntegerEnv(env, "DELIVERY_MAX_DELAY_MS", basePolicy.maxDelayMs, {
      minimum: 0
    })
  });

export const createDeliveryJobOptions = (
  retryPolicy: RetryPolicy = defaultRetryPolicy
): JobsOptions => ({
  attempts: retryPolicy.maxAttempts,
  backoff: {
    type: deliveryBackoffStrategyName
  },
  removeOnComplete: false,
  removeOnFail: false
});

export const createDeliveryBackoffStrategy =
  (retryPolicy: RetryPolicy = defaultRetryPolicy) =>
  (attemptsMade: number, type?: string, error?: Error): number => {
    if (error instanceof NonRetryableDeliveryError || error?.name === "NonRetryableDeliveryError") {
      return -1;
    }

    if (type !== deliveryBackoffStrategyName) {
      throw new QueueConfigurationError(`Unsupported BullMQ backoff strategy "${type ?? ""}".`);
    }

    return calculateRetryDelayMs(attemptsMade, retryPolicy);
  };
