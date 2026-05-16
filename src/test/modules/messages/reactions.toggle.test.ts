import { beforeEach, describe, expect, it, vi } from "vitest";

const mockServiceRoleClient = vi.fn();

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => mockServiceRoleClient(),
}));

vi.mock("@/modules/notifications/service", () => ({
  upsertNewMessageNotification: vi.fn(),
  markConversationNewMessageNotificationRead: vi.fn(),
}));

import {
  emptyReactionSummary,
  loadReactionsForMessages,
  toggleMessageReaction,
} from "@/modules/messages/reactions";
import { isMessageReactionKey } from "@/modules/messages/constants";

const MESSAGE_ID = "11111111-1111-4111-8111-111111111111";
const ANOTHER_MESSAGE_ID = "11111111-1111-4111-8111-111111111112";
const CONVERSATION_ID = "22222222-2222-4222-8222-222222222222";
const STUDENT_PROFILE_ID = "33333333-3333-4333-8333-333333333333";
const TUTOR_PROFILE_ID = "44444444-4444-4444-8444-444444444444";
const STUDENT_APP_USER_ID = "55555555-5555-4555-8555-555555555555";
const TUTOR_APP_USER_ID = "66666666-6666-4666-8666-666666666666";
const NON_PARTICIPANT_APP_USER_ID = "77777777-7777-4777-8777-777777777777";

type ReactionRow = {
  message_id: string;
  reaction_key: string;
  reactor_app_user_id: string;
};

type Behavior = {
  message?: { conversation_id: string; id: string; message_status: string; sender_app_user_id: string } | null;
  conversation?: {
    id: string;
    conversation_status: "active" | "blocked" | "archived";
    student_profile_id: string;
    tutor_profile_id: string;
  } | null;
  studentProfile?: { app_user_id: string } | null;
  tutorProfile?: { app_user_id: string } | null;
  blocks?: Array<{
    blocker_app_user_id: string;
    blocked_app_user_id: string;
    block_status: "active" | "released";
  }>;
  existingReaction?: { id: string; reaction_key: string } | null;
  recentReactionCount?: number;
  reactionsRows?: ReactionRow[];
};

function makeReturningTerminal<T>(payload: T) {
  return {
    returns: () => Promise.resolve(payload),
  };
}

function makeAwaitableTerminal<T>(payload: T) {
  return Promise.resolve(payload);
}

function setSupabaseBehavior(behavior: Behavior) {
  const reactionInserts: ReactionRow[] = [];
  const reactionUpdates: Array<{ id: string; reaction_key: string }> = [];
  const reactionDeletes: string[] = [];

  const client = {
    from(table: string) {
      switch (table) {
        case "messages":
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: behavior.message ?? null,
                  error: null,
                }),
              }),
            }),
          };

        case "conversations":
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: behavior.conversation ?? null,
                  error: null,
                }),
              }),
            }),
          };

        case "student_profiles":
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: behavior.studentProfile ?? null,
                  error: null,
                }),
              }),
            }),
          };

        case "tutor_profiles":
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: behavior.tutorProfile ?? null,
                  error: null,
                }),
              }),
            }),
          };

        case "user_blocks":
          return {
            select: () => ({
              eq: () => ({
                or: () =>
                  makeReturningTerminal({
                    data: behavior.blocks ?? [],
                    error: null,
                  }),
              }),
            }),
          };

        case "message_reactions":
          return {
            select: (
              _columns: string,
              options?: { count?: string; head?: boolean },
            ) => {
              if (options?.count) {
                return {
                  eq: () => ({
                    gte: () =>
                      makeAwaitableTerminal({
                        count: behavior.recentReactionCount ?? 0,
                        error: null,
                      }),
                  }),
                };
              }

              return {
                eq: () => ({
                  eq: () => ({
                    maybeSingle: async () => ({
                      data: behavior.existingReaction ?? null,
                      error: null,
                    }),
                  }),
                }),
                in: () =>
                  makeReturningTerminal({
                    data: behavior.reactionsRows ?? [],
                    error: null,
                  }),
              };
            },
            insert: async (payload: ReactionRow) => {
              reactionInserts.push(payload);
              return { error: null };
            },
            update: (payload: { reaction_key: string }) => ({
              eq: async () => {
                reactionUpdates.push({
                  id: behavior.existingReaction?.id ?? "",
                  reaction_key: payload.reaction_key,
                });
                return { error: null };
              },
            }),
            delete: () => ({
              eq: async (_col: string, id: string) => {
                reactionDeletes.push(id);
                return { error: null };
              },
            }),
          };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  mockServiceRoleClient.mockReturnValue(client);

  return { reactionDeletes, reactionInserts, reactionUpdates };
}

