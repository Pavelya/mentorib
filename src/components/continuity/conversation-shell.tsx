import Link from "next/link";
import type { Route } from "next";
import type { HTMLAttributes, ReactNode } from "react";

import { Avatar, StatusBadge } from "@/components/ui";

import { PersonSummary } from "./continuity-primitives";
import styles from "./conversation-shell.module.css";

import type {
  ConversationListItemDto,
  MessageThreadDto,
  ThreadMessageDto,
} from "@/modules/messages/conversations";

type ConversationShellProps = HTMLAttributes<HTMLDivElement> & {
  basePath: `/${string}`;
  emptyState?: ReactNode;
  listEyebrow?: string;
  listTitle?: string;
  conversations: ConversationListItemDto[];
  selectedConversationId?: string | null;
  thread?: ReactNode;
};

type ConversationListItemProps = {
  basePath: `/${string}`;
  conversation: ConversationListItemDto;
  formatTimestamp: (isoTimestamp: string) => string;
  isActive?: boolean;
};

type ConversationThreadProps = {
  composerSlot?: ReactNode;
  formatTimestamp: (isoTimestamp: string) => string;
  thread: MessageThreadDto;
  threadActions?: ReactNode;
};

type ConversationListProps = {
  basePath: `/${string}`;
  conversations: ConversationListItemDto[];
  emptyState?: ReactNode;
  eyebrow?: string;
  formatTimestamp: (isoTimestamp: string) => string;
  selectedConversationId?: string | null;
  title?: string;
};

