"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import shellStyles from "@/components/continuity/conversation-shell.module.css";
import { ScreenState } from "@/components/continuity";
import { PersonSummary } from "@/components/continuity/continuity-primitives";
import {
  Avatar,
  Chip,
  getPopoverTriggerProps,
  getReactionLabel,
  Menu,
  MenuItem,
  OverflowMenuTrigger,
  Popover,
  ReactionGlyph,
  StatusBadge,
} from "@/components/ui";
import { joinConversationChannel } from "@/lib/supabase/realtime";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { type MessageReactionKey, messageReactionKeys } from "@/modules/messages/constants";
import type {
  ConversationListItemDto,
  MessageThreadDto,
  ThreadMessageDto,
} from "@/modules/messages/conversations";
import type { ConversationBroadcastEvent } from "@/lib/supabase/realtime";
import {
  setConversationArchivedAction,
  setConversationMutedAction,
  toggleReactionAction,
} from "@/modules/messages/actions";
import {
  initialConversationFlagActionState,
  initialToggleReactionActionState,
  type ConversationFlagActionState,
  type ToggleReactionActionState,
} from "@/modules/messages/actions-state";

import styles from "./messages-experience.module.css";

type ConversationBroadcaster = (event: ConversationBroadcastEvent) => void;

const ConversationBroadcastContext = createContext<ConversationBroadcaster | null>(
  null,
);

type FilterValue = "all" | "unread" | "muted" | "archived";

const FILTER_OPTIONS: Array<{ label: string; value: FilterValue }> = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Muted", value: "muted" },
  { label: "Archived", value: "archived" },
];

const TYPING_VISIBLE_MS = 4000;

type MessagesExperienceProps = {
  actorRole: "student" | "tutor";
  basePath: `/${string}`;
  conversations: ConversationListItemDto[];
  selectedConversationId: string | null;
  thread: MessageThreadDto | null;
  threadComposer?: ReactNode;
};

