import { NextResponse } from "next/server";

import { logJobsEvent } from "@/lib/jobs/logging";
import {
  enqueueStripeWebhookJobAfterResponse,
  recordStripeWebhookReceipt,
} from "@/lib/jobs/service";
import {
  StripeWebhookSignatureError,
  verifyAndParseStripeWebhook,
} from "@/lib/jobs/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signatureHeader = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!signatureHeader) {
    logJobsEvent("warn", "stripe_webhook_missing_signature", {});

    return NextResponse.json(
      { error: "Missing Stripe-Signature header." },
      { status: 400 },
    );
  }

  try {
    const event = verifyAndParseStripeWebhook(rawBody, signatureHeader);
    const receipt = await recordStripeWebhookReceipt(event, signatureHeader);

    if (receipt.event.processing_status === "received") {
      enqueueStripeWebhookJobAfterResponse(receipt.event);
    }

    return NextResponse.json(
      {
        duplicate: receipt.deduped,
        received: true,
      },
      { status: receipt.deduped ? 200 : 202 },
    );
  } catch (error) {
    if (error instanceof StripeWebhookSignatureError) {
      logJobsEvent("warn", "stripe_webhook_rejected", {
        error_message: error.message,
      });

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logJobsEvent("error", "stripe_webhook_persist_failed", {
      error_message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Could not persist the Stripe webhook event." },
      { status: 500 },
    );
  }
}
