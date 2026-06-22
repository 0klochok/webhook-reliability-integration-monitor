import type { AppErrorCode } from "./errors.js";
import { redactObject } from "./redaction.js";

export type NodeEnvironment = "development" | "test" | "production";

export interface ConfigIssue {
  readonly key: string;
  readonly message: string;
}

export class ConfigValidationError extends Error {
  readonly code: AppErrorCode = "config_invalid";
  readonly issues: readonly ConfigIssue[];
  readonly diagnostics: Record<string, unknown>;

  constructor(issues: readonly ConfigIssue[], diagnostics: Record<string, unknown> = {}) {
    super(
      `Runtime configuration is invalid: ${issues
        .map((issue) => `${issue.key}: ${issue.message}`)
        .join("; ")}`
    );
    this.name = "ConfigValidationError";
    this.issues = issues;
    this.diagnostics = redactObject(diagnostics);
  }
}

export const parseNodeEnvironment = (
  value: string | undefined,
  fallback: NodeEnvironment = "development"
): NodeEnvironment => {
  const normalized = value?.trim() || fallback;

  if (normalized === "development" || normalized === "test" || normalized === "production") {
    return normalized;
  }

  throw new Error("NODE_ENV must be development, test, or production.");
};

export const getOptionalEnv = (
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
  key: string
): string | undefined => {
  const value = env[key]?.trim();
  return value ? value : undefined;
};

export const parseRequiredStringEnv = (
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
  key: string
): string => {
  const value = getOptionalEnv(env, key);

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
};

export const parseIntegerEnv = (
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
  key: string,
  fallback: number,
  options: {
    readonly minimum?: number;
    readonly maximum?: number;
  } = {}
): number => {
  const rawValue = getOptionalEnv(env, key);

  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);
  const minimum = options.minimum ?? Number.MIN_SAFE_INTEGER;
  const maximum = options.maximum ?? Number.MAX_SAFE_INTEGER;

  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${key} must be an integer between ${minimum} and ${maximum}.`);
  }

  return value;
};

export const parseNumberEnv = (
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
  key: string,
  fallback: number,
  options: {
    readonly minimumExclusive?: number;
    readonly minimum?: number;
  } = {}
): number => {
  const rawValue = getOptionalEnv(env, key);

  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value)) {
    throw new Error(`${key} must be a finite number.`);
  }

  if (options.minimumExclusive !== undefined && value <= options.minimumExclusive) {
    throw new Error(`${key} must be greater than ${options.minimumExclusive}.`);
  }

  if (options.minimum !== undefined && value < options.minimum) {
    throw new Error(`${key} must be greater than or equal to ${options.minimum}.`);
  }

  return value;
};

export const parseUrlEnv = (
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
  key: string,
  options: {
    readonly required?: boolean;
    readonly fallback?: string;
    readonly protocols?: readonly string[];
  } = {}
): string => {
  const value = getOptionalEnv(env, key) ?? options.fallback;

  if (!value) {
    if (options.required) {
      throw new Error(`${key} is required.`);
    }

    return "";
  }

  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${key} must be a valid URL.`);
  }

  if (options.protocols && !options.protocols.includes(parsed.protocol)) {
    throw new Error(`${key} must use one of: ${options.protocols.join(", ")}.`);
  }

  return value;
};

export const collectConfigIssues = <TConfig>(
  buildConfig: () => TConfig,
  diagnostics: Record<string, unknown>
): TConfig => {
  const issues: ConfigIssue[] = [];

  try {
    return buildConfig();
  } catch (error) {
    issues.push({
      key: "runtime",
      message: error instanceof Error ? error.message : "Unknown configuration error."
    });
    throw new ConfigValidationError(issues, diagnostics);
  }
};
