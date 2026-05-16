import { buildAbsoluteUrl } from "@/lib/seo/site";
import type { TransactionalEmailProps } from "@/lib/email/templates/transactional-email";

import type { NotificationType } from "@/modules/notifications/constants";
import type { NotificationObjectType } from "@/modules/notifications/service";
import { NOTIFICATION_OBJECT_TYPES } from "@/modules/notifications/service";

const NOTIFICATIONS_INBOX_PATH = "/notifications";
const FALLBACK_FOOTER =
  "Open Mentor IB to review the full update. Conversation messages are not included in email — open Messages in the app for chat detail.";

export type NotificationEmailPayload = {
  contentTag: string;
  subject: string;
  template: TransactionalEmailProps;
};

type EmailEligibleNotification = {
  bodySummary: string;
  notificationType: NotificationType;
  objectId: string | null;
  objectType: NotificationObjectType;
  title: string;
};

export function isEmailEligibleNotificationType(
  notificationType: NotificationType,
) {
  return NON_EMAIL_NOTIFICATION_TYPES.has(notificationType) === false;
}

const NON_EMAIL_NOTIFICATION_TYPES = new Set<NotificationType>([
  "new_message",
  // `lesson_report_shared` is in-app only this wave; email delivery is
  // explicitly out of scope per `P2-REPORT-001`.
  "lesson_report_shared",
  // `tutor_listing_status_changed` is the tutor-only in-app heads-up for
  // listed↔not_listed transitions; the tutor sees the editor immediately
  // after taking the action, so an email duplicate would be noise.
  "tutor_listing_status_changed",
]);

export function buildNotificationEmailPayload(
  notification: EmailEligibleNotification,
): NotificationEmailPayload | null {
  if (!isEmailEligibleNotificationType(notification.notificationType)) {
    return null;
  }

  const { ctaLabel, ctaPath, ctaContextNote, subject } = resolveEmailDescriptor(
    notification.notificationType,
    notification.objectType,
    notification.objectId,
  );

  return {
    contentTag: notification.notificationType,
    subject,
    template: {
      bodyParagraphs: [notification.bodySummary],
      cta: {
        label: ctaLabel,
        url: buildAbsoluteUrl(ctaPath).toString(),
      },
      ctaContextNote,
      footerNote: FALLBACK_FOOTER,
      preheader: notification.bodySummary.slice(0, 140),
      title: notification.title,
    },
  };
}

type EmailDescriptor = {
  ctaContextNote: string;
  ctaLabel: string;
  ctaPath: string;
  subject: string;
};

