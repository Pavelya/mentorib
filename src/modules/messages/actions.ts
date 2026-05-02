"use server";

import { revalidatePath } from "next/cache";

import { ensureAuthAccount } from "@/lib/auth/account-service";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  hasRole,
  isRestrictedAccount,
  requiresRoleSelection,
} from "@/modules/accounts/account-state";
import { logMessagesEvent } from "@/modules/messages/observability";
import { markConversationRead } from "@/modules/messages/read-state";
import {
  sendConversationMessage,
  type MessageSendResult,
} from "@/modules/messages/send";

import type { SendMessageActionState } from "./actions-state";

export async function sendMessageAction(
  _previousState: SendMessageActionState,
  formData: FormData,
): Promise<SendMessageActionState> {
  const conversationId = readFormString(formData, "conversationId");
  const body = readFormString(formData, "body");
  const replyToMessageId = readOptionalFormString(formData, "replyToMessageId");

  if (!conversationId) {
    return {
      code: "missing_conversation",
      fieldErrors: {},
      message: "We couldn't determine which conversation to send into.",
      submittedAt: Date.now(),
    };
  }

  if (!isSupabaseAuthConfigured()) {
    return {
      code: "auth_unconfigured",
      fieldErrors: {},
      message: "Messaging is unavailable in this environment.",
      submittedAt: Date.now(),
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    return {
      code: "unauthenticated",
      fieldErrors: {},
      message: "Sign in again to keep messaging.",
      submittedAt: Date.now(),
    };
  }

  let account: Awaited<ReturnType<typeof ensureAuthAccount>>;

  try {
    account = await ensureAuthAccount(user);
  } catch {
    return {
      code: "account_resolution_failed",
      fieldErrors: {},
      message: "We couldn't resolve your account context. Try again.",
      submittedAt: Date.now(),
    };
  }

  if (requiresRoleSelection(account)) {
    return {
      code: "role_selection_required",
      fieldErrors: {},
      message: "Finish account setup before sending messages.",
      submittedAt: Date.now(),
    };
  }

  if (isRestrictedAccount(account)) {
    return {
      code: "account_restricted",
      fieldErrors: {},
      message: "This account cannot send messages right now.",
      submittedAt: Date.now(),
    };
  }

  if (!hasRole(account, "student") && !hasRole(account, "tutor")) {
    return {
      code: "forbidden",
      fieldErrors: {},
      message: "You don't have permission to send messages.",
      submittedAt: Date.now(),
    };
  }

  let result: MessageSendResult;

  try {
    result = await sendConversationMessage(account, {
      body,
      conversationId,
      replyToMessageId: replyToMessageId ?? undefined,
    });
  } catch {
    logMessagesEvent("error", "send_action_unhandled_error", {
      actor_app_user_id: account.id,
      conversation_id: conversationId,
    });
    return {
      code: "temporary_failure",
      fieldErrors: {},
      message: "We couldn't send your message. Try again in a moment.",
      submittedAt: Date.now(),
    };
  }

  if (result.code === "ok") {
    revalidatePath("/messages");
    revalidatePath("/tutor/messages");
    revalidatePath("/notifications");
    return {
      code: "ok",
      fieldErrors: {},
      message: null,
      submittedAt: Date.now(),
    };
  }

  return {
    code: result.code,
    fieldErrors: result.fieldErrors ?? {},
    message: result.message ?? "We couldn't send your message.",
    submittedAt: Date.now(),
  };
}

export async function markConversationReadAction(formData: FormData) {
  const conversationId = readFormString(formData, "conversationId");

  if (!conversationId || !isSupabaseAuthConfigured()) {
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

  const result = await markConversationRead({ id: accountId }, conversationId);

  if (result.code === "ok" && result.marked > 0) {
    revalidatePath("/messages");
    revalidatePath("/tutor/messages");
    revalidatePath("/notifications");
  }
}

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function readOptionalFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length === 0 ? null : trimmed;
}
