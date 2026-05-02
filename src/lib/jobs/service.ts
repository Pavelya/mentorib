import { after } from "next/server";

import type { MentorIbDatabase } from "@/lib/supabase/database.types";
import { logJobsEvent } from "@/lib/jobs/logging";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  defaultJobMaxAttempts,
  defaultRetryDelaySeconds,
  defaultStaleJobThresholdMinutes,
  stripeWebhookEventTypes,
  type JobType,
  type StripeWebhookEventType,
} from "@/modules/jobs/constants";
import { deliverNotificationEmail } from "@/modules/notifications/email-delivery";
import type { StripeWebhookEnvelope } from "@/lib/jobs/stripe";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue | undefined };

type JsonObject = Record<string, JsonValue>;

type JobRunRecord = MentorIbDatabase["public"]["Tables"]["job_runs"]["Row"];
type WebhookEventRecord = MentorIbDatabase["public"]["Tables"]["webhook_events"]["Row"];

type EnqueueJobInput = {
  availableAt?: string;
  dedupeKey?: string;
  jobType: JobType;
  maxAttempts?: number;
  payload?: JsonObject;
  triggerObjectId?: string;
  triggerObjectType?: string;
};

type EnqueueJobResult = {
  deduped: boolean;
  job: JobRunRecord;
};

type JobDrainSummary = {
  claimed_count: number;
  completed_count: number;
  dead_lettered_count: number;
  ignored_count: number;
  requeued_stale_count: number;
  retried_count: number;
};

type JobHandlerResult = {
  outcome?: "completed" | "ignored";
  result?: JsonObject;
};

type WebhookReceiptResult = {
  deduped: boolean;
  event: WebhookEventRecord;
};

type JobFailureResolution = {
  outcome: "dead_lettered" | "retryable";
};

class JobExecutionError extends Error {
  readonly code: string;
  readonly details?: JsonObject;
  readonly retryDelaySeconds?: number;
  readonly retryable: boolean;

  constructor({
    code,
    details,
    message,
    retryDelaySeconds,
    retryable,
  }: {
    code: string;
    details?: JsonObject;
    message: string;
    retryDelaySeconds?: number;
    retryable: boolean;
  }) {
    super(message);
    this.code = code;
    this.details = details;
    this.retryDelaySeconds = retryDelaySeconds;
    this.retryable = retryable;
  }
}

class RetryableJobError extends JobExecutionError {
  constructor(
    code: string,
    message: string,
    options: { details?: JsonObject; retryDelaySeconds?: number } = {},
  ) {
    super({
      code,
      details: options.details,
      message,
      retryDelaySeconds: options.retryDelaySeconds,
      retryable: true,
    });
  }
}

class TerminalJobError extends JobExecutionError {
  constructor(code: string, message: string, options: { details?: JsonObject } = {}) {
    super({
      code,
      details: options.details,
      message,
      retryable: false,
    });
  }
}

const supportedStripeWebhookActions: Record<StripeWebhookEventType, string> = {
  "account.updated": "tutor_payout_status_refresh",
  "charge.captured": "payment_capture_confirmation",
  "charge.refunded": "payment_refund_confirmation",
  "checkout.session.completed": "booking_authorization_confirmation",
  "payment_intent.amount_capturable_updated": "authorization_validity_check",
};

const jobHandlers: Record<JobType, (job: JobRunRecord) => Promise<JobHandlerResult>> = {
  booking_authorization_expiry_scan: handleBookingAuthorizationExpiryScan,
  notification_delivery: handleNotificationDelivery,
  payout_processing: handlePayoutProcessing,
  stripe_webhook_process: handleStripeWebhookProcess,
  trust_snapshot_refresh: handleTrustSnapshotRefresh,
};

export async function enqueueJob(input: EnqueueJobInput): Promise<EnqueueJobResult> {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const payload = input.payload ?? {};
  const availableAt = input.availableAt ?? new Date().toISOString();

  const { data, error } = await serviceRoleClient
    .from("job_runs")
    .insert({
      available_at: availableAt,
      dedupe_key: input.dedupeKey ?? null,
      job_type: input.jobType,
      max_attempts: input.maxAttempts ?? defaultJobMaxAttempts,
      payload,
      trigger_object_id: input.triggerObjectId ?? null,
      trigger_object_type: input.triggerObjectType ?? null,
    })
    .select("*")
    .single<JobRunRecord>();

  if (error) {
    if (isUniqueViolation(error) && input.dedupeKey) {
      const existingJob = await getJobByDedupeKey(input.jobType, input.dedupeKey);

      return {
        deduped: true,
        job: existingJob,
      };
    }

    throw new Error(`Could not enqueue the ${input.jobType} job.`);
  }

  return {
    deduped: false,
    job: data,
  };
}

