export class QueueConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QueueConfigurationError";
  }
}

export class RetryableDeliveryError extends Error {
  readonly reasonCode: string;

  constructor(message: string, reasonCode = "retryable_delivery_failure") {
    super(message);
    this.name = "RetryableDeliveryError";
    this.reasonCode = reasonCode;
  }
}

export class NonRetryableDeliveryError extends Error {
  readonly reasonCode: string;

  constructor(message: string, reasonCode = "non_retryable_delivery_failure") {
    super(message);
    this.name = "NonRetryableDeliveryError";
    this.reasonCode = reasonCode;
  }
}
