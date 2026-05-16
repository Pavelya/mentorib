import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  type ParticipantRole,
  type UserBlockStatus,
} from "@/modules/messages/constants";

export type ConversationOwnersRow = {
  conversation_status: "active" | "blocked" | "archived";
  id: string;
  student_app_user_id: string;
  student_profile_id: string;
  tutor_app_user_id: string;
  tutor_profile_id: string;
};

export type ConversationBlockState =
  | "blocked_by_me"
  | "blocked_by_counterpart"
  | null;

export async function loadConversationOwners(
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

export function resolveParticipantRole(
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

export async function loadActiveBlockState(
  actorAppUserId: string,
  counterpartAppUserId: string,
): Promise<ConversationBlockState> {
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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}