export function MessagesExperience({
  actorRole,
  basePath,
  conversations,
  selectedConversationId,
  thread,
  threadComposer,
}: MessagesExperienceProps) {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [nameQuery, setNameQuery] = useState("");

  const visibleConversations = useMemo(() => {
    const trimmed = nameQuery.trim().toLowerCase();

    return conversations.filter((conversation) => {
      if (filter === "archived") {
        if (!conversation.filterFlags.isArchived) {
          return false;
        }
      } else {
        if (conversation.filterFlags.isArchived) {
          return false;
        }
      }

      if (filter === "unread" && !conversation.filterFlags.hasUnread) {
        return false;
      }

      if (filter === "muted" && !conversation.filterFlags.isMuted) {
        return false;
      }

      if (
        trimmed.length > 0 &&
        !conversation.counterpart.displayName.toLowerCase().includes(trimmed)
      ) {
        return false;
      }

      return true;
    });
  }, [conversations, filter, nameQuery]);

  return (
    <div className={shellStyles.shell}>
      <section aria-label="Conversation list" className={shellStyles.list}>
        <header className={shellStyles.listHeader}>
          <p className={shellStyles.listEyebrow}>Conversations</p>
          <h2 className={shellStyles.listTitle}>Your tutor threads</h2>
        </header>

        <div className={styles.filterBar}>
          <div
            aria-label="Filter conversations"
            className={styles.filterChipRow}
            role="group"
          >
            {FILTER_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                onClick={() => setFilter(option.value)}
                pressed={filter === option.value}
                size="compact"
                tone={filter === option.value ? "trust" : "default"}
              >
                {option.label}
              </Chip>
            ))}
          </div>
          <input
            aria-label="Search by counterpart name"
            className={styles.filterSearch}
            onChange={(event) => setNameQuery(event.target.value)}
            placeholder="Filter by name…"
            type="search"
            value={nameQuery}
          />
        </div>

        {visibleConversations.length === 0 ? (
          <p className={styles.listEmpty}>
            {filter === "archived"
              ? "No archived conversations."
              : "No conversations match the current filter."}
          </p>
        ) : (
          <ul className={shellStyles.listItems}>
            {visibleConversations.map((conversation) => (
              <li className={shellStyles.listItem} key={conversation.id}>
                <ConversationListRow
                  basePath={basePath}
                  conversation={conversation}
                  isActive={conversation.id === selectedConversationId}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {thread ? (
        <ThreadView
          actorRole={actorRole}
          composerSlot={threadComposer}
          thread={thread}
        />
      ) : (
        <ScreenState
          description="Open any conversation from the list to see the shared message shell with the lesson context kept visible."
          hints={["Threads stay attached to the tutor relationship, not the lesson."]}
          kind="empty"
          title="Select a conversation"
        />
      )}
    </div>
  );
}

function ConversationListRow({
  basePath,
  conversation,
  isActive,
}: {
  basePath: `/${string}`;
  conversation: ConversationListItemDto;
  isActive: boolean;
}) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [muteState, muteAction, mutePending] = useActionState<
    ConversationFlagActionState,
    FormData
  >(setConversationMutedAction, initialConversationFlagActionState);
  const [archiveState, archiveAction, archivePending] = useActionState<
    ConversationFlagActionState,
    FormData
  >(setConversationArchivedAction, initialConversationFlagActionState);

  void muteState;
  void archiveState;

  const href = `${basePath}?c=${conversation.id}` as Route;

  const dispatchFlag = useCallback(
    (
      formAction: (formData: FormData) => void,
      value: boolean,
    ) => {
      const formData = new FormData();
      formData.set("conversationId", conversation.id);
      formData.set("value", value ? "true" : "false");
      formAction(formData);
      setMenuOpen(false);
    },
    [conversation.id],
  );

  const isPending = mutePending || archivePending;

  return (
    <div
      className={[
        styles.listItemRow,
        conversation.isMuted ? styles.listMuted : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Link
        aria-current={isActive ? "page" : undefined}
        className={[
          shellStyles.listLink,
          isActive ? shellStyles.listLinkActive : "",
          styles.listItemLink,
        ]
          .filter(Boolean)
          .join(" ")}
        href={href}
      >
        <div className={shellStyles.itemHeader}>
          <div className={shellStyles.itemIdentity}>
            <Avatar
              name={conversation.counterpart.displayName}
              size="sm"
              src={conversation.counterpart.avatarUrl ?? undefined}
            />
            <p className={shellStyles.itemName}>
              {conversation.counterpart.displayName}
            </p>
          </div>

          {conversation.lastMessage ? (
            <p className={shellStyles.itemTimestamp}>
              {formatListTimestamp(conversation.lastMessage.createdAt)}
            </p>
          ) : null}
        </div>

        {conversation.lastMessage ? (
          <p
            className={[
              shellStyles.itemPreview,
              conversation.lastMessage.isFromCurrentActor
                ? shellStyles.itemPreviewSelf
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {conversation.lastMessage.preview}
          </p>
        ) : (
          <p className={shellStyles.itemPreview}>No messages yet.</p>
        )}

        {conversation.unreadCount > 0 ||
        conversation.isMuted ||
        conversation.isArchived ||
        conversation.blockState !== "active" ||
        conversation.status !== "active" ? (
          <div className={shellStyles.itemSignals}>
            {conversation.unreadCount > 0 ? (
              <StatusBadge
                className={styles.unreadBadge}
                tone={conversation.isMuted ? "info" : "trust"}
              >
                {conversation.unreadCount === 1
                  ? "1 unread"
                  : `${conversation.unreadCount} unread`}
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

      <div className={styles.listItemMenu}>
        <OverflowMenuTrigger
          aria-label={`Conversation options for ${conversation.counterpart.displayName}`}
          {...getPopoverTriggerProps({
            contentId: `conversation-options-${conversation.id}`,
            haspopup: "menu",
            open: menuOpen,
          })}
          disabled={isPending}
          onClick={() => setMenuOpen((current) => !current)}
          orientation="vertical"
          ref={triggerRef}
        />
        <Menu
          anchorRef={triggerRef}
          contentId={`conversation-options-${conversation.id}`}
          onOpenChange={setMenuOpen}
          open={menuOpen}
          placement="bottom-end"
        >
          <MenuItem
            onSelect={() => dispatchFlag(muteAction, !conversation.isMuted)}
          >
            {conversation.isMuted ? "Unmute conversation" : "Mute conversation"}
          </MenuItem>
          <MenuItem
            onSelect={() => dispatchFlag(archiveAction, !conversation.isArchived)}
          >
            {conversation.isArchived ? "Unarchive" : "Archive"}
          </MenuItem>
        </Menu>
      </div>
    </div>
  );
}

function ThreadView({
  actorRole,
  composerSlot,
  thread,
}: {
  actorRole: "student" | "tutor";
  composerSlot?: ReactNode;
  thread: MessageThreadDto;
}) {
  const { conversation, messages, reachedStart } = thread;
  const { broadcast, isCounterpartOnline, isCounterpartTyping } = useConversationChannel(
    conversation.id,
    actorRole,
  );
  const counterpartOnline = isCounterpartOnline;

  return (
    <section aria-label="Active conversation" className={shellStyles.thread}>
      <header className={shellStyles.threadHeader}>
        <PersonSummary
          avatarSrc={conversation.counterpart.avatarUrl ?? undefined}
          className={shellStyles.threadIdentity}
          descriptor={describeCounterpart(conversation)}
          eyebrow={
            conversation.counterpart.role === "tutor" ? "Tutor" : "Student"
          }
          meta={buildIdentityMeta(thread)}
          name={conversation.counterpart.displayName}
          state={
            conversation.status === "blocked" ? "attention_needed" : "default"
          }
          variant="compact"
        />
      </header>

      <div className={styles.threadStatusRow}>
        {counterpartOnline ? (
          <>
            <span aria-hidden="true" className={styles.onlineDot} />
            <span>Online</span>
          </>
        ) : (
          <span>Offline</span>
        )}
      </div>

      {messages.length === 0 ? (
        <div className={shellStyles.threadEmpty}>
          <p className={shellStyles.threadEmptyTitle}>
            No messages in this thread yet.
          </p>
          <p className={shellStyles.threadEmptyDescription}>
            Once a message is sent, it will appear here for both participants.
          </p>
        </div>
      ) : (
        <ConversationBroadcastContext.Provider value={broadcast}>
          {reachedStart ? (
            <p className={shellStyles.threadStartHint}>Start of conversation</p>
          ) : null}

          <ol className={shellStyles.messages}>
            {messages.map((message) => (
              <ThreadMessage key={message.id} message={message} />
            ))}
          </ol>
        </ConversationBroadcastContext.Provider>
      )}

      {isCounterpartTyping ? (
        <p aria-live="polite" className={styles.typingIndicator}>
          {conversation.counterpart.displayName} is typing…
        </p>
      ) : null}

      {composerSlot}
    </section>
  );
}

function ThreadMessage({
  message,
}: {
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
      className={[
        shellStyles.messageItem,
        message.isFromCurrentActor
          ? shellStyles.messageItemSelf
          : shellStyles.messageItemCounterpart,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className={shellStyles.messageMeta}>
        <span>{senderLabel}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={message.createdAt}>
          {formatBubbleTimestamp(message.createdAt)}
        </time>
        {message.editedAt && !isRemoved ? (
          <>
            <span aria-hidden="true">·</span>
            <span>Edited</span>
          </>
        ) : null}
      </p>

      {message.replyTo ? (
        <div className={shellStyles.replyTo}>
          <p className={shellStyles.replyToLabel}>
            Replying to{" "}
            {message.replyTo.senderRole === "tutor" ? "tutor" : "student"}
          </p>
          <p className={shellStyles.replyToBody}>{message.replyTo.preview}</p>
        </div>
      ) : null}

      <p
        className={[
          shellStyles.messageBubble,
          message.isFromCurrentActor ? shellStyles.messageBubbleSelf : "",
          isRemoved ? shellStyles.messageBubbleRemoved : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {message.body}
      </p>

      {!isRemoved ? <MessageReactionRow message={message} /> : null}
    </li>
  );
}

function MessageReactionRow({ message }: { message: ThreadMessageDto }) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    ToggleReactionActionState,
    FormData
  >(toggleReactionAction, initialToggleReactionActionState);
  const broadcast = useContext(ConversationBroadcastContext);
  const lastBroadcastRef = useRef<number | null>(null);

  useEffect(() => {
    if (!broadcast || state.code !== "ok" || !state.submittedAt) {
      return;
    }
    if (lastBroadcastRef.current === state.submittedAt) {
      return;
    }
    lastBroadcastRef.current = state.submittedAt;
    broadcast({ messageId: message.id, type: "reaction_changed" });
  }, [broadcast, message.id, state.code, state.submittedAt]);

  const dispatchReaction = useCallback(
    (key: MessageReactionKey) => {
      const formData = new FormData();
      formData.set("messageId", message.id);
      formData.set("reactionKey", key);
      formAction(formData);
      setPickerOpen(false);
    },
    [formAction, message.id],
  );

  const summary = message.reactions;
  const orderedKeys = messageReactionKeys.filter((key) => (summary.counts[key] ?? 0) > 0);

  return (
    <div className={styles.reactionRow}>
      {orderedKeys.map((key) => (
        <Chip
          key={key}
          onClick={() => dispatchReaction(key)}
          pressed={summary.myReactionKey === key}
          size="compact"
          tone={summary.myReactionKey === key ? "trust" : "default"}
        >
          <ReactionGlyph reactionKey={key} size={14} />
          <span>{summary.counts[key]}</span>
        </Chip>
      ))}
      <button
        aria-label="Add reaction"
        {...getPopoverTriggerProps({
          contentId: `reaction-picker-${message.id}`,
          haspopup: "dialog",
          open: pickerOpen,
        })}
        className={styles.reactionTrigger}
        disabled={pending}
        onClick={() => setPickerOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <ReactionGlyph
          aria-hidden
          reactionKey={summary.myReactionKey ?? "thumbs_up"}
          size={14}
        />
      </button>
      <Popover
        anchorRef={triggerRef}
        contentId={`reaction-picker-${message.id}`}
        onOpenChange={setPickerOpen}
        open={pickerOpen}
        placement="top-start"
        role="group"
      >
        <div aria-label="React with" className={styles.reactionPicker} role="group">
          {messageReactionKeys.map((key) => (
            <button
              aria-label={getReactionLabel(key)}
              aria-pressed={summary.myReactionKey === key}
              className={[
                styles.reactionPickerButton,
                summary.myReactionKey === key
                  ? styles.reactionPickerButtonActive
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={pending}
              key={key}
              onClick={() => dispatchReaction(key)}
              type="button"
            >
              <ReactionGlyph aria-hidden reactionKey={key} size={18} />
            </button>
          ))}
        </div>
      </Popover>
      {state.code && state.code !== "ok" && state.message ? (
        <span role="status" style={{ marginLeft: "var(--space-2)" }}>
          {state.message}
        </span>
      ) : null}
    </div>
  );
}

function useConversationChannel(
  conversationId: string,
  actorRole: "student" | "tutor",
): {
  broadcast: ConversationBroadcaster;
  isCounterpartOnline: boolean;
  isCounterpartTyping: boolean;
} {
  const [isCounterpartOnline, setCounterpartOnline] = useState(false);
  const [isCounterpartTyping, setCounterpartTyping] = useState(false);
  const broadcastRef = useRef<ConversationBroadcaster>(() => {});

  useEffect(() => {
    if (!isSupabaseAuthConfigured()) {
      broadcastRef.current = () => {};
      return;
    }

    let typingTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const handle = joinConversationChannel({
      actorRole,
      conversationId,
      onPresenceChange: (state) => {
        const counterpartRole: "student" | "tutor" =
          actorRole === "student" ? "tutor" : "student";
        const counterpartEntries = state[counterpartRole];
        setCounterpartOnline(
          Array.isArray(counterpartEntries) && counterpartEntries.length > 0,
        );
      },
      onTyping: (payload) => {
        if (payload.actorRole === actorRole) {
          return;
        }

        setCounterpartTyping(true);
        if (typingTimeoutId) {
          clearTimeout(typingTimeoutId);
        }
        typingTimeoutId = setTimeout(() => {
          setCounterpartTyping(false);
        }, TYPING_VISIBLE_MS);
      },
    });

    broadcastRef.current = (event) => {
      void handle.broadcast(event);
    };

    return () => {
      broadcastRef.current = () => {};
      if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
      }
      void handle.unsubscribe();
    };
  }, [actorRole, conversationId]);

  const broadcast = useCallback<ConversationBroadcaster>((event) => {
    broadcastRef.current(event);
  }, []);

  return { broadcast, isCounterpartOnline, isCounterpartTyping };
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

function formatListTimestamp(isoTimestamp: string) {
  const date = new Date(isoTimestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (diffMs < oneDayMs) {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  if (diffMs < 7 * oneDayMs) {
    return new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatBubbleTimestamp(isoTimestamp: string) {
  const date = new Date(isoTimestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

