import {
  fakeStripeSampleSignatureVerifier,
  stripeSampleSignatureHeaderName
} from "@webhook-monitor/core";
import { describe, expect, it } from "vitest";

import { createStripeSampleSignedHeaders } from "../src/signing/stripe-sample-signing.js";

const rawBody = JSON.stringify({
  id: "evt_demo_signing",
  object: "event"
});
const secret = "whsec_local_test_secret";
const timestamp = 1_787_225_600;

describe("Stripe sample signing", () => {
  it("creates a Stripe-style t/v1 header", () => {
    const headers = createStripeSampleSignedHeaders({
      rawBody,
      secret,
      timestamp
    });

    expect(headers[stripeSampleSignatureHeaderName]).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
  });

  it("verifies generated signatures with the core verifier", () => {
    const headers = createStripeSampleSignedHeaders({
      rawBody,
      secret,
      timestamp
    });

    const verification = fakeStripeSampleSignatureVerifier.verify({
      providerId: "stripe-sample",
      rawBody,
      headers,
      secret,
      now: new Date(timestamp * 1000),
      timestampToleranceSeconds: 300
    });

    expect(verification.verified).toBe(true);
  });

  it("creates different signatures for different raw bodies", () => {
    const first = createStripeSampleSignedHeaders({
      rawBody,
      secret,
      timestamp
    });
    const second = createStripeSampleSignedHeaders({
      rawBody: JSON.stringify({ id: "evt_demo_signing_changed", object: "event" }),
      secret,
      timestamp
    });

    expect(first[stripeSampleSignatureHeaderName]).not.toBe(
      second[stripeSampleSignatureHeaderName]
    );
  });

  it("fails verification with the wrong secret", () => {
    const headers = createStripeSampleSignedHeaders({
      rawBody,
      secret,
      timestamp
    });

    const verification = fakeStripeSampleSignatureVerifier.verify({
      providerId: "stripe-sample",
      rawBody,
      headers,
      secret: "whsec_wrong_local_secret",
      now: new Date(timestamp * 1000),
      timestampToleranceSeconds: 300
    });

    expect(verification).toMatchObject({
      verified: false,
      reasonCode: "signature_mismatch"
    });
  });
});
