import { describe, expect, it } from "vitest";

import {
  getProviderMetadata,
  isProviderId,
  providerIds,
  providerMetadataById
} from "../src/providers.js";

describe("provider identifiers and metadata", () => {
  it("accepts known providers", () => {
    expect(providerIds).toEqual(["stripe-sample", "generic-http", "mock-crm"]);
    expect(isProviderId("stripe-sample")).toBe(true);
    expect(isProviderId("generic-http")).toBe(true);
    expect(isProviderId("mock-crm")).toBe(true);
  });

  it("rejects unknown providers", () => {
    expect(isProviderId("stripe")).toBe(false);
    expect(isProviderId("unknown-provider")).toBe(false);
    expect(isProviderId(undefined)).toBe(false);
  });

  it("exposes provider metadata and signature requirements", () => {
    expect(getProviderMetadata("stripe-sample")).toEqual(providerMetadataById["stripe-sample"]);
    expect(providerMetadataById["stripe-sample"].requiresSignatureVerification).toBe(true);
    expect(providerMetadataById["generic-http"].requiresSignatureVerification).toBe(false);
    expect(providerMetadataById["mock-crm"].requiresSignatureVerification).toBe(false);
  });
});