export function enqueueJobAfterResponse(input: EnqueueJobInput) {
  // Lane B helper: only use this to enqueue work whose durable source row already exists.
  after(async () => {
    try {
      await enqueueJob(input);
    } catch (error) {
      logJobsEvent("error", "job_enqueue_after_response_failed", {
        dedupe_key: input.dedupeKey ?? null,
        error_message: getErrorMessage(error),
        job_type: input.jobType,
      });
    }
  });
}

export async function recordStripeWebhookReceipt(
  event: StripeWebhookEnvelope,
  signatureHeader: string,
): Promise<WebhookReceiptResult> {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const receivedAt = new Date().toISOString();

  const { data, error } = await serviceRoleClient
    .from("webhook_events")
    .insert({
      event_type: event.type,
      payload: toJsonObject(event),
      processed_at: null,
      processing_status: "received",
      provider: "stripe",
      provider_event_id: event.id,
      received_at: receivedAt,
      signature_header: signatureHeader,
      verified_at: receivedAt,
      verification_status: "verified",
    })
    .select("*")
    .single<WebhookEventRecord>();

  if (error) {
    if (isUniqueViolation(error)) {
      const existingEvent = await getWebhookEventByProviderId("stripe", event.id);

      if (JSON.stringify(existingEvent.payload) !== JSON.stringify(event)) {
        logJobsEvent("warn", "webhook_payload_replay_mismatch", {
          event_id: event.id,
          event_type: event.type,
          provider: "stripe",
        });
      }

      return {
        deduped: true,
        event: existingEvent,
      };
    }

    throw new Error("Could not persist the Stripe webhook receipt.");
  }

  return {
    deduped: false,
    event: data,
  };
}

export function enqueueStripeWebhookJobAfterResponse(event: WebhookEventRecord) {
  enqueueJobAfterResponse({
    dedupeKey: buildStripeWebhookJobDedupeKey(event.provider, event.provider_event_id),
    jobType: "stripe_webhook_process",
    payload: {
      provider: event.provider,
      provider_event_id: event.provider_event_id,
      webhook_event_id: event.id,
    },
    triggerObjectId: event.id,
    triggerObjectType: "webhook_event",
  });
}

export async function recoverStripeWebhookJobs(limit = 25) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("webhook_events")
    .select("*")
    .eq("provider", "stripe")
    .eq("verification_status", "verified")
    .eq("processing_status", "received")
    .order("received_at", { ascending: true })
    .limit(limit)
    .returns<WebhookEventRecord[]>();

  if (error) {
    throw new Error("Could not recover pending webhook jobs.");
  }

  let recoveredCount = 0;

  for (const event of data ?? []) {
    const result = await enqueueJob({
      dedupeKey: buildStripeWebhookJobDedupeKey(event.provider, event.provider_event_id),
      jobType: "stripe_webhook_process",
      payload: {
        provider: event.provider,
        provider_event_id: event.provider_event_id,
        webhook_event_id: event.id,
      },
      triggerObjectId: event.id,
      triggerObjectType: "webhook_event",
    });

    if (!result.deduped) {
      recoveredCount += 1;
    }
  }

  return recoveredCount;
}

export async function seedScheduledJobs(referenceTime = new Date()) {
  const scheduledJobs: EnqueueJobInput[] = [
    {
      dedupeKey: `booking_authorization_expiry_scan:${toUtcHourBucket(referenceTime)}`,
      jobType: "booking_authorization_expiry_scan",
      payload: {
        scheduled_bucket: toUtcHourBucket(referenceTime),
        scheduled_from: "cron",
      },
    },
    {
      dedupeKey: `payout_processing:${toUtcDayBucket(referenceTime)}`,
      jobType: "payout_processing",
      payload: {
        scheduled_bucket: toUtcDayBucket(referenceTime),
        scheduled_from: "cron",
      },
    },
    {
      dedupeKey: `trust_snapshot_refresh:${toUtcDayBucket(referenceTime)}`,
      jobType: "trust_snapshot_refresh",
      payload: {
        scheduled_bucket: toUtcDayBucket(referenceTime),
        scheduled_from: "cron",
      },
    },
  ];

  let seededCount = 0;

  for (const scheduledJob of scheduledJobs) {
    const result = await enqueueJob(scheduledJob);

    if (!result.deduped) {
      seededCount += 1;
    }
  }

  return seededCount;
}

