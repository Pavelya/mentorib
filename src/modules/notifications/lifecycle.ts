import { formatUtcDateTime } from "@/lib/datetime/format";
import {
  NOTIFICATION_OBJECT_TYPES,
  createNotification,
} from "@/modules/notifications/service";

const SUMMARY_MAX_LENGTH = 240;

type LessonRequestNotificationInput = {
  lessonId: string;
  scheduledStartAt: string;
  studentAppUserId: string;
  studentDisplayName: string | null;
  timezone: string;
  tutorAppUserId: string;
  tutorDisplayName: string | null;
};

export async function createLessonRequestSubmittedNotifications(
  input: LessonRequestNotificationInput,
) {
  const studentLabel = trimOrFallback(input.studentDisplayName, "your student");
  const tutorLabel = trimOrFallback(input.tutorDisplayName, "your tutor");
  const startLabel = formatUtcDateTime(input.scheduledStartAt, {
    timezone: input.timezone,
  });

  await Promise.all([
    createNotification({
      appUserId: input.studentAppUserId,
      bodySummary: truncate(
        `Your lesson request with ${tutorLabel} is awaiting tutor confirmation. We will hold the authorization until they accept or it expires.`,
      ),
      notificationType: "lesson_request_submitted",
      objectId: input.lessonId,
      objectType: NOTIFICATION_OBJECT_TYPES.lesson,
      title: `Lesson request sent for ${startLabel}`,
    }),
    createNotification({
      appUserId: input.tutorAppUserId,
      bodySummary: truncate(
        `${studentLabel} requested a lesson at ${startLabel}. Review the request before it expires so the payment authorization is not released.`,
      ),
      notificationType: "lesson_request_submitted",
      objectId: input.lessonId,
      objectType: NOTIFICATION_OBJECT_TYPES.lesson,
      title: `New lesson request from ${studentLabel}`,
    }),
  ]);
}

type LessonAcceptedNotificationInput = {
  lessonId: string;
  scheduledStartAt: string;
  studentAppUserId: string;
  timezone: string;
  tutorDisplayName: string | null;
};

export async function createLessonAcceptedNotification(
  input: LessonAcceptedNotificationInput,
) {
  const tutorLabel = trimOrFallback(input.tutorDisplayName, "Your tutor");
  const startLabel = formatUtcDateTime(input.scheduledStartAt, {
    timezone: input.timezone,
  });

  return createNotification({
    appUserId: input.studentAppUserId,
    bodySummary: truncate(
      `${tutorLabel} accepted your lesson on ${startLabel}. The hold on your card has been captured for this booking.`,
    ),
    notificationType: "lesson_accepted",
    objectId: input.lessonId,
    objectType: NOTIFICATION_OBJECT_TYPES.lesson,
    title: "Lesson confirmed",
  });
}

type LessonDeclinedNotificationInput = {
  lessonId: string;
  reason: "declined" | "expired";
  scheduledStartAt: string;
  studentAppUserId: string;
  timezone: string;
};

export async function createLessonDeclinedOrExpiredNotification(
  input: LessonDeclinedNotificationInput,
) {
  const startLabel = formatUtcDateTime(input.scheduledStartAt, {
    timezone: input.timezone,
  });

  if (input.reason === "expired") {
    return createNotification({
      appUserId: input.studentAppUserId,
      bodySummary: truncate(
        `Your request for ${startLabel} expired before the tutor responded. The authorization on your card has been released.`,
      ),
      notificationType: "lesson_request_expired",
      objectId: input.lessonId,
      objectType: NOTIFICATION_OBJECT_TYPES.lesson,
      title: "Lesson request expired",
    });
  }

  return createNotification({
    appUserId: input.studentAppUserId,
    bodySummary: truncate(
      `Your request for ${startLabel} was declined. The authorization on your card has been released.`,
    ),
    notificationType: "lesson_declined",
    objectId: input.lessonId,
    objectType: NOTIFICATION_OBJECT_TYPES.lesson,
    title: "Lesson request declined",
  });
}

type LessonUpdatedNotificationInput = {
  appUserIds: readonly string[];
  changeType: "cancelled" | "rescheduled";
  lessonId: string;
  scheduledStartAt: string;
  timezone: string;
};

