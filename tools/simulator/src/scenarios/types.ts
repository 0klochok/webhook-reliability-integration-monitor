import type { EventStatus, ProviderId } from "@webhook-monitor/core";

import type { SimulatorConfig } from "../config.js";
import type { SimulatorHttpClient, SimulatorHttpRequest } from "../http-client.js";

export type ScenarioId =
  | "stripe-valid"
  | "success"
  | "duplicate"
  | "invalid-signature"
  | "invalid-payload"
  | "mock-crm-success"
  | "retry-success"
  | "dead-letter"
  | "permanent-failure"
  | "manual-replay"
  | "all";

export interface ScenarioContext {
  readonly config: SimulatorConfig;
  readonly http: SimulatorHttpClient;
}

export interface ScenarioStep {
  readonly label: string;
  readonly providerId: ProviderId;
  readonly externalEventId?: string;
  readonly expectedBehavior: string;
  readonly request: SimulatorHttpRequest;
  readonly expectedHttpStatuses: readonly number[];
  readonly expectedDuplicate?: boolean;
  readonly allowExistingDuplicate?: boolean;
}

export interface ScenarioPlan {
  readonly id: ScenarioId;
  readonly name: string;
  readonly expectedBehavior: string;
  readonly steps: readonly ScenarioStep[];
  readonly finalStatuses?: readonly EventStatus[];
}

export interface Scenario {
  readonly id: ScenarioId;
  readonly createPlan: (config: SimulatorConfig) => ScenarioPlan;
  readonly run: (context: ScenarioContext) => Promise<void>;
}
