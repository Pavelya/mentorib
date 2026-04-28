import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { logMessagesEvent } from "@/modules/messages/observability";
import {
  type ParticipantRole,
  type UserBlockStatus,
} from "@/modules/messages/constants";
import { upsertNewMessageNotification } from "@/modules/notifications/service";

export const MESSAGE_BODY_MAX_LENGTH = 4000;

const RATE_LIMIT_WINDOW_MS = 5_000;
const RATE_LIMIT_MAX_MESSAGES = 8;

export type MessageSendResultCode =
  | "validation_failed"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "conflict"
  | "temporary_failure"
  | "ok";

export type MessageSendResult = {
  code: MessageSendResultCode;
  fieldErrors?: Partial<Record<"body", string>>;
  message?: string;
  messageId?: string;
};

type ConversationOwnersRow = {
  conversation_status: "active" | "blocked" | "archived";
  id: string;
  student_app_user_id: string;
  student_profile_id: string;
  tutor_app_user_id: string;
  tutor_profile_id: string;
};

type CounterpartProfileRow = {
  app_user_id: string;
  display_name: string | null;
  full_name: string | null;
};

const COUNTERPART_DISPLAY_FALLBACK = "your conversation partner";

export async function sendConversationMessage(
  account: Pick<ResolvedAuthAccount, "id">,
  params: { body: string; conversationId: string; replyToMessageId?: string },
): Promise<MessageSendResult> {
  if (!isUuid(params.conversationId)) {
    return {
      code: "not_found",
      message: "We couldn't find that conversation.",
    };
  }

  if (params.replyToMessageId !== undefined && !isUuid(params.replyToMessageId)) {
    return {
      code: "validation_failed",
      message: "The reply target is not valid.",
    };
  }

  const trimmedBody = params.body.trim();

  if (trimmedBody.length === 0) {
    return {
      code: "validation_failed",
      fieldErrors: { body: "Type a message before sending." },
      message: "Type a message before sending.",
    };
  }

  if (trimmedBody.length > MESSAGE_BODY_MAX_LENGTH) {
    return {
      code: "validation_failed",
      fieldErrors: {
        body: `Keep messages under ${MESSAGE_BODY_MAX_LENGTH} characters.`,
      },
      message: `Keep messages under ${MESSAGE_BODY_MAX_LENGTH} characters.`,
    };
  }

  const supabase = createSupabaseServiceRoleClient();

  const conversation = await loadConversationOwners(params.conversationId);

  if (!conversation) {
    return {
      code: "not_found",
      message: "We couldn't find that conversation.",
    };
  }

  if (conversation.conversation_status !== "active") {
    return {
      code: "forbidden",
      message: "This conversation is not accepting new messages.",
    };
  }

  const senderRole = resolveSenderRole(conversation, account.id);

  if (!senderRole) {
    logMessagesEvent("warn", "send_denied_non_participant", {
      actor_app_user_id: account.id,
      conversation_id: conversation.id,
      reason: "non_participant",
    });
    return {
      code: "not_found",
      message: "We couldn't find that conversation.",
    };
  }

  const counterpartAppUserId =
    senderRole === "student"
      ? conversation.tutor_app_user_id
      : conversation.student_app_user_id;

  const blockState = await loadActiveBlockState(account.id, counterpartAppUserId);

  if (blockState) {
    logMessagesEvent("info", "send_denied_block", {
      actor_app_user_id: account.id,
      conversation_id: conversation.id,
      reason: blockState,
    });
    return {
      code: "forbidden",
      message:
        blockState === "blocked_by_me"
          ? "Unblock this participant to continue messaging."
          : "This participant has blocked further messages.",
    };
  }

  const recentSendCount = await countRecentMessagesFromActor(account.id);

  if (recentSendCount >= RATE_LIMIT_MAX_MESSAGES) {
    logMessagesEvent("warn", "send_rate_limited", {
      actor_app_user_id: account.id,
      conversation_id: conversation.id,
    });
    return {
      code: "rate_limited",
      message: "You're sending messages too quickly. Pause for a moment and try again.",
    };
  }

  if (params.replyToMessageId) {
    const replyValid = await isReplyTargetInConversation(
      params.replyToMessageId,
      conversation.id,
    );

    if (!replyValid) {
      return {
        code: "validation_failed",
        message: "Reply target is no longer available.",
      };
    }
  }

  const insertPayload = {
    body: trimmedBody,
    conversation_id: conversation.id,
    reply_to_message_id: params.replyToMessageId ?? null,
    sender_app_user_id: account.id,
  };

  const { data: insertedMessage, error: insertError } = await supabase
    .from("messages")
    .insert(insertPayload)
    .select("id")
    .single<{ id: string }>();

  if (insertError || !insertedMessage) {
    logMessagesEvent("error", "send_insert_failed", {
      actor_app_user_id: account.id,
      conversation_id: conversation.id,
      reason: insertError?.code ?? "unknown",
    });
    return {
      code: "temporary_failure",
      message: "We couldn't send your message. Try again in a moment.",
    };
  }

  const senderName = await resolveActorDisplayName(account.id, senderRole);

  await upsertNewMessageNotification({
    appUserId: counterpartAppUserId,
    bodySummary: buildNewMessageSummary(senderName),
    conversationId: conversation.id,
    title: `New message from ${senderName}`,
  });

  logMessagesEvent("info", "send_succeeded", {
    actor_app_user_id: account.id,
    body_length: trimmedBody.length,
    conversation_id: conversation.id,
    message_id: insertedMessage.id,
    recipient_app_user_id: counterpartAppUserId,
  });

  return { code: "ok", messageId: insertedMessage.id };
}

