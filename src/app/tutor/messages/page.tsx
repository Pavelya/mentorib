import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";

import {
  ConversationShell,
  ConversationThread,
  ScreenState,
} from "@/components/continuity";
import {
  ConversationComposer,
  MarkConversationRead,
} from "@/components/messages";
import styles from "@/components/messages/messages.module.css";
import { InlineNotice, getButtonClassName } from "@/components/ui";
import {
  buildPostSignInRedirect,
  ensureAuthAccount,
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
    return renderMessagesPage({
      list: buildPreviewConversationList(),
      previewNotice: true,
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

  let account: Awaited<ReturnType<typeof ensureAuthAccount>> | null = null;

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

  return renderMessagesPage({ list, previewNotice: false, thread });
}

function renderMessagesPage({
  list,
  previewNotice,
  thread,
}: {
  list: ConversationListDto;
  previewNotice: boolean;
  thread: MessageThreadDto | null;
}) {
  const selectedId = thread?.conversation.id ?? null;
  const hasConversations = list.conversations.length > 0;
  const showThreadColumn = hasConversations || thread;

  return (
    <article className={styles.page}>
      {previewNotice ? (
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
      ) : null}

      {showThreadColumn ? (
        <ConversationShell
          basePath={MESSAGES_BASE_PATH}
          conversations={list.conversations}
          emptyState={<EmptyListNotice />}
          selectedConversationId={selectedId}
          thread={
            thread ? renderThread(thread, { isPreview: previewNotice }) : <SelectThreadHint />
          }
        />
      ) : (
        <ScreenState
          action={
            <Link className={getButtonClassName()} href="/tutor/lessons">
              Open lessons hub
            </Link>
          }
          description="Conversations stay attached to a student relationship. They show up here once a student reaches out or you accept a booking request."
          hints={[
            "Threads live across lessons, not per session.",
            "You can block or report any participant from inside the thread.",
          ]}
          kind="empty"
          title="No conversations yet"
        />
      )}
    </article>
  );
}

function renderThread(thread: MessageThreadDto, options: { isPreview: boolean }) {
  const composerSlot = options.isPreview
    ? undefined
    : renderComposerSlot(thread);

  return (
    <>
      {options.isPreview ? null : (
        <MarkConversationRead
          conversationId={thread.conversation.id}
          unreadCount={thread.conversation.unreadCount}
        />
      )}
      <ConversationThread
        composerSlot={composerSlot}
        formatTimestamp={formatThreadTimestamp}
        thread={thread}
        threadActions={<ThreadSafetyActions thread={thread} basePath={MESSAGES_BASE_PATH} />}
      />
    </>
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

function ThreadSafetyActions({
  thread,
  basePath,
}: {
  thread: MessageThreadDto;
  basePath: string;
}) {
  const counterpartId = thread.conversation.counterpart.appUserId;

  return (
    <>
      <Link
        className={getButtonClassName({ size: "compact", variant: "secondary" })}
        href={`${basePath}?c=${thread.conversation.id}&action=block&user=${counterpartId}` as Route}
      >
        {thread.blockState === "blocked_by_me" ? "Manage block" : "Block"}
      </Link>
      <Link
        className={getButtonClassName({ size: "compact", variant: "ghost" })}
        href={`${basePath}?c=${thread.conversation.id}&action=report&user=${counterpartId}` as Route}
      >
        Report
      </Link>
    </>
  );
}

function EmptyListNotice() {
  return (
    <ScreenState
      className={styles.emptyState}
      description="Once a student starts a conversation with you, it shows up in this list."
      kind="empty"
      title="No conversations yet"
    />
  );
}

function SelectThreadHint() {
  return (
    <ScreenState
      description="Open any conversation from the list to see the shared message shell with the student and lesson context kept visible."
      hints={["Threads stay attached to the student relationship, not the lesson."]}
      kind="empty"
      title="Select a conversation"
    />
  );
}

function formatThreadTimestamp(isoTimestamp: string) {
  const date = new Date(isoTimestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
