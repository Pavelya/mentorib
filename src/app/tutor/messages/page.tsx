import type { Route } from "next";
import { notFound, redirect } from "next/navigation";

import { ConversationShell, ScreenState } from "@/components/continuity";
import {
  ConversationComposer,
  MarkConversationRead,
  MessagesExperience,
} from "@/components/messages";
import styles from "@/components/messages/messages.module.css";
import { InlineNotice } from "@/components/ui";
import {
  buildPostSignInRedirect,
  ensureAuthAccount,
  type ResolvedAuthAccount,
} from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { routeFamilies } from "@/lib/routing/route-families";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  hasRole,
  isRestrictedAccount,
  requiresRoleSelection,
} from "@/modules/accounts/account-state";
import {
  buildPreviewConversationList,
  buildPreviewConversationThread,
  getConversationListForActor,
  getConversationThreadForActor,
  type ConversationListDto,
  type MessageThreadDto,
} from "@/modules/messages/conversations";

type TutorMessagesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const MESSAGES_BASE_PATH = "/tutor/messages" as const;

export default async function TutorMessagesPage({ searchParams }: TutorMessagesPageProps) {
  const resolvedSearchParams = await searchParams;
  const requestedConversationId = getSingleValue(resolvedSearchParams.c);

  if (!isSupabaseAuthConfigured()) {
    return renderPreviewMessagesPage({
      list: buildPreviewConversationList(),
      thread: requestedConversationId ? buildPreviewConversationThread() : null,
    });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(MESSAGES_BASE_PATH) as Route);
  }

  let account: ResolvedAuthAccount | null = null;

  try {
    account = await ensureAuthAccount(user);
  } catch {
    account = null;
  }

  if (!account) {
    return (
      <article className={styles.page}>
        <InlineNotice
          className={styles.notice}
          title="Messages unavailable"
          tone="warning"
        >
          <p>
            We could not load your account context. Refresh the page or sign in again to
            continue.
          </p>
        </InlineNotice>
      </article>
    );
  }

  if (requiresRoleSelection(account)) {
    redirect(routeFamilies.setup.defaultHref);
  }

  if (isRestrictedAccount(account)) {
    return (
      <InlineNotice title="Account access limited" tone="warning">
        <p>This account cannot view messages right now.</p>
      </InlineNotice>
    );
  }

  if (!hasRole(account, "tutor")) {
    redirect(buildPostSignInRedirect(account, MESSAGES_BASE_PATH) as Route);
  }

  const list = await getConversationListForActor(account);

  let thread: MessageThreadDto | null = null;

  if (requestedConversationId) {
    thread = await getConversationThreadForActor(account, requestedConversationId);

    if (!thread) {
      notFound();
    }
  }

  return renderMessagesPage({
    list,
    thread,
  });
}

function renderMessagesPage({
  list,
  thread,
}: {
  list: ConversationListDto;
  thread: MessageThreadDto | null;
}) {
  const hasConversations = list.conversations.length > 0;

  if (!hasConversations && !thread) {
    return (
      <article className={styles.page}>
        <ScreenState
          description="Conversations stay attached to a student relationship. They show up here once a student reaches out or you accept a booking request."
          hints={[
            "Threads live across lessons, not per session.",
            "You can block or report any participant from inside the thread.",
          ]}
          icon="messageSquare"
          kind="empty"
          title="No conversations yet"
        />
      </article>
    );
  }

  return (
    <article className={styles.page}>
      {thread ? (
        <MarkConversationRead
          conversationId={thread.conversation.id}
          unreadCount={thread.conversation.unreadCount}
        />
      ) : null}
      <MessagesExperience
        actorRole="tutor"
        basePath={MESSAGES_BASE_PATH}
        conversations={list.conversations}
        selectedConversationId={thread?.conversation.id ?? null}
        thread={thread}
        threadComposer={thread ? renderComposerSlot(thread) : null}
      />
    </article>
  );
}

function renderPreviewMessagesPage({
  list,
  thread,
}: {
  list: ConversationListDto;
  thread: MessageThreadDto | null;
}) {
  return (
    <article className={styles.page}>
      <InlineNotice
        className={styles.notice}
        title="Messages preview"
        tone="info"
      >
        <p>
          Live messaging connects once Supabase auth is configured. The shared shell
          below previews the conversation list and thread surfaces.
        </p>
      </InlineNotice>
      <ConversationShell
        basePath={MESSAGES_BASE_PATH}
        conversations={list.conversations}
        emptyState={null}
        selectedConversationId={thread?.conversation.id ?? null}
        thread={null}
      />
    </article>
  );
}

function renderComposerSlot(thread: MessageThreadDto) {
  const counterpartName = thread.conversation.counterpart.displayName;

  if (thread.blockState === "blocked_by_me") {
    return (
      <ConversationComposer
        conversationId={thread.conversation.id}
        counterpartName={counterpartName}
        disabled
        disabledReason="Unblock this participant from the safety menu to continue messaging."
      />
    );
  }

  if (thread.blockState === "blocked_by_counterpart") {
    return (
      <ConversationComposer
        conversationId={thread.conversation.id}
        counterpartName={counterpartName}
        disabled
        disabledReason="This participant has blocked further messages."
      />
    );
  }

  if (thread.conversation.status !== "active") {
    return (
      <ConversationComposer
        conversationId={thread.conversation.id}
        counterpartName={counterpartName}
        disabled
        disabledReason="This conversation is not accepting new messages right now."
      />
    );
  }

  return (
    <ConversationComposer
      conversationId={thread.conversation.id}
      counterpartName={counterpartName}
    />
  );
}

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
