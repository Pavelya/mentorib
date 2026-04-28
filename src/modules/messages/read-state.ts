import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { logMessagesEvent } from "@/modules/messages/observability";
import { markConversationNewMessageNotificationRead } from "@/modules/notifications/service";

const READ_BATCH_LIMIT = 200;

export type MarkConversationReadResult = {
  code: "ok" | "not_found" | "forbidden" | "temporary_failure";
  marked: number;
};

export async function markConversationRead(
  account: Pick<ResolvedAuthAccount, "id">,
  conversationId: string,
): Promise<MarkConversationReadResult> {
  if (!isUuid(conversationId)) {
    return { code: "not_found", marked: 0 };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: participantRow, error: participantError } = await supabase
    .from("conversation_participants")
    .select("app_user_id, conversation_id")
    .eq("conversation_id", conversationId)
    .eq("app_user_id", account.id)
    .maybeSingle<{ app_user_id: string; conversation_id: string }>();

  if (participantError) {
    return { code: "temporary_failure", marked: 0 };
  }

  if (!participantRow) {
    return { code: "not_found", marked: 0 };
  }

  const { data: counterpartMessages, error: messageError } = await supabase
    .from("messages")
    .select("id")
    .eq("conversation_id", conversationId)
    .neq("sender_app_user_id", account.id)
    .order("created_at", { ascending: false })
    .limit(READ_BATCH_LIMIT)
    .returns<Array<{ id: string }>>();

  if (messageError) {
    return { code: "temporary_failure", marked: 0 };
  }

  const candidateIds = (counterpartMessages ?? []).map((row) => row.id);

  if (candidateIds.length === 0) {
    await markConversationNewMessageNotificationRead({
      appUserId: account.id,
      conversationId,
    });
    return { code: "ok", marked: 0 };
  }

  const { data: existingReadRows, error: existingReadError } = await supabase
    .from("message_reads")
    .select("message_id")
    .eq("app_user_id", account.id)
    .in("message_id", candidateIds)
    .returns<Array<{ message_id: string }>>();

  if (existingReadError) {
    return { code: "temporary_failure", marked: 0 };
  }

  const existingIds = new Set((existingReadRows ?? []).map((row) => row.message_id));
  const missingIds = candidateIds.filter((id) => !existingIds.has(id));

  if (missingIds.length === 0) {
    await markConversationNewMessageNotificationRead({
      appUserId: account.id,
      conversationId,
    });
    return { code: "ok", marked: 0 };
  }

  const insertRows = missingIds.map((messageId) => ({
    app_user_id: account.id,
    message_id: messageId,
  }));

  const { error: insertError } = await supabase
    .from("message_reads")
    .insert(insertRows);

  if (insertError) {
    logMessagesEvent("error", "mark_read_insert_failed", {
      actor_app_user_id: account.id,
      conversation_id: conversationId,
      reason: insertError.code ?? "unknown",
    });
    return { code: "temporary_failure", marked: 0 };
  }

  await markConversationNewMessageNotificationRead({
    appUserId: account.id,
    conversationId,
  });

  logMessagesEvent("info", "mark_read_succeeded", {
    actor_app_user_id: account.id,
    conversation_id: conversationId,
    unread_marked: missingIds.length,
  });

  return { code: "ok", marked: missingIds.length };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}
