import type { StripeSampleEvent } from "../schemas/stripe-sample.js";

export const createStripeSampleEventFixture = (): StripeSampleEvent => ({
  id: "evt_local_payment_succeeded",
  object: "event",
  type: "payment_intent.succeeded",
  created: 1_787_225_600,
  livemode: false,
  data: {
    object: {
      id: "pi_local_123",
      object: "payment_intent",
      amount: 2499,
      currency: "usd",
      customer: "cus_local_123",
      metadata: {
        source: "local-test"
      }
    }
  }
});
