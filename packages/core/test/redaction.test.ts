import { describe, expect, it } from "vitest";

import { redactObject, redactString, redactedValue } from "../src/index.js";

describe("secret redaction", () => {
  it("redacts secret-like keys", () => {
    expect(
      redactObject({
        secret: "whsec_test",
        password: "local-password",
        token: "local-token",
        apiKey: "local-api-key",
        api_key: "local-api-key",
        authorization: "Bearer token",
        cookie: "session=secret",
        safe: "visible"
      })
    ).toEqual({
      secret: redactedValue,
      password: redactedValue,
      token: redactedValue,
      apiKey: redactedValue,
      api_key: redactedValue,
      authorization: redactedValue,
      cookie: redactedValue,
      safe: "visible"
    });
  });

  it("redacts nested secret values without mutating the original object", () => {
    const original = {
      providerId: "stripe-sample",
      nested: {
        STRIPE_SAMPLE_WEBHOOK_SECRET: "whsec_local_test_secret",
        externalEventId: "evt_test"
      }
    };

    const redacted = redactObject(original);

    expect(redacted).toEqual({
      providerId: "stripe-sample",
      nested: {
        STRIPE_SAMPLE_WEBHOOK_SECRET: redactedValue,
        externalEventId: "evt_test"
      }
    });
    expect(original.nested.STRIPE_SAMPLE_WEBHOOK_SECRET).toBe("whsec_local_test_secret");
  });

  it("redacts credentials inside database and redis URLs", () => {
    expect(redactString("postgres://user:password@localhost:5432/app")).toBe(
      "postgres://[redacted]:[redacted]@localhost:5432/app"
    );
    expect(redactString("redis://:redis-password@localhost:6379/0")).toBe(
      "redis://[redacted]:[redacted]@localhost:6379/0"
    );
  });

  it("leaves safe operational fields visible", () => {
    expect(
      redactObject({
        providerId: "generic-http",
        externalEventId: "event-1",
        payloadHash: "a".repeat(64),
        eventId: "11111111-1111-4111-8111-111111111111",
        correlationId: "demo-correlation-123"
      })
    ).toEqual({
      providerId: "generic-http",
      externalEventId: "event-1",
      payloadHash: "a".repeat(64),
      eventId: "11111111-1111-4111-8111-111111111111",
      correlationId: "demo-correlation-123"
    });
  });
});