export async function requeueStaleJobs(
  staleThresholdMinutes = defaultStaleJobThresholdMinutes,
) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const cutoff = new Date(Date.now() - staleThresholdMinutes * 60 * 1000).toISOString();
  const { data, error } = await serviceRoleClient
    .from("job_runs")
    .select("*")
    .eq("job_status", "running")
    .lt("started_at", cutoff)
    .returns<JobRunRecord[]>();

  if (error) {
    throw new Error("Could not load stale running jobs.");
  }

  let requeuedCount = 0;

  for (const job of data ?? []) {
    const isDeadLetter = job.attempt_number >= job.max_attempts;

    if (isDeadLetter) {
      await updateJobState(job.id, {
        dead_lettered_at: new Date().toISOString(),
        failure_code: job.failure_code ?? "stale_job_timeout",
        failure_message: job.failure_message ?? "The job exceeded the stale-running threshold.",
        finished_at: new Date().toISOString(),
        job_status: "dead_lettered",
        last_failed_at: new Date().toISOString(),
      });
      requeuedCount += 1;
      continue;
    }

    await updateJobState(job.id, {
      available_at: new Date().toISOString(),
      failure_code: job.failure_code ?? "stale_job_timeout",
      failure_message: job.failure_message ?? "The job exceeded the stale-running threshold.",
      finished_at: null,
      job_status: "retryable",
      last_failed_at: new Date().toISOString(),
    });
    requeuedCount += 1;
  }

  return requeuedCount;
}

export async function drainDueJobs(limit = 10): Promise<JobDrainSummary> {
  const claimedJobs = await claimDueJobs(limit);
  let completedCount = 0;
  let ignoredCount = 0;
  let retriedCount = 0;
  let deadLetteredCount = 0;

  for (const job of claimedJobs) {
    const result = await runJob(job);

    if (result === "completed") {
      completedCount += 1;
      continue;
    }

    if (result === "ignored") {
      ignoredCount += 1;
      continue;
    }

    if (result.outcome === "retryable") {
      retriedCount += 1;
      continue;
    }

    deadLetteredCount += 1;
  }

  return {
    claimed_count: claimedJobs.length,
    completed_count: completedCount,
    dead_lettered_count: deadLetteredCount,
    ignored_count: ignoredCount,
    requeued_stale_count: 0,
    retried_count: retriedCount,
  };
}

async function claimDueJobs(limit: number) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient.rpc("claim_job_runs", {
    p_limit: limit,
  });

  if (error) {
    throw new Error("Could not claim due jobs.");
  }

  return (data ?? []) as JobRunRecord[];
}

async function runJob(job: JobRunRecord) {
  const handler = jobHandlers[job.job_type as JobType];

  if (!handler) {
    return handleJobFailure(
      job,
      new TerminalJobError("unknown_job_type", `No handler is registered for ${job.job_type}.`),
    );
  }

  try {
    const result = await handler(job);
    const outcome = result.outcome ?? "completed";

    await updateJobState(job.id, {
      dead_lettered_at: null,
      failure_code: null,
      failure_message: null,
      finished_at: new Date().toISOString(),
      job_status: "completed",
      last_error_payload: null,
      last_failed_at: null,
      result_payload: result.result ?? {},
    });

    return outcome;
  } catch (error) {
    return handleJobFailure(job, error);
  }
}

