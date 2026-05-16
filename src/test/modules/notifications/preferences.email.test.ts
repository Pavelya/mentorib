import { beforeEach, describe, expect, it, vi } from "vitest";

const mockResolvePolicy = vi.fn();
const mockLogEmailEvent = vi.fn();
const mockEnqueueJob = vi.fn();

vi.mock("@/lib/email/logging", () => ({
  logEmailEvent: (...args: unknown[]) => mockLogEmailEvent(...args),
}));

vi.mock("@/lib/jobs/service", () => ({
  enqueueJob: (...args: unknown[]) => mockEnqueueJob(...args),
}));

vi.mock("@/modules/notifications/preferences", () => ({
  resolveNotificationDispatchPolicy: (...args: unknown[]) =>
    mockResolvePolicy(...args),
}));

import { scheduleNotificationEmailDelivery } from "@/modules/notifications/email-delivery";

const APP_USER_ID = "11111111-1111-4111-8111-111111111111";
const NOTIFICATION_ID = "22222222-2222-4222-8222-222222222222";

const baseNotification = {
  app_user_id: APP_USER_ID,
  body_summary: "summary",
  id: NOTIFICATION_ID,
  object_id: null,
  object_type: "lesson",
  title: "title",
};

beforeEach(() => {
  mockResolvePolicy.mockReset();
  mockLogEmailEvent.mockReset();
  mockEnqueueJob.mockReset();
  mockEnqueueJob.mockResolvedValue({ deduped: false });
});

describe("scheduleNotificationEmailDelivery preference enforcement", () => {
  it("returns channel_in_app_only for new_message regardless of preferences", async () => {
    const result = await scheduleNotificationEmailDelivery({
      notification: { ...baseNotification, notification_type: "new_message" },
    });

    expect(result).toEqual({
      outcome: "skipped",
      reason: "channel_in_app_only",
    });
    expect(mockResolvePolicy).not.toHaveBeenCalled();
    expect(mockEnqueueJob).not.toHaveBeenCalled();
  });

  it("skips enqueueing when the user disabled the email channel for the category", async () => {
    mockResolvePolicy.mockResolvedValue({
      emailEnabled: false,
      inAppEnabled: true,
      isMandatory: false,
    });

    const result = await scheduleNotificationEmailDelivery({
      notification: {
        ...baseNotification,
        notification_type: "upcoming_lesson_reminder",
      },
    });

    expect(result).toEqual({
      outcome: "skipped",
      reason: "channel_disabled_by_preference",
    });
    expect(mockEnqueueJob).not.toHaveBeenCalled();
    expect(mockLogEmailEvent).toHaveBeenCalledWith(
      "info",
      "notification_email_skipped",
      expect.objectContaining({
        app_user_id: APP_USER_ID,
        notification_category: "lesson_reminders",
        notification_id: NOTIFICATION_ID,
        notification_type: "upcoming_lesson_reminder",
        reason: "channel_disabled_by_preference",
      }),
    );
    const [, , payload] = mockLogEmailEvent.mock.calls[0]!;
    expect(payload as Record<string, unknown>).not.toHaveProperty("title");
    expect(payload as Record<string, unknown>).not.toHaveProperty(
      "body_summary",
    );
  });

  it("still enqueues mandatory notification emails when preferences are off", async () => {
    mockResolvePolicy.mockResolvedValue({
      emailEnabled: true,
      inAppEnabled: true,
      isMandatory: true,
    });

    const result = await scheduleNotificationEmailDelivery({
      notification: {
        ...baseNotification,
        notification_type: "lesson_accepted",
      },
    });

    expect(result.outcome).toBe("enqueued");
    expect(mockEnqueueJob).toHaveBeenCalledTimes(1);
  });
});
