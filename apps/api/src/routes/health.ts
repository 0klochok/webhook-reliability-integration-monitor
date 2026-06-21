import type { Hono } from "hono";

import type { ApiConfig } from "../config.js";

export const registerHealthRoutes = (app: Hono, config: ApiConfig): void => {
  app.get("/healthz", (context) =>
    context.json({
      ok: true,
      service: config.serviceName
    })
  );
};
