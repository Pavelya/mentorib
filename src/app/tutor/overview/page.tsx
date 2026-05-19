import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import {
  LessonSummary,
  PersonSummary,
  ScreenState,
} from "@/components/continuity";
import { TimezoneNotice } from "@/components/datetime";
import {
  Card,
  InlineNotice,
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
import { getTutorApplication } from "@/modules/tutors/application";
import {
  buildPreviewTutorOverview,
  getTutorOverview,
  type TutorOverviewDto,
  type TutorOverviewIssueDto,
  type TutorOverviewLessonDto,
} from "@/modules/tutors/tutor-overview";

import {
  getIssueCaseLabel,
  getIssueTypeLabel,
  mapLessonStatusToSummary,
} from "./overview-presentation";
import styles from "./overview.module.css";

const OVERVIEW_PATH = "/tutor/overview" as const;

export default async function TutorOverviewPage() {
  const timezone = await getCurrentUserTimezone();

  if (!isSupabaseAuthConfigured()) {
    return renderOverviewPage({
      hasOpenReadinessGate: false,
      overview: buildPreviewTutorOverview(),
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
    redirect(buildAuthSignInPath(routeFamilies.tutor.defaultHref) as Route);
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
        <InlineNotice
          className={styles.notice}
          title="Tutor overview unavailable"
          tone="warning"
        >
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
        <p>This account cannot view the tutor overview right now.</p>
      </InlineNotice>
    );
  }

  if (!hasRole(account, "tutor")) {
    redirect(buildPostSignInRedirect(account, OVERVIEW_PATH) as Route);
  }

  const overview = await getTutorOverview(account);

  const hasOpenReadinessGate =
    overview.state === "ready"
      ? await loadHasOpenReadinessGate(account)
      : false;

  return renderOverviewPage({
    hasOpenReadinessGate,
    overview,
    previewNotice: false,
    timezone,
  });
}

async function loadHasOpenReadinessGate(
  account: Parameters<typeof getTutorApplication>[0],
): Promise<boolean> {
  const application = await getTutorApplication(account);
  return application.readinessGates.some((gate) => gate.state !== "complete");
}

function renderOverviewPage({
  hasOpenReadinessGate,
  overview,
  previewNotice,
  timezone,
}: {
  hasOpenReadinessGate: boolean;
  overview: TutorOverviewDto;
  previewNotice: boolean;
  timezone: string;
}) {
  const timezoneLabel = getTimezoneLabel(timezone);

  return (
    <article className={styles.page}>
      <TimezoneNotice timezone={timezone} />

      {previewNotice ? (
        <InlineNotice
          className={styles.notice}
          title="Tutor overview preview"
          tone="info"
        >
          <p>
            Live tutor data connects once Supabase auth is configured. The shell
            below previews the operational surface.
          </p>
        </InlineNotice>
      ) : null}

      {overview.state === "no_profile" ? (
        <InlineNotice
          className={styles.notice}
          title="Tutor profile not set up"
          tone="warning"
        >
          <p>
            Your tutor profile has not been created yet. Complete the application
            flow to start receiving lesson requests.
          </p>
        </InlineNotice>
      ) : null}

      <PersonSummary
        avatarSrc={overview.profile.avatarUrl ?? undefined}
        descriptor={overview.profile.headline ?? undefined}
        eyebrow="Tutor overview"
        meta={[`Local timezone: ${timezoneLabel}`]}
        name={overview.profile.displayName}
        variant="header"
      />

      {hasOpenReadinessGate ? (
        <InlineNotice title="Finish setup to go live" tone="warning">
          <p>Your public listing has open items waiting on you.</p>
          <p className={styles.actionRow}>
            <Link
              className={getButtonClassName({
                size: "compact",
                variant: "secondary",
              })}
              href={"/tutor/profile" as Route}
            >
              Finish setup
            </Link>
          </p>
        </InlineNotice>
      ) : null}

      <div className={styles.metricRow}>
        <MetricItem
          label="Pending requests"
          value={overview.metrics.pendingRequestCount}
        />
        <MetricItem
          label="Upcoming lessons"
          value={overview.metrics.upcomingLessonCount}
        />
        <MetricItem
          label="Open issues"
          value={overview.metrics.openIssueCount}
        />
      </div>

      <PendingRequestsSection
        lessons={overview.pendingRequests}
        timezone={timezone}
      />

      <UpcomingLessonsSection
        lessons={overview.upcomingLessons}
        timezone={timezone}
      />

      <OpenIssuesSection issues={overview.openIssues} timezone={timezone} />
    </article>
  );
}

function MetricItem({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className={styles.metricValue}>{value}</p>
      <p className={styles.metricLabel}>{label}</p>
    </Card>
  );
}

function PendingRequestsSection({
  lessons,
  timezone,
}: {
  lessons: TutorOverviewLessonDto[];
  timezone: string;
}) {
  if (lessons.length === 0) {
    return (
      <ScreenState
        action={
          <Link
            className={getButtonClassName({
              size: "compact",
              variant: "secondary",
            })}
            href={"/tutor/lessons" as Route}
          >
            Open lessons hub
          </Link>
        }
        description="Lesson requests from students will show here so you can accept or decline before they expire."
        kind="empty"
        title="No requests waiting"
      />
    );
  }

  return (
    <section>
      <ul className={styles.lessonList}>
        {lessons.map((lesson) => (
          <li className={styles.lessonItem} key={lesson.id}>
            <PendingRequestRow lesson={lesson} timezone={timezone} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PendingRequestRow({
  lesson,
  timezone,
}: {
  lesson: TutorOverviewLessonDto;
  timezone: string;
}) {
  const subjectLabel = lesson.context.subject?.label ?? "Mentor IB lesson";
  const focusLabel = lesson.context.focus?.label ?? null;
  const scheduleLabel = formatUtcLessonRange(
    lesson.scheduledStartAt,
    lesson.scheduledEndAt,
    timezone,
  );
  const timezoneLabel = getTimezoneLabel(timezone);
  const expiresLabel = formatUtcDateTime(lesson.requestExpiresAt, {
    timezone,
  });
  const details = [
    `Lesson fee · ${lesson.priceLabel}`,
    `Request expires · ${expiresLabel}`,
  ];

  if (lesson.context.note) {
    details.push(`Student note · ${lesson.context.note}`);
  }

  return (
    <LessonSummary
      action={
        <Link
          className={getButtonClassName({
            size: "compact",
            variant: "secondary",
          })}
          href={"/tutor/lessons" as Route}
        >
          Review request
        </Link>
      }
      details={details}
      label="Pending request"
      person={
        <PersonSummary
          avatarSrc={lesson.student.avatarUrl ?? undefined}
          descriptor={`Student timezone: ${getTimezoneLabel(lesson.student.timezone)}`}
          eyebrow="Student"
          name={lesson.student.displayName}
          variant="compact"
        />
      }
      schedule={scheduleLabel}
      status={mapLessonStatusToSummary(lesson.lessonStatus)}
      timezone={timezoneLabel}
      title={focusLabel ? `${subjectLabel} · ${focusLabel}` : subjectLabel}
    />
  );
}

function UpcomingLessonsSection({
  lessons,
  timezone,
}: {
  lessons: TutorOverviewLessonDto[];
  timezone: string;
}) {
  if (lessons.length === 0) {
    return (
      <ScreenState
        description="Lessons you have accepted will appear here so you can prepare and join from one place."
        kind="empty"
        title="No upcoming lessons"
      />
    );
  }

  return (
    <section>
      <ul className={styles.lessonList}>
        {lessons.map((lesson) => (
          <li className={styles.lessonItem} key={lesson.id}>
            <UpcomingLessonRow lesson={lesson} timezone={timezone} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function UpcomingLessonRow({
  lesson,
  timezone,
}: {
  lesson: TutorOverviewLessonDto;
  timezone: string;
}) {
  const subjectLabel = lesson.context.subject?.label ?? "Mentor IB lesson";
  const focusLabel = lesson.context.focus?.label ?? null;
  const scheduleLabel = formatUtcLessonRange(
    lesson.scheduledStartAt,
    lesson.scheduledEndAt,
    timezone,
  );
  const timezoneLabel = getTimezoneLabel(timezone);
  const details = [`Lesson fee · ${lesson.priceLabel}`];

  if (lesson.context.note) {
    details.push(`Student note · ${lesson.context.note}`);
  }

  return (
    <LessonSummary
      action={
        <Link
          className={getButtonClassName({
            size: "compact",
            variant: "secondary",
          })}
          href={"/tutor/lessons" as Route}
        >
          Open lesson
        </Link>
      }
      details={details}
      label="Upcoming lesson"
      person={
        <PersonSummary
          avatarSrc={lesson.student.avatarUrl ?? undefined}
          descriptor={`Student timezone: ${getTimezoneLabel(lesson.student.timezone)}`}
          eyebrow="Student"
          name={lesson.student.displayName}
          variant="compact"
        />
      }
      schedule={scheduleLabel}
      status={mapLessonStatusToSummary(lesson.lessonStatus)}
      timezone={timezoneLabel}
      title={focusLabel ? `${subjectLabel} · ${focusLabel}` : subjectLabel}
    />
  );
}

function OpenIssuesSection({
  issues,
  timezone,
}: {
  issues: TutorOverviewIssueDto[];
  timezone: string;
}) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <section className={styles.issueList}>
      {issues.map((issue) => (
        <OpenIssueRow issue={issue} key={issue.id} timezone={timezone} />
      ))}
    </section>
  );
}

function OpenIssueRow({
  issue,
  timezone,
}: {
  issue: TutorOverviewIssueDto;
  timezone: string;
}) {
  const reportedLabel = formatUtcDateTime(issue.reportedAt, { timezone });
  const deadlineLabel = formatUtcDateTime(issue.counterpartyDeadlineAt, {
    timezone,
  });

  return (
    <Card>
      <div className={styles.issueHeader}>
        <p className={styles.issueTitle}>{getIssueTypeLabel(issue.issueType)}</p>
        <StatusBadge tone="warning">
          {getIssueCaseLabel(issue.caseStatus)}
        </StatusBadge>
      </div>

      <p className={styles.issueMeta}>
        Student · {issue.student.displayName}
      </p>
      <p className={styles.issueMeta}>Reported · {reportedLabel}</p>
      <p className={styles.issueMeta}>Response deadline · {deadlineLabel}</p>

      <div className={styles.actionRow}>
        <Link
          className={getButtonClassName({
            size: "compact",
            variant: "secondary",
          })}
          href={"/tutor/lessons" as Route}
        >
          Open lesson
        </Link>
      </div>
    </Card>
  );
}
