import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

import {
  type ConversationStatus,
  type MessageStatus,
  type ParticipantRole,
  type UserBlockStatus,
} from "@/modules/messages/constants";

const CONVERSATION_LIST_LIMIT = 30;
const THREAD_MESSAGE_LIMIT = 60;
const MESSAGE_PREVIEW_MAX_LENGTH = 140;

const REMOVED_MESSAGE_PREVIEW = "Message removed";
const REMOVED_MESSAGE_BODY = "This message is no longer available.";

type ConversationRecord = {
  conversation_status: ConversationStatus;
  id: string;
  last_message_at: string | null;
  last_message_id: string | null;
  student_profile_id: string;
  tutor_profile_id: string;
};

type ParticipantRecord = {
  app_user_id: string;
  conversation_id: string;
  is_archived: boolean;
  is_muted: boolean;
  participant_role: ParticipantRole;
};

type MessagePreviewRecord = {
  body: string;
  created_at: string;
  id: string;
  message_status: MessageStatus;
  removed_at: string | null;
  sender_app_user_id: string;
};

type ThreadMessageRecord = MessagePreviewRecord & {
  conversation_id: string;
  edited_at: string | null;
  reply_to_message_id: string | null;
};

type CounterpartRecord = {
  app_user_id: string;
  avatar_url: string | null;
  display_name: string | null;
  full_name: string | null;
};

type StudentProfileLookup = {
  app_user_id: string;
  id: string;
};

type TutorProfileLookup = {
  app_user_id: string;
  id: string;
};

export type ConversationListItemDto = {
  blockState: "blocked_by_me" | "blocked_by_counterpart" | "active";
  counterpart: {
    appUserId: string;
    avatarUrl: string | null;
    displayName: string;
    role: ParticipantRole;
  };
  id: string;
  isArchived: boolean;
  isMuted: boolean;
  lastMessage: {
    createdAt: string;
    isFromCurrentActor: boolean;
    preview: string;
  } | null;
  status: ConversationStatus;
  unreadCount: number;
};

export type ConversationListDto = {
  conversations: ConversationListItemDto[];
  state: "denied" | "preview" | "ready";
};

export type ThreadMessageDto = {
  body: string;
  createdAt: string;
  editedAt: string | null;
  id: string;
  isFromCurrentActor: boolean;
  replyTo: {
    id: string;
    preview: string;
    senderRole: ParticipantRole;
  } | null;
  senderRole: ParticipantRole;
  status: MessageStatus;
};

export type MessageThreadDto = {
  blockState: "blocked_by_me" | "blocked_by_counterpart" | "active";
  conversation: ConversationListItemDto;
  messages: ThreadMessageDto[];
  reachedStart: boolean;
};

export async function getStudentConversationList(
  account: Pick<ResolvedAuthAccount, "id">,
): Promise<ConversationListDto> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: participantRows, error: participantError } = await supabase
    .from("conversation_participants")
    .select("app_user_id, conversation_id, is_archived, is_muted, participant_role")
    .eq("app_user_id", account.id)
    .returns<ParticipantRecord[]>();

  if (participantError) {
    throw new Error("Could not load conversation participants.");
  }

  const conversationIds = (participantRows ?? []).map((row) => row.conversation_id);

  if (conversationIds.length === 0) {
    return { conversations: [], state: "ready" };
  }

  const { data: conversationRows, error: conversationError } = await supabase
    .from("conversations")
    .select(
      "id, conversation_status, last_message_at, last_message_id, student_profile_id, tutor_profile_id",
    )
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(CONVERSATION_LIST_LIMIT)
    .returns<ConversationRecord[]>();

  if (conversationError) {
    throw new Error("Could not load conversations.");
  }

  const visibleConversations = conversationRows ?? [];

  if (visibleConversations.length === 0) {
    return { conversations: [], state: "ready" };
  }

  const visibleConversationIds = visibleConversations.map((row) => row.id);

  const [counterpartParticipants, lastMessageRows] = await Promise.all([
    loadCounterpartParticipants(visibleConversationIds, account.id),
    loadLastMessagesForConversations(visibleConversations),
  ]);

  const counterpartLookup = await buildCounterpartLookup(
    counterpartParticipants.map((row) => row.app_user_id),
  );

  const blockLookup = await loadBlockLookup(
    account.id,
    counterpartParticipants.map((row) => row.app_user_id),
  );

  const unreadByConversation = await loadUnreadCountByConversation(
    account.id,
    visibleConversationIds,
  );

  const participantByConversation = new Map(
    (participantRows ?? []).map((row) => [row.conversation_id, row]),
  );
  const counterpartByConversation = new Map(
    counterpartParticipants.map((row) => [row.conversation_id, row]),
  );
  const lastMessageById = new Map(lastMessageRows.map((row) => [row.id, row]));

  const items = visibleConversations.flatMap<ConversationListItemDto>((conversation) => {
    const participant = participantByConversation.get(conversation.id);
    const counterpartParticipant = counterpartByConversation.get(conversation.id);

    if (!participant || !counterpartParticipant) {
      return [];
    }

    const counterpart = counterpartLookup.get(counterpartParticipant.app_user_id);

    if (!counterpart) {
      return [];
    }

    const lastMessage = conversation.last_message_id
      ? lastMessageById.get(conversation.last_message_id) ?? null
      : null;

    return [
      buildConversationListItem({
        account,
        blockLookup,
        conversation,
        counterpart,
        counterpartParticipant,
        lastMessage,
        participant,
        unreadCount: unreadByConversation.get(conversation.id) ?? 0,
      }),
    ];
  });

  return { conversations: items, state: "ready" };
}

