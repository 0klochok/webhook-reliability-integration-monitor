import type { AppErrorCode, ErrorLogLevel } from "./errors.js";
import { redactObject } from "./redaction.js";

export type LogLevel = ErrorLogLevel | "silent";

export interface LogFields {
  readonly correlationId?: string;
  readonly requestId?: string;
  readonly eventId?: string;
  readonly providerId?: string;
  readonly externalEventId?: string;
  readonly jobId?: string;
  readonly errorCode?: AppErrorCode | string;
  readonly [key: string]: unknown;
}

export interface StructuredLogRecord extends Record<string, unknown> {
  readonly timestamp: string;
  readonly level: ErrorLogLevel;
  readonly service: string;
  readonly message: string;
}

export type LogSink = (record: StructuredLogRecord) => void;

export interface Logger {
  readonly service: string;
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  child(fields: LogFields): Logger;
}

export interface CreateLoggerOptions {
  readonly service: string;
  readonly level?: LogLevel;
  readonly sink?: LogSink;
  readonly baseFields?: LogFields;
  readonly clock?: () => Date;
}

export interface MemoryLogger extends Logger {
  readonly records: StructuredLogRecord[];
}

const logLevelWeights: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 50
};

export const logLevels = ["debug", "info", "warn", "error", "silent"] as const;

export const parseLogLevel = (value: string | undefined, fallback: LogLevel = "info"): LogLevel => {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (logLevels.includes(normalized as LogLevel)) {
    return normalized as LogLevel;
  }

  throw new Error("LOG_LEVEL must be one of debug, info, warn, error, or silent.");
};

const defaultSink: LogSink = (record) => {
  const line = JSON.stringify(record);

  if (record.level === "error") {
    console.error(line);
    return;
  }

  if (record.level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
};

const normalizeError = (error: Error): Record<string, unknown> => ({
  name: error.name,
  message: error.message,
  code: "code" in error && typeof error.code === "string" ? (error.code as string) : undefined
});

const normalizeFields = (fields: LogFields | undefined): Record<string, unknown> => {
  if (!fields) {
    return {};
  }

  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fields)) {
    normalized[key] = value instanceof Error ? normalizeError(value) : value;
  }

  return redactObject(normalized);
};

export const createLogger = (options: CreateLoggerOptions): Logger => {
  const level = options.level ?? "info";
  const sink = options.sink ?? defaultSink;
  const clock = options.clock ?? (() => new Date());
  const baseFields = options.baseFields ?? {};

  const log = (recordLevel: ErrorLogLevel, message: string, fields?: LogFields): void => {
    if (logLevelWeights[recordLevel] < logLevelWeights[level]) {
      return;
    }

    sink({
      timestamp: clock().toISOString(),
      level: recordLevel,
      service: options.service,
      message,
      ...normalizeFields(baseFields),
      ...normalizeFields(fields)
    });
  };

  return {
    service: options.service,
    debug: (message, fields) => log("debug", message, fields),
    info: (message, fields) => log("info", message, fields),
    warn: (message, fields) => log("warn", message, fields),
    error: (message, fields) => log("error", message, fields),
    child: (fields) =>
      createLogger({
        ...options,
        level,
        sink,
        clock,
        baseFields: {
          ...baseFields,
          ...fields
        }
      })
  };
};

export const createMemoryLogger = (
  options: Omit<CreateLoggerOptions, "sink"> & { readonly level?: LogLevel }
): MemoryLogger => {
  const records: StructuredLogRecord[] = [];
  const logger = createLogger({
    ...options,
    sink: (record) => {
      records.push(record);
    }
  });

  return {
    ...logger,
    records
  };
};
