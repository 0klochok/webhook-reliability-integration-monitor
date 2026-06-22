import { randomUUID } from "node:crypto";

const maxCorrelationIdLength = 128;
const correlationIdPattern = /^[A-Za-z0-9._:/=@+-]+$/;

export const isValidCorrelationId = (value: string): boolean => {
  const trimmed = value.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= maxCorrelationIdLength &&
    correlationIdPattern.test(trimmed)
  );
};

export const createCorrelationId = (): string => randomUUID();

export const resolveCorrelationId = (incomingValue: string | undefined): string => {
  const trimmed = incomingValue?.trim();
  return trimmed && isValidCorrelationId(trimmed) ? trimmed : createCorrelationId();
};
