import { z } from "zod";

export const providerIds = ["stripe-sample", "generic-http", "mock-crm"] as const;

export type ProviderId = (typeof providerIds)[number];

export const providerIdSchema = z.enum(providerIds);

export interface ProviderCapabilities {
  readonly signatureVerification: boolean;
}

export interface ProviderMetadata {
  readonly providerId: ProviderId;
  readonly displayName: string;
  readonly capabilities: ProviderCapabilities;
  readonly requiresSignatureVerification: boolean;
}

export const providerMetadataById = {
  "stripe-sample": {
    providerId: "stripe-sample",
    displayName: "Stripe sample",
    capabilities: {
      signatureVerification: true
    },
    requiresSignatureVerification: true
  },
  "generic-http": {
    providerId: "generic-http",
    displayName: "Generic HTTP webhook",
    capabilities: {
      signatureVerification: false
    },
    requiresSignatureVerification: false
  },
  "mock-crm": {
    providerId: "mock-crm",
    displayName: "Mock CRM",
    capabilities: {
      signatureVerification: false
    },
    requiresSignatureVerification: false
  }
} satisfies Record<ProviderId, ProviderMetadata>;

export const providerMetadataList = providerIds.map(
  (providerId) => providerMetadataById[providerId]
);

export const isProviderId = (input: unknown): input is ProviderId =>
  providerIdSchema.safeParse(input).success;

export const getProviderMetadata = (providerId: ProviderId): ProviderMetadata =>
  providerMetadataById[providerId];
