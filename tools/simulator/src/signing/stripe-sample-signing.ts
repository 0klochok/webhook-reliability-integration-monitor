import {
  createFakeStripeSampleSignatureHeader,
  fakeStripeSampleSignatureVerifier,
  stripeSampleSignatureHeaderName
} from "@webhook-monitor/core";

export interface CreateStripeSampleSignedRequestInput {
  readonly rawBody: string;
  readonly secret: string;
  readonly timestamp?: number;
}

export const createStripeSampleSignedHeaders = (
  input: CreateStripeSampleSignedRequestInput
): Record<string, string> => {
  const timestamp = input.timestamp ?? Math.floor(Date.now() / 1000);

  return {
    "content-type": "application/json",
    [stripeSampleSignatureHeaderName]: createFakeStripeSampleSignatureHeader({
      rawBody: input.rawBody,
      secret: input.secret,
      timestamp
    })
  };
};

export const createInvalidStripeSampleSignedHeaders = (): Record<string, string> => ({
  "content-type": "application/json",
  [stripeSampleSignatureHeaderName]: "t=1787225600,v1=not-a-valid-hmac"
});

export { fakeStripeSampleSignatureVerifier, stripeSampleSignatureHeaderName };