export async function createLessonUpdatedNotifications(
  input: LessonUpdatedNotificationInput,
) {
  const startLabel = formatUtcDateTime(input.scheduledStartAt, {
    timezone: input.timezone,
  });
  const title =
    input.changeType === "cancelled" ? "Lesson cancelled" : "Lesson rescheduled";
  const summary =
    input.changeType === "cancelled"
      ? `The lesson on ${startLabel} has been cancelled. Any related payment will follow the cancellation policy.`
      : `The lesson previously on ${startLabel} has been rescheduled. Open the lesson detail to confirm the new time.`;

  await Promise.all(
    uniqueAppUserIds(input.appUserIds).map((appUserId) =>
      createNotification({
        appUserId,
        bodySummary: truncate(summary),
        notificationType: "lesson_updated",
        objectId: input.lessonId,
        objectType: NOTIFICATION_OBJECT_TYPES.lesson,
        title,
      }),
    ),
  );
}

type UpcomingLessonReminderInput = {
  appUserId: string;
  lessonId: string;
  scheduledStartAt: string;
  timezone: string;
};

export async function createUpcomingLessonReminderNotification(
  input: UpcomingLessonReminderInput,
) {
  const startLabel = formatUtcDateTime(input.scheduledStartAt, {
    timezone: input.timezone,
  });

  return createNotification({
    appUserId: input.appUserId,
    bodySummary: truncate(
      `Your lesson is coming up on ${startLabel}. Open the lesson detail for the meeting link and prep notes.`,
    ),
    notificationType: "upcoming_lesson_reminder",
    objectId: input.lessonId,
    objectType: NOTIFICATION_OBJECT_TYPES.lesson,
    title: `Lesson reminder · ${startLabel}`,
  });
}

type LessonIssueAcknowledgementInput = {
  appUserId: string;
  caseId: string;
  lessonId: string;
};

export async function createLessonIssueAcknowledgementNotification(
  input: LessonIssueAcknowledgementInput,
) {
  return createNotification({
    appUserId: input.appUserId,
    bodySummary: truncate(
      "We received your lesson issue report. Our team will follow up before the counterparty deadline.",
    ),
    notificationType: "lesson_issue_acknowledgement",
    objectId: input.caseId,
    objectType: NOTIFICATION_OBJECT_TYPES.lessonIssueCase,
    title: "Issue report received",
  });
}

type LessonIssueResolutionInput = {
  appUserIds: readonly string[];
  caseId: string;
  outcome: "dismissed" | "resolved";
};

export async function createLessonIssueResolutionNotifications(
  input: LessonIssueResolutionInput,
) {
  const summary =
    input.outcome === "resolved"
      ? "The lesson issue has been resolved. Any required adjustments will be reflected in your billing or payout summary."
      : "The lesson issue has been closed without further action. Reach out to support if you have new information to share.";

  await Promise.all(
    uniqueAppUserIds(input.appUserIds).map((appUserId) =>
      createNotification({
        appUserId,
        bodySummary: truncate(summary),
        notificationType: "lesson_issue_resolution",
        objectId: input.caseId,
        objectType: NOTIFICATION_OBJECT_TYPES.lessonIssueCase,
        title: "Lesson issue update",
      }),
    ),
  );
}

type PayoutNotificationInput = {
  appUserId: string;
  outcome: "hold" | "ready";
  payoutId: string;
};

export async function createPayoutNotification(input: PayoutNotificationInput) {
  return createNotification({
    appUserId: input.appUserId,
    bodySummary: truncate(
      input.outcome === "ready"
        ? "Your latest payout has been processed and is on its way to your connected payout method."
        : "Your latest payout is on hold while we verify a connected payout requirement. Open Earnings for next steps.",
    ),
    notificationType: "payout_processed",
    objectId: input.payoutId,
    objectType: NOTIFICATION_OBJECT_TYPES.payment,
    title:
      input.outcome === "ready" ? "Payout processed" : "Payout requires action",
  });
}

type PolicyNoticeNotificationInput = {
  appUserId: string;
  policyNoticeVersionId: string;
  summary: string;
  title: string;
};

export async function createPolicyNoticeNotification(
  input: PolicyNoticeNotificationInput,
) {
  return createNotification({
    appUserId: input.appUserId,
    bodySummary: truncate(input.summary),
    notificationType: "policy_notice_updated",
    objectId: input.policyNoticeVersionId,
    objectType: NOTIFICATION_OBJECT_TYPES.policyNoticeVersion,
    title: input.title,
  });
}

function trimOrFallback(value: string | null, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  return trimmed.length === 0 ? fallback : trimmed;
}

function truncate(value: string) {
  if (value.length <= SUMMARY_MAX_LENGTH) {
    return value;
  }

  return `${value.slice(0, SUMMARY_MAX_LENGTH - 1).trimEnd()}…`;
}

function uniqueAppUserIds(values: readonly string[]) {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}