const activeConversation = {
  conversation_status: "active" as const,
  id: CONVERSATION_ID,
  student_profile_id: STUDENT_PROFILE_ID,
  tutor_profile_id: TUTOR_PROFILE_ID,
};

const activeMessage = {
  conversation_id: CONVERSATION_ID,
  id: MESSAGE_ID,
  message_status: "sent",
  sender_app_user_id: TUTOR_APP_USER_ID,
};

beforeEach(() => {
  mockServiceRoleClient.mockReset();
});

describe("isMessageReactionKey", () => {
  it("accepts every canonical reaction key", () => {
    for (const key of ["thumbs_up", "heart", "laugh", "celebrate", "thinking", "clap"]) {
      expect(isMessageReactionKey(key)).toBe(true);
    }
  });

  it("rejects unknown values", () => {
    expect(isMessageReactionKey("fire")).toBe(false);
    expect(isMessageReactionKey("")).toBe(false);
    expect(isMessageReactionKey(undefined)).toBe(false);
    expect(isMessageReactionKey(42)).toBe(false);
  });
});

describe("toggleMessageReaction", () => {
  it("inserts a new reaction when the actor has not reacted yet", async () => {
    const { reactionInserts } = setSupabaseBehavior({
      conversation: activeConversation,
      message: activeMessage,
      studentProfile: { app_user_id: STUDENT_APP_USER_ID },
      tutorProfile: { app_user_id: TUTOR_APP_USER_ID },
      existingReaction: null,
    });

    const result = await toggleMessageReaction(
      { id: STUDENT_APP_USER_ID },
      { messageId: MESSAGE_ID, reactionKey: "heart" },
    );

    expect(result.code).toBe("ok");
    expect(result.action).toBe("added");
    expect(result.myReactionKey).toBe("heart");
    expect(reactionInserts).toEqual([
      {
        message_id: MESSAGE_ID,
        reaction_key: "heart",
        reactor_app_user_id: STUDENT_APP_USER_ID,
      },
    ]);
  });

  it("removes the reaction when the same key is re-clicked", async () => {
    const { reactionDeletes } = setSupabaseBehavior({
      conversation: activeConversation,
      message: activeMessage,
      studentProfile: { app_user_id: STUDENT_APP_USER_ID },
      tutorProfile: { app_user_id: TUTOR_APP_USER_ID },
      existingReaction: { id: "existing-id", reaction_key: "heart" },
    });

    const result = await toggleMessageReaction(
      { id: STUDENT_APP_USER_ID },
      { messageId: MESSAGE_ID, reactionKey: "heart" },
    );

    expect(result.code).toBe("ok");
    expect(result.action).toBe("removed");
    expect(result.myReactionKey).toBeNull();
    expect(reactionDeletes).toContain("existing-id");
  });

  it("switches the reaction when a different key is clicked", async () => {
    const { reactionUpdates } = setSupabaseBehavior({
      conversation: activeConversation,
      message: activeMessage,
      studentProfile: { app_user_id: STUDENT_APP_USER_ID },
      tutorProfile: { app_user_id: TUTOR_APP_USER_ID },
      existingReaction: { id: "existing-id", reaction_key: "thumbs_up" },
    });

    const result = await toggleMessageReaction(
      { id: STUDENT_APP_USER_ID },
      { messageId: MESSAGE_ID, reactionKey: "laugh" },
    );

    expect(result.code).toBe("ok");
    expect(result.action).toBe("switched");
    expect(result.previousReactionKey).toBe("thumbs_up");
    expect(reactionUpdates).toEqual([{ id: "existing-id", reaction_key: "laugh" }]);
  });

  it("denies non-participants", async () => {
    setSupabaseBehavior({
      conversation: activeConversation,
      message: activeMessage,
      studentProfile: { app_user_id: STUDENT_APP_USER_ID },
      tutorProfile: { app_user_id: TUTOR_APP_USER_ID },
    });

    const result = await toggleMessageReaction(
      { id: NON_PARTICIPANT_APP_USER_ID },
      { messageId: MESSAGE_ID, reactionKey: "heart" },
    );

    expect(result.code).toBe("not_found");
  });

  it("denies removed messages", async () => {
    setSupabaseBehavior({
      conversation: activeConversation,
      message: { ...activeMessage, message_status: "removed" },
      studentProfile: { app_user_id: STUDENT_APP_USER_ID },
      tutorProfile: { app_user_id: TUTOR_APP_USER_ID },
    });

    const result = await toggleMessageReaction(
      { id: STUDENT_APP_USER_ID },
      { messageId: MESSAGE_ID, reactionKey: "heart" },
    );

    expect(result.code).toBe("forbidden");
  });

  it("denies blocked pairs", async () => {
    setSupabaseBehavior({
      conversation: activeConversation,
      message: activeMessage,
      studentProfile: { app_user_id: STUDENT_APP_USER_ID },
      tutorProfile: { app_user_id: TUTOR_APP_USER_ID },
      blocks: [
        {
          blocker_app_user_id: STUDENT_APP_USER_ID,
          blocked_app_user_id: TUTOR_APP_USER_ID,
          block_status: "active",
        },
      ],
    });

    const result = await toggleMessageReaction(
      { id: STUDENT_APP_USER_ID },
      { messageId: MESSAGE_ID, reactionKey: "heart" },
    );

    expect(result.code).toBe("forbidden");
    expect(result.message).toMatch(/unblock/i);
  });

  it("rejects unknown reaction keys before hitting the database", async () => {
    setSupabaseBehavior({});
    const result = await toggleMessageReaction(
      { id: STUDENT_APP_USER_ID },
      { messageId: MESSAGE_ID, reactionKey: "fire" },
    );

    expect(result.code).toBe("validation_failed");
  });
});

