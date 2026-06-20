import { describe, expect, it } from "vitest";

import {
  createFakeStripeSampleSignatureHeader,
  fakeStripeSampleSignatureVerifier,
  stripeSampleSignatureHeaderName
} from "../src/signature.js";
import { createStripeSampleEventFixture } from "../src/test-fixtures/stripe-sample.js";

const rawBody = JSON.stringify(createStripeSampleEventFixture());
const secret = "whsec_local_fake_secret_for_tests";
const timestamp = 1_787_225_600;
const now = new Date(timestamp * 1000);

describe("fake stripe sample signature verifier", () => {
  it("accepts a valid signature", () => {
    const signatureHeader = createFakeStripeSampleSignatureHeader({
      rawBody,
      secret,
      timestamp
    });

    const result = fakeStripeSampleSignatureVerifier.verify({
      providerId: "stripe-sample",
      rawBody,
      headers: {
        [stripeSampleSignatureHeaderName]: signatureHeader
      },
      secret,
      timestampToleranceSeconds: 300,
      now
    });

    expect(result).toEqual({
      providerId: "stripe-sample",
      verified: true,
      timestamp
    });
  });

  it("rejects an invalid signature", () => {
    const result = fakeStripeSampleSignatureVerifier.verify({
      providerId: "stripe-sample",
      rawBody,
      headers: {
        [stripeSampleSignatureHeaderName]: `t=${timestamp},v1=${"0".repeat(64)}`
      },
      secret,
      timestampToleranceSeconds: 300,
      now
    });

    expect(result).toMatchObject({
      providerId: "stripe-sample",
      verified: false,
      reasonCode: "signature_mismatch"
    });
  });

  it("rejects a missing signature header", () => {
    const result = fakeStripeSampleSignatureVerifier.verify({
      providerId: "stripe-sample",
      rawBody,
      headers: {},
      secret,
      timestampToleranceSeconds: 300,
      now
    });

    expect(result).toMatchObject({
      providerId: "stripe-sample",
      verified: false,
      reasonCode: "missing_signature_header"
    });
  });

  it("rejects a stale timestamp when tolerance is configured", () => {
    const staleTimestamp = timestamp - 301;
    const signatureHeader = createFakeStripeSampleSignatureHeader({
      rawBody,
      secret,
      timestamp: staleTimestamp
    });

    const result = fakeStripeSampleSignatureVerifier.verify({
      providerId: "stripe-sample",
      rawBody,
      headers: {
        [stripeSampleSignatureHeaderName]: signatureHeader
      },
      secret,
      timestampToleranceSeconds: 300,
      now
    });

    expect(result).toMatchObject({
      providerId: "stripe-sample",
      verified: false,
      reasonCode: "timestamp_outside_tolerance",
      timestamp: staleTimestamp
    });
  });
});
