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
  "review_submitted",
  "tutor_application_submitted",
  "tutor_application_reviewed",
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

export const policyNoticeTypes = [
  "terms",
  "privacy",
  "cookie_notice",
  "tutor_agreement",
  "trust_and_safety",
  "refund_policy",
] as const;

export type PolicyNoticeType = (typeof policyNoticeTypes)[number];