async function handleJobFailure(
  job: JobRunRecord,
  error: unknown,
): Promise<JobFailureResolution> {
  const normalizedError = normalizeJobError(job, error);
  const errorPayload = normalizedError.details ?? {};

  if (job.job_type === "stripe_webhook_process") {
    await markWebhookEventFailed(job, normalizedError);
  }

  if (!normalizedError.retryable || job.attempt_number >= job.max_attempts) {
    await updateJobState(job.id, {
      dead_lettered_at: new Date().toISOString(),
      failure_code: normalizedError.code,
      failure_message: normalizedError.message,
      finished_at: new Date().toISOString(),
      job_status: "dead_lettered",
      last_error_payload: errorPayload,
      last_failed_at: new Date().toISOString(),
      result_payload: null,
    });

    logJobsEvent("error", "job_dead_lettered", {
      attempt_number: job.attempt_number,
      dedupe_key: job.dedupe_key,
      error_code: normalizedError.code,
      error_message: normalizedError.message,
      job_id: job.id,
      job_type: job.job_type,
      trigger_object_id: job.trigger_object_id,
      trigger_object_type: job.trigger_object_type,
    });

    return {
      outcome: "dead_lettered",
    };
  }

  const retryDelaySeconds =
    normalizedError.retryDelaySeconds ?? Math.max(job.attempt_number, 1) * defaultRetryDelaySeconds;
  const retryAt = new Date(Date.now() + retryDelaySeconds * 1000).toISOString();

  await updateJobState(job.id, {
    available_at: retryAt,
    dead_lettered_at: null,
    failure_code: normalizedError.code,
    failure_message: normalizedError.message,
    finished_at: null,
    job_status: "retryable",
    last_error_payload: errorPayload,
    last_failed_at: new Date().toISOString(),
    result_payload: null,
  });

  logJobsEvent("warn", "job_requeued", {
    attempt_number: job.attempt_number,
    dedupe_key: job.dedupe_key,
    error_code: normalizedError.code,
    error_message: normalizedError.message,
    job_id: job.id,
    job_type: job.job_type,
    retry_at: retryAt,
  });

  return {
    outcome: "retryable",
  };
}

async function handleBookingAuthorizationExpiryScan(job: JobRunRecord): Promise<JobHandlerResult> {
  return {
    result: {
      job_id: job.id,
      handled_at: new Date().toISOString(),
      scan: "booking_authorization_expiry",
      status: "infrastructure_ready",
    },
  };
}

async function handleNotificationDelivery(job: JobRunRecord): Promise<JobHandlerResult> {
  const payload = normalizeJsonObject(job.payload);
  const channel = typeof payload.channel === "string" ? payload.channel : null;
  const notificationId =
    typeof payload.notification_id === "string" ? payload.notification_id : null;
  const attemptNumber = Math.max(1, job.attempt_number);

  if (!notificationId) {
    throw new TerminalJobError(
      "missing_notification_reference",
      "The notification_delivery job is missing a notification_id payload.",
    );
  }

  if (channel !== "email") {
    return {
      outcome: "ignored",
      result: {
        channel,
        ignored_reason: "unsupported_channel",
        job_id: job.id,
        notification_id: notificationId,
      },
    };
  }

  const outcome = await deliverNotificationEmail({
    attemptNumber,
    jobRunId: job.id,
    notificationId,
  });

  if (outcome.status === "sent") {
    return {
      result: {
        delivery_id: outcome.deliveryId,
        job_id: job.id,
        notification_id: notificationId,
        status: "sent",
      },
    };
  }

  if (outcome.status === "skipped") {
    return {
      outcome: "ignored",
      result: {
        delivery_id: outcome.deliveryId,
        ignored_reason: outcome.reason ?? "skipped",
        job_id: job.id,
        notification_id: notificationId,
        status: "skipped",
      },
    };
  }

  if (outcome.retryable) {
    throw new RetryableJobError(
      outcome.reason ?? "notification_email_failed",
      "The notification email send failed; scheduling another attempt.",
      {
        details: {
          delivery_id: outcome.deliveryId,
          notification_id: notificationId,
        },
      },
    );
  }

  throw new TerminalJobError(
    outcome.reason ?? "notification_email_failed_terminal",
    "The notification email send failed and is not retryable.",
    {
      details: {
        delivery_id: outcome.deliveryId,
        notification_id: notificationId,
      },
    },
  );
}

async function handlePayoutProcessing(job: JobRunRecord): Promise<JobHandlerResult> {
  return {
    result: {
      handled_at: new Date().toISOString(),
      job_id: job.id,
      payout_processing: "scheduled_sweep",
      status: "infrastructure_ready",
    },
  };
}

async function handleTrustSnapshotRefresh(job: JobRunRecord): Promise<JobHandlerResult> {
  return {
    result: {
      handled_at: new Date().toISOString(),
      job_id: job.id,
      refresh: "trust_snapshot",
      status: "infrastructure_ready",
    },
  };
}

