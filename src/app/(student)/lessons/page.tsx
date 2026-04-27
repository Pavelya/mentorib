import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { LessonSummary, PersonSummary, ScreenState } from "@/components/continuity";
import { TimezoneNotice } from "@/components/datetime";
import { InlineNotice, getButtonClassName } from "@/components/ui";
import {
  buildPostSignInRedirect,
  ensureAuthAccount,
} from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import {
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
  buildPreviewStudentLessonList,
  getStudentLessonList,
  type StudentLessonListDto,
  type StudentLessonListItemDto,
} from "@/modules/lessons/student-lessons";

import { ISSUE_CASE_LABELS, mapLessonStatusToSummary } from "./lesson-presentation";
import styles from "./lessons.module.css";

const LESSONS_BASE_PATH = "/lessons" as const;

export default async function StudentLessonsPage() {
  const timezone = await getCurrentUserTimezone();

  if (!isSupabaseAuthConfigured()) {
    return renderLessonsPage({
      list: buildPreviewStudentLessonList(),
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
    redirect(buildAuthSignInPath(routeFamilies.student.defaultHref) as Route);
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
    redirect(buildPostSignInRedirect(account, LESSONS_BASE_PATH) as Route);
  }

  const list = await getStudentLessonList(account);

  return renderLessonsPage({ list, previewNotice: false, timezone });
}

function renderLessonsPage({
  list,
  previewNotice,
  timezone,
}: {
  list: StudentLessonListDto;
  previewNotice: boolean;
  timezone: string;
}) {
  return (
    <article className={styles.page}>
      <TimezoneNotice timezone={timezone} />

      {previewNotice ? (
        <InlineNotice
          className={styles.notice}
          title="Lessons preview"
          tone="info"
        >
          <p>
            Live lesson data connects once Supabase auth is configured. The shared shell
            below previews the lesson list surface.
          </p>
        </InlineNotice>
      ) : null}

      {list.lessons.length === 0 ? (
        <ScreenState
          action={
            <Link className={getButtonClassName()} href="/match">
              Find a tutor
            </Link>
          }
          description="Once a tutor accepts your lesson request, the session shows up here with the meeting link, lesson notes, and a way to flag any issue."
          kind="empty"
          title="No lessons yet"
        />
      ) : (
        <ul className={styles.lessonList}>
          {list.lessons.map((lesson) => (
            <li className={styles.lessonItem} key={lesson.id}>
              <LessonRowCard lesson={lesson} timezone={timezone} />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function LessonRowCard({
  lesson,
  timezone,
}: {
  lesson: StudentLessonListItemDto;
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
  const detailDescription = lesson.tutor.headline ?? lesson.tutor.bestForSummary ?? "Mentor IB tutor";
  const details = buildSummaryDetails(lesson);

  return (
    <LessonSummary
      action={
        <Link
          className={getButtonClassName({ size: "compact", variant: "secondary" })}
          href={`${LESSONS_BASE_PATH}/${lesson.id}` as Route}
        >
          View lesson
        </Link>
      }
      details={details}
      label="Lesson"
      person={
        <PersonSummary
          avatarSrc={lesson.tutor.avatarUrl ?? undefined}
          descriptor={detailDescription}
          eyebrow="Tutor"
          name={lesson.tutor.displayName}
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

function buildSummaryDetails(lesson: StudentLessonListItemDto): string[] {
  const details: string[] = [];

  if (lesson.schedule.isTrial) {
    details.push("Trial lesson");
  }

  details.push(`Lesson fee · ${lesson.schedule.priceLabel}`);

  if (lesson.issue) {
    details.push(`Issue · ${ISSUE_CASE_LABELS[lesson.issue.caseStatus]}`);
  }

  return details;
}
