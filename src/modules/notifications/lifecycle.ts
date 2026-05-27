import { formatUtcDateTime } from "@/lib/datetime/format";
import { logEmailEvent } from "@/lib/email/logging";

import { scheduleNotificationEmailDelivery } from "@/modules/notifications/email-delivery";
import {
  NOTIFICATION_OBJECT_TYPES,
  createNotification,
} from "@/modules/notifications/service";

type CreatedNotification = Awaited<ReturnType<typeof createNotification>>;

async function dispatchNotificationEmail(notification: CreatedNotification) {
  if (!notification) {
    return;
  }

  try {
    await scheduleNotificationEmailDelivery({ notification });
  } catch (error) {
    logEmailEvent("error", "notification_email_schedule_failed", {
      error_message:
        error instanceof Error ? error.message : "Unknown scheduling error",
      notification_id: notification.id,
      notification_type: notification.notification_type,
    });
  }
}

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

  const created = await Promise.all([
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

  await Promise.all(created.map(dispatchNotificationEmail));
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

  const notification = await createNotification({
    appUserId: input.studentAppUserId,
    bodySummary: truncate(
      `${tutorLabel} accepted your lesson on ${startLabel}. The hold on your card has been captured for this booking.`,
    ),
    notificationType: "lesson_accepted",
    objectId: input.lessonId,
    objectType: NOTIFICATION_OBJECT_TYPES.lesson,
    title: "Lesson confirmed",
  });

  await dispatchNotificationEmail(notification);

  return notification;
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

  const notification =
    input.reason === "expired"
      ? await createNotification({
          appUserId: input.studentAppUserId,
          bodySummary: truncate(
            `Your request for ${startLabel} expired before the tutor responded. The authorization on your card has been released.`,
          ),
          notificationType: "lesson_request_expired",
          objectId: input.lessonId,
          objectType: NOTIFICATION_OBJECT_TYPES.lesson,
          title: "Lesson request expired",
        })
      : await createNotification({
          appUserId: input.studentAppUserId,
          bodySummary: truncate(
            `Your request for ${startLabel} was declined. The authorization on your card has been released.`,
          ),
          notificationType: "lesson_declined",
          objectId: input.lessonId,
          objectType: NOTIFICATION_OBJECT_TYPES.lesson,
          title: "Lesson request declined",
        });

  await dispatchNotificationEmail(notification);

  return notification;
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

  const created = await Promise.all(
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

  await Promise.all(created.map(dispatchNotificationEmail));
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

  const notification = await createNotification({
    appUserId: input.appUserId,
    bodySummary: truncate(
      `Your lesson is coming up on ${startLabel}. Open the lesson detail for the meeting link and prep notes.`,
    ),
    notificationType: "upcoming_lesson_reminder",
    objectId: input.lessonId,
    objectType: NOTIFICATION_OBJECT_TYPES.lesson,
    title: `Lesson reminder · ${startLabel}`,
  });

  await dispatchNotificationEmail(notification);

  return notification;
}

type LessonIssueAcknowledgementInput = {
  appUserId: string;
  caseId: string;
  lessonId: string;
};

export async function createLessonIssueAcknowledgementNotification(
  input: LessonIssueAcknowledgementInput,
) {
  const notification = await createNotification({
    appUserId: input.appUserId,
    bodySummary: truncate(
      "We received your lesson issue report. Our team will follow up before the counterparty deadline.",
    ),
    notificationType: "lesson_issue_acknowledgement",
    objectId: input.caseId,
    objectType: NOTIFICATION_OBJECT_TYPES.lessonIssueCase,
    title: "Issue report received",
  });

  await dispatchNotificationEmail(notification);

  return notification;
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

  const created = await Promise.all(
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

  await Promise.all(created.map(dispatchNotificationEmail));
}

type LessonReportSharedInput = {
  lessonId: string;
  studentAppUserId: string;
  tutorDisplayName: string | null;
};

export async function createLessonReportSharedNotification(
  input: LessonReportSharedInput,
) {
  const tutorLabel = trimOrFallback(input.tutorDisplayName, "Your tutor");

  const notification = await createNotification({
    appUserId: input.studentAppUserId,
    bodySummary: truncate(
      `${tutorLabel} shared a lesson recap with you. Open the lesson detail to read the goal, what was covered, and recommended next steps.`,
    ),
    notificationType: "lesson_report_shared",
    objectId: input.lessonId,
    objectType: NOTIFICATION_OBJECT_TYPES.lesson,
    title: "Lesson recap shared",
  });

  // `lesson_report_shared` is in-app only this wave; email dispatch is
  // intentionally suppressed by `isEmailEligibleNotificationType`. The shared
  // dispatch helper below will short-circuit safely.
  await dispatchNotificationEmail(notification);

  return notification;
}

type PayoutNotificationInput = {
  appUserId: string;
  outcome: "hold" | "ready";
  payoutId: string;
};

export async function createPayoutNotification(input: PayoutNotificationInput) {
  const notification = await createNotification({
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

  await dispatchNotificationEmail(notification);

  return notification;
}

type TutorListingStatusChangeReason =
  | "self"
  | "gate_regression"
  | "admin_takedown";

type TutorListingStatusChangedInput = {
  appUserId: string;
  missingGateKeys?: readonly string[];
  publicListingStatus: "listed" | "not_listed" | "delisted";
  reason: TutorListingStatusChangeReason;
  tutorProfileId: string;
};

export async function createTutorListingStatusChangedNotification(
  input: TutorListingStatusChangedInput,
) {
  const title =
    input.reason === "admin_takedown"
      ? "Your public listing was removed"
      : input.publicListingStatus === "listed"
        ? "Your public listing is live"
        : input.reason === "gate_regression"
          ? "Your public listing was paused"
          : "Listing paused";

  const summary =
    input.reason === "admin_takedown"
      ? "Your profile has been removed from public listing — check notifications for details. Contact support if you need more context."
      : input.publicListingStatus === "listed"
        ? "Your tutor profile is now discoverable to students. You can pause it any time from /tutor/profile."
        : input.reason === "gate_regression"
          ? `A readiness step needs your attention, so your public listing has been paused. Open /tutor/profile to finish the remaining steps${
              input.missingGateKeys && input.missingGateKeys.length > 0
                ? ` (${input.missingGateKeys.join(", ")})`
                : ""
            }.`
          : "You paused your public listing. Resume it from /tutor/profile whenever you're ready.";

  const notification = await createNotification({
    appUserId: input.appUserId,
    bodySummary: truncate(summary),
    notificationType: "tutor_listing_status_changed",
    objectId: input.tutorProfileId,
    objectType: NOTIFICATION_OBJECT_TYPES.tutorProfile,
    title,
  });

  // `tutor_listing_status_changed` is in-app only; the email-mapping module
  // short-circuits delivery for this type.
  await dispatchNotificationEmail(notification);

  return notification;
}

type ModerationReportAcknowledgementInput = {
  reporterAppUserId: string;
  caseId: string;
  resolutionKind: "upheld" | "rejected";
};

// Generic in-app heads-up to a reporter once their report case has been
// resolved. The payload intentionally carries no details about the
// resolved party, internal notes, or reviewer identity — per
// `P2-OPS-001` §8.3/§15.
export async function createModerationReportAcknowledgementNotification(
  input: ModerationReportAcknowledgementInput,
) {
  const title = "Your report was reviewed";
  const summary =
    input.resolutionKind === "upheld"
      ? "Thanks for flagging this. Our team reviewed your report and acted on it. We can't share details about the other person involved."
      : "Thanks for flagging this. Our team reviewed your report and decided no further action was needed at this time.";

  const notification = await createNotification({
    appUserId: input.reporterAppUserId,
    bodySummary: truncate(summary),
    notificationType: "moderation_report_acknowledgement",
    objectId: input.caseId,
    objectType: NOTIFICATION_OBJECT_TYPES.moderationCase,
    title,
  });

  // `moderation_report_acknowledgement` is in-app only; the email-mapping
  // module short-circuits delivery for this type.
  await dispatchNotificationEmail(notification);

  return notification;
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
  const notification = await createNotification({
    appUserId: input.appUserId,
    bodySummary: truncate(input.summary),
    notificationType: "policy_notice_updated",
    objectId: input.policyNoticeVersionId,
    objectType: NOTIFICATION_OBJECT_TYPES.policyNoticeVersion,
    title: input.title,
  });

  await dispatchNotificationEmail(notification);

  return notification;
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
