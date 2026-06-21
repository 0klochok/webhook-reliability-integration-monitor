import {
  createDeliveryQueueJobId,
  type DeliveryQueuePort,
  type EnqueueDeliveryInput,
  type EnqueueDeliveryResult
} from "../delivery-job.js";

export interface FakeDeliveryQueue extends DeliveryQueuePort {
  readonly calls: ReadonlyArray<EnqueueDeliveryInput>;
  failNext(error?: Error): void;
}

export const createFakeDeliveryQueue = (): FakeDeliveryQueue => {
  const calls: EnqueueDeliveryInput[] = [];
  let nextError: Error | undefined;

  return {
    calls,
    failNext(error = new Error("Fake delivery queue failed.")) {
      nextError = error;
    },
    enqueueDelivery: async (input): Promise<EnqueueDeliveryResult> => {
      if (nextError) {
        const error = nextError;
        nextError = undefined;
        throw error;
      }

      calls.push(input);

      return {
        queued: true,
        queueJobId: createDeliveryQueueJobId(input)
      };
    }
  };
};
