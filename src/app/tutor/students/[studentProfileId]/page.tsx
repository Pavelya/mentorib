import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";

import {
  ContextChipRow,
  LessonSummary,
  PersonSummary,
  ScreenState,
} from "@/components/continuity";
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
  getRecentSharedLessonRecapsForTutor,
  type RecentLessonRecapDto,
} from "@/modules/lessons/lesson-reports";
import {
  buildPreviewTutorStudentRelationship,
  getTutorStudentRelationship,
  type TutorStudentRelationshipDto,
  type TutorStudentRelationshipLessonDto,
} from "@/modules/lessons/tutor-students";

import { mapLessonStatusToSummary } from "../../lessons/lesson-presentation";
import {
  buildStudentsHref,
  getRelationshipBadgeLabel,
  getRelationshipBadgeTone,
  getRelationshipDescriptor,
  parseRelationshipFilter,
  parseSearchTerm,
} from "../students-presentation";
import styles from "./student-detail.module.css";

type StudentDetailPageProps = {
  params: Promise<{ studentProfileId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TutorStudentDetailPage({
  params,
  searchParams,
}: StudentDetailPageProps) {
  const [{ studentProfileId }, resolvedSearchParams, timezone] =
    await Promise.all([params, searchParams, getCurrentUserTimezone()]);

  const backHref = buildStudentsHref({
    relationship: parseRelationshipFilter(resolvedSearchParams.relationship),
    search: parseSearchTerm(resolvedSearchParams.q),
    subjectId: readSingleParam(resolvedSearchParams.subject),
  });

  const detailHref = `/tutor/students/${studentProfileId}`;

  if (!isSupabaseAuthConfigured()) {
    const preview = buildPreviewTutorStudentRelationship(studentProfileId);

    if (preview.state !== "preview" || !preview.relationship) {
      notFound();
    }

    return renderDetailPage({
      backHref,
      previewNotice: true,
      relationship: preview.relationship,
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
        <InlineNotice
          className={styles.notice}
          title="Tutor student unavailable"
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
        <p>This account cannot view tutor students right now.</p>
      </InlineNotice>
    );
  }

  if (!hasRole(account, "tutor")) {
    redirect(buildPostSignInRedirect(account, detailHref) as Route);
  }

  const [result, recentRecaps] = await Promise.all([
    getTutorStudentRelationship(account, studentProfileId),
    getRecentSharedLessonRecapsForTutor(account, studentProfileId),
  ]);

  if (result.state === "no_profile") {
    return (
      <article className={styles.page}>
        <BackLink href={backHref} />
        <InlineNotice
          className={styles.notice}
          title="Tutor profile not set up"
          tone="warning"
        >
          <p>
            Your tutor profile has not been created yet. Complete the
            application flow before student relationships can appear here.
          </p>
        </InlineNotice>
      </article>
    );
  }

  if (result.state === "not_found" || !result.relationship) {
    notFound();
  }

  return renderDetailPage({
    backHref,
    previewNotice: false,
    recentRecaps,
    relationship: result.relationship,
    timezone,
  });
}

function renderDetailPage({
  backHref,
  previewNotice,
  recentRecaps = [],
  relationship,
  timezone,
}: {
  backHref: Route;
  previewNotice: boolean;
  recentRecaps?: readonly RecentLessonRecapDto[];
  relationship: TutorStudentRelationshipDto;
  timezone: string;
}) {
  return (
    <article className={styles.page}>
      <TimezoneNotice timezone={timezone} />
      <BackLink href={backHref} />

      <PersonSummary
        avatarSrc={relationship.avatarUrl ?? undefined}
        badges={[
          {
            label: getRelationshipBadgeLabel(relationship.relationshipState),
            tone: getRelationshipBadgeTone(relationship.relationshipState),
          },
        ]}
        descriptor={getRelationshipDescriptor(relationship.relationshipState)}
        eyebrow="Student"
        meta={[`Student timezone · ${getTimezoneLabel(relationship.timezone)}`]}
        name={relationship.displayName}
        variant="header"
      />

      {previewNotice ? (
        <InlineNotice
          className={styles.notice}
          title="Tutor student preview"
          tone="info"
        >
          <p>
            Live relationship data connects once Supabase auth is configured.
            The surface below previews the student detail view.
          </p>
        </InlineNotice>
      ) : null}

      <RelationshipContextSection
        relationship={relationship}
        timezone={timezone}
      />

      <RecentLessonsSection
        lessons={relationship.recentLessons}
        student={relationship}
        timezone={timezone}
      />

      <RecentRecapsSection recaps={recentRecaps} timezone={timezone} />

      <NextActionsSection />
    </article>
  );
}

function RecentRecapsSection({
  recaps,
  timezone,
}: {
  recaps: readonly RecentLessonRecapDto[];
  timezone: string;
}) {
  if (recaps.length === 0) {
    return null;
  }

  return (
    <Section
      eyebrow="Recent recaps"
      title="Lesson recaps you've shared"
      description="Continuity notes you've shared with this student. Open the lesson to update or revisit the recap."
    >
      <ul className={styles.detailList}>
        {recaps.map((recap) => (
          <li className={styles.detailItem} key={recap.lessonId}>
            <Link href={recap.lessonHref as Route}>
              {formatRecapLabel(recap, timezone)}
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function formatRecapLabel(
  recap: RecentLessonRecapDto,
  timezone: string,
): string {
  const subjectLabel = recap.subject?.label ?? "Lesson";
  const focusLabel = recap.focus?.label ? ` · ${recap.focus.label}` : "";
  const sharedLabel = formatUtcDateTime(recap.sharedAt, { timezone });
  const ackSuffix = recap.acknowledgedAt ? " · acknowledged" : "";

  return `${subjectLabel}${focusLabel} — shared ${sharedLabel}${ackSuffix}`;
}

function BackLink({ href }: { href: Route }) {
  return (
    <Link
      className={getButtonClassName({ size: "compact", variant: "secondary" })}
      href={href}
    >
      Back to students
    </Link>
  );
}

function RelationshipContextSection({
  relationship,
  timezone,
}: {
  relationship: TutorStudentRelationshipDto;
  timezone: string;
}) {
  const details: string[] = [];

  if (relationship.upcomingLessonAt) {
    details.push(
      `Next lesson · ${formatUtcDateTime(relationship.upcomingLessonAt, { timezone })}`,
    );
  }

  if (relationship.lastLessonAt) {
    details.push(
      `Last lesson · ${formatUtcDateTime(relationship.lastLessonAt, { timezone })}`,
    );
  }

  details.push(
    relationship.completedLessonCount === 1
      ? "1 completed lesson"
      : `${relationship.completedLessonCount} completed lessons`,
  );

  if (relationship.pendingRequestCount > 0) {
    details.push(
      relationship.pendingRequestCount === 1
        ? "1 pending request"
        : `${relationship.pendingRequestCount} pending requests`,
    );
  }

  return (
    <Section
      eyebrow="Relationship context"
      title="Active teaching relationship"
      description="Lessons and messages remain the shared continuity anchors. This view summarises what you already share with this student."
    >
      {relationship.subjects.length > 0 ? (
        <ContextChipRow
          items={relationship.subjects.map((subject) => ({
            label: subject.label,
          }))}
          label="Subjects"
        />
      ) : null}

      <ul className={styles.detailList}>
        {details.map((detail) => (
          <li className={styles.detailItem} key={detail}>
            {detail}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function RecentLessonsSection({
  lessons,
  student,
  timezone,
}: {
  lessons: readonly TutorStudentRelationshipLessonDto[];
  student: TutorStudentRelationshipDto;
  timezone: string;
}) {
  return (
    <Section
      eyebrow="Recent lessons"
      title="Lesson history"
      description="The most recent shared lessons. Open any lesson to manage scheduling, meeting access, or issues."
    >
      {lessons.length > 0 ? (
        <ul className={styles.lessonList}>
          {lessons.map((lesson) => (
            <li className={styles.lessonItem} key={lesson.id}>
              <RecentLessonCard
                lesson={lesson}
                student={student}
                timezone={timezone}
              />
            </li>
          ))}
        </ul>
      ) : (
        <ScreenState
          description="Once a lesson is requested or accepted, it will appear here so you can keep track of the relationship."
          kind="empty"
          title="No lessons yet"
        />
      )}
    </Section>
  );
}

function RecentLessonCard({
  lesson,
  student,
  timezone,
}: {
  lesson: TutorStudentRelationshipLessonDto;
  student: TutorStudentRelationshipDto;
  timezone: string;
}) {
  const subjectLabel = lesson.subject?.label ?? "Mentor IB lesson";
  const focusLabel = lesson.focus?.label ?? null;
  const title = focusLabel ? `${subjectLabel} · ${focusLabel}` : subjectLabel;
  const scheduleLabel = formatUtcLessonRange(
    lesson.startAt,
    lesson.endAt,
    timezone,
  );
  const timezoneLabel = getTimezoneLabel(timezone);

  return (
    <LessonSummary
      action={
        <Link
          className={getButtonClassName({
            size: "compact",
            variant: "secondary",
          })}
          href={`/tutor/lessons/${lesson.id}` as Route}
        >
          Open lesson
        </Link>
      }
      label="Lesson"
      person={
        <PersonSummary
          avatarSrc={student.avatarUrl ?? undefined}
          descriptor={`Student timezone · ${getTimezoneLabel(student.timezone)}`}
          eyebrow="Student"
          name={student.displayName}
          variant="compact"
        />
      }
      schedule={scheduleLabel}
      status={mapLessonStatusToSummary(lesson.lessonStatus)}
      timezone={timezoneLabel}
      title={title}
    />
  );
}

function NextActionsSection() {
  return (
    <Section
      eyebrow="Continue the relationship"
      title="Next actions"
      description="Continuity stays in the existing lessons and messages hubs."
    >
      <div className={styles.actionRow}>
        <Link
          className={getButtonClassName({ variant: "secondary" })}
          href={"/tutor/lessons" as Route}
        >
          Open lessons
        </Link>
        <Link
          className={getButtonClassName({ variant: "secondary" })}
          href={"/tutor/messages" as Route}
        >
          Open messages
        </Link>
      </div>
    </Section>
  );
}

function readSingleParam(value: string | string[] | undefined): string {
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === "string" ? single.trim() : "";
}
