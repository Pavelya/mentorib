import { randomUUID } from "node:crypto";

import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";

import { LessonSummary, PersonSummary } from "@/components/continuity";
import { TimezoneNotice } from "@/components/datetime";
import {
  Chip,
  InlineNotice,
  Panel,
  Section,
  StatusBadge,
  getButtonClassName,
} from "@/components/ui";
import {
  buildPostSignInRedirect,
  ensureAuthAccount,
} from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import {
  formatUtcDateTime,
  formatUtcLessonRange,
  getTimezoneLabel,
} from "@/lib/datetime";
import { getCurrentUserTimezone } from "@/lib/datetime/server";
import { routeFamilies } from "@/lib/routing/route-families";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  hasRole,
  isRestrictedAccount,
  requiresRoleSelection,
} from "@/modules/accounts/account-state";
import {
  buildLessonCalendarLinks,
  type LessonCalendarSnapshot,
} from "@/modules/lessons/calendar";
import {
  buildStudentCancellationPolicy,
  type CancellationPolicyView,
} from "@/modules/lessons/lesson-actions";
import type { StudentLessonReportDto } from "@/modules/lessons/lesson-reports";
import {
  buildPreviewStudentLessonDetail,
  getStudentLessonDetail,
  type StudentLessonDetailDto,
  type StudentLessonIssueDto,
  type StudentLessonMeetingDto,
} from "@/modules/lessons/student-lessons";
import {
  getReviewEligibilityForStudentLesson,
  REVIEW_MAX_RATING,
  type LessonReviewEligibilityDto,
  type ReviewSummaryDto,
} from "@/modules/reviews";

import {
  ISSUE_CASE_LABELS,
  ISSUE_TYPE_LABELS,
  MEETING_ACCESS_HINTS,
  MEETING_METHOD_LABELS,
  mapLessonStatusToSummary,
} from "../lesson-presentation";
import {
  AcknowledgeLessonReportForm,
  CancelLessonForm,
  ReportIssueForm,
  RescheduleLessonForm,
  STUDENT_ISSUE_TYPE_OPTIONS,
  SubmitTutorReviewForm,
} from "./lesson-actions-client";
import styles from "./lesson-detail.module.css";

const LESSONS_BASE_PATH = "/lessons" as const;

type LessonDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudentLessonDetailPage({
  params,
}: LessonDetailPageProps) {
  const { id } = await params;
  const timezone = await getCurrentUserTimezone();
  const detailHref = `${LESSONS_BASE_PATH}/${id}`;

  if (!isSupabaseAuthConfigured()) {
    return renderDetailPage({
      detail: buildPreviewStudentLessonDetail(),
      previewNotice: true,
      reviewEligibility: { status: "ineligible", reason: "Live review capture connects once Supabase auth is configured." },
      timezone,
    });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(detailHref) as Route);
  }

  let account: Awaited<ReturnType<typeof ensureAuthAccount>> | null = null;

  try {
    account = await ensureAuthAccount(user);
  } catch {
    account = null;
  }

  if (!account) {
    return (
      <article className={styles.page}>
        <InlineNotice title="Lesson unavailable" tone="warning">
          <p>
            We could not load your account context. Refresh the page or sign in again to
            continue.
          </p>
        </InlineNotice>
      </article>
    );
  }

  if (requiresRoleSelection(account)) {
    redirect(routeFamilies.setup.defaultHref);
  }

  if (isRestrictedAccount(account)) {
    return (
      <InlineNotice title="Account access limited" tone="warning">
        <p>This account cannot view lessons right now.</p>
      </InlineNotice>
    );
  }

  if (!hasRole(account, "student")) {
    redirect(buildPostSignInRedirect(account, detailHref) as Route);
  }

  const detail = await getStudentLessonDetail(account, id);

  if (!detail) {
    notFound();
  }

  const reviewEligibility = await getReviewEligibilityForStudentLesson(
    account,
    detail.id,
  );

  return renderDetailPage({
    detail,
    previewNotice: false,
    reviewEligibility,
    timezone,
  });
}

