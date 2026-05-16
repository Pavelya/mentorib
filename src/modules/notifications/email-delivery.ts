import type { MentorIbDatabase } from "@/lib/supabase/database.types";
import { logEmailEvent } from "@/lib/email/logging";
import { sendTransactionalEmail } from "@/lib/email/service";
import { enqueueJob } from "@/lib/jobs/service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

import {
  buildNotificationEmailPayload,
  isEmailEligibleNotificationType,
} from "@/modules/notifications/email-mapping";
import { NOTIFICATION_TYPE_TO_CATEGORY, type NotificationType } from "@/modules/notifications/constants";
import { resolveNotificationDispatchPolicy } from "@/modules/notifications/preferences";

type NotificationRow = MentorIbDatabase["public"]["Tables"]["notifications"]["Row"];
type NotificationDeliveryRow =
  MentorIbDatabase["public"]["Tables"]["notification_deliveries"]["Row"];

const EMAIL_PROVIDER = "resend";

export type ScheduleNotificationEmailInput = {
  notification: Pick<
    NotificationRow,
    | "app_user_id"
    | "body_summary"
    | "id"
    | "notification_type"
    | "object_id"
    | "object_type"
    | "title"
  >;
};

export async function scheduleNotificationEmailDelivery(
  input: ScheduleNotificationEmailInput,
) {
  const { notification } = input;

  if (!isEmailEligibleNotificationType(notification.notification_type)) {
    return { outcome: "skipped" as const, reason: "channel_in_app_only" };
  }

  const dispatchPolicy = await resolveNotificationDispatchPolicy(
    notification.app_user_id,
    notification.notification_type,
  );

  if (!dispatchPolicy.isMandatory && !dispatchPolicy.emailEnabled) {
    logEmailEvent("info", "notification_email_skipped", {
      app_user_id: notification.app_user_id,
      notification_category:
        NOTIFICATION_TYPE_TO_CATEGORY[notification.notification_type],
      notification_id: notification.id,
      notification_type: notification.notification_type,
      reason: "channel_disabled_by_preference",
    });

    return {
      outcome: "skipped" as const,
      reason: "channel_disabled_by_preference",
    };
  }

  const result = await enqueueJob({
    dedupeKey: `notification_email:${notification.id}:1`,
    jobType: "notification_delivery",
    payload: {
      attempt_number: 1,
      channel: "email",
      notification_id: notification.id,
    },
    triggerObjectId: notification.id,
    triggerObjectType: "notification",
  });

  return { outcome: "enqueued" as const, deduped: result.deduped };
}

export type DeliverNotificationEmailInput = {
  attemptNumber: number;
  jobRunId: string;
  notificationId: string;
};

export type DeliverNotificationEmailOutcome = {
  deliveryId: string | null;
  status: "skipped" | "sent" | "failed";
  retryable: boolean;
  reason?: string;
};

export async function deliverNotificationEmail(
  input: DeliverNotificationEmailInput,
): Promise<DeliverNotificationEmailOutcome> {
  const serviceRoleClient = createSupabaseServiceRoleClient();

  const { data: notification, error: notificationError } = await serviceRoleClient
    .from("notifications")
    .select(
      "id, app_user_id, body_summary, notification_type, object_id, object_type, title",
    )
    .eq("id", input.notificationId)
    .maybeSingle<
      Pick<
        NotificationRow,
        | "app_user_id"
        | "body_summary"
        | "id"
        | "notification_type"
        | "object_id"
        | "object_type"
        | "title"
      >
    >();

  if (notificationError || !notification) {
    return {
      deliveryId: null,
      retryable: false,
      status: "skipped",
      reason: "notification_not_found",
    };
  }

  const emailPayload = buildNotificationEmailPayload({
    bodySummary: notification.body_summary,
    notificationType: notification.notification_type as NotificationType,
    objectId: notification.object_id,
    objectType: notification.object_type as never,
    title: notification.title,
  });

  if (!emailPayload) {
    return {
      deliveryId: null,
      retryable: false,
      status: "skipped",
      reason: "channel_in_app_only",
    };
  }

  const { data: appUser, error: appUserError } = await serviceRoleClient
    .from("app_users")
    .select("id, email")
    .eq("id", notification.app_user_id)
    .maybeSingle<{ email: string; id: string }>();

  if (appUserError || !appUser?.email) {
    return {
      deliveryId: null,
      retryable: false,
      status: "skipped",
      reason: "recipient_email_unavailable",
    };
  }

  const delivery = await upsertDeliveryAttempt({
    attemptNumber: input.attemptNumber,
    jobRunId: input.jobRunId,
    notificationId: notification.id,
  });

  if (!delivery) {
    return {
      deliveryId: null,
      retryable: true,
      status: "failed",
      reason: "delivery_record_unavailable",
    };
  }

  await markDeliveryAttempted(delivery.id);

  const sendResult = await sendTransactionalEmail({
    contentTag: emailPayload.contentTag,
    recipientEmail: appUser.email,
    subject: emailPayload.subject,
    template: emailPayload.template,
  });

  if (sendResult.outcome === "skipped") {
    await markDeliverySkipped(delivery.id, sendResult.reason);

    logEmailEvent("warn", "notification_email_send_skipped", {
      delivery_id: delivery.id,
      notification_id: notification.id,
      reason: sendResult.reason,
    });

    return {
      deliveryId: delivery.id,
      retryable: false,
      status: "skipped",
      reason: sendResult.reason,
    };
  }

  if (sendResult.outcome === "sent") {
    await markDeliveryAccepted(delivery.id, sendResult.providerMessageId);

    logEmailEvent("info", "notification_email_accepted", {
      delivery_id: delivery.id,
      notification_id: notification.id,
      provider_message_id: sendResult.providerMessageId,
    });

    return { deliveryId: delivery.id, retryable: false, status: "sent" };
  }

  await markDeliveryFailed(delivery.id, {
    errorCode: sendResult.errorCode,
    errorMessage: sendResult.errorMessage,
  });

  return {
    deliveryId: delivery.id,
    reason: sendResult.errorCode,
    retryable: sendResult.retryable,
    status: "failed",
  };
}

