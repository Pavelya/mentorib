import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";

import {
  ConversationShell,
  ConversationThread,
  ScreenState,
} from "@/components/continuity";
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
  getStudentConversationList,
  getStudentConversationThread,
  type ConversationListDto,
  type MessageThreadDto,
} from "@/modules/messages/conversations";

import styles from "./messages.module.css";

type MessagesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const MESSAGES_BASE_PATH = "/messages" as const;

export default async function StudentMessagesPage({ searchParams }: MessagesPageProps) {
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
    redirect(buildAuthSignInPath(routeFamilies.student.defaultHref) as Route);
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

  if (!hasRole(account, "student")) {
    redirect(buildPostSignInRedirect(account, MESSAGES_BASE_PATH) as Route);
  }

  const list = await getStudentConversationList(account);

  let thread: MessageThreadDto | null = null;

  if (requestedConversationId) {
    thread = await getStudentConversationThread(account, requestedConversationId);

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
          thread={thread ? renderThread(thread) : <SelectThreadHint />}
        />
      ) : (
        <ScreenState
          action={
            <Link className={getButtonClassName()} href="/match">
              Find a tutor
            </Link>
          }
          description="Messages stay attached to a tutor relationship. Start by matching with a tutor — the conversation appears here once you reach out."
          hints={[
            "Conversations live across lessons, not per session.",
            "You can block or report any participant from inside the thread.",
          ]}
          kind="empty"
          title="No conversations yet"
        />
      )}
    </article>
  );
}

function renderThread(thread: MessageThreadDto) {
  return (
    <ConversationThread
      formatTimestamp={formatThreadTimestamp}
      thread={thread}
      threadActions={<ThreadSafetyActions thread={thread} />}
    />
  );
}

function ThreadSafetyActions({ thread }: { thread: MessageThreadDto }) {
  const counterpartId = thread.conversation.counterpart.appUserId;

  return (
    <>
      <Link
        className={getButtonClassName({ size: "compact", variant: "secondary" })}
        href={`/messages?c=${thread.conversation.id}&action=block&user=${counterpartId}` as Route}
      >
        {thread.blockState === "blocked_by_me" ? "Manage block" : "Block"}
      </Link>
      <Link
        className={getButtonClassName({ size: "compact", variant: "ghost" })}
        href={`/messages?c=${thread.conversation.id}&action=report&user=${counterpartId}` as Route}
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
      description="Once you start a conversation with a tutor, it shows up in this list."
      kind="empty"
      title="No conversations yet"
    />
  );
}

function SelectThreadHint() {
  return (
    <ScreenState
      description="Open any conversation from the list to see the shared message shell with the tutor and lesson context kept visible."
      hints={["Threads stay attached to the tutor relationship, not the lesson."]}
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