function renderDetailPage({
  detail,
  previewNotice,
  reviewEligibility,
  timezone,
}: {
  detail: StudentLessonDetailDto;
  previewNotice: boolean;
  reviewEligibility: LessonReviewEligibilityDto;
  timezone: string;
}) {
  const subjectLabel = detail.context.subject?.label ?? "Mentor IB lesson";
  const focusLabel = detail.context.focus?.label ?? null;
  const scheduleLabel = formatUtcLessonRange(
    detail.schedule.startAt,
    detail.schedule.endAt,
    timezone,
  );
  const timezoneLabel = getTimezoneLabel(timezone);
  const calendarSnapshot: LessonCalendarSnapshot = {
    endAtUtc: detail.schedule.endAt,
    focusLabel,
    joinUrl: detail.meeting?.meetingUrl ?? null,
    lessonId: detail.id,
    startAtUtc: detail.schedule.startAt,
    subjectLabel,
  };
  const calendarLinks = buildLessonCalendarLinks(calendarSnapshot);
  const cancellationPolicy = buildStudentCancellationPolicy({
    cancelled_at: null,
    lesson_status: detail.lessonStatus,
    scheduled_start_at: detail.schedule.startAt,
  });

  return (
    <article className={styles.page}>
      <TimezoneNotice timezone={timezone} />

      {previewNotice ? (
        <InlineNotice
          className={styles.notice}
          title="Lesson preview"
          tone="info"
        >
          <p>
            Live lesson data connects once Supabase auth is configured. The shared shell
            below previews the lesson detail surface.
          </p>
        </InlineNotice>
      ) : null}

      <p className={styles.backLink}>
        <Link href={LESSONS_BASE_PATH as Route}>← Back to lessons</Link>
      </p>

      <LessonSummary
        action={
          detail.tutor.profileHref ? (
            <Link
              className={getButtonClassName({ size: "compact", variant: "secondary" })}
              href={detail.tutor.profileHref}
            >
              View tutor profile
            </Link>
          ) : null
        }
        details={buildLessonDetails(detail)}
        label="Lesson detail"
        person={
          <PersonSummary
            avatarSrc={detail.tutor.avatarUrl ?? undefined}
            descriptor={detail.tutor.headline ?? detail.tutor.bio ?? "Mentor IB tutor"}
            eyebrow="Tutor"
            name={detail.tutor.displayName}
            variant="standard"
          />
        }
        schedule={scheduleLabel}
        status={mapLessonStatusToSummary(detail.lessonStatus)}
        timezone={timezoneLabel}
        title={focusLabel ? `${subjectLabel} · ${focusLabel}` : subjectLabel}
      />

      <ContextSection detail={detail} />

      <MeetingAccessSection meeting={detail.meeting} />

      <CalendarSection
        googleCalendarUrl={calendarLinks.googleCalendarUrl}
        icsHref={calendarLinks.icsHref}
        previewNotice={previewNotice}
      />

      <CancellationSection
        lessonId={detail.id}
        policy={cancellationPolicy}
        previewNotice={previewNotice}
      />

      <RescheduleSection
        lessonId={detail.id}
        policy={cancellationPolicy}
        previewNotice={previewNotice}
        rebookHref={resolveRebookHref(detail)}
      />

      <IssueSection
        detail={detail}
        previewNotice={previewNotice}
      />

      <ReportSection
        lessonId={detail.id}
        previewNotice={previewNotice}
        report={detail.report}
      />

      <ReviewSection
        detail={detail}
        eligibility={reviewEligibility}
        previewNotice={previewNotice}
      />
    </article>
  );
}