async function upsertDeliveryAttempt(input: {
  attemptNumber: number;
  jobRunId: string;
  notificationId: string;
}): Promise<NotificationDeliveryRow | null> {
  const serviceRoleClient = createSupabaseServiceRoleClient();

  const { data: existing } = await serviceRoleClient
    .from("notification_deliveries")
    .select(
      "accepted_at, attempt_number, attempted_at, channel, created_at, delivery_status, error_code, error_message, failed_at, id, job_run_id, notification_id, provider, provider_message_id, updated_at",
    )
    .eq("notification_id", input.notificationId)
    .eq("channel", "email")
    .eq("attempt_number", input.attemptNumber)
    .maybeSingle<NotificationDeliveryRow>();

  if (existing) {
    if (existing.delivery_status === "accepted") {
      return existing;
    }

    const { data: refreshed, error: refreshError } = await serviceRoleClient
      .from("notification_deliveries")
      .update({
        accepted_at: null,
        attempted_at: null,
        delivery_status: "queued",
        error_code: null,
        error_message: null,
        failed_at: null,
        job_run_id: input.jobRunId,
        provider: EMAIL_PROVIDER,
        provider_message_id: null,
      })
      .eq("id", existing.id)
      .select(
        "accepted_at, attempt_number, attempted_at, channel, created_at, delivery_status, error_code, error_message, failed_at, id, job_run_id, notification_id, provider, provider_message_id, updated_at",
      )
      .maybeSingle<NotificationDeliveryRow>();

    if (refreshError) {
      return null;
    }

    return refreshed;
  }

  const { data, error } = await serviceRoleClient
    .from("notification_deliveries")
    .insert({
      attempt_number: input.attemptNumber,
      channel: "email",
      delivery_status: "queued",
      job_run_id: input.jobRunId,
      notification_id: input.notificationId,
      provider: EMAIL_PROVIDER,
    })
    .select(
      "accepted_at, attempt_number, attempted_at, channel, created_at, delivery_status, error_code, error_message, failed_at, id, job_run_id, notification_id, provider, provider_message_id, updated_at",
    )
    .maybeSingle<NotificationDeliveryRow>();

  if (error) {
    return null;
  }

  return data;
}

async function markDeliveryAttempted(deliveryId: string) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const nowIso = new Date().toISOString();

  await serviceRoleClient
    .from("notification_deliveries")
    .update({
      attempted_at: nowIso,
      delivery_status: "attempted",
    })
    .eq("id", deliveryId);
}

async function markDeliveryAccepted(
  deliveryId: string,
  providerMessageId: string,
) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const nowIso = new Date().toISOString();

  await serviceRoleClient
    .from("notification_deliveries")
    .update({
      accepted_at: nowIso,
      delivery_status: "accepted",
      error_code: null,
      error_message: null,
      provider_message_id: providerMessageId,
    })
    .eq("id", deliveryId);
}

async function markDeliveryFailed(
  deliveryId: string,
  failure: { errorCode: string; errorMessage: string },
) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const nowIso = new Date().toISOString();

  await serviceRoleClient
    .from("notification_deliveries")
    .update({
      delivery_status: "failed",
      error_code: failure.errorCode,
      error_message: failure.errorMessage,
      failed_at: nowIso,
    })
    .eq("id", deliveryId);
}

async function markDeliverySkipped(deliveryId: string, reason: string) {
  // notification_deliveries does not model a skipped status, so record the
  // reason as a non-retryable failure to keep tracking honest.
  await markDeliveryFailed(deliveryId, {
    errorCode: "send_skipped",
    errorMessage: `Email send skipped: ${reason}`,
  });
}
