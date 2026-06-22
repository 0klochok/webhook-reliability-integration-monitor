import { eventStatusSchema, type Logger } from "@webhook-monitor/core";
import {
  ManualReplayNotAllowedError,
  WebhookEventNotFoundError,
  type createDashboardRepository
} from "@webhook-monitor/db";
import type { DeliveryQueuePort } from "@webhook-monitor/queue";

import { ApiError, toApiError } from "../errors.js";
import { createErrorResponse } from "../services/response-shapes.js";
import type { ApiApp, ApiContext } from "../types.js";
import { renderDeadLetterView } from "./dead-letter-view.js";
import { renderEventDetailView } from "./event-detail-view.js";
import { renderEventListView } from "./event-list-view.js";
import { renderErrorPage } from "./layout.js";
import { renderSummaryView } from "./summary-view.js";

export type DashboardRepository = ReturnType<typeof createDashboardRepository>;

export interface DashboardRouteDependencies {
  readonly dashboard: DashboardRepository;
  readonly deliveryQueue: DeliveryQueuePort;
  readonly logger: Logger;
  readonly clock?: () => Date;
}

interface DashboardSuccessResponse<TData> {
  readonly ok: true;
  readonly data: TData;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const createSuccessResponse = <TData>(data: TData): DashboardSuccessResponse<TData> => ({
  ok: true,
  data
});

const validateEventId = (eventId: string): void => {
  if (!uuidPattern.test(eventId)) {
    throw new ApiError({
      code: "invalid_event_id",
      statusCode: 400,
      publicMessage: "Event ID must be a valid UUID."
    });
  }
};

const parseStatusFilter = (status: string | undefined) => {
  if (!status) {
    return undefined;
  }

  const result = eventStatusSchema.safeParse(status);

  if (!result.success) {
    throw new ApiError({
      code: "invalid_status_filter",
      statusCode: 400,
      publicMessage: "Unsupported event status filter."
    });
  }

  return result.data;
};

const routeErrorToApiError = (error: unknown): ApiError => {
  if (error instanceof WebhookEventNotFoundError) {
    return new ApiError({
      code: "not_found",
      statusCode: 404,
      publicMessage: "Webhook event was not found."
    });
  }

  if (error instanceof ManualReplayNotAllowedError) {
    return new ApiError({
      code: "replay_not_allowed",
      statusCode: 409,
      publicMessage: "Manual replay is not allowed for the current event status."
    });
  }

  return toApiError(error);
};

const jsonError = (context: ApiContext, error: unknown): Response => {
  const apiError = routeErrorToApiError(error);
  const correlationId = context.get("correlationId");

  return context.json(
    createErrorResponse({
      code: apiError.code,
      message: apiError.publicMessage,
      eventId: apiError.eventId,
      correlationId,
      issues: apiError.issues
    }),
    apiError.statusCode
  );
};

const htmlError = (context: ApiContext, error: unknown): Response => {
  const apiError = routeErrorToApiError(error);

  return context.html(
    renderErrorPage(apiError.statusCode, apiError.publicMessage, apiError.publicMessage),
    apiError.statusCode
  );
};

const replayStatusMessage = (value: string | undefined): string | undefined => {
  if (value === "queued") {
    return "Manual replay was queued for worker delivery.";
  }

  return undefined;
};

const createManualReplay = async (
  dependencies: DashboardRouteDependencies,
  eventId: string,
  correlationId: string
) => {
  const requestedAt = dependencies.clock?.() ?? new Date();
  const replayRequest = await dependencies.dashboard.createManualReplayRequest({
    eventId,
    requestedBy: "local-operator",
    reason: "Manual replay requested from the local dashboard.",
    requestedAt,
    metadata: {
      source: "local_dashboard",
      correlationId
    }
  });

  let queueJobId: string;

  try {
    const enqueueResult = await dependencies.deliveryQueue.enqueueDelivery({
      eventId: replayRequest.event.id,
      providerId: replayRequest.event.providerId,
      externalEventId: replayRequest.event.externalEventId,
      correlationId,
      enqueuedAt: requestedAt.toISOString(),
      replayOfEventId: replayRequest.event.id,
      manualReplayId: replayRequest.manualReplay.id,
      requestedBy: replayRequest.manualReplay.requestedBy,
      initialAttemptNumber: replayRequest.initialAttemptNumber
    });
    queueJobId = enqueueResult.queueJobId;
  } catch (cause) {
    const failedAt = dependencies.clock?.() ?? new Date();
    await dependencies.dashboard.markManualReplayFailed({
      replayId: replayRequest.manualReplay.id,
      errorCode: "replay_enqueue_failed",
      errorMessage: "Replay delivery job could not be queued.",
      completedAt: failedAt
    });

    throw new ApiError({
      code: "replay_enqueue_failed",
      statusCode: 503,
      publicMessage: "Manual replay could not be queued for delivery.",
      eventId,
      cause
    });
  }

  const queuedAt = dependencies.clock?.() ?? new Date();
  const manualReplay = await dependencies.dashboard.markManualReplayQueued({
    replayId: replayRequest.manualReplay.id,
    queueJobId,
    queuedAt
  });

  return {
    event: {
      id: replayRequest.event.id,
      providerId: replayRequest.event.providerId,
      externalEventId: replayRequest.event.externalEventId,
      currentStatus: replayRequest.event.currentStatus
    },
    manualReplay,
    queueJobId,
    initialAttemptNumber: replayRequest.initialAttemptNumber
  };
};

export const registerDashboardRoutes = (
  app: ApiApp,
  dependencies: DashboardRouteDependencies
): void => {
  app.get("/dashboard", async (context) => {
    try {
      const summary = await dependencies.dashboard.getDashboardSummary();
      return context.html(renderSummaryView(summary));
    } catch (error) {
      return htmlError(context, error);
    }
  });

  app.get("/dashboard/events", async (context) => {
    try {
      const status = parseStatusFilter(context.req.query("status"));
      const events = await dependencies.dashboard.listDashboardEvents({ status });
      return context.html(renderEventListView(events, status));
    } catch (error) {
      return htmlError(context, error);
    }
  });

  app.get("/dashboard/events/:eventId", async (context) => {
    try {
      const eventId = context.req.param("eventId");
      validateEventId(eventId);
      const detail = await dependencies.dashboard.getEventDetail(eventId);

      if (!detail) {
        throw new ApiError({
          code: "not_found",
          statusCode: 404,
          publicMessage: "Webhook event was not found."
        });
      }

      return context.html(
        renderEventDetailView(detail, replayStatusMessage(context.req.query("replay")))
      );
    } catch (error) {
      return htmlError(context, error);
    }
  });

  app.get("/dashboard/dead-letter", async (context) => {
    try {
      const events = await dependencies.dashboard.listDashboardDeadLetters();
      return context.html(renderDeadLetterView(events));
    } catch (error) {
      return htmlError(context, error);
    }
  });

  app.post("/dashboard/events/:eventId/replay", async (context) => {
    try {
      const eventId = context.req.param("eventId");
      validateEventId(eventId);
      await createManualReplay(dependencies, eventId, context.get("correlationId"));

      return context.redirect(`/dashboard/events/${eventId}?replay=queued`, 303);
    } catch (error) {
      return htmlError(context, error);
    }
  });

  app.get("/api/dashboard/summary", async (context) => {
    try {
      const summary = await dependencies.dashboard.getDashboardSummary();
      return context.json(createSuccessResponse(summary));
    } catch (error) {
      return jsonError(context, error);
    }
  });

  app.get("/api/dashboard/events", async (context) => {
    try {
      const status = parseStatusFilter(context.req.query("status"));
      const events = await dependencies.dashboard.listDashboardEvents({ status });
      return context.json(createSuccessResponse(events));
    } catch (error) {
      return jsonError(context, error);
    }
  });

  app.get("/api/dashboard/events/:eventId", async (context) => {
    try {
      const eventId = context.req.param("eventId");
      validateEventId(eventId);
      const detail = await dependencies.dashboard.getEventDetail(eventId);

      if (!detail) {
        throw new ApiError({
          code: "not_found",
          statusCode: 404,
          publicMessage: "Webhook event was not found."
        });
      }

      return context.json(createSuccessResponse(detail));
    } catch (error) {
      return jsonError(context, error);
    }
  });

  app.get("/api/dashboard/dead-letter", async (context) => {
    try {
      const events = await dependencies.dashboard.listDashboardDeadLetters();
      return context.json(createSuccessResponse(events));
    } catch (error) {
      return jsonError(context, error);
    }
  });

  app.post("/api/dashboard/events/:eventId/replay", async (context) => {
    try {
      const eventId = context.req.param("eventId");
      validateEventId(eventId);
      const replay = await createManualReplay(dependencies, eventId, context.get("correlationId"));

      return context.json(createSuccessResponse(replay));
    } catch (error) {
      return jsonError(context, error);
    }
  });
};