function ReportSection({
  lessonId,
  previewNotice,
  report,
}: {
  lessonId: string;
  previewNotice: boolean;
  report: StudentLessonReportDto | null;
}) {
  if (previewNotice || !report) {
    return null;
  }

  const { content } = report;

  return (
    <Panel eyebrow="Lesson recap" title="Lesson recap from your tutor">
      <Section density="compact">
        <p className={styles.bodyText}>
          Your tutor shared this recap after the lesson. It builds on what you
          worked on together and points to recommended next steps.
        </p>

        {content.goalSummary ? (
          <Section density="compact" divider="top" eyebrow="Lesson goal">
            <p className={styles.noteText}>{content.goalSummary}</p>
          </Section>
        ) : null}

        {content.coverageSummary ? (
          <Section density="compact" divider="top" eyebrow="What we covered">
            <p className={styles.noteText}>{content.coverageSummary}</p>
          </Section>
        ) : null}

        {content.studentConfidenceSignal ? (
          <Section
            density="compact"
            divider="top"
            eyebrow="Confidence and understanding"
          >
            <p className={styles.noteText}>
              {content.studentConfidenceSignal}
            </p>
          </Section>
        ) : null}

        {content.nextStepsSummary ? (
          <Section density="compact" divider="top" eyebrow="Next steps">
            <p className={styles.noteText}>{content.nextStepsSummary}</p>
          </Section>
        ) : null}

        {report.reportStatus === "acknowledged" ? (
          <Section density="compact" divider="top">
            <StatusBadge tone="positive">Recap acknowledged</StatusBadge>
          </Section>
        ) : report.isEligibleToAcknowledge ? (
          <Section density="compact" divider="top">
            <AcknowledgeLessonReportForm lessonId={lessonId} />
          </Section>
        ) : null}
      </Section>
    </Panel>
  );
}

function ReviewSection({
  detail,
  eligibility,
  previewNotice,
}: {
  detail: StudentLessonDetailDto;
  eligibility: LessonReviewEligibilityDto;
  previewNotice: boolean;
}) {
  return (
    <Panel eyebrow="Lesson review" title="Tell other students what worked">
      <Section density="compact">
        {previewNotice ? (
          <InlineNotice tone="info" title="Review preview">
            <p>
              Students can publish a star rating and a short, lesson-grounded
              comment after the lesson is marked completed. Live review capture
              connects once Supabase auth is configured.
            </p>
          </InlineNotice>
        ) : eligibility.status === "already_submitted" ? (
          <ExistingReviewSummary review={eligibility.existingReview} />
        ) : eligibility.status === "ineligible" ? (
          <p className={styles.bodyText}>{eligibility.reason}</p>
        ) : (
          <SubmitTutorReviewForm
            lessonId={detail.id}
            tutorDisplayName={detail.tutor.displayName}
          />
        )}
      </Section>
    </Panel>
  );
}

function ExistingReviewSummary({ review }: { review: ReviewSummaryDto }) {
  const filledStars = "★".repeat(review.ratingValue);
  const emptyStars = "☆".repeat(Math.max(0, REVIEW_MAX_RATING - review.ratingValue));

  return (
    <div className={styles.reviewSummary}>
      <div className={styles.reviewSummaryHeader}>
        <StatusBadge tone="positive">Review published</StatusBadge>
        <span
          aria-label={`Rated ${review.ratingValue} out of ${REVIEW_MAX_RATING}`}
          className={styles.reviewStarsInline}
        >
          <span aria-hidden="true">
            {filledStars}
            <span style={{ color: "var(--color-border-strong)" }}>{emptyStars}</span>
          </span>
        </span>
      </div>
      {review.comment ? (
        <p className={styles.noteText}>{review.comment}</p>
      ) : (
        <p className={styles.bodyText}>
          You published a {review.ratingValue}-star rating without a comment.
        </p>
      )}
    </div>
  );
}

function ContextSection({ detail }: { detail: StudentLessonDetailDto }) {
  const chips = [
    detail.context.subject ? { label: detail.context.subject.label, tone: "info" as const } : null,
    detail.context.focus ? { label: detail.context.focus.label, tone: "trust" as const } : null,
    detail.schedule.isTrial ? { label: "Trial lesson", tone: "support" as const } : null,
  ].filter((value): value is { label: string; tone: "info" | "trust" | "support" } => value !== null);

  return (
    <Panel
      eyebrow="Lesson context"
      title="Subject and request"
      tone="soft"
    >
      <Section density="compact">
        {chips.length > 0 ? (
          <ul className={styles.chipRow}>
            {chips.map((chip) => (
              <li key={chip.label}>
                <Chip tone={chip.tone}>{chip.label}</Chip>
              </li>
            ))}
          </ul>
        ) : null}

        {detail.context.note ? (
          <Section
            density="compact"
            divider="top"
            eyebrow="Your note to the tutor"
          >
            <p className={styles.noteText}>{detail.context.note}</p>
          </Section>
        ) : null}
      </Section>
    </Panel>
  );
}