async function loadConversationOwners(
  conversationId: string,
): Promise<ConversationOwnersRow | null> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: conversationRow, error: conversationError } = await supabase
    .from("conversations")
    .select(
      "id, conversation_status, student_profile_id, tutor_profile_id",
    )
    .eq("id", conversationId)
    .maybeSingle<{
      id: string;
      conversation_status: ConversationOwnersRow["conversation_status"];
      student_profile_id: string;
      tutor_profile_id: string;
    }>();

  if (conversationError || !conversationRow) {
    return null;
  }

  const [studentResult, tutorResult] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("app_user_id")
      .eq("id", conversationRow.student_profile_id)
      .maybeSingle<{ app_user_id: string }>(),
    supabase
      .from("tutor_profiles")
      .select("app_user_id")
      .eq("id", conversationRow.tutor_profile_id)
      .maybeSingle<{ app_user_id: string }>(),
  ]);

  if (
    studentResult.error ||
    tutorResult.error ||
    !studentResult.data ||
    !tutorResult.data
  ) {
    return null;
  }

  return {
    conversation_status: conversationRow.conversation_status,
    id: conversationRow.id,
    student_app_user_id: studentResult.data.app_user_id,
    student_profile_id: conversationRow.student_profile_id,
    tutor_app_user_id: tutorResult.data.app_user_id,
    tutor_profile_id: conversationRow.tutor_profile_id,
  };
}

function resolveSenderRole(
  conversation: ConversationOwnersRow,
  actorAppUserId: string,
): ParticipantRole | null {
  if (conversation.student_app_user_id === actorAppUserId) {
    return "student";
  }

  if (conversation.tutor_app_user_id === actorAppUserId) {
    return "tutor";
  }

  return null;
}

async function loadActiveBlockState(
  actorAppUserId: string,
  counterpartAppUserId: string,
): Promise<"blocked_by_me" | "blocked_by_counterpart" | null> {
  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocker_app_user_id, blocked_app_user_id, block_status")
    .eq("block_status", "active" satisfies UserBlockStatus)
    .or(
      `and(blocker_app_user_id.eq.${actorAppUserId},blocked_app_user_id.eq.${counterpartAppUserId}),and(blocker_app_user_id.eq.${counterpartAppUserId},blocked_app_user_id.eq.${actorAppUserId})`,
    )
    .returns<
      Array<{
        blocked_app_user_id: string;
        blocker_app_user_id: string;
        block_status: UserBlockStatus;
      }>
    >();

  if (error || !data || data.length === 0) {
    return null;
  }

  for (const row of data) {
    if (row.blocker_app_user_id === actorAppUserId) {
      return "blocked_by_me";
    }
  }

  return "blocked_by_counterpart";
}

async function countRecentMessagesFromActor(actorAppUserId: string): Promise<number> {
  const supabase = createSupabaseServiceRoleClient();
  const sinceIso = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("sender_app_user_id", actorAppUserId)
    .gte("created_at", sinceIso);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

async function isReplyTargetInConversation(
  replyToMessageId: string,
  conversationId: string,
): Promise<boolean> {
  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id")
    .eq("id", replyToMessageId)
    .maybeSingle<{ id: string; conversation_id: string }>();

  if (error || !data) {
    return false;
  }

  return data.conversation_id === conversationId;
}

async function resolveActorDisplayName(
  appUserId: string,
  senderRole: ParticipantRole,
): Promise<string> {
  const supabase = createSupabaseServiceRoleClient();
  const profileTable =
    senderRole === "tutor" ? "tutor_profiles" : "student_profiles";

  const [userResult, profileResult] = await Promise.all([
    supabase
      .from("app_users")
      .select("full_name")
      .eq("id", appUserId)
      .maybeSingle<{ full_name: string | null }>(),
    supabase
      .from(profileTable)
      .select("display_name")
      .eq("app_user_id", appUserId)
      .maybeSingle<{ display_name: string | null }>(),
  ]);

  return resolveDisplayName({
    app_user_id: appUserId,
    display_name: profileResult.data?.display_name ?? null,
    full_name: userResult.data?.full_name ?? null,
  });
}

function resolveDisplayName(record: CounterpartProfileRow): string {
  const candidate = record.display_name?.trim() || record.full_name?.trim();

  return candidate && candidate.length > 0
    ? candidate
    : COUNTERPART_DISPLAY_FALLBACK;
}

function buildNewMessageSummary(senderName: string) {
  return `${senderName} sent you a new message. Open the conversation to read it.`;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}
