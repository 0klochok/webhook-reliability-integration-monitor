import { createDatabaseClient } from "@webhook-monitor/db";

import { loadLocalWorkerEnv, loadWorkerConfig } from "./config.js";
import { registerWorkerShutdown } from "./shutdown.js";
import { createDeliveryWorkerRuntime } from "./worker.js";

loadLocalWorkerEnv({ allowExampleFallback: true });

const config = loadWorkerConfig();
const database = createDatabaseClient({
  allowExampleFallback: true
});
const runtime = createDeliveryWorkerRuntime({
  database,
  config
});

registerWorkerShutdown({
  worker: runtime.workerResource.worker,
  redisConnection: runtime.workerResource.connection,
  ownsRedisConnection: runtime.workerResource.ownsConnection,
  closeDatabase: database.close
});

console.log(`webhook delivery worker listening on queue with concurrency ${config.concurrency}.`);
