import { beforeEach, describe, expect, it, vi } from "vitest";

const mockServiceRoleClient = vi.fn();

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => mockServiceRoleClient(),
}));

vi.mock("@/modules/notifications/service", () => ({
  upsertNewMessageNotification: vi.fn(),
  markConversationNewMessageNotificationRead: vi.fn(),
}));

import { setConversationParticipantFlag } from "@/modules/messages/conversation-state";

const CONVERSATION_ID = "22222222-2222-4222-8222-222222222222";
const STUDENT_APP_USER_ID = "55555555-5555-4555-8555-555555555555";

type Behavior = {
  participant?: {
    app_user_id: string;
    conversation_id: string;
    is_archived: boolean;
    is_muted: boolean;
  } | null;
};

function setSupabaseBehavior(behavior: Behavior) {
  const updates: Array<Record<string, unknown>> = [];

  const client = {
    from(table: string) {
      if (table === "conversation_participants") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: behavior.participant ?? null,
                  error: null,
                }),
              }),
            }),
          }),
          update: (payload: Record<string, unknown>) => ({
            eq: () => ({
              eq: async () => {
                updates.push(payload);
                return { error: null };
              },
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };

  mockServiceRoleClient.mockReturnValue(client);

  return { updates };
}

beforeEach(() => {
  mockServiceRoleClient.mockReset();
});

describe("setConversationParticipantFlag", () => {
  it("returns not_found when the actor is not a participant", async () => {
    setSupabaseBehavior({ participant: null });

    const result = await setConversationParticipantFlag(
      { id: STUDENT_APP_USER_ID },
      { conversationId: CONVERSATION_ID, flag: "muted", value: true },
    );

    expect(result.code).toBe("not_found");
  });

  it("is idempotent when the new value matches the current value", async () => {
    const { updates } = setSupabaseBehavior({
      participant: {
        app_user_id: STUDENT_APP_USER_ID,
        conversation_id: CONVERSATION_ID,
        is_archived: false,
        is_muted: true,
      },
    });

    const result = await setConversationParticipantFlag(
      { id: STUDENT_APP_USER_ID },
      { conversationId: CONVERSATION_ID, flag: "muted", value: true },
    );

    expect(result.code).toBe("ok");
    expect(result.action).toBe("enabled");
    expect(updates).toHaveLength(0);
  });

  it("writes the muted flag when the value flips", async () => {
    const { updates } = setSupabaseBehavior({
      participant: {
        app_user_id: STUDENT_APP_USER_ID,
        conversation_id: CONVERSATION_ID,
        is_archived: false,
        is_muted: false,
      },
    });

    const result = await setConversationParticipantFlag(
      { id: STUDENT_APP_USER_ID },
      { conversationId: CONVERSATION_ID, flag: "muted", value: true },
    );

    expect(result.code).toBe("ok");
    expect(result.action).toBe("enabled");
    expect(updates).toEqual([{ is_muted: true }]);
  });

  it("writes the archived flag when the value flips", async () => {
    const { updates } = setSupabaseBehavior({
      participant: {
        app_user_id: STUDENT_APP_USER_ID,
        conversation_id: CONVERSATION_ID,
        is_archived: false,
        is_muted: false,
      },
    });

    const result = await setConversationParticipantFlag(
      { id: STUDENT_APP_USER_ID },
      { conversationId: CONVERSATION_ID, flag: "archived", value: true },
    );

    expect(result.code).toBe("ok");
    expect(result.action).toBe("enabled");
    expect(updates).toEqual([{ is_archived: true }]);
  });

  it("rejects invalid conversation ids without hitting the database", async () => {
    setSupabaseBehavior({});

    const result = await setConversationParticipantFlag(
      { id: STUDENT_APP_USER_ID },
      { conversationId: "not-a-uuid", flag: "muted", value: true },
    );

    expect(result.code).toBe("not_found");
  });
});
