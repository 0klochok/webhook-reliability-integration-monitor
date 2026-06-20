import { pathToFileURL } from "node:url";

import {
  createPayloadHash,
  normalizedEventSchemaVersion,
  type JsonValue,
  type NormalizedEvent,
  type ProviderId
} from "@webhook-monitor/core";

import { createDatabaseClient, type CreateDatabaseClientOptions } from "../client.js";
import { resolveDatabaseUrl } from "../env.js";
import {
  createDeadLetterEventsRepository,
  createDeliveryAttemptsRepository,
  createManualReplaysRepository,
  createWebhookEventRepository
} from "../repositories/index.js";
import { resetDatabase } from "./reset.js";

interface SeedEventInput {
  readonly providerId: ProviderId;
  readonly externalEventId: string;
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly receivedAt: Date;
  readonly payload: JsonValue;
  readonly signatureVerificationRequired: boolean;
}

const createSeedEvent = (input: SeedEventInput): NormalizedEvent => ({
  providerId: input.providerId,
  externalEventId: input.externalEventId,
  eventType: input.eventType,
  occurredAt: input.occurredAt,
  receivedAt: input.receivedAt,
  idempotencyKey: input.externalEventId,
  payload: input.payload,
  payloadHash: createPayloadHash(input.payload),
  signatureVerificationRequired: input.signatureVerificationRequired,
  schemaVersion: normalizedEventSchemaVersion
});