function cx(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function ConversationShell({
  basePath,
  className,
  conversations,
  emptyState,
  listEyebrow,
  listTitle,
  selectedConversationId,
  thread,
  ...props
}: ConversationShellProps) {
  const hasThread = thread !== undefined && thread !== null && thread !== false;
  const formatTimestamp = createTimestampFormatter();

  return (
    <div
      {...props}
      className={cx(styles.shell, !hasThread && styles.shellSingle, className)}
    >
      <ConversationList
        basePath={basePath}
        conversations={conversations}
        emptyState={emptyState}
        eyebrow={listEyebrow}
        formatTimestamp={formatTimestamp}
        selectedConversationId={selectedConversationId}
        title={listTitle}
      />

      {hasThread ? thread : null}
    </div>
  );
}

export function ConversationList({
  basePath,
  conversations,
  emptyState,
  eyebrow = "Conversations",
  formatTimestamp,
  selectedConversationId,
  title = "Your tutor threads",
}: ConversationListProps) {
  return (
    <section aria-label="Conversation list" className={styles.list}>
      <header className={styles.listHeader}>
        <p className={styles.listEyebrow}>{eyebrow}</p>
        <h2 className={styles.listTitle}>{title}</h2>
      </header>

      {conversations.length === 0 ? (
        emptyState ?? (
          <p className={styles.composerHint}>You have no conversations yet.</p>
        )
      ) : (
        <ul className={styles.listItems}>
          {conversations.map((conversation) => (
            <li className={styles.listItem} key={conversation.id}>
              <ConversationListItem
                basePath={basePath}
                conversation={conversation}
                formatTimestamp={formatTimestamp}
                isActive={conversation.id === selectedConversationId}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ConversationListItem({
  basePath,
  conversation,
  formatTimestamp,
  isActive = false,
}: ConversationListItemProps) {
  const href = `${basePath}?c=${conversation.id}` as Route;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cx(styles.listLink, isActive && styles.listLinkActive)}
      href={href}
    >
      <div className={styles.itemHeader}>
        <div className={styles.itemIdentity}>
          <Avatar
            name={conversation.counterpart.displayName}
            size="sm"
            src={conversation.counterpart.avatarUrl ?? undefined}
          />
          <p className={styles.itemName}>{conversation.counterpart.displayName}</p>
        </div>

        {conversation.lastMessage ? (
          <p className={styles.itemTimestamp}>
            {formatTimestamp(conversation.lastMessage.createdAt)}
          </p>
        ) : null}
      </div>

      {conversation.lastMessage ? (
        <p
          className={cx(
            styles.itemPreview,
            conversation.lastMessage.isFromCurrentActor && styles.itemPreviewSelf,
          )}
        >
          {conversation.lastMessage.preview}
        </p>
      ) : (
        <p className={styles.itemPreview}>No messages yet.</p>
      )}

      {conversation.unreadCount > 0 ||
      conversation.isMuted ||
      conversation.isArchived ||
      conversation.blockState !== "active" ||
      conversation.status !== "active" ? (
        <div className={styles.itemSignals}>
          {conversation.unreadCount > 0 ? (
            <StatusBadge tone="trust">
              {conversation.unreadCount === 1 ? "1 unread" : `${conversation.unreadCount} unread`}
            </StatusBadge>
          ) : null}
          {conversation.isMuted ? (
            <StatusBadge tone="info">Muted</StatusBadge>
          ) : null}
          {conversation.isArchived ? (
            <StatusBadge tone="info">Archived</StatusBadge>
          ) : null}
          {conversation.blockState === "blocked_by_me" ? (
            <StatusBadge tone="destructive">You blocked this user</StatusBadge>
          ) : conversation.blockState === "blocked_by_counterpart" ? (
            <StatusBadge tone="destructive">Blocked by participant</StatusBadge>
          ) : null}
          {conversation.status === "blocked" ? (
            <StatusBadge tone="destructive">Conversation blocked</StatusBadge>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}

export function ConversationThread({
  composerSlot,
  formatTimestamp,
  thread,
  threadActions,
}: ConversationThreadProps) {
  const { conversation, messages, reachedStart } = thread;

  return (
    <section aria-label="Active conversation" className={styles.thread}>
      <header className={styles.threadHeader}>
        <PersonSummary
          avatarSrc={conversation.counterpart.avatarUrl ?? undefined}
          className={styles.threadIdentity}
          descriptor={describeCounterpart(conversation)}
          eyebrow={
            conversation.counterpart.role === "tutor" ? "Tutor" : "Student"
          }
          meta={buildIdentityMeta(thread)}
          name={conversation.counterpart.displayName}
          state={conversation.status === "blocked" ? "attention_needed" : "default"}
          variant="compact"
        />

        {threadActions ? (
          <div className={styles.threadActions}>{threadActions}</div>
        ) : null}
      </header>

      {messages.length === 0 ? (
        <div className={styles.threadEmpty}>
          <p className={styles.threadEmptyTitle}>No messages in this thread yet.</p>
          <p className={styles.threadEmptyDescription}>
            Once a message is sent, it will appear here for both participants.
          </p>
        </div>
      ) : (
        <>
          {reachedStart ? (
            <p className={styles.threadStartHint}>Start of conversation</p>
          ) : null}

          <ol className={styles.messages}>
            {messages.map((message) => (
              <ConversationMessage
                formatTimestamp={formatTimestamp}
                key={message.id}
                message={message}
              />
            ))}
          </ol>
        </>
      )}

      {composerSlot ?? <ComposerPlaceholder />}
    </section>
  );
}

function ConversationMessage({
  formatTimestamp,
  message,
}: {
  formatTimestamp: (isoTimestamp: string) => string;
  message: ThreadMessageDto;
}) {
  const isRemoved = message.status === "removed";
  const senderLabel = message.isFromCurrentActor
    ? "You"
    : message.senderRole === "tutor"
      ? "Tutor"
      : "Student";

  return (
    <li
      className={cx(
        styles.messageItem,
        message.isFromCurrentActor ? styles.messageItemSelf : styles.messageItemCounterpart,
      )}
    >
      <p className={styles.messageMeta}>
        <span>{senderLabel}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={message.createdAt}>{formatTimestamp(message.createdAt)}</time>
        {message.editedAt && !isRemoved ? (
          <>
            <span aria-hidden="true">·</span>
            <span>Edited</span>
          </>
        ) : null}
      </p>

      {message.replyTo ? (
        <div className={styles.replyTo}>
          <p className={styles.replyToLabel}>
            Replying to {message.replyTo.senderRole === "tutor" ? "tutor" : "student"}
          </p>
          <p className={styles.replyToBody}>{message.replyTo.preview}</p>
        </div>
      ) : null}

      <p
        className={cx(
          styles.messageBubble,
          message.isFromCurrentActor && styles.messageBubbleSelf,
          isRemoved && styles.messageBubbleRemoved,
        )}
      >
        {message.body}
      </p>
    </li>
  );
}

function ComposerPlaceholder() {
  return (
    <div aria-label="Message composer" className={styles.composer} role="note">
      <p className={styles.composerLabel}>Message sending lands in P1-MSG-002.</p>
      <p className={styles.composerHint}>
        The composer is reserved here so the shared shell already shows the action surface.
      </p>
    </div>
  );
}

function describeCounterpart(conversation: ConversationListItemDto) {
  if (conversation.blockState === "blocked_by_me") {
    return "You blocked this participant. Unblock from the safety menu to continue messaging.";
  }

  if (conversation.blockState === "blocked_by_counterpart") {
    return "This participant has blocked further messages.";
  }

  if (conversation.status === "blocked") {
    return "This conversation is currently blocked.";
  }

  if (conversation.status === "archived") {
    return "Archived conversation kept for continuity.";
  }

  return conversation.counterpart.role === "tutor"
    ? "Direct line with your matched tutor."
    : "Direct line with this student.";
}

function buildIdentityMeta(thread: MessageThreadDto): string[] {
  const meta: string[] = [];

  if (thread.conversation.unreadCount > 0) {
    meta.push(
      thread.conversation.unreadCount === 1
        ? "1 unread"
        : `${thread.conversation.unreadCount} unread`,
    );
  }

  if (thread.conversation.isMuted) {
    meta.push("Muted");
  }

  if (thread.conversation.isArchived) {
    meta.push("Archived");
  }

  return meta;
}

function createTimestampFormatter() {
  return (isoTimestamp: string) => {
    const date = new Date(isoTimestamp);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const now = Date.now();
    const diffMs = now - date.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (diffMs < oneDayMs) {
      return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date);
    }

    if (diffMs < 7 * oneDayMs) {
      return new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date);
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
    }).format(date);
  };
}
