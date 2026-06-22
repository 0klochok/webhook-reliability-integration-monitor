import { createHash } from "node:crypto";

import type { ProviderId } from "@webhook-monitor/core";

export interface WebhookRateLimitInput {
  readonly providerId: ProviderId | string;
  readonly clientKey: string;
  readonly now?: Date;
}

export interface WebhookRateLimitAllowedResult {
  readonly allowed: true;
  readonly keyHash: string;
}

export interface WebhookRateLimitRejectedResult {
  readonly allowed: false;
  readonly keyHash: string;
  readonly retryAfterSeconds: number;
}

export type WebhookRateLimitResult = WebhookRateLimitAllowedResult | WebhookRateLimitRejectedResult;

export interface WebhookRateLimiter {
  check(input: WebhookRateLimitInput): WebhookRateLimitResult;
}

export interface CreateInMemoryWebhookRateLimiterOptions {
  readonly windowMs: number;
  readonly maxRequests: number;
  readonly clock?: () => Date;
}

interface RateLimitBucket {
  count: number;
  resetAtMs: number;
}

const hashKey = (value: string): string =>
  createHash("sha256").update(value).digest("hex").slice(0, 16);

export const createInMemoryWebhookRateLimiter = (
  options: CreateInMemoryWebhookRateLimiterOptions
): WebhookRateLimiter => {
  const buckets = new Map<string, RateLimitBucket>();
  const clock = options.clock ?? (() => new Date());

  return {
    check: (input) => {
      const nowMs = (input.now ?? clock()).getTime();
      const key = `${input.providerId}:${input.clientKey || "unknown-client"}`;
      const keyHash = hashKey(key);
      const existingBucket = buckets.get(key);
      const bucket =
        existingBucket && existingBucket.resetAtMs > nowMs
          ? existingBucket
          : {
              count: 0,
              resetAtMs: nowMs + options.windowMs
            };

      bucket.count += 1;
      buckets.set(key, bucket);

      if (bucket.count <= options.maxRequests) {
        return {
          allowed: true,
          keyHash
        };
      }

      return {
        allowed: false,
        keyHash,
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAtMs - nowMs) / 1000))
      };
    }
  };
};
