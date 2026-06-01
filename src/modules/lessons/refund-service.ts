import "server-only";

import {
  createStripeServerClient,
  isStripeCheckoutConfigured,
} from "@/lib/stripe/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export class LessonRefundError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

type RefundablePaymentRow = {
  id: string;
  payment_status:
    | "authorized"
    | "cancelled"
    | "failed"
    | "paid"
    | "pending"
    | "refunded";
  stripe_payment_intent_id: string | null;
};

export type LessonRefundResult = {
  refunded: boolean;
  released: boolean;
};

// Canonical refund path shared by the participant-cancellation flow and the
// admin dispute-resolution flow (`P2-OPSFIX-006`). Extracted so the Stripe
// refund call lives in exactly one place. Idempotent: a payment already
// `refunded` / `cancelled` (or never charged) is a no-op, so a retry after a
// partial failure never double-refunds. A `paid` payment is refunded against
// the captured charge; an `authorized` (not-yet-captured) payment has its
// authorization voided instead.
export async function processLessonRefund(
  lessonId: string,
): Promise<LessonRefundResult> {
  const payment = await loadRefundablePayment(lessonId);
  if (!payment || !payment.stripe_payment_intent_id) {
    return { refunded: false, released: false };
  }

  if (
    payment.payment_status !== "paid" &&
    payment.payment_status !== "authorized"
  ) {
    // Already settled (refunded/cancelled) or never charged — nothing to do.
    return { refunded: false, released: false };
  }

  if (!isStripeCheckoutConfigured()) {
    throw new LessonRefundError(
      "stripe_unconfigured",
      "Refunds are unavailable until Stripe is configured on the server.",
    );
  }

  const stripe = createStripeServerClient();
  const supabase = createSupabaseServiceRoleClient();
  const nowIso = new Date().toISOString();

  if (payment.payment_status === "paid") {
    await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
    });
    const { error } = await supabase
      .from("payments")
      .update({ payment_status: "refunded", refunded_at: nowIso })
      .eq("id", payment.id);
    if (error) {
      throw new LessonRefundError(
        "payment_update_failed",
        "We couldn't update the payment record after the refund.",
      );
    }
    return { refunded: true, released: false };
  }

  // `authorized` → void the authorization.
  await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id);
  const { error } = await supabase
    .from("payments")
    .update({ payment_status: "cancelled", capture_cancelled_at: nowIso })
    .eq("id", payment.id);
  if (error) {
    throw new LessonRefundError(
      "payment_update_failed",
      "We couldn't update the payment record after releasing the authorization.",
    );
  }
  return { refunded: false, released: true };
}

// "Release the captured payment to the tutor" for student-fault / tutor-favour
// resolutions. By the time a lesson issue reaches manual review the lesson was
// accepted and the payment captured, so the captured amount simply stays with
// the tutor — there is no authorization to void and no refund to issue. This
// helper exists so the resolution mapping reads symmetrically and has a single
// documented place to evolve if a payout-hold ledger is introduced later.
export async function releaseCapturedLessonPayment(): Promise<void> {
  return;
}

async function loadRefundablePayment(
  lessonId: string,
): Promise<RefundablePaymentRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, payment_status, stripe_payment_intent_id")
    .eq("lesson_id", lessonId)
    .maybeSingle<RefundablePaymentRow>();
  if (error) {
    throw new LessonRefundError(
      "payment_lookup_failed",
      "We couldn't read the payment state for this lesson.",
    );
  }
  return data ?? null;
}
