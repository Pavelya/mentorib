import { describe, expect, it } from "vitest";

import { getNotificationTypeLabel } from "@/modules/notifications/labels";

describe("getNotificationTypeLabel", () => {
  it("returns the recipient label for lesson_report_shared when the account is a student", () => {
    expect(getNotificationTypeLabel("lesson_report_shared", "student")).toBe(
      "Lesson recap from your tutor",
    );
  });

  it("returns the author label for lesson_report_shared when the account is a tutor", () => {
    expect(getNotificationTypeLabel("lesson_report_shared", "tutor")).toBe(
      "Recap shared with student",
    );
  });

  it("returns the author label for review_submitted when the account is a student", () => {
    expect(getNotificationTypeLabel("review_submitted", "student")).toBe(
      "Your review published",
    );
  });

  it("returns the recipient label for review_submitted when the account is a tutor", () => {
    expect(getNotificationTypeLabel("review_submitted", "tutor")).toBe(
      "New review on your teaching",
    );
  });

  it("returns a role-independent label for symmetric lifecycle types", () => {
    expect(getNotificationTypeLabel("lesson_accepted", "student")).toBe(
      getNotificationTypeLabel("lesson_accepted", "tutor"),
    );
    expect(getNotificationTypeLabel("lesson_declined", "student")).toBe(
      getNotificationTypeLabel("lesson_declined", "tutor"),
    );
    expect(getNotificationTypeLabel("policy_notice_updated", "student")).toBe(
      getNotificationTypeLabel("policy_notice_updated", "tutor"),
    );
  });
});
