export const notificationTypes = [
  "new_message",
  "lesson_request_submitted",
  "lesson_accepted",
  "lesson_declined",
  "lesson_request_expired",
  "lesson_updated",
  "upcoming_lesson_reminder",
  "lesson_issue_acknowledgement",
  "lesson_issue_resolution",
  "lesson_report_shared",
  "review_submitted",
  "tutor_application_submitted",
  "tutor_application_reviewed",
  "tutor_credential_reviewed",
  "tutor_listing_status_changed",
  "payout_processed",
  "policy_notice_updated",
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export const notificationStatuses = [
  "unread",
  "read",
  "dismissed",
] as const;

export type NotificationStatus = (typeof notificationStatuses)[number];

export const notificationChannels = ["in_app", "email"] as const;

export type NotificationChannel = (typeof notificationChannels)[number];

export const notificationDeliveryStatuses = [
  "queued",
  "attempted",
  "accepted",
  "failed",
] as const;

export type NotificationDeliveryStatus =
  (typeof notificationDeliveryStatuses)[number];

export const notificationCategories = [
  "lesson_reminders",
  "reviews",
  "tutor_application_updates",
  "lesson_recaps",
] as const;

export type NotificationCategory = (typeof notificationCategories)[number];

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  lesson_reminders: "Lesson reminders",
  reviews: "Reviews",
  tutor_application_updates: "Tutor application updates",
  lesson_recaps: "Lesson recaps",
};

export type NotificationCategoryAudience = "student" | "tutor" | "both";

export const NOTIFICATION_CATEGORY_AUDIENCE: Record<
  NotificationCategory,
  NotificationCategoryAudience
> = {
  lesson_reminders: "both",
  reviews: "tutor",
  tutor_application_updates: "tutor",
  lesson_recaps: "student",
};

export type NotificationCategoryDescription =
  | string
  | { readonly student: string; readonly tutor: string };

export const NOTIFICATION_CATEGORY_DESCRIPTIONS: Record<
  NotificationCategory,
  NotificationCategoryDescription
> = {
  lesson_reminders: {
    student:
      "Heads-up before a scheduled lesson so you can prepare or join on time.",
    tutor:
      "Heads-up before a scheduled lesson so you can be ready to teach on time.",
  },
  reviews: "Notices when a student leaves a review on a lesson you taught.",
  tutor_application_updates:
    "Status updates while your tutor application is under review.",
  lesson_recaps:
    "Continuity notes your tutor shares after a lesson is complete.",
};

export type NotificationAudienceRole = "student" | "tutor";

export function getNotificationCategoryDescription(
  category: NotificationCategory,
  role: NotificationAudienceRole,
): string {
  const value = NOTIFICATION_CATEGORY_DESCRIPTIONS[category];
  return typeof value === "string" ? value : value[role];
}

export function filterNotificationCategoriesForRoles(roles: {
  isStudent: boolean;
  isTutor: boolean;
}): readonly NotificationCategory[] {
  return notificationCategories.filter((category) => {
    const audience = NOTIFICATION_CATEGORY_AUDIENCE[category];
    if (audience === "both") {
      return roles.isStudent || roles.isTutor;
    }
    if (audience === "student") {
      return roles.isStudent;
    }
    return roles.isTutor;
  });
}

export const IN_APP_ONLY_NOTIFICATION_CATEGORIES = new Set<NotificationCategory>([
  "lesson_recaps",
]);

export const MANDATORY_NOTIFICATION_TYPES = new Set<NotificationType>([
  "lesson_request_submitted",
  "lesson_accepted",
  "lesson_declined",
  "lesson_request_expired",
  "lesson_updated",
  "lesson_issue_acknowledgement",
  "lesson_issue_resolution",
  "payout_processed",
  "policy_notice_updated",
]);

export const NOTIFICATION_TYPE_TO_CATEGORY: Record<
  NotificationType,
  NotificationCategory | null
> = {
  new_message: null,
  lesson_request_submitted: null,
  lesson_accepted: null,
  lesson_declined: null,
  lesson_request_expired: null,
  lesson_updated: null,
  upcoming_lesson_reminder: "lesson_reminders",
  lesson_issue_acknowledgement: null,
  lesson_issue_resolution: null,
  lesson_report_shared: "lesson_recaps",
  review_submitted: "reviews",
  tutor_application_submitted: "tutor_application_updates",
  tutor_application_reviewed: "tutor_application_updates",
  tutor_credential_reviewed: "tutor_application_updates",
  tutor_listing_status_changed: null,
  payout_processed: null,
  policy_notice_updated: null,
};

export function isNotificationCategory(
  value: string,
): value is NotificationCategory {
  return (notificationCategories as readonly string[]).includes(value);
}

export const policyNoticeTypes = [
  "terms",
  "privacy",
  "cookie_notice",
  "tutor_agreement",
  "trust_and_safety",
  "refund_policy",
] as const;

export type PolicyNoticeType = (typeof policyNoticeTypes)[number];