function resolveEmailDescriptor(
  notificationType: NotificationType,
  objectType: NotificationObjectType,
  objectId: string | null,
): EmailDescriptor {
  const lessonPath = objectId ? `/lessons/${objectId}` : "/lessons";
  const issueCasePath = objectId
    ? `/lessons?case=${encodeURIComponent(objectId)}`
    : "/lessons";
  const policyReviewPath = objectId
    ? `/privacy?notice=${encodeURIComponent(objectId)}`
    : "/privacy";
  const earningsPath = "/tutor/earnings";

  switch (notificationType) {
    case "lesson_request_submitted":
      return {
        ctaContextNote:
          "Open Mentor IB to review the lesson request. Authorization will release automatically if not accepted in time.",
        ctaLabel: "Open lesson detail",
        ctaPath: lessonPath,
        subject: "Mentor IB · Lesson request update",
      };
    case "lesson_accepted":
      return {
        ctaContextNote:
          "We confirm payment, scheduling, and meeting details only inside Mentor IB.",
        ctaLabel: "Open lesson detail",
        ctaPath: lessonPath,
        subject: "Mentor IB · Lesson confirmed",
      };
    case "lesson_declined":
      return {
        ctaContextNote:
          "Authorization holds are released automatically when a request is declined.",
        ctaLabel: "Open Mentor IB",
        ctaPath: lessonPath,
        subject: "Mentor IB · Lesson request declined",
      };
    case "lesson_request_expired":
      return {
        ctaContextNote:
          "Authorization holds are released automatically when a request expires.",
        ctaLabel: "Open Mentor IB",
        ctaPath: lessonPath,
        subject: "Mentor IB · Lesson request expired",
      };
    case "lesson_updated":
      return {
        ctaContextNote:
          "Schedule, meeting links, and policy outcomes always live in lesson detail.",
        ctaLabel: "Open lesson detail",
        ctaPath: lessonPath,
        subject: "Mentor IB · Lesson update",
      };
    case "upcoming_lesson_reminder":
      return {
        ctaContextNote: "Meeting links and prep notes are inside lesson detail.",
        ctaLabel: "Open lesson detail",
        ctaPath: lessonPath,
        subject: "Mentor IB · Upcoming lesson reminder",
      };
    case "lesson_issue_acknowledgement":
      return {
        ctaContextNote:
          "We will follow up before the counterparty deadline through your lesson detail and notifications.",
        ctaLabel: "Open lessons",
        ctaPath: issueCasePath,
        subject: "Mentor IB · Issue report received",
      };
    case "lesson_issue_resolution":
      return {
        ctaContextNote:
          "Adjustments to billing or payouts appear in your account once the case closes.",
        ctaLabel: "Open lessons",
        ctaPath: issueCasePath,
        subject: "Mentor IB · Lesson issue update",
      };
    case "review_submitted":
      return {
        ctaContextNote:
          "Review activity is reflected on the relevant tutor profile and dashboard.",
        ctaLabel: "Open Mentor IB",
        ctaPath: NOTIFICATIONS_INBOX_PATH,
        subject: "Mentor IB · Review activity",
      };
    case "tutor_application_submitted":
      return {
        ctaContextNote:
          "Application status updates appear in your tutor overview as our team reviews.",
        ctaLabel: "Open tutor overview",
        ctaPath: "/tutor/overview",
        subject: "Mentor IB · Tutor application received",
      };
    case "tutor_application_reviewed":
      return {
        ctaContextNote:
          "Open Mentor IB for the full reviewer notes and any required next steps.",
        ctaLabel: "Open tutor overview",
        ctaPath: "/tutor/overview",
        subject: "Mentor IB · Tutor application update",
      };
    case "payout_processed":
      return {
        ctaContextNote:
          "Payout amounts, holds, and bank details only appear inside Earnings.",
        ctaLabel: "Open Earnings",
        ctaPath: earningsPath,
        subject: "Mentor IB · Payout update",
      };
    case "policy_notice_updated":
      return {
        ctaContextNote:
          "We highlight legal updates after sign-in until you review the latest version.",
        ctaLabel: "Review the update",
        ctaPath:
          objectType === NOTIFICATION_OBJECT_TYPES.policyNoticeVersion
            ? policyReviewPath
            : NOTIFICATIONS_INBOX_PATH,
        subject: "Mentor IB · Policy update",
      };
    case "new_message":
      return {
        ctaContextNote: "Chat content stays in Messages and is never emailed.",
        ctaLabel: "Open Messages",
        ctaPath: "/messages",
        subject: "Mentor IB · Messages",
      };
    case "lesson_report_shared":
      // `lesson_report_shared` is in-app only this wave; the early-return in
      // `buildNotificationEmailPayload` ensures this branch is unreachable,
      // but the switch must stay exhaustive over `NotificationType`.
      return {
        ctaContextNote:
          "Lesson recaps stay inside Mentor IB; open lesson detail to read the recap from your tutor.",
        ctaLabel: "Open lesson detail",
        ctaPath: lessonPath,
        subject: "Mentor IB · Lesson recap shared",
      };
    case "tutor_listing_status_changed":
      // In-app only — the early-return in `buildNotificationEmailPayload`
      // covers this branch, but the switch must stay exhaustive.
      return {
        ctaContextNote:
          "Open Mentor IB to manage your listing publication and readiness.",
        ctaLabel: "Open tutor profile",
        ctaPath: "/tutor/profile",
        subject: "Mentor IB · Listing status update",
      };
  }
}
