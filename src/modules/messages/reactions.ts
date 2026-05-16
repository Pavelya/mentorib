import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  isUuid,
  loadActiveBlockState,
  loadConversationOwners,
  resolveParticipantRole,
} from "@/modules/messages/access";
import {
  isMessageReactionKey,
  type MessageReactionKey,
  type MessageStatus,
  messageReactionKeys,
} from "@/modules/messages/constants";
import { logMessagesEvent } from "@/modules/messages/observability";

export const REACTION_RATE_LIMIT_WINDOW_MS = 60_000;
export const REACTION_RATE_LIMIT_MAX = 30;

export type ToggleReactionResultCode =
  | "ok"
  | "not_found"
  | "forbidden"
  | "validation_failed"
  | "rate_limited"
  | "temporary_failure";

export type ToggleReactionAction = "added" | "removed" | "switched";

export type ToggleReactionResult = {
  code: ToggleReactionResultCode;
  action?: ToggleReactionAction;
  conversationId?: string;
  message?: string;
  myReactionKey?: MessageReactionKey | null;
  previousReactionKey?: MessageReactionKey | null;
};

export type ReactionSummary = {
  counts: Partial<Record<MessageReactionKey, number>>;
  myReactionKey: MessageReactionKey | null;
  total: number;
};

export function emptyReactionSummary(): ReactionSummary {
  return { counts: {}, myReactionKey: null, total: 0 };
}

export async function toggleMessageReaction(
  account: Pick<ResolvedAuthAccount, "id">,
  params: { messageId: string; reactionKey: string },
): Promise<ToggleReactionResult> {
  if (!isUuid(params.messageId)) {
    return {
      code: "not_found",
      message: "We couldn't find that message.",
    };
  }

  if (!isMessageReactionKey(params.reactionKey)) {
    return {
      code: "validation_failed",
      message: "That reaction is not supported.",
    };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: messageRow, error: messageError } = await supabase
    .from("messages")
    .select("conversation_id, id, message_status, sender_app_user_id")
    .eq("id", params.messageId)
    .maybeSingle<{
      conversation_id: string;
      id: string;
      message_status: MessageStatus;
      sender_app_user_id: string;
    }>();

  if (messageError) {
    return {
      code: "temporary_failure",
      message: "We couldn't reach the messaging service. Try again in a moment.",
    };
  }

  if (!messageRow) {
    return {
      code: "not_found",
      message: "We couldn't find that message.",
    };
  }

  if (messageRow.message_status === "removed") {
    return {
      code: "forbidden",
      message: "This message is no longer available.",
    };
  }

  const conversation = await loadConversationOwners(messageRow.conversation_id);

  if (!conversation) {
    return {
      code: "not_found",
      message: "We couldn't find that conversation.",
    };
  }

  if (conversation.conversation_status !== "active") {
    return {
      code: "forbidden",
      message: "This conversation is not accepting new reactions.",
    };
  }

  const reactorRole = resolveParticipantRole(conversation, account.id);

  if (!reactorRole) {
    logMessagesEvent("warn", "reaction_denied_non_participant", {
      actor_app_user_id: account.id,
      conversation_id: conversation.id,
      message_id: messageRow.id,
      reason: "non_participant",
    });
    return {
      code: "not_found",
      message: "We couldn't find that message.",
    };
  }

  const counterpartAppUserId =
    reactorRole === "student"
      ? conversation.tutor_app_user_id
      : conversation.student_app_user_id;

  const blockState = await loadActiveBlockState(account.id, counterpartAppUserId);

  if (blockState) {
    logMessagesEvent("info", "reaction_denied_block", {
      actor_app_user_id: account.id,
      conversation_id: conversation.id,
      message_id: messageRow.id,
      reason: blockState,
    });
    return {
      code: "forbidden",
      message:
        blockState === "blocked_by_me"
          ? "Unblock this participant to react to messages."
          : "This participant has blocked further interaction.",
    };
  }

  const recentReactionCount = await countRecentReactionsFromActor(account.id);

  if (recentReactionCount >= REACTION_RATE_LIMIT_MAX) {
    logMessagesEvent("warn", "reaction_rate_limited", {
      actor_app_user_id: account.id,
      conversation_id: conversation.id,
      message_id: messageRow.id,
    });
    return {
      code: "rate_limited",
      message: "You're reacting too quickly. Pause for a moment and try again.",
    };
  }

  const { data: existingRow, error: existingError } = await supabase
    .from("message_reactions")
    .select("id, reaction_key")
    .eq("message_id", messageRow.id)
    .eq("reactor_app_user_id", account.id)
    .maybeSingle<{ id: string; reaction_key: MessageReactionKey }>();

  if (existingError) {
    logMessagesEvent("error", "reaction_lookup_failed", {
      actor_app_user_id: account.id,
      conversation_id: conversation.id,
      message_id: messageRow.id,
      reason: existingError.code ?? "unknown",
    });
    return {
      code: "temporary_failure",
      message: "We couldn't update your reaction. Try again in a moment.",
    };
  }

  if (existingRow && existingRow.reaction_key === params.reactionKey) {
    const { error: deleteError } = await supabase
      .from("message_reactions")
      .delete()
      .eq("id", existingRow.id);

    if (deleteError) {
      logMessagesEvent("error", "reaction_delete_failed", {
        actor_app_user_id: account.id,
        conversation_id: conversation.id,
        message_id: messageRow.id,
        reason: deleteError.code ?? "unknown",
      });
      return {
        code: "temporary_failure",
        message: "We couldn't update your reaction. Try again in a moment.",
      };
    }

    logMessagesEvent("info", "reaction_removed", {
      actor_app_user_id: account.id,
      conversation_id: conversation.id,
      message_id: messageRow.id,
      reaction_key: params.reactionKey,
    });

    return {
      action: "removed",
      code: "ok",
      conversationId: conversation.id,
      myReactionKey: null,
      previousReactionKey: existingRow.reaction_key,
    };
  }

  if (existingRow) {
    const { error: updateError } = await supabase
      .from("message_reactions")
      .update({ reaction_key: params.reactionKey })
      .eq("id", existingRow.id);

    if (updateError) {
      logMessagesEvent("error", "reaction_update_failed", {
        actor_app_user_id: account.id,
        conversation_id: conversation.id,
        message_id: messageRow.id,
        reason: updateError.code ?? "unknown",
      });
      return {
        code: "temporary_failure",
        message: "We couldn't update your reaction. Try again in a moment.",
      };
    }

    logMessagesEvent("info", "reaction_switched", {
      actor_app_user_id: account.id,
      conversation_id: conversation.id,
      message_id: messageRow.id,
      reaction_key: params.reactionKey,
    });

    return {
      action: "switched",
      code: "ok",
      conversationId: conversation.id,
      myReactionKey: params.reactionKey,
      previousReactionKey: existingRow.reaction_key,
    };
  }

  const { error: insertError } = await supabase
    .from("message_reactions")
    .insert({
      message_id: messageRow.id,
      reaction_key: params.reactionKey,
      reactor_app_user_id: account.id,
    });

  if (insertError) {
    logMessagesEvent("error", "reaction_insert_failed", {
      actor_app_user_id: account.id,
      conversation_id: conversation.id,
      message_id: messageRow.id,
      reason: insertError.code ?? "unknown",
    });
    return {
      code: "temporary_failure",
      message: "We couldn't add your reaction. Try again in a moment.",
    };
  }

  logMessagesEvent("info", "reaction_added", {
    actor_app_user_id: account.id,
    conversation_id: conversation.id,
    message_id: messageRow.id,
    reaction_key: params.reactionKey,
  });

  return {
    action: "added",
    code: "ok",
    conversationId: conversation.id,
    myReactionKey: params.reactionKey,
    previousReactionKey: null,
  };
}

