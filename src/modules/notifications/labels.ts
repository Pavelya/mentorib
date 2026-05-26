import type { NotificationAudienceRole, NotificationType } from "./constants";

export type NotificationTypeTone =
  | "info"
  | "positive"
  | "warning"
  | "trust";

export function getNotificationTypeLabel(
  type: NotificationType,
  role: NotificationAudienceRole,
): string {
  switch (type) {
    case "new_message":
      return "Chat message";
    case "lesson_request_submitted":
      return "Lesson request";
    case "lesson_accepted":
      return "Lesson accepted";
    case "lesson_declined":
      return "Lesson declined";
    case "lesson_request_expired":
      return "Lesson request expired";
    case "lesson_updated":
      return "Lesson update";
    case "upcoming_lesson_reminder":
      return "Lesson reminder";
    case "lesson_issue_acknowledgement":
      return "Issue received";
    case "lesson_issue_resolution":
      return "Issue resolved";
    case "lesson_report_shared":
      return role === "tutor"
        ? "Recap shared with student"
        : "Lesson recap from your tutor";
    case "review_submitted":
      return role === "tutor"
        ? "New review on your teaching"
        : "Your review published";
    case "tutor_application_submitted":
      return "Tutor application sent";
    case "tutor_application_reviewed":
      return "Application reviewed";
    case "tutor_credential_reviewed":
      return "Credential reviewed";
    case "tutor_listing_status_changed":
      return "Listing status updated";
    case "payout_processed":
      return "Payout updated";
    case "policy_notice_updated":
      return "Legal update";
  }
}

export function getNotificationTypeTone(
  type: NotificationType,
): NotificationTypeTone {
  switch (type) {
    case "new_message":
      return "info";
    case "lesson_accepted":
    case "lesson_issue_resolution":
    case "payout_processed":
      return "positive";
    case "lesson_declined":
    case "lesson_request_expired":
    case "policy_notice_updated":
    case "tutor_application_reviewed":
    case "tutor_credential_reviewed":
    case "tutor_listing_status_changed":
      return "warning";
    case "review_submitted":
    case "tutor_application_submitted":
      return "trust";
    case "lesson_request_submitted":
    case "lesson_updated":
    case "upcoming_lesson_reminder":
    case "lesson_issue_acknowledgement":
    case "lesson_report_shared":
      return "info";
  }
}
