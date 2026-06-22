import type { StripeSampleEvent } from "@webhook-monitor/core";

import type { GenericDemoDeliveryBehavior } from "./generic-http.js";

export const createStripeSampleDemoPayload = (
  eventId = "evt_demo_stripe_valid",
  deliveryBehavior: GenericDemoDeliveryBehavior = "success"
): StripeSampleEvent => ({
  id: eventId,
  object: "event",
  type: "payment_intent.succeeded",
  created: 1_787_225_600,
  livemode: false,
  data: {
    object: {
      id: "pi_demo_phase_6",
      object: "payment_intent",
      amount: 2499,
      currency: "usd",
      customer: "cus_demo_phase_6",
      metadata: {
        source: "phase-6-local-simulator",
        deliveryBehavior
      }
    }
  }
});
