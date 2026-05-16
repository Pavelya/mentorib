"use server";

import { revalidatePath } from "next/cache";

import { ensureAuthAccount } from "@/lib/auth/account-service";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  IN_APP_ONLY_NOTIFICATION_CATEGORIES,
  isNotificationCategory,
  type NotificationCategory,
} from "@/modules/notifications/constants";

const PREFERENCE_CHANNELS = ["in_app", "email"] as const;
type PreferenceChannel = (typeof PREFERENCE_CHANNELS)[number];

function isPreferenceChannel(value: unknown): value is PreferenceChannel {
  return (
    typeof value === "string" &&
    (PREFERENCE_CHANNELS as readonly string[]).includes(value)
  );
}

export type UpdateNotificationPreferenceInput = {
  category: NotificationCategory;
  channel: PreferenceChannel;
  enabled: boolean;
};

export type UpdateNotificationPreferenceResult =
  | { code: "success" }
  | {
      code:
        | "invalid_input"
        | "channel_not_toggleable"
        | "auth_required"
        | "auth_unconfigured"
        | "persist_failed";
      message: string;
    };

export async function updateNotificationPreference(
  input: UpdateNotificationPreferenceInput,
): Promise<UpdateNotificationPreferenceResult> {
  const category = input?.category;
  const channel = input?.channel;
  const enabled = input?.enabled;

  if (
    typeof category !== "string" ||
    !isNotificationCategory(category) ||
    !isPreferenceChannel(channel) ||
    typeof enabled !== "boolean"
  ) {
    return {
      code: "invalid_input",
      message: "We couldn't read that preference change. Refresh and try again.",
    };
  }

  if (channel === "email" && IN_APP_ONLY_NOTIFICATION_CATEGORIES.has(category)) {
    return {
      code: "channel_not_toggleable",
      message: "This category is delivered in-app only.",
    };
  }

  if (!isSupabaseAuthConfigured()) {
    return {
      code: "auth_unconfigured",
      message:
        "Notification preferences are not available until Supabase auth is configured.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    return {
      code: "auth_required",
      message: "Sign in again to update your notification preferences.",
    };
  }

  const account = await ensureAuthAccount(user);

  const upsertPayload =
    channel === "in_app"
      ? {
          app_user_id: account.id,
          in_app_enabled: enabled,
          notification_category: category,
        }
      : {
          app_user_id: account.id,
          email_enabled: enabled,
          notification_category: category,
        };

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(upsertPayload, {
      onConflict: "app_user_id,notification_category",
    });

  if (error) {
    return {
      code: "persist_failed",
      message:
        "We couldn't save that change just now. Please try again in a moment.",
    };
  }

  revalidatePath("/settings");

  return { code: "success" };
}
