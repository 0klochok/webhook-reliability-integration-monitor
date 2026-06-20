import { createHmac, timingSafeEqual } from "node:crypto";

import type { ProviderId } from "./providers.js";

export type SignatureVerificationReasonCode =
  | "missing_signature_header"
  | "missing_secret"
  | "invalid_signature_header"
  | "timestamp_outside_tolerance"
  | "signature_mismatch";

export interface SignatureVerificationInput {
  readonly providerId: ProviderId;
  readonly rawBody: string | Buffer;
  readonly headers: Record<string, string | undefined>;
  readonly secret: string;
  readonly timestampToleranceSeconds?: number;
  readonly now?: Date;
}

export interface SignatureVerificationResult {
  readonly providerId: ProviderId;
  readonly verified: boolean;
  readonly reasonCode?: SignatureVerificationReasonCode;
  readonly message?: string;
  readonly timestamp?: number;
}

export interface SignatureVerifier {
  readonly providerId: ProviderId;
  verify(input: SignatureVerificationInput): SignatureVerificationResult;
}

export interface CreateFakeStripeSampleSignatureHeaderInput {
  readonly rawBody: string | Buffer;
  readonly secret: string;
  readonly timestamp: number;
}

export const stripeSampleSignatureHeaderName = "stripe-signature";

const rawBodyToString = (rawBody: string | Buffer): string =>
  typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");

const getHeaderCaseInsensitive = (
  headers: Record<string, string | undefined>,
  headerName: string
): string | undefined => {
  const requestedName = headerName.toLowerCase();
  const headerEntry = Object.entries(headers).find(([key]) => key.toLowerCase() === requestedName);

  return headerEntry?.[1];
};

const parseStripeStyleSignatureHeader = (
  headerValue: string
): { readonly timestamp: number; readonly signature: string } | undefined => {
  const parts = Object.fromEntries(
    headerValue.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value] as const;
    })
  );

  const timestamp = Number(parts.t);
  const signature = parts.v1;

  if (!Number.isInteger(timestamp) || !signature) {
    return undefined;
  }

  return {
    timestamp,
    signature
  };
};

const createStripeStyleHmac = (
  rawBody: string | Buffer,
  secret: string,
  timestamp: number
): string =>
  createHmac("sha256", secret)
    .update(`${timestamp}.${rawBodyToString(rawBody)}`)
    .digest("hex");

const hmacMatches = (expectedSignature: string, actualSignature: string): boolean => {
  const expected = Buffer.from(expectedSignature, "hex");
  const actual = Buffer.from(actualSignature, "hex");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

export const createFakeStripeSampleSignatureHeader = ({
  rawBody,
  secret,
  timestamp
}: CreateFakeStripeSampleSignatureHeaderInput): string => {
  const signature = createStripeStyleHmac(rawBody, secret, timestamp);

  return `t=${timestamp},v1=${signature}`;
};

export const fakeStripeSampleSignatureVerifier: SignatureVerifier = {
  providerId: "stripe-sample",
  verify(input) {
    if (!input.secret) {
      return {
        providerId: input.providerId,
        verified: false,
        reasonCode: "missing_secret",
        message: "A signing secret is required for signature verification."
      };
    }

    const headerValue = getHeaderCaseInsensitive(input.headers, stripeSampleSignatureHeaderName);

    if (!headerValue) {
      return {
        providerId: input.providerId,
        verified: false,
        reasonCode: "missing_signature_header",
        message: "Missing stripe-signature header."
      };
    }

    const parsedHeader = parseStripeStyleSignatureHeader(headerValue);

    if (!parsedHeader) {
      return {
        providerId: input.providerId,
        verified: false,
        reasonCode: "invalid_signature_header",
        message: "Signature header must include t=<timestamp> and v1=<hex-hmac>."
      };
    }

    if (input.timestampToleranceSeconds !== undefined) {
      const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1000);
      const ageSeconds = Math.abs(nowSeconds - parsedHeader.timestamp);

      if (ageSeconds > input.timestampToleranceSeconds) {
        return {
          providerId: input.providerId,
          verified: false,
          reasonCode: "timestamp_outside_tolerance",
          message: "Signature timestamp is outside the configured tolerance.",
          timestamp: parsedHeader.timestamp
        };
      }
    }

    const expectedSignature = createStripeStyleHmac(
      input.rawBody,
      input.secret,
      parsedHeader.timestamp
    );

    if (!hmacMatches(expectedSignature, parsedHeader.signature)) {
      return {
        providerId: input.providerId,
        verified: false,
        reasonCode: "signature_mismatch",
        message: "Signature does not match the expected HMAC.",
        timestamp: parsedHeader.timestamp
      };
    }

    return {
      providerId: input.providerId,
      verified: true,
      timestamp: parsedHeader.timestamp
    };
  }
};
