import type { EventStatus } from "@webhook-monitor/core";

import {
  printDashboardLink,
  printHttpResult,
  printObservedStatus,
  printScenarioStart,
  printSuccess
} from "../output.js";
import { pollUntil } from "../wait.js";
import type { ScenarioContext, ScenarioPlan, ScenarioStep } from "./types.js";

interface WebhookResponseBody {
  readonly ok?: boolean;
  readonly eventId?: string;
  readonly duplicate?: boolean;
}

interface DashboardSummaryResponse {
  readonly ok: true;
  readonly data: {
    readonly totalEventVolume: number;
  };
}

interface DashboardDetailResponse {
  readonly ok: true;
  readonly data: {
    readonly event: {
      readonly id: string;
      readonly currentStatus: EventStatus;
    };
    readonly manualReplays: ReadonlyArray<{
      readonly id: string;
      readonly status: string;
    }>;
  };
}

interface ReplayResponse {
  readonly ok: true;
  readonly data: {
    readonly manualReplay: {
      readonly id: string;
      readonly status: string;
    };
    readonly queueJobId: string;
    readonly initialAttemptNumber: number;
  };
}

export interface StepResult {
  readonly eventId?: string;
  readonly duplicate: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asWebhookResponseBody = (value: unknown): WebhookResponseBody => {
  if (!isRecord(value)) {
    return {};
  }

  return {
    ok: typeof value.ok === "boolean" ? value.ok : undefined,
    eventId: typeof value.eventId === "string" ? value.eventId : undefined,
    duplicate: typeof value.duplicate === "boolean" ? value.duplicate : undefined
  };
};

const parseDashboardSummary = (body: unknown): DashboardSummaryResponse => {
  if (
    isRecord(body) &&
    body.ok === true &&
    isRecord(body.data) &&
    typeof body.data.totalEventVolume === "number"
  ) {
    return body as unknown as DashboardSummaryResponse;
  }

  throw new Error("Dashboard summary JSON response had an unexpected shape.");
};

const parseDashboardDetail = (body: unknown): DashboardDetailResponse => {
  if (
    isRecord(body) &&
    body.ok === true &&
    isRecord(body.data) &&
    isRecord(body.data.event) &&
    typeof body.data.event.currentStatus === "string"
  ) {
    return body as unknown as DashboardDetailResponse;
  }

  throw new Error("Dashboard event detail JSON response had an unexpected shape.");
};

const parseReplayResponse = (body: unknown): ReplayResponse => {
  if (
    isRecord(body) &&
    body.ok === true &&
    isRecord(body.data) &&
    isRecord(body.data.manualReplay) &&
    typeof body.data.manualReplay.id === "string" &&
    typeof body.data.queueJobId === "string"
  ) {
    return body as unknown as ReplayResponse;
  }

  throw new Error("Manual replay JSON response had an unexpected shape.");
};

const statusList = (statuses: readonly EventStatus[]): string => statuses.join(", ");

export const jsonPost = (
  path: string,
  body: unknown,
  headers: Record<string, string> = {
    "content-type": "application/json"
  }
) => ({
  method: "POST" as const,
  path,
  headers,
  body: JSON.stringify(body)
});

export const createManualReplayRequest = (eventId: string) => ({
  method: "POST" as const,
  path: `/api/dashboard/events/${eventId}/replay`
});

export const executeStep = async (
  context: ScenarioContext,
  step: ScenarioStep
): Promise<StepResult> => {
  printScenarioStart({
    name: step.label,
    endpoint: `${step.request.method} ${step.request.path}`,
    providerId: step.providerId,
    externalEventId: step.externalEventId,
    expectedBehavior: step.expectedBehavior
  });

  const response = await context.http.request(step.request);
  printHttpResult(response);

  if (!step.expectedHttpStatuses.includes(response.status)) {
    throw new Error(
      `Expected HTTP status ${step.expectedHttpStatuses.join(" or ")} but received ${
        response.status
      }.`
    );
  }

  const body = asWebhookResponseBody(response.body);
  const duplicate = body.duplicate === true;

  if (
    step.expectedDuplicate !== undefined &&
    duplicate !== step.expectedDuplicate &&
    !(duplicate && step.allowExistingDuplicate)
  ) {
    throw new Error(`Expected duplicate=${step.expectedDuplicate} but received ${duplicate}.`);
  }

  if (duplicate && step.allowExistingDuplicate && step.expectedDuplicate === false) {
    printSuccess("Scenario event already exists locally; duplicate processing was prevented.");
    console.log("Run pnpm demo:reset before a fresh demo sequence.");
  }

  if (body.eventId) {
    console.log(`Persisted event id: ${body.eventId}`);
    printDashboardLink(context.config, body.eventId);
  }

  return {
    eventId: body.eventId,
    duplicate
  };
};

export const getDashboardSummaryTotal = async (context: ScenarioContext): Promise<number> => {
  const response = await context.http.request({
    method: "GET",
    path: "/api/dashboard/summary"
  });

  if (response.status !== 200) {
    throw new Error(`Expected dashboard summary HTTP 200 but received ${response.status}.`);
  }

  return parseDashboardSummary(response.body).data.totalEventVolume;
};

export const assertCleanDashboard = async (context: ScenarioContext): Promise<void> => {
  const totalEventVolume = await getDashboardSummaryTotal(context);

  if (totalEventVolume !== 0) {
    throw new Error(
      `simulator:all expects a clean demo database, but dashboard summary has ${totalEventVolume} events. Run pnpm demo:reset first.`
    );
  }
};

export const getEventDetail = async (
  context: ScenarioContext,
  eventId: string
): Promise<DashboardDetailResponse["data"]> => {
  const response = await context.http.request({
    method: "GET",
    path: `/api/dashboard/events/${eventId}`
  });

  if (response.status !== 200) {
    throw new Error(`Expected event detail HTTP 200 but received ${response.status}.`);
  }

  return parseDashboardDetail(response.body).data;
};

export const pollEventStatus = async (
  context: ScenarioContext,
  eventId: string,
  expectedStatuses: readonly EventStatus[]
): Promise<DashboardDetailResponse["data"]> => {
  const detail = await pollUntil({
    timeoutMs: context.config.pollTimeoutMs,
    intervalMs: context.config.pollIntervalMs,
    fetchValue: () => getEventDetail(context, eventId),
    isExpected: (value) => expectedStatuses.includes(value.event.currentStatus),
    describeValue: (value) => `status=${value.event.currentStatus}`,
    onTransition: printObservedStatus
  });

  printSuccess(`Final observed status matched ${statusList(expectedStatuses)}.`);
  printDashboardLink(context.config, eventId);
  return detail;
};

export const runWebhookScenario = async (
  context: ScenarioContext,
  plan: ScenarioPlan
): Promise<StepResult> => {
  const step = plan.steps[0];

  if (!step) {
    throw new Error(`Scenario ${plan.id} has no executable steps.`);
  }

  const result = await executeStep(context, step);

  if (result.eventId && plan.finalStatuses && !result.duplicate) {
    await pollEventStatus(context, result.eventId, plan.finalStatuses);
  }

  return result;
};

export const postManualReplay = async (
  context: ScenarioContext,
  eventId: string
): Promise<ReplayResponse["data"]> => {
  printScenarioStart({
    name: "Manual replay request",
    endpoint: `POST /api/dashboard/events/${eventId}/replay`,
    expectedBehavior: "queue a replay-specific delivery job"
  });

  const response = await context.http.request({
    ...createManualReplayRequest(eventId)
  });
  printHttpResult(response);

  if (response.status !== 200) {
    throw new Error(`Expected manual replay HTTP 200 but received ${response.status}.`);
  }

  const replay = parseReplayResponse(response.body).data;
  console.log(`Manual replay id: ${replay.manualReplay.id}`);
  console.log(`Replay queue job id: ${replay.queueJobId}`);
  console.log(`Initial replay attempt number: ${replay.initialAttemptNumber}`);
  return replay;
};
