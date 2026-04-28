import type { MentorIbDatabase } from "@/lib/supabase/database.types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

import type {
  NotificationStatus,
  NotificationType,
} from "@/modules/notifications/constants";

type NotificationRow =
  MentorIbDatabase["public"]["Tables"]["notifications"]["Row"];

export const NOTIFICATION_OBJECT_TYPES = {
  conversation: "conversation",
  lesson: "lesson",
  lessonIssueCase: "lesson_issue_case",
  payment: "payment",
  policyNoticeVersion: "policy_notice_version",
  tutorApplication: "tutor_application",
  tutorReview: "tutor_review",
} as const;

export type NotificationObjectType =
  (typeof NOTIFICATION_OBJECT_TYPES)[keyof typeof NOTIFICATION_OBJECT_TYPES];

export type CreateNotificationInput = {
  appUserId: string;
  bodySummary: string;
  notificationType: NotificationType;
  objectId: string | null;
  objectType: NotificationObjectType;
  title: string;
};

export async function createNotification(
  input: CreateNotificationInput,
): Promise<NotificationRow | null> {
  const trimmedTitle = input.title.trim();
  const trimmedBody = input.bodySummary.trim();
  const trimmedObjectType = input.objectType.trim();

  if (!trimmedTitle || !trimmedBody || !trimmedObjectType) {
    return null;
  }

  const serviceRoleClient = createSupabaseServiceRoleClient();

  if (input.objectId) {
    const { data: existing } = await serviceRoleClient
      .from("notifications")
      .select(
        "id, app_user_id, body_summary, created_at, dismissed_at, notification_status, notification_type, object_id, object_type, read_at, title, updated_at",
      )
      .eq("app_user_id", input.appUserId)
      .eq("notification_type", input.notificationType)
      .eq("object_type", trimmedObjectType)
      .eq("object_id", input.objectId)
      .maybeSingle<NotificationRow>();

    if (existing) {
      return existing;
    }
  }

  const { data, error } = await serviceRoleClient
    .from("notifications")
    .insert({
      app_user_id: input.appUserId,
      body_summary: trimmedBody,
      notification_type: input.notificationType,
      object_id: input.objectId,
      object_type: trimmedObjectType,
      title: trimmedTitle,
    })
    .select(
      "id, app_user_id, body_summary, created_at, dismissed_at, notification_status, notification_type, object_id, object_type, read_at, title, updated_at",
    )
    .single<NotificationRow>();

  if (error) {
    return null;
  }

  return data;
}

export async function upsertNewMessageNotification(input: {
  appUserId: string;
  bodySummary: string;
  conversationId: string;
  title: string;
}): Promise<NotificationRow | null> {
  const trimmedTitle = input.title.trim();
  const trimmedBody = input.bodySummary.trim();

  if (!trimmedTitle || !trimmedBody) {
    return null;
  }

  const serviceRoleClient = createSupabaseServiceRoleClient();
  const objectType = NOTIFICATION_OBJECT_TYPES.conversation;

  const { data: existing } = await serviceRoleClient
    .from("notifications")
    .select(
      "id, app_user_id, body_summary, created_at, dismissed_at, notification_status, notification_type, object_id, object_type, read_at, title, updated_at",
    )
    .eq("app_user_id", input.appUserId)
    .eq("notification_type", "new_message")
    .eq("object_type", objectType)
    .eq("object_id", input.conversationId)
    .maybeSingle<NotificationRow>();

  if (existing) {
    if (existing.notification_status === "unread") {
      return existing;
    }

    const { data: refreshed, error: refreshError } = await serviceRoleClient
      .from("notifications")
      .update({
        body_summary: trimmedBody,
        dismissed_at: null,
        notification_status: "unread",
        read_at: null,
        title: trimmedTitle,
      })
      .eq("id", existing.id)
      .select(
        "id, app_user_id, body_summary, created_at, dismissed_at, notification_status, notification_type, object_id, object_type, read_at, title, updated_at",
      )
      .single<NotificationRow>();

    if (refreshError) {
      return null;
    }

    return refreshed;
  }

  const { data, error } = await serviceRoleClient
    .from("notifications")
    .insert({
      app_user_id: input.appUserId,
      body_summary: trimmedBody,
      notification_type: "new_message",
      object_id: input.conversationId,
      object_type: objectType,
      title: trimmedTitle,
    })
    .select(
      "id, app_user_id, body_summary, created_at, dismissed_at, notification_status, notification_type, object_id, object_type, read_at, title, updated_at",
    )
    .single<NotificationRow>();

  if (error) {
    return null;
  }

  return data;
}

export async function markConversationNewMessageNotificationRead(input: {
  appUserId: string;
  conversationId: string;
}): Promise<void> {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const nowIso = new Date().toISOString();

  await serviceRoleClient
    .from("notifications")
    .update({
      dismissed_at: null,
      notification_status: "read",
      read_at: nowIso,
    })
    .eq("app_user_id", input.appUserId)
    .eq("notification_type", "new_message")
    .eq("object_type", NOTIFICATION_OBJECT_TYPES.conversation)
    .eq("object_id", input.conversationId)
    .eq("notification_status", "unread");
}

export async function updateNotificationStatus(
  appUserId: string,
  notificationId: string,
  nextStatus: NotificationStatus,
): Promise<NotificationRow | null> {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const nowIso = new Date().toISOString();

  const updates: MentorIbDatabase["public"]["Tables"]["notifications"]["Update"] =
    nextStatus === "read"
      ? { dismissed_at: null, notification_status: "read", read_at: nowIso }
      : nextStatus === "dismissed"
        ? { dismissed_at: nowIso, notification_status: "dismissed" }
        : { dismissed_at: null, notification_status: "unread", read_at: null };

  const { data, error } = await serviceRoleClient
    .from("notifications")
    .update(updates)
    .eq("id", notificationId)
    .eq("app_user_id", appUserId)
    .select(
      "id, app_user_id, body_summary, created_at, dismissed_at, notification_status, notification_type, object_id, object_type, read_at, title, updated_at",
    )
    .maybeSingle<NotificationRow>();

  if (error) {
    return null;
  }

  return data;
}

export async function markAllAccountNotificationsRead(
  appUserId: string,
): Promise<number> {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await serviceRoleClient
    .from("notifications")
    .update({
      dismissed_at: null,
      notification_status: "read",
      read_at: nowIso,
    })
    .eq("app_user_id", appUserId)
    .eq("notification_status", "unread")
    .neq("notification_type", "new_message")
    .select("id");

  if (error || !data) {
    return 0;
  }

  return data.length;
}
