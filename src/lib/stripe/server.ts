import Stripe from "stripe";

import { getStripeSecretKey, hasStripeSecretKey } from "@/lib/stripe/env";

let stripeServerClient: Stripe | undefined;

export function isStripeCheckoutConfigured() {
  return hasStripeSecretKey();
}

export function createStripeServerClient() {
  if (stripeServerClient) {
    return stripeServerClient;
  }

  stripeServerClient = new Stripe(getStripeSecretKey());

  return stripeServerClient;
}
