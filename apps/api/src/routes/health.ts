import type { Logger } from "@webhook-monitor/core";

import type { ApiConfig } from "../config.js";
import type { ApiApp } from "../types.js";

export interface HealthRouteDependencies {
  readonly config: ApiConfig;
  readonly databaseReadiness?: () => Promise<void>;
  readonly queueReadiness?: () => Promise<void>;
  readonly logger: Logger;
}

type DependencyStatus = "ok" | "unavailable";

export const registerHealthRoutes = (app: ApiApp, dependencies: HealthRouteDependencies): void => {
  const config = dependencies.config;

  app.get("/healthz", (context) =>
    context.json({
      ok: true,
      service: config.serviceName
    })
  );

  app.get("/readyz", async (context) => {
    const dependencyStatuses: {
      database: DependencyStatus;
      queue: DependencyStatus;
    } = {
      database: "ok",
      queue: "ok"
    };
    let error:
      | {
          readonly code: "database_unavailable" | "queue_unavailable";
          readonly message: string;
        }
      | undefined;

    try {
      await dependencies.databaseReadiness?.();
    } catch (cause) {
      dependencyStatuses.database = "unavailable";
      error = {
        code: "database_unavailable",
        message: "Database dependency is unavailable."
      };
      dependencies.logger.error("Database readiness check failed.", {
        correlationId: context.get("correlationId"),
        errorCode: "database_unavailable",
        error: cause instanceof Error ? cause : undefined
      });
    }

    try {
      await dependencies.queueReadiness?.();
    } catch (cause) {
      dependencyStatuses.queue = "unavailable";
      error ??= {
        code: "queue_unavailable",
        message: "Queue dependency is unavailable."
      };
      dependencies.logger.error("Queue readiness check failed.", {
        correlationId: context.get("correlationId"),
        errorCode: "queue_unavailable",
        error: cause instanceof Error ? cause : undefined
      });
    }

    if (error) {
      return context.json(
        {
          ok: false,
          service: config.serviceName,
          dependencies: dependencyStatuses,
          error,
          correlationId: context.get("correlationId")
        },
        503
      );
    }

    return context.json({
      ok: true,
      service: config.serviceName,
      dependencies: dependencyStatuses
    });
  });
};
