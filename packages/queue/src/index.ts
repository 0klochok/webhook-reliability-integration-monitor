export interface EnqueueDeliveryInput {
  readonly eventId: string;
}

export interface EnqueueDeliveryResult {
  readonly queued: true;
  readonly queueJobId?: string;
}

export interface DeliveryQueuePort {
  enqueueDelivery(input: EnqueueDeliveryInput): Promise<EnqueueDeliveryResult>;
}

export const createNoopDeliveryQueue = (): DeliveryQueuePort => ({
  enqueueDelivery: async () => ({
    queued: true
  })
});