export async function getStudentConversationThread(
  account: Pick<ResolvedAuthAccount, "id">,
  conversationId: string,
): Promise<MessageThreadDto | null> {
  if (!isUuid(conversationId)) {
    return null;
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: participantRow, error: participantError } = await supabase
    .from("conversation_participants")
    .select("app_user_id, conversation_id, is_archived, is_muted, participant_role")
    .eq("conversation_id", conversationId)
    .eq("app_user_id", account.id)
    .maybeSingle<ParticipantRecord>();

  if (participantError) {
    throw new Error("Could not load the conversation participant.");
  }

  if (!participantRow) {
    return null;
  }

  const { data: conversationRow, error: conversationError } = await supabase
    .from("conversations")
    .select(
      "id, conversation_status, last_message_at, last_message_id, student_profile_id, tutor_profile_id",
    )
    .eq("id", conversationId)
    .maybeSingle<ConversationRecord>();

  if (conversationError) {
    throw new Error("Could not load the conversation.");
  }

  if (!conversationRow) {
    return null;
  }

  const { data: counterpartRow, error: counterpartError } = await supabase
    .from("conversation_participants")
    .select("app_user_id, conversation_id, is_archived, is_muted, participant_role")
    .eq("conversation_id", conversationId)
    .neq("app_user_id", account.id)
    .maybeSingle<ParticipantRecord>();

  if (counterpartError) {
    throw new Error("Could not load the conversation counterpart.");
  }

  if (!counterpartRow) {
    return null;
  }

  const counterpartLookup = await buildCounterpartLookup([counterpartRow.app_user_id]);
  const counterpart = counterpartLookup.get(counterpartRow.app_user_id);

  if (!counterpart) {
    return null;
  }

  const blockLookup = await loadBlockLookup(account.id, [counterpartRow.app_user_id]);

  const { data: messageRows, error: messageError } = await supabase
    .from("messages")
    .select(
      "id, body, conversation_id, created_at, edited_at, message_status, removed_at, reply_to_message_id, sender_app_user_id",
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(THREAD_MESSAGE_LIMIT)
    .returns<ThreadMessageRecord[]>();

  if (messageError) {
    throw new Error("Could not load conversation messages.");
  }

  const orderedMessages = (messageRows ?? []).slice().reverse();
  const replyTargetIds = new Set<string>();

  for (const message of orderedMessages) {
    if (message.reply_to_message_id) {
      replyTargetIds.add(message.reply_to_message_id);
    }
  }

  const replyLookup = await loadReplyTargetMessages(replyTargetIds);

  const unreadByConversation = await loadUnreadCountByConversation(account.id, [
    conversationRow.id,
  ]);

  const conversationItem = buildConversationListItem({
    account,
    blockLookup,
    conversation: conversationRow,
    counterpart,
    counterpartParticipant: counterpartRow,
    lastMessage: conversationRow.last_message_id
      ? orderedMessages.find((message) => message.id === conversationRow.last_message_id) ?? null
      : null,
    participant: participantRow,
    unreadCount: unreadByConversation.get(conversationRow.id) ?? 0,
  });

  const messages = orderedMessages.map((message) =>
    buildThreadMessage({
      account,
      counterpartParticipant: counterpartRow,
      message,
      participant: participantRow,
      replyLookup,
    }),
  );

  return {
    blockState: conversationItem.blockState,
    conversation: conversationItem,
    messages,
    reachedStart: orderedMessages.length < THREAD_MESSAGE_LIMIT,
  };
}

function buildConversationListItem({
  account,
  blockLookup,
  conversation,
  counterpart,
  counterpartParticipant,
  lastMessage,
  participant,
  unreadCount,
}: {
  account: Pick<ResolvedAuthAccount, "id">;
  blockLookup: Map<string, BlockState>;
  conversation: ConversationRecord;
  counterpart: CounterpartRecord;
  counterpartParticipant: ParticipantRecord;
  lastMessage: MessagePreviewRecord | null;
  participant: ParticipantRecord;
  unreadCount: number;
}): ConversationListItemDto {
  const counterpartName = resolveCounterpartName(counterpart);
  const blockState = blockLookup.get(counterpartParticipant.app_user_id) ?? "active";

  const previewSource = lastMessage;

  return {
    blockState,
    counterpart: {
      appUserId: counterpartParticipant.app_user_id,
      avatarUrl: counterpart.avatar_url,
      displayName: counterpartName,
      role: counterpartParticipant.participant_role,
    },
    id: conversation.id,
    isArchived: participant.is_archived,
    isMuted: participant.is_muted,
    lastMessage: previewSource
      ? {
          createdAt: previewSource.created_at,
          isFromCurrentActor: previewSource.sender_app_user_id === account.id,
          preview: buildPreview(previewSource),
        }
      : null,
    status: conversation.conversation_status,
    unreadCount,
  };
}

function buildThreadMessage({
  account,
  counterpartParticipant,
  message,
  participant,
  replyLookup,
}: {
  account: Pick<ResolvedAuthAccount, "id">;
  counterpartParticipant: ParticipantRecord;
  message: ThreadMessageRecord;
  participant: ParticipantRecord;
  replyLookup: Map<string, MessagePreviewRecord>;
}): ThreadMessageDto {
  const isOwn = message.sender_app_user_id === account.id;
  const senderRole: ParticipantRole = isOwn
    ? participant.participant_role
    : counterpartParticipant.participant_role;
  const isRemoved = message.message_status === "removed" || message.removed_at !== null;
  const replyTarget = message.reply_to_message_id
    ? replyLookup.get(message.reply_to_message_id) ?? null
    : null;

  return {
    body: isRemoved ? REMOVED_MESSAGE_BODY : message.body,
    createdAt: message.created_at,
    editedAt: message.edited_at,
    id: message.id,
    isFromCurrentActor: isOwn,
    replyTo: replyTarget
      ? {
          id: replyTarget.id,
          preview: buildPreview(replyTarget),
          senderRole:
            replyTarget.sender_app_user_id === account.id
              ? participant.participant_role
              : counterpartParticipant.participant_role,
        }
      : null,
    senderRole,
    status: isRemoved ? "removed" : message.message_status,
  };
}

async function loadCounterpartParticipants(
  conversationIds: string[],
  currentAppUserId: string,
): Promise<ParticipantRecord[]> {
  if (conversationIds.length === 0) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("conversation_participants")
    .select("app_user_id, conversation_id, is_archived, is_muted, participant_role")
    .in("conversation_id", conversationIds)
    .neq("app_user_id", currentAppUserId)
    .returns<ParticipantRecord[]>();

  if (error) {
    throw new Error("Could not load conversation counterparts.");
  }

  return data ?? [];
}

async function loadLastMessagesForConversations(
  conversations: ConversationRecord[],
): Promise<MessagePreviewRecord[]> {
  const lastMessageIds = conversations
    .map((conversation) => conversation.last_message_id)
    .filter((value): value is string => Boolean(value));

  if (lastMessageIds.length === 0) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("messages")
    .select("body, created_at, id, message_status, removed_at, sender_app_user_id")
    .in("id", lastMessageIds)
    .returns<MessagePreviewRecord[]>();

  if (error) {
    throw new Error("Could not load conversation last messages.");
  }

  return data ?? [];
}

async function loadReplyTargetMessages(
  replyIds: Set<string>,
): Promise<Map<string, MessagePreviewRecord>> {
  if (replyIds.size === 0) {
    return new Map();
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("messages")
    .select("body, created_at, id, message_status, removed_at, sender_app_user_id")
    .in("id", Array.from(replyIds))
    .returns<MessagePreviewRecord[]>();

  if (error) {
    throw new Error("Could not load reply targets.");
  }

  return new Map((data ?? []).map((row) => [row.id, row]));
}

async function buildCounterpartLookup(
  counterpartAppUserIds: string[],
): Promise<Map<string, CounterpartRecord>> {
  const uniqueIds = Array.from(new Set(counterpartAppUserIds));

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const supabase = createSupabaseServiceRoleClient();

  const [usersResult, studentResult, tutorResult] = await Promise.all([
    supabase
      .from("app_users")
      .select("avatar_url, full_name, id")
      .in("id", uniqueIds)
      .returns<Array<{ avatar_url: string | null; full_name: string | null; id: string }>>(),
    supabase
      .from("student_profiles")
      .select("app_user_id, display_name, id")
      .in("app_user_id", uniqueIds)
      .returns<Array<StudentProfileLookup & { display_name: string | null }>>(),
    supabase
      .from("tutor_profiles")
      .select("app_user_id, display_name, id")
      .in("app_user_id", uniqueIds)
      .returns<Array<TutorProfileLookup & { display_name: string | null }>>(),
  ]);

  if (usersResult.error || studentResult.error || tutorResult.error) {
    throw new Error("Could not load conversation counterpart profiles.");
  }

  const userById = new Map(
    (usersResult.data ?? []).map((row) => [row.id, row]),
  );
  const studentDisplayByUser = new Map(
    (studentResult.data ?? []).map((row) => [row.app_user_id, row.display_name]),
  );
  const tutorDisplayByUser = new Map(
    (tutorResult.data ?? []).map((row) => [row.app_user_id, row.display_name]),
  );

  const lookup = new Map<string, CounterpartRecord>();

  for (const id of uniqueIds) {
    const user = userById.get(id);
    if (!user) {
      continue;
    }

    lookup.set(id, {
      app_user_id: id,
      avatar_url: user.avatar_url,
      display_name: tutorDisplayByUser.get(id) ?? studentDisplayByUser.get(id) ?? null,
      full_name: user.full_name,
    });
  }

  return lookup;
}

type BlockState = ConversationListItemDto["blockState"];

async function loadBlockLookup(
  currentAppUserId: string,
  counterpartAppUserIds: string[],
): Promise<Map<string, BlockState>> {
  const uniqueIds = Array.from(new Set(counterpartAppUserIds));
  const lookup = new Map<string, BlockState>();

  if (uniqueIds.length === 0) {
    return lookup;
  }

  const supabase = createSupabaseServiceRoleClient();

  const [outgoingResult, incomingResult] = await Promise.all([
    supabase
      .from("user_blocks")
      .select("blocked_app_user_id, blocker_app_user_id, block_status")
      .eq("blocker_app_user_id", currentAppUserId)
      .in("blocked_app_user_id", uniqueIds)
      .eq("block_status", "active" satisfies UserBlockStatus)
      .returns<
        Array<{
          blocked_app_user_id: string;
          blocker_app_user_id: string;
          block_status: UserBlockStatus;
        }>
      >(),
    supabase
      .from("user_blocks")
      .select("blocked_app_user_id, blocker_app_user_id, block_status")
      .eq("blocked_app_user_id", currentAppUserId)
      .in("blocker_app_user_id", uniqueIds)
      .eq("block_status", "active" satisfies UserBlockStatus)
      .returns<
        Array<{
          blocked_app_user_id: string;
          blocker_app_user_id: string;
          block_status: UserBlockStatus;
        }>
      >(),
  ]);

  if (outgoingResult.error || incomingResult.error) {
    throw new Error("Could not load block state.");
  }

  for (const row of outgoingResult.data ?? []) {
    lookup.set(row.blocked_app_user_id, "blocked_by_me");
  }

  for (const row of incomingResult.data ?? []) {
    if (!lookup.has(row.blocker_app_user_id)) {
      lookup.set(row.blocker_app_user_id, "blocked_by_counterpart");
    }
  }

  return lookup;
}

async function loadUnreadCountByConversation(
  currentAppUserId: string,
  conversationIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  if (conversationIds.length === 0) {
    return counts;
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: messageRows, error: messageError } = await supabase
    .from("messages")
    .select("conversation_id, id, sender_app_user_id")
    .in("conversation_id", conversationIds)
    .neq("sender_app_user_id", currentAppUserId)
    .returns<Array<{ conversation_id: string; id: string; sender_app_user_id: string }>>();

  if (messageError) {
    throw new Error("Could not load unread message candidates.");
  }

  if (!messageRows || messageRows.length === 0) {
    return counts;
  }

  const messageIds = messageRows.map((row) => row.id);

  const { data: readRows, error: readError } = await supabase
    .from("message_reads")
    .select("message_id")
    .eq("app_user_id", currentAppUserId)
    .in("message_id", messageIds)
    .returns<Array<{ message_id: string }>>();

  if (readError) {
    throw new Error("Could not load message read state.");
  }

  const readMessageIds = new Set((readRows ?? []).map((row) => row.message_id));

  for (const row of messageRows) {
    if (readMessageIds.has(row.id)) {
      continue;
    }

    counts.set(row.conversation_id, (counts.get(row.conversation_id) ?? 0) + 1);
  }

  return counts;
}

function resolveCounterpartName(counterpart: CounterpartRecord) {
  const candidate = counterpart.display_name?.trim() || counterpart.full_name?.trim();

  return candidate && candidate.length > 0 ? candidate : "Mentor IB participant";
}

function buildPreview(message: MessagePreviewRecord) {
  if (message.message_status === "removed" || message.removed_at) {
    return REMOVED_MESSAGE_PREVIEW;
  }

  const collapsed = message.body.replace(/\s+/g, " ").trim();

  if (collapsed.length === 0) {
    return REMOVED_MESSAGE_PREVIEW;
  }

  if (collapsed.length <= MESSAGE_PREVIEW_MAX_LENGTH) {
    return collapsed;
  }

  return `${collapsed.slice(0, MESSAGE_PREVIEW_MAX_LENGTH).trimEnd()}…`;
}

export function buildPreviewConversationList(): ConversationListDto {
  const previewCounterpart = "Maya Chen";
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  return {
    conversations: [
      {
        blockState: "active",
        counterpart: {
          appUserId: "preview-tutor",
          avatarUrl: null,
          displayName: previewCounterpart,
          role: "tutor",
        },
        id: "preview-conversation",
        isArchived: false,
        isMuted: false,
        lastMessage: {
          createdAt: oneHourAgo,
          isFromCurrentActor: false,
          preview:
            "Looking forward to the Paper 2 sprint — sharing the warm-up problem set ahead of our session.",
        },
        status: "active",
        unreadCount: 1,
      },
    ],
    state: "preview",
  };
}

export function buildPreviewConversationThread(): MessageThreadDto {
  const list = buildPreviewConversationList();
  const conversation = list.conversations[0];

  if (!conversation) {
    throw new Error("Preview conversation list must have at least one item.");
  }

  const baseTime = Date.now() - 24 * 60 * 60 * 1000;

  return {
    blockState: "active",
    conversation,
    messages: [
      {
        body: "Hi Maya — I have my Paper 2 mock back. The biggest gap is structuring my historical investigation.",
        createdAt: new Date(baseTime).toISOString(),
        editedAt: null,
        id: "preview-message-1",
        isFromCurrentActor: true,
        replyTo: null,
        senderRole: "student",
        status: "sent",
      },
      {
        body: "Thanks for sharing. Let's anchor the next session on argument structuring and use one of your sources as a worked example.",
        createdAt: new Date(baseTime + 30 * 60 * 1000).toISOString(),
        editedAt: null,
        id: "preview-message-2",
        isFromCurrentActor: false,
        replyTo: null,
        senderRole: "tutor",
        status: "sent",
      },
      {
        body: "Looking forward to the Paper 2 sprint — sharing the warm-up problem set ahead of our session.",
        createdAt: new Date(baseTime + 23 * 60 * 60 * 1000).toISOString(),
        editedAt: null,
        id: "preview-message-3",
        isFromCurrentActor: false,
        replyTo: null,
        senderRole: "tutor",
        status: "sent",
      },
    ],
    reachedStart: true,
  };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}
