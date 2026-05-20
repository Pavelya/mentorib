import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { LessonSummary, PersonSummary, ScreenState } from "@/components/continuity";
import { TimezoneNotice } from "@/components/datetime";
import { InlineNotice, Section, getButtonClassName } from "@/components/ui";
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
  buildPreviewTutorLessonList,
  getTutorLessonList,
  type TutorLessonListDto,
  type TutorLessonListItemDto,
} from "@/modules/lessons/tutor-lessons";

import { ISSUE_CASE_LABELS, mapLessonStatusToSummary } from "./lesson-presentation";
import styles from "./lessons.module.css";

const LESSONS_BASE_PATH = "/tutor/lessons" as const;

export default async function TutorLessonsPage() {
  const timezone = await getCurrentUserTimezone();

  if (!isSupabaseAuthConfigured()) {
    return renderLessonsPage({
      list: buildPreviewTutorLessonList(),
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
    redirect(buildAuthSignInPath(LESSONS_BASE_PATH) as Route);
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
          title="Lessons unavailable"
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
        <p>This account cannot view tutor lessons right now.</p>
      </InlineNotice>
    );
  }

  if (!hasRole(account, "tutor")) {
    redirect(buildPostSignInRedirect(account, LESSONS_BASE_PATH) as Route);
  }

  const list = await getTutorLessonList(account);

  return renderLessonsPage({ list, previewNotice: false, timezone });
}

function renderLessonsPage({
  list,
  previewNotice,
  timezone,
}: {
  list: TutorLessonListDto;
  previewNotice: boolean;
  timezone: string;
}) {
  const { pendingRequests, upcoming, past } = list.groups;
  const hasAny =
    pendingRequests.length > 0 || upcoming.length > 0 || past.length > 0;

  return (
    <article className={styles.page}>
      {previewNotice ? (
        <InlineNotice
          className={styles.notice}
          title="Lessons preview"
          tone="info"
        >
          <p>
            Live lesson data connects once Supabase auth is configured. The
            shared lesson hub below previews how requests and confirmed lessons
            appear from the tutor view.
          </p>
        </InlineNotice>
      ) : null}

      {list.state === "no_profile" ? (
        <InlineNotice
          className={styles.notice}
          title="Profile not set up"
          tone="warning"
        >
          <p>
            Your tutor profile has not been created yet. Complete the application
            flow to start receiving lesson requests.
          </p>
        </InlineNotice>
      ) : null}

      <header className={styles.intro}>
        <p className={styles.eyebrow}>Tutor lessons</p>
        <h1 className={styles.title}>Lessons</h1>
        <p className={styles.description}>
          Review pending requests, prepare upcoming sessions, and look back on
          completed work.
        </p>
      </header>

      <TimezoneNotice timezone={timezone} />

      {!hasAny && list.state !== "no_profile" ? (
        <ScreenState
          description="Lesson requests and confirmed lessons appear here so you can review pending requests, prepare upcoming sessions, and look back on completed work."
          icon="calendar"
          kind="empty"
          title="No lessons yet"
        />
      ) : null}

      <LessonGroup
        emptyDescription="Lesson requests waiting on your decision will show up here. Accept to capture the student's payment, or decline to release the authorization."
        emptyTitle="No pending requests"
        lessons={pendingRequests}
        showExpiry
        timezone={timezone}
        title="Pending requests"
      />

      <LessonGroup
        emptyDescription="Confirmed lessons appear here so you can prepare and join from one place."
        emptyTitle="No upcoming lessons"
        lessons={upcoming}
        timezone={timezone}
        title="Upcoming lessons"
      />

      {past.length > 0 ? (
        <LessonGroup
          emptyDescription=""
          emptyTitle=""
          lessons={past}
          subtitle="Completed, declined, expired, and cancelled lessons."
          timezone={timezone}
          title="Past lessons"
        />
      ) : null}
    </article>
  );
}

function LessonGroup({
  emptyDescription,
  emptyTitle,
  lessons,
  showExpiry,
  subtitle,
  timezone,
  title,
}: {
  emptyDescription: string;
  emptyTitle: string;
  lessons: TutorLessonListItemDto[];
  showExpiry?: boolean;
  subtitle?: string;
  timezone: string;
  title: string;
}) {
  if (lessons.length === 0) {
    if (!emptyTitle) {
      return null;
    }

    return (
      <Section description={subtitle} title={title}>
        <ScreenState description={emptyDescription} kind="empty" title={emptyTitle} />
      </Section>
    );
  }

  return (
    <Section description={subtitle} title={title}>
      <ul className={styles.lessonList}>
        {lessons.map((lesson) => (
          <li className={styles.lessonItem} key={lesson.id}>
            <LessonRowCard
              lesson={lesson}
              showExpiry={showExpiry ?? false}
              timezone={timezone}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function LessonRowCard({
  lesson,
  showExpiry,
  timezone,
}: {
  lesson: TutorLessonListItemDto;
  showExpiry: boolean;
  timezone: string;
}) {
  const subjectLabel = lesson.context.subject?.label ?? "Mentor IB lesson";
  const focusLabel = lesson.context.focus?.label ?? null;
  const scheduleLabel = formatUtcLessonRange(
    lesson.schedule.startAt,
    lesson.schedule.endAt,
    timezone,
  );
  const timezoneLabel = getTimezoneLabel(timezone);
  const studentDescriptor = `Student timezone: ${getTimezoneLabel(lesson.student.timezone)}`;
  const details = buildSummaryDetails(lesson, showExpiry, timezone);

  return (
    <LessonSummary
      action={
        <Link
          className={getButtonClassName({ size: "compact", variant: "secondary" })}
          href={`${LESSONS_BASE_PATH}/${lesson.id}` as Route}
        >
          {showExpiry ? "Review request" : "Open lesson"}
        </Link>
      }
      details={details}
      label={showExpiry ? "Pending request" : "Lesson"}
      person={
        <PersonSummary
          avatarSrc={lesson.student.avatarUrl ?? undefined}
          descriptor={studentDescriptor}
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

function buildSummaryDetails(
  lesson: TutorLessonListItemDto,
  showExpiry: boolean,
  timezone: string,
): string[] {
  const details: string[] = [];

  if (lesson.schedule.isTrial) {
    details.push("Trial lesson");
  }

  details.push(`Lesson fee · ${lesson.schedule.priceLabel}`);

  if (showExpiry) {
    const expiresLabel = formatUtcDateTime(lesson.requestExpiresAt, { timezone });
    details.push(`Request expires · ${expiresLabel}`);
  }

  if (lesson.context.note) {
    details.push(`Student note · ${lesson.context.note}`);
  }

  if (lesson.issue) {
    details.push(`Issue · ${ISSUE_CASE_LABELS[lesson.issue.caseStatus]}`);
  }

  return details;
}
