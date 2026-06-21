import { describe, expect, it, vi } from "vitest";

import { closeWorkerResources } from "../src/shutdown.js";

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
});
