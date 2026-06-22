import type { Context, Hono } from "hono";

export interface ApiVariables {
  readonly correlationId: string;
}

export type ApiApp = Hono<{ Variables: ApiVariables }>;
export type ApiContext = Context<{ Variables: ApiVariables }>;