export async function loadReactionsForMessages(
  messageIds: string[],
  accountId: string,
): Promise<Map<string, ReactionSummary>> {
  const lookup = new Map<string, ReactionSummary>();
  const uniqueIds = Array.from(new Set(messageIds));

  if (uniqueIds.length === 0) {
    return lookup;
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("message_reactions")
    .select("message_id, reaction_key, reactor_app_user_id")
    .in("message_id", uniqueIds)
    .returns<
      Array<{
        message_id: string;
        reaction_key: MessageReactionKey;
        reactor_app_user_id: string;
      }>
    >();

  if (error) {
    return lookup;
  }

  for (const row of data ?? []) {
    let summary = lookup.get(row.message_id);

    if (!summary) {
      summary = emptyReactionSummary();
      lookup.set(row.message_id, summary);
    }

    summary.counts[row.reaction_key] =
      (summary.counts[row.reaction_key] ?? 0) + 1;
    summary.total += 1;

    if (row.reactor_app_user_id === accountId) {
      summary.myReactionKey = row.reaction_key;
    }
  }

  return lookup;
}

async function countRecentReactionsFromActor(
  actorAppUserId: string,
): Promise<number> {
  const supabase = createSupabaseServiceRoleClient();
  const sinceIso = new Date(
    Date.now() - REACTION_RATE_LIMIT_WINDOW_MS,
  ).toISOString();

  const { count, error } = await supabase
    .from("message_reactions")
    .select("id", { count: "exact", head: true })
    .eq("reactor_app_user_id", actorAppUserId)
    .gte("updated_at", sinceIso);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export { messageReactionKeys };
