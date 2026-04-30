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
  buildTutorCancellationPolicy,
  type CancellationPolicyView,
} from "@/modules/lessons/lesson-actions";
import {
  buildPreviewTutorLessonDetail,
  getTutorLessonDetail,
  type TutorLessonDetailDto,
  type TutorLessonIssueDto,
  type TutorLessonMeetingDto,
} from "@/modules/lessons/tutor-lessons";

import {
  ISSUE_CASE_LABELS,
  ISSUE_TYPE_LABELS,
  MEETING_ACCESS_HINTS,
  MEETING_METHOD_LABELS,
  mapLessonStatusToSummary,
} from "../lesson-presentation";
import {
  CancelLessonForm,
  ReportIssueForm,
  RequestDecisionForms,
  TUTOR_ISSUE_TYPE_OPTIONS,
} from "./lesson-actions-client";
import styles from "./lesson-detail.module.css";

const LESSONS_BASE_PATH = "/tutor/lessons" as const;

type LessonDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TutorLessonDetailPage({
  params,
}: LessonDetailPageProps) {
  const { id } = await params;
  const timezone = await getCurrentUserTimezone();
  const detailHref = `${LESSONS_BASE_PATH}/${id}`;

  if (!isSupabaseAuthConfigured()) {
    return renderDetailPage({
      detail: buildPreviewTutorLessonDetail(),
      previewNotice: true,
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
            We could not load your account context. Refresh the page or sign in
            again to continue.
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
        <p>This account cannot view tutor lessons right now.</p>
      </InlineNotice>
    );
  }

  if (!hasRole(account, "tutor")) {
    redirect(buildPostSignInRedirect(account, detailHref) as Route);
  }

  const detail = await getTutorLessonDetail(account, id);

  if (!detail) {
    notFound();
  }

  return renderDetailPage({ detail, previewNotice: false, timezone });
}

function renderDetailPage({
  detail,
  previewNotice,
  timezone,
}: {
  detail: TutorLessonDetailDto;
  previewNotice: boolean;
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
  const cancellationPolicy = buildTutorCancellationPolicy({
    cancelled_at: null,
    lesson_status: detail.lessonStatus,
    scheduled_start_at: detail.schedule.startAt,
  });
  const isPending = detail.lessonStatus === "pending";

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
            Live lesson data connects once Supabase auth is configured. The
            shared shell below previews the tutor lesson detail surface.
          </p>
        </InlineNotice>
      ) : null}

      <p className={styles.backLink}>
        <Link href={LESSONS_BASE_PATH as Route}>← Back to lessons</Link>
      </p>

      <LessonSummary
        details={buildLessonDetails(detail)}
        label="Lesson detail"
        person={
          <PersonSummary
            avatarSrc={detail.student.avatarUrl ?? undefined}
            descriptor={`Student timezone: ${getTimezoneLabel(detail.student.timezone)}`}
            eyebrow="Student"
            name={detail.student.displayName}
            variant="standard"
          />
        }
        schedule={scheduleLabel}
        status={mapLessonStatusToSummary(detail.lessonStatus)}
        timezone={timezoneLabel}
        title={focusLabel ? `${subjectLabel} · ${focusLabel}` : subjectLabel}
      />

      <ContextSection detail={detail} timezone={timezone} />

      {isPending ? (
        <RequestDecisionSection
          lessonId={detail.id}
          previewNotice={previewNotice}
        />
      ) : null}

      <MeetingAccessSection meeting={detail.meeting} />

      <CancellationSection
        lessonId={detail.id}
        policy={cancellationPolicy}
        previewNotice={previewNotice}
      />

      <IssueSection detail={detail} previewNotice={previewNotice} />
    </article>
  );
}

