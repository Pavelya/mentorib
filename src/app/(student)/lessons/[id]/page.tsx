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
  buildPreviewStudentLessonDetail,
  getStudentLessonDetail,
  type StudentLessonDetailDto,
  type StudentLessonIssueDto,
  type StudentLessonMeetingDto,
} from "@/modules/lessons/student-lessons";

import {
  ISSUE_CASE_LABELS,
  ISSUE_TYPE_LABELS,
  MEETING_ACCESS_HINTS,
  MEETING_METHOD_LABELS,
  mapLessonStatusToSummary,
} from "../lesson-presentation";
import styles from "./lesson-detail.module.css";

const LESSONS_BASE_PATH = "/lessons" as const;
const REPORT_ACTION = "report";

type LessonDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StudentLessonDetailPage({
  params,
  searchParams,
}: LessonDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const requestedAction = getSingleValue(resolvedSearchParams.action);
  const timezone = await getCurrentUserTimezone();
  const detailHref = `${LESSONS_BASE_PATH}/${id}`;

  if (!isSupabaseAuthConfigured()) {
    return renderDetailPage({
      detail: buildPreviewStudentLessonDetail(),
      detailHref,
      previewNotice: true,
      requestedAction,
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

  return renderDetailPage({
    detail,
    detailHref,
    previewNotice: false,
    requestedAction,
    timezone,
  });
}

function renderDetailPage({
  detail,
  detailHref,
  previewNotice,
  requestedAction,
  timezone,
}: {
  detail: StudentLessonDetailDto;
  detailHref: string;
  previewNotice: boolean;
  requestedAction: string | undefined;
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
  const reportRequested =
    requestedAction === REPORT_ACTION && detail.isIssueEntryEligible;

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
            descriptor={detail.tutor.headline ?? detail.tutor.bestForSummary ?? "Mentor IB tutor"}
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

      <IssueSection
        detail={detail}
        detailHref={detailHref}
        reportRequested={reportRequested}
      />
    </article>
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

function IssueSection({
  detail,
  detailHref,
  reportRequested,
}: {
  detail: StudentLessonDetailDto;
  detailHref: string;
  reportRequested: boolean;
}) {
  const { issue, isIssueEntryEligible } = detail;
  const reportHref = `${detailHref}?action=${REPORT_ACTION}`;

  return (
    <Panel eyebrow="Lesson issues" title="Report a problem">
      <Section density="compact">
        {issue ? <IssueStatus issue={issue} /> : null}

        {reportRequested ? (
          <InlineNotice tone="info" title="Report flow ships next">
            <p>
              Structured issue reporting lands in a follow-up task. Until then, you can
              still flag a lesson problem so the platform tracks the entry intent.
            </p>
          </InlineNotice>
        ) : null}

        {isIssueEntryEligible ? (
          <Link
            className={getButtonClassName({ variant: "secondary" })}
            href={reportHref as Route}
          >
            {issue ? "Update issue report" : "Report issue"}
          </Link>
        ) : (
          <p className={styles.bodyText}>
            Issue reporting opens once the lesson is accepted and stays available through
            the lesson window. Use this surface — not the chat thread — when something
            goes wrong with a session.
          </p>
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

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
