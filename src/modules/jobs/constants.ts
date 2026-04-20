export const jobTypes = [
  "booking_authorization_expiry_scan",
  "notification_delivery",
  "payout_processing",
  "stripe_webhook_process",
  "trust_snapshot_refresh",
] as const;

export type JobType = (typeof jobTypes)[number];

export const jobStatuses = [
  "queued",
  "running",
  "retryable",
  "completed",
  "dead_lettered",
  "cancelled",
] as const;

export type JobStatus = (typeof jobStatuses)[number];

export const webhookProviders = ["stripe"] as const;

export type WebhookProvider = (typeof webhookProviders)[number];

export const webhookVerificationStatuses = ["verified", "rejected"] as const;

export type WebhookVerificationStatus = (typeof webhookVerificationStatuses)[number];

export const webhookProcessingStatuses = [
  "received",
  "processing",
  "processed",
  "ignored",
  "failed",
] as const;

export type WebhookProcessingStatus = (typeof webhookProcessingStatuses)[number];

export const stripeWebhookEventTypes = [
  "account.updated",
  "charge.captured",
  "charge.refunded",
  "checkout.session.completed",
  "payment_intent.amount_capturable_updated",
] as const;

export type StripeWebhookEventType = (typeof stripeWebhookEventTypes)[number];

export const defaultJobMaxAttempts = 5;
export const defaultRetryDelaySeconds = 60;
export const defaultStaleJobThresholdMinutes = 15;
