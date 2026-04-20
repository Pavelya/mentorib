const STRIPE_WEBHOOK_SIGNATURE_TOLERANCE_SECONDS = 300;

export function getCronSecret() {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    throw new Error(
      "Background jobs are not fully configured. Set CRON_SECRET on the server.",
    );
  }

  return cronSecret;
}

export function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error(
      "Stripe webhooks are not fully configured. Set STRIPE_WEBHOOK_SECRET on the server.",
    );
  }

  return webhookSecret;
}

export function getStripeWebhookSignatureToleranceSeconds() {
  return STRIPE_WEBHOOK_SIGNATURE_TOLERANCE_SECONDS;
}
