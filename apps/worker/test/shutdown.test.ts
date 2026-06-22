import { createMemoryLogger } from "@webhook-monitor/core";
import { describe, expect, it, vi } from "vitest";

import { closeWorkerResources, createWorkerShutdownController } from "../src/shutdown.js";

describe("worker shutdown helpers", () => {
  it("closes worker and database resources", async () => {
    const workerClose = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const closeDatabase = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    await closeWorkerResources({
      worker: {
        close: workerClose
      },
      closeDatabase
    });

    expect(workerClose).toHaveBeenCalledTimes(1);
    expect(closeDatabase).toHaveBeenCalledTimes(1);
  });

  it("runs shutdown idempotently and logs safe start and completion messages", async () => {
    const workerClose = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const closeDatabase = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const logger = createMemoryLogger({
      service: "webhook-reliability-worker",
      level: "debug",
      clock: () => new Date("2026-06-20T12:00:00.000Z")
    });
    const controller = createWorkerShutdownController({
      worker: {
        close: workerClose
      },
      closeDatabase,
      logger
    });

    await Promise.all([controller.shutdown("SIGTERM"), controller.shutdown("SIGTERM")]);

    expect(workerClose).toHaveBeenCalledTimes(1);
    expect(closeDatabase).toHaveBeenCalledTimes(1);
    expect(logger.records.map((record) => record.message)).toEqual([
      "Worker shutdown started.",
      "Worker shutdown completed."
    ]);
    expect(JSON.stringify(logger.records)).not.toContain("redis://");
  });
});
