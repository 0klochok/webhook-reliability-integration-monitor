import type { JsonObject, JsonValue } from "@webhook-monitor/core";
import type { WebhookEvent } from "@webhook-monitor/db";

export const mockDeliveryBehaviors = [
  "success",
  "fail-once-then-success",
  "fail-twice-then-success",
  "always-retryable-fail",
  "permanent-fail",
  "fail-until-manual-replay-success"
] as const;

export type MockDeliveryBehavior = (typeof mockDeliveryBehaviors)[number];

export interface MockDownstreamDeliveryInput {
  readonly event: WebhookEvent;
  readonly attemptNumber: number;
  readonly targetUrl: string;
  readonly manualReplayId?: string;
}

export type MockDownstreamDeliveryResult =
  | {
      readonly ok: true;
      readonly httpStatusCode: 200;
    }
  | {
      readonly ok: false;
      readonly retryable: true;
      readonly httpStatusCode: 503;
      readonly errorCode: string;
      readonly errorMessage: string;
    }
  | {
      readonly ok: false;
      readonly retryable: false;
      readonly httpStatusCode: 400;
      readonly errorCode: string;
      readonly errorMessage: string;
    };

export interface MockDownstreamClient {
  deliver(input: MockDownstreamDeliveryInput): Promise<MockDownstreamDeliveryResult>;
}

const behaviorSet = new Set<string>(mockDeliveryBehaviors);

const isJsonObject = (value: JsonValue | undefined): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getNestedString = (value: JsonValue, path: readonly string[]): string | undefined => {
  let current: JsonValue | undefined = value;

  for (const segment of path) {
    if (!isJsonObject(current)) {
      return undefined;
    }

    current = current[segment];
  }

  return typeof current === "string" ? current : undefined;
};

export const extractMockDeliveryBehavior = (payload: JsonValue): MockDeliveryBehavior => {
  const candidates = [
    getNestedString(payload, ["metadata", "deliveryBehavior"]),
    getNestedString(payload, ["payload", "deliveryBehavior"]),
    getNestedString(payload, ["data", "object", "metadata", "deliveryBehavior"]),
    getNestedString(payload, ["record", "attributes", "deliveryBehavior"]),
    getNestedString(payload, ["deliveryBehavior"])
  ];

  const behavior = candidates.find((candidate) => candidate && behaviorSet.has(candidate));

  return (behavior as MockDeliveryBehavior | undefined) ?? "success";
};

const retryableFailure = (
  behavior: MockDeliveryBehavior,
  attemptNumber: number
): MockDownstreamDeliveryResult => ({
  ok: false,
  retryable: true,
  httpStatusCode: 503,
  errorCode: "MOCK_DOWNSTREAM_RETRYABLE",
  errorMessage: `Mock downstream retryable failure for ${behavior} on attempt ${attemptNumber}.`
});

const permanentFailure = (): MockDownstreamDeliveryResult => ({
  ok: false,
  retryable: false,
  httpStatusCode: 400,
  errorCode: "MOCK_DOWNSTREAM_PERMANENT",
  errorMessage: "Mock downstream permanent failure."
});

const success = (): MockDownstreamDeliveryResult => ({
  ok: true,
  httpStatusCode: 200
});

export const createPayloadDrivenMockDownstreamClient = (): MockDownstreamClient => ({
  deliver: async (input) => {
    const behavior = extractMockDeliveryBehavior(input.event.payload);

    switch (behavior) {
      case "success":
        return success();
      case "fail-once-then-success":
        return input.attemptNumber <= 1
          ? retryableFailure(behavior, input.attemptNumber)
          : success();
      case "fail-twice-then-success":
        return input.attemptNumber <= 2
          ? retryableFailure(behavior, input.attemptNumber)
          : success();
      case "always-retryable-fail":
        return retryableFailure(behavior, input.attemptNumber);
      case "permanent-fail":
        return permanentFailure();
      case "fail-until-manual-replay-success":
        return input.manualReplayId ? success() : retryableFailure(behavior, input.attemptNumber);
    }
  }
});
