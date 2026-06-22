export const redactedValue = "[redacted]" as const;

const sensitiveKeyPatterns = [
  "secret",
  "password",
  "token",
  "apikey",
  "api_key",
  "authorization",
  "cookie",
  "stripe_sample_webhook_secret",
  "database_url",
  "redis_url"
] as const;

export const isSensitiveKey = (key: string): boolean => {
  const normalized = key.replace(/[-\s]/g, "_").toLowerCase();
  return sensitiveKeyPatterns.some((pattern) => normalized.includes(pattern));
};

const redactUrlCredentials = (value: string): string => {
  try {
    const url = new URL(value);

    if (url.username || url.password) {
      return `${url.protocol}//${redactedValue}:${redactedValue}@${url.host}${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return value;
  }

  return value;
};

export const redactString = (value: string): string => redactUrlCredentials(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const redactValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry));
  }

  if (isRecord(value)) {
    return redactObject(value);
  }

  if (typeof value === "string") {
    return redactString(value);
  }

  return value;
};

export const redactObject = (input: Readonly<Record<string, unknown>>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    result[key] = isSensitiveKey(key) ? redactedValue : redactValue(value);
  }

  return result;
};

export const redactErrorMessage = (message: string): string => redactString(message);