async function handleStripeWebhookProcess(job: JobRunRecord): Promise<JobHandlerResult> {
  const webhookEventId = resolveWebhookEventId(job);

  if (!webhookEventId) {
    throw new TerminalJobError(
      "missing_webhook_event_reference",
      "The Stripe webhook job is missing its webhook event reference.",
    );
  }

  const webhookEvent = await getWebhookEventById(webhookEventId);

  if (webhookEvent.processing_status === "processed") {
    return {
      result: {
        event_id: webhookEvent.provider_event_id,
        replay_safe: true,
        status: "already_processed",
      },
    };
  }

  if (webhookEvent.processing_status === "ignored") {
    return {
      outcome: "ignored",
      result: {
        event_id: webhookEvent.provider_event_id,
        replay_safe: true,
        status: "already_ignored",
      },
    };
  }

  await updateWebhookEventState(webhookEvent.id, {
    error_code: null,
    error_message: null,
    processed_at: null,
    processing_status: "processing",
  });

  const dispatchResult = await dispatchStripeWebhook(webhookEvent);

  await updateWebhookEventState(webhookEvent.id, {
    error_code: null,
    error_message: null,
    processed_at: new Date().toISOString(),
    processing_status: dispatchResult.processingStatus,
  });

  return {
    outcome: dispatchResult.processingStatus === "ignored" ? "ignored" : "completed",
    result: dispatchResult.result,
  };
}

async function dispatchStripeWebhook(webhookEvent: WebhookEventRecord) {
  if (!isSupportedStripeWebhookEventType(webhookEvent.event_type)) {
    return {
      processingStatus: "ignored" as const,
      result: toJsonObject({
        event_id: webhookEvent.provider_event_id,
        event_type: webhookEvent.event_type,
        ignored_reason: "unsupported_event_type",
        provider: webhookEvent.provider,
      }),
    };
  }

  if (webhookEvent.event_type === "account.updated") {
    const outcome = await processConnectAccountUpdatedWebhook(webhookEvent);

    return {
      processingStatus: "processed" as const,
      result: toJsonObject({
        domain_action: supportedStripeWebhookActions[webhookEvent.event_type],
        event_id: webhookEvent.provider_event_id,
        event_type: webhookEvent.event_type,
        provider: webhookEvent.provider,
        ...outcome,
      }),
    };
  }

  return {
    processingStatus: "processed" as const,
    result: toJsonObject({
      domain_action: supportedStripeWebhookActions[webhookEvent.event_type],
      event_id: webhookEvent.provider_event_id,
      event_type: webhookEvent.event_type,
      infrastructure_only: true,
      provider: webhookEvent.provider,
    }),
  };
}

async function processConnectAccountUpdatedWebhook(
  webhookEvent: WebhookEventRecord,
): Promise<JsonObject> {
  const { applyConnectAccountSnapshot, loadTutorPayoutProfileByStripeAccountId } =
    await import("@/modules/payouts/service");
  const { mapAccountToReadinessSnapshot } = await import(
    "@/modules/payouts/connect"
  );

  const payload = normalizeJsonObject(webhookEvent.payload as JsonValue | null);
  const data = payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)
    ? (payload.data as JsonObject)
    : null;
  const account =
    data?.object && typeof data.object === "object" && !Array.isArray(data.object)
      ? (data.object as JsonObject)
      : null;
  const accountId = typeof account?.id === "string" ? account.id : null;

  if (!accountId) {
    return { skipped_reason: "missing_account_id" };
  }

  const profile = await loadTutorPayoutProfileByStripeAccountId(accountId);

  if (!profile) {
    return { account_id: accountId, skipped_reason: "no_matching_tutor_profile" };
  }

  const snapshot = mapAccountToReadinessSnapshot({
    charges_enabled: account?.charges_enabled === true,
    details_submitted: account?.details_submitted === true,
    payouts_enabled: account?.payouts_enabled === true,
    requirements: normalizeRequirementsFromPayload(account?.requirements),
  });

  const result = await applyConnectAccountSnapshot({
    accountId,
    profile,
    snapshot,
  });

  return {
    account_id: accountId,
    listing_status: result.profile.public_listing_status,
    listing_status_changed: result.listingStatusChanged,
    payout_status: result.profile.payout_readiness_status,
    payout_status_changed: result.payoutStatusChanged,
  };
}