describe("loadReactionsForMessages", () => {
  it("aggregates counts, marks the actor's reaction, and survives mixed-author sets", async () => {
    setSupabaseBehavior({
      reactionsRows: [
        {
          message_id: MESSAGE_ID,
          reaction_key: "heart",
          reactor_app_user_id: STUDENT_APP_USER_ID,
        },
        {
          message_id: MESSAGE_ID,
          reaction_key: "heart",
          reactor_app_user_id: TUTOR_APP_USER_ID,
        },
        {
          message_id: ANOTHER_MESSAGE_ID,
          reaction_key: "thumbs_up",
          reactor_app_user_id: TUTOR_APP_USER_ID,
        },
      ],
    });

    const lookup = await loadReactionsForMessages(
      [MESSAGE_ID, ANOTHER_MESSAGE_ID],
      STUDENT_APP_USER_ID,
    );

    const first = lookup.get(MESSAGE_ID);
    expect(first?.counts.heart).toBe(2);
    expect(first?.total).toBe(2);
    expect(first?.myReactionKey).toBe("heart");

    const second = lookup.get(ANOTHER_MESSAGE_ID);
    expect(second?.counts.thumbs_up).toBe(1);
    expect(second?.myReactionKey).toBeNull();
  });

  it("returns an empty map for an empty input", async () => {
    setSupabaseBehavior({});
    const lookup = await loadReactionsForMessages([], STUDENT_APP_USER_ID);
    expect(lookup.size).toBe(0);
  });

  it("produces an empty summary for messages with no rows", () => {
    const summary = emptyReactionSummary();
    expect(summary.total).toBe(0);
    expect(summary.myReactionKey).toBeNull();
  });
});