export const seedDatabase = async (options: CreateDatabaseClientOptions = {}): Promise<void> => {
  const databaseUrl = resolveDatabaseUrl({
    ...options,
    allowExampleFallback: options.allowExampleFallback ?? true
  });

  await resetDatabase({ ...options, databaseUrl });

  const client = createDatabaseClient({
    ...options,
    databaseUrl
  });

  try {
    const webhookEvents = createWebhookEventRepository(client.db);
    const deliveryAttempts = createDeliveryAttemptsRepository(client.db);
    const deadLetterEvents = createDeadLetterEventsRepository(client.db);
    const manualReplays = createManualReplaysRepository(client.db);

    const deliveredReceivedAt = new Date("2026-06-20T12:00:00.000Z");
    const deliveredCompletedAt = new Date("2026-06-20T12:00:02.000Z");
    const delivered = await webhookEvents.createWithInitialStatusHistory({
      normalizedEvent: createSeedEvent({
        providerId: "stripe-sample",
        externalEventId: "evt_seed_delivered",
        eventType: "invoice.payment_succeeded",
        occurredAt: new Date("2026-06-20T11:59:30.000Z"),
        receivedAt: deliveredReceivedAt,
        payload: {
          id: "evt_seed_delivered",
          object: "event",
          type: "invoice.payment_succeeded",
          livemode: false
        },
        signatureVerificationRequired: true
      }),
      currentStatus: "received",
      createdAt: deliveredReceivedAt,
      updatedAt: deliveredReceivedAt,
      initialHistory: {
        reasonCode: "seed_received",
        message: "Seeded delivered event received.",
        createdAt: deliveredReceivedAt
      }
    });

    await webhookEvents.transitionStatus({
      eventId: delivered.event.id,
      toStatus: "delivered",
      reasonCode: "seed_delivery_succeeded",
      message: "Seeded event delivered to the fake downstream target.",
      changedAt: deliveredCompletedAt
    });

    await deliveryAttempts.createDeliveryAttempt({
      eventId: delivered.event.id,
      attemptNumber: 1,
      status: "succeeded",
      targetUrl: "http://localhost:3999/mock-downstream",
      httpStatusCode: 200,
      durationMs: 42,
      startedAt: deliveredReceivedAt,
      completedAt: deliveredCompletedAt,
      createdAt: deliveredReceivedAt
    });

    const retryReceivedAt = new Date("2026-06-20T12:05:00.000Z");
    const retryFailedAt = new Date("2026-06-20T12:05:01.000Z");
    const retry = await webhookEvents.createWithInitialStatusHistory({
      normalizedEvent: createSeedEvent({
        providerId: "generic-http",
        externalEventId: "evt_seed_retryable",
        eventType: "order.updated",
        occurredAt: new Date("2026-06-20T12:04:45.000Z"),
        receivedAt: retryReceivedAt,
        payload: {
          eventId: "evt_seed_retryable",
          eventType: "order.updated",
          source: "local-seed"
        },
        signatureVerificationRequired: false
      }),
      currentStatus: "received",
      createdAt: retryReceivedAt,
      updatedAt: retryReceivedAt,
      initialHistory: {
        reasonCode: "seed_received",
        createdAt: retryReceivedAt
      }
    });

    await webhookEvents.transitionStatus({
      eventId: retry.event.id,
      toStatus: "failed_retryable",
      reasonCode: "seed_downstream_500",
      message: "Fake downstream returned a retryable failure.",
      changedAt: retryFailedAt
    });

    await deliveryAttempts.createDeliveryAttempt({
      eventId: retry.event.id,
      attemptNumber: 1,
      status: "failed_retryable",
      targetUrl: "http://localhost:3999/mock-downstream",
      httpStatusCode: 500,
      errorCode: "DOWNSTREAM_500",
      errorMessage: "Fake downstream failure for local demo seed data.",
      durationMs: 81,
      nextRetryAt: new Date("2026-06-20T12:05:05.000Z"),
      startedAt: retryReceivedAt,
      completedAt: retryFailedAt,
      createdAt: retryReceivedAt
    });

    const deadLetterReceivedAt = new Date("2026-06-20T12:10:00.000Z");
    const deadLetteredAt = new Date("2026-06-20T12:10:20.000Z");
    const deadLetter = await webhookEvents.createWithInitialStatusHistory({
      normalizedEvent: createSeedEvent({
        providerId: "mock-crm",
        externalEventId: "evt_seed_dead_lettered",
        eventType: "company.updated",
        occurredAt: new Date("2026-06-20T12:09:45.000Z"),
        receivedAt: deadLetterReceivedAt,
        payload: {
          eventId: "evt_seed_dead_lettered",
          action: "company.updated",
          companyId: "company_local_demo"
        },
        signatureVerificationRequired: false
      }),
      currentStatus: "received",
      createdAt: deadLetterReceivedAt,
      updatedAt: deadLetterReceivedAt,
      initialHistory: {
        reasonCode: "seed_received",
        createdAt: deadLetterReceivedAt
      }
    });

    await deliveryAttempts.createDeliveryAttempt({
      eventId: deadLetter.event.id,
      attemptNumber: 3,
      status: "failed_permanent",
      targetUrl: "http://localhost:3999/mock-downstream",
      httpStatusCode: 422,
      errorCode: "VALIDATION_FAILED",
      errorMessage: "Fake permanent downstream validation failure.",
      durationMs: 67,
      startedAt: new Date("2026-06-20T12:10:19.000Z"),
      completedAt: deadLetteredAt,
      createdAt: deadLetterReceivedAt
    });

    await webhookEvents.transitionStatus({
      eventId: deadLetter.event.id,
      toStatus: "dead_lettered",
      reasonCode: "seed_max_attempts_exhausted",
      message: "Seeded event exhausted fake retry attempts.",
      changedAt: deadLetteredAt
    });

    await deadLetterEvents.createDeadLetterEvent({
      eventId: deadLetter.event.id,
      reasonCode: "max_attempts_exhausted",
      errorMessage: "Fake permanent downstream validation failure.",
      finalAttemptNumber: 3,
      payloadSnapshot: deadLetter.event.payload,
      deadLetteredAt,
      createdAt: deadLetteredAt
    });

    await manualReplays.createManualReplay({
      originalEventId: deadLetter.event.id,
      requestedBy: "local-operator",
      reason: "Demo replay request for a dead-lettered event.",
      status: "queued",
      metadata: {
        source: "local-seed"
      },
      requestedAt: new Date("2026-06-20T12:15:00.000Z"),
      createdAt: new Date("2026-06-20T12:15:00.000Z")
    });
  } finally {
    await client.close();
  }
};

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectRun) {
  seedDatabase()
    .then(() => {
      console.log("Local fake demo database records seeded.");
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