function normalizeRequirementsFromPayload(
  requirements: unknown,
): {
  currently_due: string[];
  disabled_reason: string | null;
  past_due: string[];
} {
  if (!requirements || typeof requirements !== "object" || Array.isArray(requirements)) {
    return { currently_due: [], disabled_reason: null, past_due: [] };
  }

  const requirementsObject = requirements as Record<string, unknown>;
  const currentlyDue = Array.isArray(requirementsObject.currently_due)
    ? requirementsObject.currently_due.filter(
        (entry): entry is string => typeof entry === "string",
      )
    : [];
  const pastDue = Array.isArray(requirementsObject.past_due)
    ? requirementsObject.past_due.filter(
        (entry): entry is string => typeof entry === "string",
      )
    : [];
  const disabledReason =
    typeof requirementsObject.disabled_reason === "string"
      ? requirementsObject.disabled_reason
      : null;

  return {
    currently_due: currentlyDue,
    disabled_reason: disabledReason,
    past_due: pastDue,
  };
}

async function markWebhookEventFailed(job: JobRunRecord, error: JobExecutionError) {
  const webhookEventId = resolveWebhookEventId(job);

  if (!webhookEventId) {
    return;
  }

  await updateWebhookEventState(webhookEventId, {
    error_code: error.code,
    error_message: error.message,
    processed_at: null,
    processing_status: "failed",
  });
}

async function updateJobState(
  jobId: string,
  updates: Partial<MentorIbDatabase["public"]["Tables"]["job_runs"]["Update"]>,
) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { error } = await serviceRoleClient.from("job_runs").update(updates).eq("id", jobId);

  if (error) {
    throw new Error(`Could not update job ${jobId}.`);
  }
}

async function updateWebhookEventState(
  eventId: string,
  updates: Partial<MentorIbDatabase["public"]["Tables"]["webhook_events"]["Update"]>,
) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { error } = await serviceRoleClient
    .from("webhook_events")
    .update(updates)
    .eq("id", eventId);

  if (error) {
    throw new Error(`Could not update webhook event ${eventId}.`);
  }
}

async function getJobByDedupeKey(jobType: JobType, dedupeKey: string) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("job_runs")
    .select("*")
    .eq("job_type", jobType)
    .eq("dedupe_key", dedupeKey)
    .maybeSingle<JobRunRecord>();

  if (error || !data) {
    throw new Error(`Could not load the deduped ${jobType} job.`);
  }

  return data;
}

async function getWebhookEventById(eventId: string) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("webhook_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle<WebhookEventRecord>();

  if (error || !data) {
    throw new Error(`Could not load webhook event ${eventId}.`);
  }

  return data;
}

async function getWebhookEventByProviderId(provider: "stripe", providerEventId: string) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("webhook_events")
    .select("*")
    .eq("provider", provider)
    .eq("provider_event_id", providerEventId)
    .maybeSingle<WebhookEventRecord>();

  if (error || !data) {
    throw new Error(`Could not load webhook event ${providerEventId}.`);
  }

  return data;
}

function buildStripeWebhookJobDedupeKey(provider: string, providerEventId: string) {
  return `${provider}:webhook:${providerEventId}`;
}

function resolveWebhookEventId(job: JobRunRecord) {
  if (job.trigger_object_type === "webhook_event" && job.trigger_object_id) {
    return job.trigger_object_id;
  }

  const payload = normalizeJsonObject(job.payload);
  const webhookEventId = payload.webhook_event_id;

  return typeof webhookEventId === "string" ? webhookEventId : null;
}

function normalizeJobError(job: JobRunRecord, error: unknown) {
  if (error instanceof JobExecutionError) {
    return error;
  }

  return new RetryableJobError(
    "job_execution_failed",
    `The ${job.job_type} job failed unexpectedly.`,
    {
      details: {
        cause: getErrorMessage(error),
      },
    },
  );
}

function toJsonObject(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as JsonObject;
}

function normalizeJsonObject(value: JsonValue | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as JsonObject;
}

function toUtcHourBucket(date: Date) {
  return `${date.toISOString().slice(0, 13)}:00:00Z`;
}

function toUtcDayBucket(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isSupportedStripeWebhookEventType(
  eventType: string,
): eventType is StripeWebhookEventType {
  return stripeWebhookEventTypes.includes(eventType as StripeWebhookEventType);
}

function isUniqueViolation(error: { code?: string | null }) {
  return error.code === "23505";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}