function MeetingAccessSection({
  meeting,
}: {
  meeting: StudentLessonMeetingDto | null;
}) {
  if (!meeting) {
    return (
      <Panel eyebrow="Meeting access" title="Meeting link">
        <p className={styles.bodyText}>
          Your tutor will share a meeting link from this lesson before the session
          starts.
        </p>
      </Panel>
    );
  }

  const methodLabel = MEETING_METHOD_LABELS[meeting.meetingMethod];
  const accessHint = MEETING_ACCESS_HINTS[meeting.accessStatus];
  const accessTone = meeting.accessStatus === "ready" ? "positive" : "warning";

  return (
    <Panel eyebrow="Meeting access" title={meeting.displayLabel ?? methodLabel}>
      <Section density="compact">
        <div className={styles.meetingHeader}>
          <StatusBadge tone={accessTone}>{accessHint}</StatusBadge>
          {meeting.provider ? <Chip tone="info">{meeting.provider}</Chip> : null}
        </div>

        {meeting.meetingUrl ? (
          <a
            className={getButtonClassName({ variant: "primary" })}
            href={meeting.meetingUrl}
            rel="noreferrer noopener"
            target="_blank"
          >
            Join meeting
          </a>
        ) : null}

        {!meeting.meetingUrl && meeting.normalizedHost ? (
          <p className={styles.bodyText}>
            Provider host: <strong>{meeting.normalizedHost}</strong>
          </p>
        ) : null}
      </Section>
    </Panel>
  );
}

function CalendarSection({
  googleCalendarUrl,
  icsHref,
  previewNotice,
}: {
  googleCalendarUrl: string;
  icsHref: string;
  previewNotice: boolean;
}) {
  return (
    <Panel eyebrow="Add to calendar" title="Keep this lesson visible">
      <Section density="compact">
        <p className={styles.bodyText}>
          Add this lesson to the calendar you already use. The export reflects the
          lesson snapshot in UTC and includes the join link when one is ready.
        </p>

        <div className={styles.actionRow}>
          <a
            className={getButtonClassName({ size: "compact", variant: "secondary" })}
            href={googleCalendarUrl}
            rel="noreferrer noopener"
            target="_blank"
          >
            Add to Google Calendar
          </a>
          {previewNotice ? (
            <span className={getButtonClassName({ size: "compact", variant: "ghost" })} aria-disabled>
              Download .ics (preview)
            </span>
          ) : (
            <a
              className={getButtonClassName({ size: "compact", variant: "ghost" })}
              href={icsHref}
            >
              Download .ics
            </a>
          )}
        </div>
      </Section>
    </Panel>
  );
}

function CancellationSection({
  lessonId,
  policy,
  previewNotice,
}: {
  lessonId: string;
  policy: CancellationPolicyView;
  previewNotice: boolean;
}) {
  if (!policy.cancellable) {
    return (
      <Panel eyebrow="Cancellation" title="Cancellation closed">
        <p className={styles.bodyText}>{policy.reason}</p>
      </Panel>
    );
  }

  const outcomeLabel = cancellationOutcomeLabel(policy);
  const outcomeTone = cancellationOutcomeTone(policy);

  return (
    <Panel eyebrow="Cancellation" title="Cancel this lesson">
      <Section density="compact">
        {previewNotice ? (
          <InlineNotice tone="info" title="Cancellation preview">
            <p>
              Cancellation respects the platform policy: full refund 2+ hours before
              start, no refund inside that window. Live cancellation connects once
              Supabase auth and Stripe are configured.
            </p>
          </InlineNotice>
        ) : (
          <CancelLessonForm
            cancelOperationKey={`lesson-cancel:${lessonId}:${randomUUID()}`}
            lessonId={lessonId}
            outcomeLabel={outcomeLabel}
            outcomeReason={policy.reason}
            outcomeTone={outcomeTone}
          />
        )}
      </Section>
    </Panel>
  );
}

