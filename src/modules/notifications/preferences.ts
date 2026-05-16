import type { MentorIbDatabase } from "@/lib/supabase/database.types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

import {
  MANDATORY_NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_TO_CATEGORY,
  notificationCategories,
  type NotificationCategory,
  type NotificationType,
} from "@/modules/notifications/constants";

type NotificationPreferenceRow =
  MentorIbDatabase["public"]["Tables"]["notification_preferences"]["Row"];

export type NotificationDispatchPolicy = {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  isMandatory: boolean;
};

export type NotificationPreferenceSnapshot = Record<
  NotificationCategory,
  { email_enabled: boolean; in_app_enabled: boolean }
>;

const DEFAULT_CHANNEL_STATE = {
  email_enabled: true,
  in_app_enabled: true,
} as const;

const MANDATORY_POLICY: NotificationDispatchPolicy = {
  emailEnabled: true,
  inAppEnabled: true,
  isMandatory: true,
};

export function buildDefaultNotificationPreferenceSnapshot(): NotificationPreferenceSnapshot {
  return notificationCategories.reduce((acc, category) => {
    acc[category] = { ...DEFAULT_CHANNEL_STATE };
    return acc;
  }, {} as NotificationPreferenceSnapshot);
}

export async function getNotificationPreferenceSnapshot(
  appUserId: string,
): Promise<NotificationPreferenceSnapshot> {
  const snapshot = buildDefaultNotificationPreferenceSnapshot();

  if (!appUserId) {
    return snapshot;
  }

  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("notification_preferences")
    .select("notification_category, in_app_enabled, email_enabled")
    .eq("app_user_id", appUserId);

  if (error || !data) {
    return snapshot;
  }

  for (const row of data as Pick<
    NotificationPreferenceRow,
    "notification_category" | "in_app_enabled" | "email_enabled"
  >[]) {
    snapshot[row.notification_category] = {
      email_enabled: row.email_enabled,
      in_app_enabled: row.in_app_enabled,
    };
  }

  return snapshot;
}

export async function resolveNotificationDispatchPolicy(
  appUserId: string,
  notificationType: NotificationType,
): Promise<NotificationDispatchPolicy> {
  if (MANDATORY_NOTIFICATION_TYPES.has(notificationType)) {
    return MANDATORY_POLICY;
  }

  const category = NOTIFICATION_TYPE_TO_CATEGORY[notificationType];

  if (!category) {
    // Unknown / unmapped optional types default to mandatory delivery so an
    // accidentally-untyped notification never silently disappears.
    return MANDATORY_POLICY;
  }

  if (!appUserId) {
    return {
      emailEnabled: true,
      inAppEnabled: true,
      isMandatory: false,
    };
  }

  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("notification_preferences")
    .select("in_app_enabled, email_enabled")
    .eq("app_user_id", appUserId)
    .eq("notification_category", category)
    .maybeSingle<Pick<
      NotificationPreferenceRow,
      "in_app_enabled" | "email_enabled"
    >>();

  if (error || !data) {
    return {
      emailEnabled: true,
      inAppEnabled: true,
      isMandatory: false,
    };
  }

  return {
    emailEnabled: data.email_enabled,
    inAppEnabled: data.in_app_enabled,
    isMandatory: false,
  };
}
