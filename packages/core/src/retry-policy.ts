import { z } from "zod";

export const retryPolicySchema = z
  .object({
    maxAttempts: z.number().int().positive(),
    initialDelayMs: z.number().int().nonnegative(),
    backoffMultiplier: z.number().positive(),
    maxDelayMs: z.number().int().nonnegative(),
    retryableStatusCodes: z.array(z.number().int().min(100).max(599)),
    retryableErrorCodes: z.array(z.string().min(1)).optional(),
    deadLetterAfterMaxAttempts: z.boolean()
  })
  .strict()
  .refine((policy) => policy.maxDelayMs >= policy.initialDelayMs, {
    message: "maxDelayMs must be greater than or equal to initialDelayMs",
    path: ["maxDelayMs"]
  });

export type RetryPolicy = z.infer<typeof retryPolicySchema>;

export const defaultRetryPolicy = retryPolicySchema.parse({
  maxAttempts: 3,
  initialDelayMs: 100,
  backoffMultiplier: 2,
  maxDelayMs: 2_000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrorCodes: ["ECONNRESET", "ETIMEDOUT"],
  deadLetterAfterMaxAttempts: true
});

const assertPositiveAttemptNumber = (attemptNumber: number): void => {
  if (!Number.isInteger(attemptNumber) || attemptNumber < 1) {
    throw new RangeError("attemptNumber must be a positive integer");
  }
};

export const calculateRetryDelayMs = (
  attemptNumber: number,
  policy: RetryPolicy = defaultRetryPolicy
): number => {
  assertPositiveAttemptNumber(attemptNumber);

  const exponent = attemptNumber - 1;
  const delay = policy.initialDelayMs * policy.backoffMultiplier ** exponent;

  return Math.min(Math.round(delay), policy.maxDelayMs);
};

export const shouldRetryAttempt = (
  attemptNumber: number,
  policy: RetryPolicy = defaultRetryPolicy
): boolean => {
  assertPositiveAttemptNumber(attemptNumber);

  return attemptNumber < policy.maxAttempts;
};

export const isRetryableHttpStatus = (
  statusCode: number,
  policy: RetryPolicy = defaultRetryPolicy
): boolean => policy.retryableStatusCodes.includes(statusCode);
