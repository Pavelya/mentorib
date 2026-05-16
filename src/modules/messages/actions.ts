"use server";

import { revalidatePath } from "next/cache";

import { captureServerEvent } from "@/lib/analytics/server";
import { ensureAuthAccount } from "@/lib/auth/account-service";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  hasRole,
  isRestrictedAccount,
  requiresRoleSelection,
} from "@/modules/accounts/account-state";
import {
  setConversationParticipantFlag,
  type ConversationFlagResult,
  type ConversationParticipantFlag,
} from "@/modules/messages/conversation-state";
import { logMessagesEvent } from "@/modules/messages/observability";
import { markConversationRead } from "@/modules/messages/read-state";
import {
  toggleMessageReaction,
  type ToggleReactionResult,
} from "@/modules/messages/reactions";
import {
  sendConversationMessage,
  type MessageSendResult,
} from "@/modules/messages/send";

import type {
  ConversationFlagActionState,
  SendMessageActionState,
  ToggleReactionActionState,
} from "./actions-state";

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

export async function toggleReactionAction(
  _previousState: ToggleReactionActionState,
  formData: FormData,
): Promise<ToggleReactionActionState> {
  const messageId = readFormString(formData, "messageId");
  const reactionKey = readFormString(formData, "reactionKey");

  if (!messageId || !reactionKey) {
    return {
      action: null,
      code: "validation_failed",
      message: "Pick a reaction to apply.",
      messageId,
      reactionKey,
      submittedAt: Date.now(),
    };
  }

  if (!isSupabaseAuthConfigured()) {
    return {
      action: null,
      code: "auth_unconfigured",
      message: "Messaging is unavailable in this environment.",
      messageId,
      reactionKey,
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
      action: null,
      code: "unauthenticated",
      message: "Sign in again to react to messages.",
      messageId,
      reactionKey,
      submittedAt: Date.now(),
    };
  }

  let account: Awaited<ReturnType<typeof ensureAuthAccount>>;

  try {
    account = await ensureAuthAccount(user);
  } catch {
    return {
      action: null,
      code: "account_resolution_failed",
      message: "We couldn't resolve your account context. Try again.",
      messageId,
      reactionKey,
      submittedAt: Date.now(),
    };
  }

  if (requiresRoleSelection(account) || isRestrictedAccount(account)) {
    return {
      action: null,
      code: "forbidden",
      message: "Your account cannot react to messages right now.",
      messageId,
      reactionKey,
      submittedAt: Date.now(),
    };
  }

  if (!hasRole(account, "student") && !hasRole(account, "tutor")) {
    return {
      action: null,
      code: "forbidden",
      message: "You don't have permission to react to this message.",
      messageId,
      reactionKey,
      submittedAt: Date.now(),
    };
  }

  let result: ToggleReactionResult;

  try {
    result = await toggleMessageReaction(account, { messageId, reactionKey });
  } catch {
    logMessagesEvent("error", "reaction_action_unhandled_error", {
      actor_app_user_id: account.id,
      message_id: messageId,
    });
    return {
      action: null,
      code: "temporary_failure",
      message: "We couldn't update your reaction. Try again in a moment.",
      messageId,
      reactionKey,
      submittedAt: Date.now(),
    };
  }

  if (result.code === "ok") {
    if (result.action && result.conversationId) {
      captureServerEvent({
        distinctId: account.id,
        name: "message_reaction_toggled",
        properties: {
          action: result.action,
          conversation_id: result.conversationId,
          message_id: messageId,
          reaction_key:
            reactionKey as "thumbs_up" | "heart" | "laugh" | "celebrate" | "thinking" | "clap",
        },
      });
    }

    revalidatePath("/messages");
    revalidatePath("/tutor/messages");

    return {
      action: result.action ?? null,
      code: "ok",
      message: null,
      messageId,
      reactionKey,
      submittedAt: Date.now(),
    };
  }

  return {
    action: null,
    code: result.code,
    message: result.message ?? "We couldn't update your reaction.",
    messageId,
    reactionKey,
    submittedAt: Date.now(),
  };
}

export async function setConversationMutedAction(
  _previousState: ConversationFlagActionState,
  formData: FormData,
): Promise<ConversationFlagActionState> {
  return runConversationFlagAction(formData, "muted");
}

export async function setConversationArchivedAction(
  _previousState: ConversationFlagActionState,
  formData: FormData,
): Promise<ConversationFlagActionState> {
  return runConversationFlagAction(formData, "archived");
}

async function runConversationFlagAction(
  formData: FormData,
  flag: ConversationParticipantFlag,
): Promise<ConversationFlagActionState> {
  const conversationId = readFormString(formData, "conversationId");
  const value = readFormString(formData, "value") === "true";

  if (!conversationId) {
    return {
      action: null,
      code: "missing_conversation",
      conversationId: null,
      flag,
      message: "We couldn't determine which conversation to update.",
      submittedAt: Date.now(),
    };
  }

  if (!isSupabaseAuthConfigured()) {
    return {
      action: null,
      code: "auth_unconfigured",
      conversationId,
      flag,
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
      action: null,
      code: "unauthenticated",
      conversationId,
      flag,
      message: "Sign in again to update this conversation.",
      submittedAt: Date.now(),
    };
  }

  let account: Awaited<ReturnType<typeof ensureAuthAccount>>;

  try {
    account = await ensureAuthAccount(user);
  } catch {
    return {
      action: null,
      code: "account_resolution_failed",
      conversationId,
      flag,
      message: "We couldn't resolve your account context. Try again.",
      submittedAt: Date.now(),
    };
  }

  if (requiresRoleSelection(account) || isRestrictedAccount(account)) {
    return {
      action: null,
      code: "forbidden",
      conversationId,
      flag,
      message: "Your account cannot update this conversation right now.",
      submittedAt: Date.now(),
    };
  }

  let result: ConversationFlagResult;

  try {
    result = await setConversationParticipantFlag(account, {
      conversationId,
      flag,
      value,
    });
  } catch {
    logMessagesEvent("error", `${flag}_action_unhandled_error`, {
      actor_app_user_id: account.id,
      conversation_id: conversationId,
    });
    return {
      action: null,
      code: "temporary_failure",
      conversationId,
      flag,
      message: "We couldn't update this conversation. Try again in a moment.",
      submittedAt: Date.now(),
    };
  }

  if (result.code === "ok") {
    if (result.action) {
      captureServerEvent({
        distinctId: account.id,
        name: flag === "muted" ? "conversation_muted_toggled" : "conversation_archived_toggled",
        properties: {
          action: result.action,
          conversation_id: conversationId,
        },
      });
    }

    revalidatePath("/messages");
    revalidatePath("/tutor/messages");

    return {
      action: result.action ?? null,
      code: "ok",
      conversationId,
      flag,
      message: null,
      submittedAt: Date.now(),
    };
  }

  return {
    action: null,
    code: result.code,
    conversationId,
    flag,
    message: result.message ?? "We couldn't update this conversation.",
    submittedAt: Date.now(),
  };
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
