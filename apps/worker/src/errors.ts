import { NonRetryableDeliveryError, RetryableDeliveryError } from "@webhook-monitor/queue";

export class MissingWebhookEventError extends NonRetryableDeliveryError {
  constructor(eventId: string) {
    super(`Webhook event "${eventId}" was not found.`, "missing_webhook_event");
    this.name = "MissingWebhookEventError";
  }
}

export class RetryableMockDeliveryError extends RetryableDeliveryError {
  constructor(message: string, reasonCode = "mock_downstream_retryable_failure") {
    super(message, reasonCode);
    this.name = "RetryableMockDeliveryError";
  }
}

export class PermanentMockDeliveryError extends NonRetryableDeliveryError {
  constructor(message: string, reasonCode = "mock_downstream_permanent_failure") {
    super(message, reasonCode);
    this.name = "PermanentMockDeliveryError";
  }
}
