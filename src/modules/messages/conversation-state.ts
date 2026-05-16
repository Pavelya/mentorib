import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { isUuid } from "@/modules/messages/access";
import { logMessagesEvent } from "@/modules/messages/observability";

export type ConversationParticipantFlag = "muted" | "archived";

export type ConversationFlagResultCode =
  | "ok"
  | "not_found"
  | "validation_failed"
  | "temporary_failure";

export type ConversationFlagAction = "enabled" | "disabled";

export type ConversationFlagResult = {
  action?: ConversationFlagAction;
  code: ConversationFlagResultCode;
  message?: string;
};

export async function setConversationParticipantFlag(
  account: Pick<ResolvedAuthAccount, "id">,
  params: {
    conversationId: string;
    flag: ConversationParticipantFlag;
    value: boolean;
  },
): Promise<ConversationFlagResult> {
  if (!isUuid(params.conversationId)) {
    return { code: "not_found", message: "We couldn't find that conversation." };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: participantRow, error: participantError } = await supabase
    .from("conversation_participants")
    .select("app_user_id, conversation_id, is_archived, is_muted")
    .eq("conversation_id", params.conversationId)
    .eq("app_user_id", account.id)
    .maybeSingle<{
      app_user_id: string;
      conversation_id: string;
      is_archived: boolean;
      is_muted: boolean;
    }>();

  if (participantError) {
    return {
      code: "temporary_failure",
      message: "We couldn't reach the messaging service. Try again in a moment.",
    };
  }

  if (!participantRow) {
    return { code: "not_found", message: "We couldn't find that conversation." };
  }

  const currentValue =
    params.flag === "muted" ? participantRow.is_muted : participantRow.is_archived;

  if (currentValue === params.value) {
    const action: ConversationFlagAction = params.value ? "enabled" : "disabled";
    logMessagesEvent("info", `${params.flag === "muted" ? "mute" : "archive"}_noop`, {
      actor_app_user_id: account.id,
      conversation_id: params.conversationId,
    });
    return { action, code: "ok" };
  }

  const updatePayload =
    params.flag === "muted"
      ? { is_muted: params.value }
      : { is_archived: params.value };

  const { error: updateError } = await supabase
    .from("conversation_participants")
    .update(updatePayload)
    .eq("conversation_id", params.conversationId)
    .eq("app_user_id", account.id);

  if (updateError) {
    logMessagesEvent(
      "error",
      `${params.flag === "muted" ? "mute" : "archive"}_update_failed`,
      {
        actor_app_user_id: account.id,
        conversation_id: params.conversationId,
        reason: updateError.code ?? "unknown",
      },
    );
    return {
      code: "temporary_failure",
      message: "We couldn't update this conversation. Try again in a moment.",
    };
  }

  const action: ConversationFlagAction = params.value ? "enabled" : "disabled";

  logMessagesEvent(
    "info",
    params.flag === "muted"
      ? params.value
        ? "conversation_muted"
        : "conversation_unmuted"
      : params.value
        ? "conversation_archived"
        : "conversation_unarchived",
    {
      actor_app_user_id: account.id,
      conversation_id: params.conversationId,
    },
  );

  return { action, code: "ok" };
}
