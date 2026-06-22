import type { ProviderId } from "@webhook-monitor/core";

import type { SimulatorConfig } from "./config.js";
import type { SimulatorHttpResponse } from "./http-client.js";

export interface ScenarioOutputInput {
  readonly name: string;
  readonly providerId?: ProviderId;
  readonly externalEventId?: string;
  readonly endpoint?: string;
  readonly expectedBehavior: string;
}

const bodySummary = (response: SimulatorHttpResponse): string => {
  if (typeof response.body === "object" && response.body !== null) {
    const body = response.body as Record<string, unknown>;
    const error = body.error as Record<string, unknown> | undefined;

    if (body.ok === false && error) {
      return `${String(error.code)}: ${String(error.message)}`;
    }

    if (body.ok === true) {
      return JSON.stringify(body);
    }
  }

  return response.bodyText.length > 240
    ? `${response.bodyText.slice(0, 240)}...`
    : response.bodyText;
};

export const printScenarioStart = (input: ScenarioOutputInput): void => {
  console.log("");
  console.log(`Scenario: ${input.name}`);
  if (input.endpoint) {
    console.log(`Endpoint: ${input.endpoint}`);
  }
  if (input.providerId) {
    console.log(`Provider: ${input.providerId}`);
  }
  if (input.externalEventId) {
    console.log(`External event id: ${input.externalEventId}`);
  }
  console.log(`Expected: ${input.expectedBehavior}`);
};

export const printHttpResult = (response: SimulatorHttpResponse): void => {
  console.log(`HTTP status: ${response.status}`);
  console.log(`Response: ${bodySummary(response)}`);
};

export const printObservedStatus = (description: string): void => {
  console.log(`Observed: ${description}`);
};

export const printDashboardLink = (
  config: SimulatorConfig,
  eventId: string | undefined,
  suffix = ""
): void => {
  const link = eventId
    ? `${config.dashboardUrl}/events/${eventId}${suffix}`
    : `${config.dashboardUrl}${suffix}`;
  console.log(`Dashboard: ${link}`);
};

export const printSuccess = (message: string): void => {
  console.log(`Result: ${message}`);
};