function ContextSection({
  detail,
  timezone,
}: {
  detail: TutorLessonDetailDto;
  timezone: string;
}) {
  const chips = [
    detail.context.subject ? { label: detail.context.subject.label, tone: "info" as const } : null,
    detail.context.focus ? { label: detail.context.focus.label, tone: "trust" as const } : null,
    detail.schedule.isTrial ? { label: "Trial lesson", tone: "support" as const } : null,
  ].filter((value): value is { label: string; tone: "info" | "trust" | "support" } => value !== null);

  const expiresLabel = formatUtcDateTime(detail.requestExpiresAt, { timezone });
  const showExpiry = detail.lessonStatus === "pending";

  return (
    <Panel eyebrow="Lesson context" title="Subject and request" tone="soft">
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

        {showExpiry ? (
          <p className={styles.bodyText}>Request expires · {expiresLabel}</p>
        ) : null}

        <p className={styles.bodyText}>Lesson fee · {detail.schedule.priceLabel}</p>

        {detail.context.note ? (
          <Section
            density="compact"
            divider="top"
            eyebrow="Student note"
          >
            <p className={styles.noteText}>{detail.context.note}</p>
          </Section>
        ) : null}
      </Section>
    </Panel>
  );
}

function RequestDecisionSection({
  lessonId,
  previewNotice,
}: {
  lessonId: string;
  previewNotice: boolean;
}) {
  return (
    <Panel eyebrow="Pending request" title="Accept or decline this request">
      <Section density="compact">
        <p className={styles.bodyText}>
          Accepting captures the student&apos;s payment authorization. Declining
          releases the authorization without charging the student.
        </p>

        {previewNotice ? (
          <InlineNotice title="Decision preview" tone="info">
            <p>
              Live accept and decline connect once Supabase auth and Stripe are
              configured.
            </p>
          </InlineNotice>
        ) : (
          <RequestDecisionForms
            acceptOperationKey={`lesson-accept:${lessonId}:${randomUUID()}`}
            declineOperationKey={`lesson-decline:${lessonId}:${randomUUID()}`}
            lessonId={lessonId}
          />
        )}
      </Section>
    </Panel>
  );
}

function MeetingAccessSection({
  meeting,
}: {
  meeting: TutorLessonMeetingDto | null;
}) {
  if (!meeting) {
    return (
      <Panel eyebrow="Meeting access" title="Meeting link">
        <p className={styles.bodyText}>
          Add a meeting link from your tutor schedule before the lesson starts so
          the student can join.
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

        {meeting.normalizedHost ? (
          <p className={styles.bodyText}>
            Provider host: <strong>{meeting.normalizedHost}</strong>
          </p>
        ) : null}
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
              Cancellation respects the platform policy. Cancelling a confirmed
              lesson refunds the student in full and records a reliability event
              against your account. Live cancellation connects once Supabase
              auth and Stripe are configured.
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

function cancellationOutcomeLabel(policy: CancellationPolicyView) {
  switch (policy.outcome) {
    case "authorization_released":
      return "Authorization released";
    case "refund_issued":
      return "Student refunded";
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
      return "warning";
    case "no_refund":
      return "warning";
  }
}

function IssueSection({
  detail,
  previewNotice,
}: {
  detail: TutorLessonDetailDto;
  previewNotice: boolean;
}) {
  const { issue, isIssueEntryEligible } = detail;

  return (
    <Panel eyebrow="Lesson issues" title="Report a problem">
      <Section density="compact">
        {issue ? <IssueStatus issue={issue} /> : null}

        {!isIssueEntryEligible ? (
          <p className={styles.bodyText}>
            Issue reporting opens after you accept a request and stays available
            through the 24-hour window after the lesson ends. Use this surface —
            not the chat thread — when something goes wrong with a session.
          </p>
        ) : previewNotice ? (
          <InlineNotice tone="info" title="Issue reporting preview">
            <p>
              Structured lesson-issue reporting connects once Supabase auth is
              configured. Pick from student absent, wrong meeting link,
              technical problem, or partial delivery.
            </p>
          </InlineNotice>
        ) : (
          <ReportIssueForm
            allowedIssueTypes={TUTOR_ISSUE_TYPE_OPTIONS}
            lessonId={detail.id}
          />
        )}
      </Section>
    </Panel>
  );
}

function IssueStatus({ issue }: { issue: TutorLessonIssueDto }) {
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

function buildLessonDetails(detail: TutorLessonDetailDto): string[] {
  const details: string[] = [];

  if (detail.schedule.isTrial) {
    details.push("Trial lesson");
  }

  details.push(`Lesson fee · ${detail.schedule.priceLabel}`);
  details.push(MEETING_METHOD_LABELS[detail.meeting?.meetingMethod ?? "external_video_call"]);

  return details;
}
