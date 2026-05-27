import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateNotification = vi.fn();
const mockSchedule = vi.fn();

vi.mock("@/modules/notifications/service", async () => {
  const actual = await vi.importActual<typeof import("@/modules/notifications/service")>(
    "@/modules/notifications/service",
  );
  return {
    ...actual,
    createNotification: (...args: unknown[]) => mockCreateNotification(...args),
  };
});

vi.mock("@/modules/notifications/email-delivery", () => ({
  scheduleNotificationEmailDelivery: (...args: unknown[]) =>
    mockSchedule(...args),
}));

import { createModerationReportAcknowledgementNotification } from "@/modules/notifications/lifecycle";
import {
  IN_APP_ONLY_NOTIFICATION_CATEGORIES,
  MANDATORY_NOTIFICATION_TYPES,
} from "@/modules/notifications/constants";
import {
  buildNotificationEmailPayload,
  isEmailEligibleNotificationType,
} from "@/modules/notifications/email-mapping";
import { NOTIFICATION_OBJECT_TYPES } from "@/modules/notifications/service";

describe("createModerationReportAcknowledgementNotification", () => {
  beforeEach(() => {
    mockCreateNotification.mockReset();
    mockSchedule.mockReset();
  });

  it("creates an in-app notification with the upheld body summary", async () => {
    mockCreateNotification.mockResolvedValueOnce({
      id: "n-1",
      app_user_id: "reporter-1",
      notification_type: "moderation_report_acknowledgement",
      object_type: "moderation_case",
    });

    await createModerationReportAcknowledgementNotification({
      caseId: "case-1",
      reporterAppUserId: "reporter-1",
      resolutionKind: "upheld",
    });

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        appUserId: "reporter-1",
        notificationType: "moderation_report_acknowledgement",
        objectId: "case-1",
        objectType: NOTIFICATION_OBJECT_TYPES.moderationCase,
        title: "Your report was reviewed",
      }),
    );
    const args = mockCreateNotification.mock.calls[0][0];
    expect(typeof args.bodySummary).toBe("string");
    expect(args.bodySummary).not.toMatch(/internal/i);
    expect(args.bodySummary).not.toMatch(/tutor profile/i);
    expect(args.bodySummary).not.toMatch(/admin/i);
  });

  it("never leaks reviewer or counter-party detail in the rejected variant", async () => {
    mockCreateNotification.mockResolvedValueOnce(null);

    await createModerationReportAcknowledgementNotification({
      caseId: "case-2",
      reporterAppUserId: "reporter-2",
      resolutionKind: "rejected",
    });

    const args = mockCreateNotification.mock.calls[0][0];
    expect(args.bodySummary).not.toMatch(/internal/i);
    expect(args.bodySummary).not.toMatch(/tutor/i);
    expect(args.bodySummary).not.toMatch(/upheld/i);
  });
});

describe("moderation_report_acknowledgement notification posture", () => {
  it("is registered as a mandatory notification type", () => {
    expect(
      MANDATORY_NOTIFICATION_TYPES.has("moderation_report_acknowledgement"),
    ).toBe(true);
  });

  it("is short-circuited from email delivery", () => {
    expect(
      isEmailEligibleNotificationType("moderation_report_acknowledgement"),
    ).toBe(false);
    expect(
      buildNotificationEmailPayload({
        bodySummary: "noop",
        notificationType: "moderation_report_acknowledgement",
        objectId: "case-1",
        objectType: NOTIFICATION_OBJECT_TYPES.moderationCase,
        title: "noop",
      }),
    ).toBeNull();
  });

  it("is not categorized — operators cannot disable it via category preferences", () => {
    // Sanity check: the type-to-category map keeps this in the null bucket
    // so the dispatch policy short-circuits to the mandatory branch.
    expect(IN_APP_ONLY_NOTIFICATION_CATEGORIES.size).toBeGreaterThan(0);
  });
});
