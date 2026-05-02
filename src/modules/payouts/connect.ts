import "server-only";

import type Stripe from "stripe";

import {
  createStripeServerClient,
  isStripeCheckoutConfigured,
} from "@/lib/stripe/server";
import type { PayoutReadinessStatus } from "@/modules/tutors/constants";

import type { PayoutSupportedCountryCode } from "@/modules/payouts/constants";

export type ConnectAccountPrefill = {
  country: PayoutSupportedCountryCode;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export function isStripeConnectConfigured() {
  return isStripeCheckoutConfigured();
}

export async function createTutorConnectAccount(
  prefill: ConnectAccountPrefill,
  options: { idempotencyKey: string },
): Promise<Stripe.Account> {
  const stripe = createStripeServerClient();
  const individual: Stripe.AccountCreateParams.Individual = {
    email: prefill.email,
  };

  if (prefill.firstName) {
    individual.first_name = prefill.firstName;
  }

  if (prefill.lastName) {
    individual.last_name = prefill.lastName;
  }

  return stripe.accounts.create(
    {
      business_type: "individual",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      country: prefill.country,
      email: prefill.email,
      individual,
      metadata: {
        platform_role: "tutor",
        prefill_source: "mentor_ib_application",
      },
      type: "express",
    },
    { idempotencyKey: options.idempotencyKey },
  );
}

export async function createTutorOnboardingLink(input: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}): Promise<Stripe.AccountLink> {
  const stripe = createStripeServerClient();

  return stripe.accountLinks.create({
    account: input.accountId,
    refresh_url: input.refreshUrl,
    return_url: input.returnUrl,
    type: "account_onboarding",
  });
}

export async function retrieveTutorConnectAccount(
  accountId: string,
): Promise<Stripe.Account> {
  const stripe = createStripeServerClient();

  return stripe.accounts.retrieve(accountId);
}

export type PayoutReadinessSnapshot = {
  chargesEnabled: boolean;
  currentlyDue: readonly string[];
  detailsSubmitted: boolean;
  disabledReason: string | null;
  pastDue: readonly string[];
  payoutsEnabled: boolean;
  status: PayoutReadinessStatus;
};

export type AccountReadinessInput = {
  charges_enabled?: boolean | null;
  details_submitted?: boolean | null;
  payouts_enabled?: boolean | null;
  requirements?: {
    currently_due?: readonly (string | null | undefined)[] | null;
    disabled_reason?: string | null;
    past_due?: readonly (string | null | undefined)[] | null;
  } | null;
};

export function mapAccountToReadinessSnapshot(
  account: AccountReadinessInput,
): PayoutReadinessSnapshot {
  const requirements = account.requirements ?? null;
  const currentlyDue = (requirements?.currently_due ?? []).filter(
    (entry): entry is string => typeof entry === "string",
  );
  const pastDue = (requirements?.past_due ?? []).filter(
    (entry): entry is string => typeof entry === "string",
  );
  const disabledReason =
    typeof requirements?.disabled_reason === "string"
      ? requirements.disabled_reason
      : null;
  const chargesEnabled = Boolean(account.charges_enabled);
  const payoutsEnabled = Boolean(account.payouts_enabled);
  const detailsSubmitted = Boolean(account.details_submitted);

  return {
    chargesEnabled,
    currentlyDue,
    detailsSubmitted,
    disabledReason,
    pastDue,
    payoutsEnabled,
    status: deriveReadinessStatus({
      chargesEnabled,
      currentlyDue,
      detailsSubmitted,
      disabledReason,
      pastDue,
      payoutsEnabled,
    }),
  };
}

export function snapshotToRequirementsSummary(
  snapshot: PayoutReadinessSnapshot,
) {
  return {
    charges_enabled: snapshot.chargesEnabled,
    currently_due: snapshot.currentlyDue,
    details_submitted: snapshot.detailsSubmitted,
    disabled_reason: snapshot.disabledReason,
    past_due: snapshot.pastDue,
    payouts_enabled: snapshot.payoutsEnabled,
  };
}

function deriveReadinessStatus(input: {
  chargesEnabled: boolean;
  currentlyDue: readonly string[];
  detailsSubmitted: boolean;
  disabledReason: string | null;
  pastDue: readonly string[];
  payoutsEnabled: boolean;
}): PayoutReadinessStatus {
  if (
    input.chargesEnabled &&
    input.payoutsEnabled &&
    input.currentlyDue.length === 0 &&
    input.pastDue.length === 0
  ) {
    return "enabled";
  }

  if (
    input.pastDue.length > 0 ||
    (input.disabledReason && input.disabledReason !== "requirements.pending_verification")
  ) {
    return "restricted";
  }

  if (input.detailsSubmitted) {
    return "pending_verification";
  }

  return "not_started";
}
