"use server";

import { revalidatePath } from "next/cache";

import { ensureAuthAccount } from "@/lib/auth/account-service";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  markAllAccountNotificationsRead,
  updateNotificationStatus,
} from "@/modules/notifications/service";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ALLOWED_TRANSITIONS = ["read", "unread", "dismissed"] as const;

type NotificationStatusTransition = (typeof ALLOWED_TRANSITIONS)[number];

export async function setNotificationStatusAction(formData: FormData) {
  const notificationId = readFormString(formData, "notificationId");
  const nextStatus = readFormString(formData, "nextStatus");

  if (
    !notificationId ||
    !UUID_PATTERN.test(notificationId) ||
    !isAllowedTransition(nextStatus)
  ) {
    return;
  }

  if (!isSupabaseAuthConfigured()) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    return;
  }

  let accountId: string;

  try {
    const account = await ensureAuthAccount(user);
    accountId = account.id;
  } catch {
    return;
  }

  await updateNotificationStatus(accountId, notificationId, nextStatus);
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  if (!isSupabaseAuthConfigured()) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    return;
  }

  let accountId: string;

  try {
    const account = await ensureAuthAccount(user);
    accountId = account.id;
  } catch {
    return;
  }

  await markAllAccountNotificationsRead(accountId);
  revalidatePath("/notifications");
}

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function isAllowedTransition(value: string): value is NotificationStatusTransition {
  return (ALLOWED_TRANSITIONS as readonly string[]).includes(value);
}