function RescheduleSection({
  lessonId,
  policy,
  previewNotice,
  rebookHref,
}: {
  lessonId: string;
  policy: CancellationPolicyView;
  previewNotice: boolean;
  rebookHref: string;
}) {
  if (!policy.cancellable) {
    return null;
  }

  const outcomeLabel = cancellationOutcomeLabel(policy);

  return (
    <Panel eyebrow="Reschedule" title="Move this lesson to a new time">
      <Section density="compact">
        <p className={styles.bodyText}>
          A reschedule is treated as cancelling this lesson plus a new booking
          request. The same cancellation policy applies to the original lesson.
        </p>

        {previewNotice ? (
          <InlineNotice tone="info" title="Reschedule preview">
            <p>
              Reschedule connects once Supabase auth and Stripe are configured. The
              flow cancels this lesson under the platform policy and routes you to a
              new booking surface with the same tutor when possible.
            </p>
          </InlineNotice>
        ) : (
          <RescheduleLessonForm
            lessonId={lessonId}
            outcomeLabel={outcomeLabel}
            rebookHref={rebookHref}
            rescheduleOperationKey={`lesson-cancel:${lessonId}:${randomUUID()}`}
          />
        )}
      </Section>
    </Panel>
  );
}

function resolveRebookHref(detail: StudentLessonDetailDto) {
  if (detail.tutor.profileHref?.startsWith("/tutors/")) {
    const slug = detail.tutor.profileHref.slice("/tutors/".length);

    if (slug.length > 0 && /^[a-z0-9-]+$/.test(slug)) {
      return `/book/${slug}`;
    }
  }

  return "/match";
}

function cancellationOutcomeLabel(policy: CancellationPolicyView) {
  switch (policy.outcome) {
    case "authorization_released":
      return "Authorization released";
    case "refund_issued":
      return "Full refund";
    case "no_refund":
      return "No refund";
  }
}

function cancellationOutcomeTone(
  policy: CancellationPolicyView,
): "positive" | "info" | "warning" {
  switch (policy.outcome) {
    case "authorization_released":
      return "info";
    case "refund_issued":
      return "positive";
    case "no_refund":
      return "warning";
  }
}

function IssueSection({
  detail,
  previewNotice,
}: {
  detail: StudentLessonDetailDto;
  previewNotice: boolean;
}) {
  const { issue, isIssueEntryEligible } = detail;

  return (
    <Panel eyebrow="Lesson issues" title="Report a problem">
      <Section density="compact">
        {issue ? <IssueStatus issue={issue} /> : null}

        {!isIssueEntryEligible ? (
          <p className={styles.bodyText}>
            Issue reporting opens after the tutor accepts and stays available through
            the 24-hour window after the lesson ends. Use this surface — not the chat
            thread — when something goes wrong with a session.
          </p>
        ) : previewNotice ? (
          <InlineNotice tone="info" title="Issue reporting preview">
            <p>
              Structured lesson-issue reporting connects once Supabase auth is
              configured. Pick from tutor absent, student absent, wrong meeting link,
              technical problem, or partial delivery.
            </p>
          </InlineNotice>
        ) : (
          <ReportIssueForm
            allowedIssueTypes={STUDENT_ISSUE_TYPE_OPTIONS}
            lessonId={detail.id}
          />
        )}
      </Section>
    </Panel>
  );
}

function IssueStatus({ issue }: { issue: StudentLessonIssueDto }) {
  const tone =
    issue.caseStatus === "resolved"
      ? "positive"
      : issue.caseStatus === "dismissed"
      ? "info"
      : "warning";
  const reportedLabel = formatUtcDateTime(issue.reportedAt, {
    timezone: undefined,
  });

  return (
    <div className={styles.issueStatus}>
      <div className={styles.issueHeader}>
        <StatusBadge tone={tone}>Issue · {ISSUE_CASE_LABELS[issue.caseStatus]}</StatusBadge>
        <Chip tone="info">{ISSUE_TYPE_LABELS[issue.issueType]}</Chip>
      </div>
      <p className={styles.bodyText}>
        {issue.reportedByCurrentActor ? "You reported this issue" : "Issue logged"} on
        {" "}
        {reportedLabel}.
      </p>
    </div>
  );
}

function buildLessonDetails(detail: StudentLessonDetailDto): string[] {
  const details: string[] = [];

  if (detail.schedule.isTrial) {
    details.push("Trial lesson");
  }

  details.push(`Lesson fee · ${detail.schedule.priceLabel}`);
  details.push(MEETING_METHOD_LABELS[detail.meeting?.meetingMethod ?? "external_video_call"]);

  return details;
}
