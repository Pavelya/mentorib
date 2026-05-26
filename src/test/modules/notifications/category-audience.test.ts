import { describe, expect, it } from "vitest";

import {
  filterNotificationCategoriesForRoles,
  getNotificationCategoryDescription,
  NOTIFICATION_CATEGORY_AUDIENCE,
} from "@/modules/notifications/constants";

describe("filterNotificationCategoriesForRoles", () => {
  it("returns student-only and shared categories for a pure student", () => {
    const categories = filterNotificationCategoriesForRoles({
      isStudent: true,
      isTutor: false,
    });
    expect(categories).toEqual(["lesson_reminders", "lesson_recaps"]);
  });

  it("returns tutor-only and shared categories for a pure tutor", () => {
    const categories = filterNotificationCategoriesForRoles({
      isStudent: false,
      isTutor: true,
    });
    expect(categories).toEqual([
      "lesson_reminders",
      "reviews",
      "tutor_application_updates",
    ]);
  });

  it("returns every category for a dual-role account", () => {
    const categories = filterNotificationCategoriesForRoles({
      isStudent: true,
      isTutor: true,
    });
    expect(categories).toEqual([
      "lesson_reminders",
      "reviews",
      "tutor_application_updates",
      "lesson_recaps",
    ]);
  });

  it("returns nothing when no product role is active", () => {
    const categories = filterNotificationCategoriesForRoles({
      isStudent: false,
      isTutor: false,
    });
    expect(categories).toEqual([]);
  });
});

describe("getNotificationCategoryDescription", () => {
  it("selects the student variant for a shared category", () => {
    const description = getNotificationCategoryDescription(
      "lesson_reminders",
      "student",
    );
    expect(description).toMatch(/prepare or join on time/);
  });

  it("selects the tutor variant for a shared category", () => {
    const description = getNotificationCategoryDescription(
      "lesson_reminders",
      "tutor",
    );
    expect(description).toMatch(/teach on time/);
  });

  it("returns the same string for single-role categories regardless of role", () => {
    expect(getNotificationCategoryDescription("reviews", "student")).toBe(
      getNotificationCategoryDescription("reviews", "tutor"),
    );
    expect(
      getNotificationCategoryDescription("tutor_application_updates", "student"),
    ).toBe(
      getNotificationCategoryDescription("tutor_application_updates", "tutor"),
    );
    expect(getNotificationCategoryDescription("lesson_recaps", "student")).toBe(
      getNotificationCategoryDescription("lesson_recaps", "tutor"),
    );
  });
});

describe("NOTIFICATION_CATEGORY_AUDIENCE", () => {
  it("classifies each category by audience", () => {
    expect(NOTIFICATION_CATEGORY_AUDIENCE).toEqual({
      lesson_reminders: "both",
      reviews: "tutor",
      tutor_application_updates: "tutor",
      lesson_recaps: "student",
    });
  });
});
