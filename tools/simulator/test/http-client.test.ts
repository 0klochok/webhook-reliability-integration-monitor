import { describe, expect, it } from "vitest";

import type { SimulatorConfig } from "../src/config.js";
import { createSimulatorHttpClient, redactSecrets, type FetchLike } from "../src/http-client.js";

const config: SimulatorConfig = {
  apiBaseUrl: "http://localhost:3000",
  dashboardUrl: "http://localhost:3000/dashboard",
  stripeSampleWebhookSecret: "whsec_local_test_secret",
  timeoutMs: 5,
  pollTimeoutMs: 30_000,
  pollIntervalMs: 500,
  verbose: false
};

const createResponse = (status: number, body: unknown) => ({
  status,
  ok: status >= 200 && status < 300,
  headers: new Headers({
    "x-request-id": "simulator-response-123"
  }),
  text: async () => JSON.stringify(body)
});

describe("simulator HTTP client", () => {
  it("handles 2xx responses", async () => {
    const client = createSimulatorHttpClient(config, async () => createResponse(200, { ok: true }));

    await expect(client.request({ method: "GET", path: "/healthz" })).resolves.toMatchObject({
      status: 200,
      ok: true,
      headers: {
        "x-request-id": "simulator-response-123"
      },
      body: { ok: true }
    });
  });

  it("sends a request correlation header", async () => {
    let requestId: string | undefined;
    const client = createSimulatorHttpClient(config, async (_url, init) => {
      requestId = new Headers(init.headers).get("x-request-id") ?? undefined;
      return createResponse(200, { ok: true });
    });

    await client.request({ method: "GET", path: "/healthz" });

    expect(requestId).toEqual(expect.any(String));
  });

  it("returns expected 4xx responses without crashing", async () => {
    const client = createSimulatorHttpClient(config, async () =>
      createResponse(400, { ok: false, error: { code: "invalid_payload" } })
    );

    await expect(
      client.request({ method: "POST", path: "/webhooks/generic-http" })
    ).resolves.toMatchObject({
      status: 400,
      ok: false
    });
  });

  it("fails clearly on connection refusal and redacts secrets", async () => {
    const client = createSimulatorHttpClient(config, async () => {
      throw new Error("connect ECONNREFUSED whsec_local_test_secret");
    });

    await expect(client.request({ method: "GET", path: "/healthz" })).rejects.toThrow(
      "Local API is unreachable"
    );
    await expect(client.request({ method: "GET", path: "/healthz" })).rejects.not.toThrow(
      "whsec_local_test_secret"
    );
  });

  it("times out safely", async () => {
    const fetchImpl: FetchLike = async (_url, init) =>
      new Promise((resolve, reject) => {
        init.signal?.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
        setTimeout(() => resolve(createResponse(200, { ok: true })), 50);
      });
    const client = createSimulatorHttpClient(config, fetchImpl);

    await expect(client.request({ method: "GET", path: "/healthz" })).rejects.toThrow(
      "Request timed out"
    );
  });

  it("redacts secrets from arbitrary output", () => {
    expect(redactSecrets("secret whsec_local_test_secret here", ["whsec_local_test_secret"])).toBe(
      "secret [redacted] here"
    );
  });
});
