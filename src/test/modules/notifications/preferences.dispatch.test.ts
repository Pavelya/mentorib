import { beforeEach, describe, expect, it, vi } from "vitest";

const mockServiceRoleClient = vi.fn();
const mockResolvePolicy = vi.fn();
const mockLogEmailEvent = vi.fn();

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => mockServiceRoleClient(),
}));

vi.mock("@/lib/email/logging", () => ({
  logEmailEvent: (...args: unknown[]) => mockLogEmailEvent(...args),
}));

vi.mock("@/modules/notifications/preferences", () => ({
  resolveNotificationDispatchPolicy: (...args: unknown[]) =>
    mockResolvePolicy(...args),
}));

import {
  createNotification,
  NOTIFICATION_OBJECT_TYPES,
} from "@/modules/notifications/service";

const APP_USER_ID = "11111111-1111-4111-8111-111111111111";
const LESSON_ID = "22222222-2222-4222-8222-222222222222";

type NotificationRowShape = {
  app_user_id: string;
  body_summary: string;
  created_at: string;
  dismissed_at: string | null;
  id: string;
  notification_status: "unread";
  notification_type: string;
  object_id: string | null;
  object_type: string;
  read_at: string | null;
  title: string;
  updated_at: string;
};

function setSupabaseBehavior(options: {
  existing?: NotificationRowShape | null;
  inserted?: NotificationRowShape | null;
}) {
  const inserts: Array<Record<string, unknown>> = [];

  const client = {
    from(table: string) {
      if (table === "notifications") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: async () => ({
                      data: options.existing ?? null,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
          insert: (payload: Record<string, unknown>) => {
            inserts.push(payload);
            return {
              select: () => ({
                single: async () => ({
                  data:
                    options.inserted ?? {
                      app_user_id: APP_USER_ID,
                      body_summary: payload.body_summary as string,
                      created_at: new Date().toISOString(),
                      dismissed_at: null,
                      id: "33333333-3333-4333-8333-333333333333",
                      notification_status: "unread" as const,
                      notification_type: payload.notification_type as string,
                      object_id: (payload.object_id as string | null) ?? null,
                      object_type: payload.object_type as string,
                      read_at: null,
                      title: payload.title as string,
                      updated_at: new Date().toISOString(),
                    },
                  error: null,
                }),
              }),
            };
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };

  mockServiceRoleClient.mockReturnValue(client);

  return { inserts };
}

beforeEach(() => {
  mockServiceRoleClient.mockReset();
  mockResolvePolicy.mockReset();
  mockLogEmailEvent.mockReset();
});

describe("createNotification preference enforcement", () => {
  it("skips writing an in-app row when the user disabled the category", async () => {
    mockResolvePolicy.mockResolvedValue({
      emailEnabled: true,
      inAppEnabled: false,
      isMandatory: false,
    });

    const result = await createNotification({
      appUserId: APP_USER_ID,
      bodySummary: "A student left you a review.",
      notificationType: "review_submitted",
      objectId: LESSON_ID,
      objectType: NOTIFICATION_OBJECT_TYPES.tutorReview,
      title: "New review",
    });

    expect(result).toBeNull();
    expect(mockServiceRoleClient).not.toHaveBeenCalled();
    expect(mockLogEmailEvent).toHaveBeenCalledWith(
      "info",
      "notification_in_app_skipped",
      expect.objectContaining({
        app_user_id: APP_USER_ID,
        notification_category: "reviews",
        notification_type: "review_submitted",
        reason: "channel_disabled_by_preference",
      }),
    );
    // The skip log must not include any title, body, or object id.
    const [, , payload] = mockLogEmailEvent.mock.calls[0]!;
    expect(payload as Record<string, unknown>).not.toHaveProperty("title");
    expect(payload as Record<string, unknown>).not.toHaveProperty(
      "body_summary",
    );
    expect(payload as Record<string, unknown>).not.toHaveProperty("object_id");
  });

  it("still writes a row for mandatory types regardless of preference state", async () => {
    mockResolvePolicy.mockResolvedValue({
      emailEnabled: true,
      inAppEnabled: true,
      isMandatory: true,
    });
    const { inserts } = setSupabaseBehavior({ existing: null });

    const result = await createNotification({
      appUserId: APP_USER_ID,
      bodySummary: "Your lesson was accepted.",
      notificationType: "lesson_accepted",
      objectId: LESSON_ID,
      objectType: NOTIFICATION_OBJECT_TYPES.lesson,
      title: "Lesson confirmed",
    });

    expect(result).not.toBeNull();
    expect(inserts).toHaveLength(1);
    expect(mockLogEmailEvent).not.toHaveBeenCalled();
  });

  it("writes the row when the user has the in-app channel enabled", async () => {
    mockResolvePolicy.mockResolvedValue({
      emailEnabled: false,
      inAppEnabled: true,
      isMandatory: false,
    });
    const { inserts } = setSupabaseBehavior({ existing: null });

    const result = await createNotification({
      appUserId: APP_USER_ID,
      bodySummary: "Your lesson reminder.",
      notificationType: "upcoming_lesson_reminder",
      objectId: LESSON_ID,
      objectType: NOTIFICATION_OBJECT_TYPES.lesson,
      title: "Lesson reminder",
    });

    expect(result).not.toBeNull();
    expect(inserts).toHaveLength(1);
  });
});
