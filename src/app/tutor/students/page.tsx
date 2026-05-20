import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import {
  ContextChipRow,
  PersonSummary,
  ScreenState,
} from "@/components/continuity";
import { TimezoneNotice } from "@/components/datetime";
import {
  Card,
  InlineNotice,
  Panel,
  StatusBadge,
  TabBar,
  TextField,
  getButtonClassName,
} from "@/components/ui";
import {
  buildPostSignInRedirect,
  ensureAuthAccount,
} from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { formatUtcDateTime, getTimezoneLabel } from "@/lib/datetime";
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
  buildPreviewTutorStudentsRoster,
  getTutorStudentsRoster,
  type TutorStudentsRosterDto,
  type TutorStudentsRosterItemDto,
} from "@/modules/lessons/tutor-students";

import {
  RELATIONSHIP_FILTER_VALUES,
  buildRosterFilter,
  buildStudentsHref,
  getRelationshipBadgeLabel,
  getRelationshipBadgeTone,
  getRelationshipDescriptor,
  getRelationshipFilterLabel,
  parseRelationshipFilter,
  parseSearchTerm,
  parseSubjectFilter,
  type RelationshipFilter,
} from "./students-presentation";
import styles from "./students.module.css";

const STUDENTS_BASE_PATH = "/tutor/students" as const;

type TutorStudentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TutorStudentsPage({
  searchParams,
}: TutorStudentsPageProps) {
  const timezone = await getCurrentUserTimezone();
  const resolvedSearchParams = await searchParams;
  const relationship = parseRelationshipFilter(
    resolvedSearchParams.relationship,
  );
  const search = parseSearchTerm(resolvedSearchParams.q);

  if (!isSupabaseAuthConfigured()) {
    const preview = buildPreviewTutorStudentsRoster();
    const subjectId = parseSubjectFilter(
      resolvedSearchParams.subject,
      preview.availableSubjects.map((subject) => subject.id),
    );

    return renderStudentsPage({
      previewNotice: true,
      relationship,
      roster: preview,
      search,
      subjectId,
      timezone,
    });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(STUDENTS_BASE_PATH) as Route);
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
          title="Students unavailable"
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
    redirect(buildPostSignInRedirect(account, STUDENTS_BASE_PATH) as Route);
  }

  const unfilteredRoster = await getTutorStudentsRoster(account);
  const subjectId = parseSubjectFilter(
    resolvedSearchParams.subject,
    unfilteredRoster.availableSubjects.map((subject) => subject.id),
  );
  const roster =
    relationship === "all" && search.length === 0 && subjectId.length === 0
      ? unfilteredRoster
      : await getTutorStudentsRoster(
          account,
          buildRosterFilter({ relationship, search, subjectId }),
        );

  return renderStudentsPage({
    previewNotice: false,
    relationship,
    roster,
    search,
    subjectId,
    timezone,
  });
}

function renderStudentsPage({
  previewNotice,
  relationship,
  roster,
  search,
  subjectId,
  timezone,
}: {
  previewNotice: boolean;
  relationship: RelationshipFilter;
  roster: TutorStudentsRosterDto;
  search: string;
  subjectId: string;
  timezone: string;
}) {
  const hasItems = roster.items.length > 0;
  const hasActiveFilters =
    relationship !== "all" || search.length > 0 || subjectId.length > 0;

  return (
    <article className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Tutor students</p>
        <h1 className={styles.title}>Students</h1>
        <p className={styles.description}>
          The students you&apos;re working with on Mentor IB.
        </p>
      </header>

      <TimezoneNotice timezone={timezone} />

      {previewNotice ? (
        <InlineNotice
          className={styles.notice}
          title="Students preview"
          tone="info"
        >
          <p>
            Live roster data connects once Supabase auth is configured. The
            surface below previews the relationship view.
          </p>
        </InlineNotice>
      ) : null}

      {roster.state === "no_profile" ? (
        <InlineNotice
          className={styles.notice}
          title="Profile not set up"
          tone="warning"
        >
          <p>
            Your tutor profile has not been created yet. Complete the application
            flow before students can appear here.
          </p>
        </InlineNotice>
      ) : null}

      <RosterControls
        availableSubjects={roster.availableSubjects}
        relationship={relationship}
        search={search}
        subjectId={subjectId}
      />

      {hasItems ? (
        <ul className={styles.rosterList}>
          {roster.items.map((item) => (
            <li className={styles.rosterItem} key={item.studentProfileId}>
              <StudentRosterCard item={item} timezone={timezone} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyRosterState
          hasActiveFilters={hasActiveFilters}
          state={roster.state}
        />
      )}
    </article>
  );
}

function RosterControls({
  availableSubjects,
  relationship,
  search,
  subjectId,
}: {
  availableSubjects: TutorStudentsRosterDto["availableSubjects"];
  relationship: RelationshipFilter;
  search: string;
  subjectId: string;
}) {
  return (
    <Panel
      aria-label="Roster controls"
      contentClassName={styles.controls}
      eyebrow="Find a student"
      title="Search and filter"
    >
      <form
        action={STUDENTS_BASE_PATH}
        className={styles.searchRow}
        method="get"
        role="search"
      >
        <input
          name="relationship"
          type="hidden"
          value={relationship === "all" ? "" : relationship}
        />
        {subjectId.length > 0 ? (
          <input name="subject" type="hidden" value={subjectId} />
        ) : null}

        <div className={styles.searchField}>
          <TextField
            defaultValue={search}
            label="Search by name"
            maxLength={80}
            name="q"
            placeholder="Search students"
            size="compact"
            type="search"
          />
        </div>

        <div className={styles.searchActions}>
          <button
            className={getButtonClassName({ size: "compact" })}
            type="submit"
          >
            Search
          </button>
          {search.length > 0 ? (
            <Link
              className={getButtonClassName({
                size: "compact",
                variant: "secondary",
              })}
              href={buildStudentsHref({ relationship, subjectId }) as Route}
            >
              Clear search
            </Link>
          ) : null}
        </div>
      </form>

      <div className={styles.filterGroup}>
        <p className={styles.filterLabel}>Relationship</p>
        <TabBar
          activeId={relationship}
          ariaLabel="Filter students by relationship"
          items={RELATIONSHIP_FILTER_VALUES.map((value) => ({
            href: buildStudentsHref({
              relationship: value,
              search,
              subjectId,
            }),
            id: value,
            label: getRelationshipFilterLabel(value),
          }))}
        />
      </div>

      {availableSubjects.length > 0 ? (
        <div className={styles.filterGroup}>
          <p className={styles.filterLabel}>Subject</p>
          <TabBar
            activeId={subjectId.length > 0 ? subjectId : "all-subjects"}
            ariaLabel="Filter students by subject"
            items={[
              {
                href: buildStudentsHref({
                  relationship,
                  search,
                  subjectId: "",
                }),
                id: "all-subjects",
                label: "All subjects",
              },
              ...availableSubjects.map((subject) => ({
                href: buildStudentsHref({
                  relationship,
                  search,
                  subjectId: subject.id,
                }),
                id: subject.id,
                label: subject.label,
              })),
            ]}
          />
        </div>
      ) : null}
    </Panel>
  );
}

function StudentRosterCard({
  item,
  timezone,
}: {
  item: TutorStudentsRosterItemDto;
  timezone: string;
}) {
  const upcomingLabel = item.upcomingLessonAt
    ? `Next lesson · ${formatUtcDateTime(item.upcomingLessonAt, { timezone })}`
    : null;
  const lastLabel = item.lastLessonAt
    ? `Last lesson · ${formatUtcDateTime(item.lastLessonAt, { timezone })}`
    : null;
  const completedLabel =
    item.completedLessonCount > 0
      ? `${item.completedLessonCount} completed ${
          item.completedLessonCount === 1 ? "lesson" : "lessons"
        }`
      : null;
  const pendingLabel =
    item.pendingRequestCount > 0
      ? `${item.pendingRequestCount} pending ${
          item.pendingRequestCount === 1 ? "request" : "requests"
        }`
      : null;

  const details = [
    upcomingLabel,
    lastLabel,
    completedLabel,
    pendingLabel,
  ].filter((value): value is string => Boolean(value));

  if (details.length === 0) {
    details.push("No lesson activity yet.");
  }

  return (
    <Card>
      <div className={styles.studentCard}>
        <PersonSummary
          avatarSrc={item.avatarUrl ?? undefined}
          badges={[
            {
              label: getRelationshipBadgeLabel(item.relationshipState),
              tone: getRelationshipBadgeTone(item.relationshipState),
            },
          ]}
          descriptor={getRelationshipDescriptor(item.relationshipState)}
          eyebrow="Student"
          meta={[`Student timezone · ${getTimezoneLabel(item.timezone)}`]}
          name={item.displayName}
          variant="standard"
        />

        {item.subjects.length > 0 ? (
          <ContextChipRow
            items={item.subjects.map((subject) => ({ label: subject.label }))}
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

        {item.pendingRequestCount > 0 ? (
          <StatusBadge tone="warning">Pending request waiting</StatusBadge>
        ) : null}

        <div className={styles.actionRow}>
          <Link
            className={getButtonClassName({
              size: "compact",
            })}
            href={`/tutor/students/${item.studentProfileId}` as Route}
          >
            Open student
          </Link>
          <Link
            className={getButtonClassName({
              size: "compact",
              variant: "secondary",
            })}
            href={"/tutor/lessons" as Route}
          >
            Open lessons
          </Link>
          <Link
            className={getButtonClassName({
              size: "compact",
              variant: "secondary",
            })}
            href={"/tutor/messages" as Route}
          >
            Open messages
          </Link>
        </div>
      </div>
    </Card>
  );
}

function EmptyRosterState({
  hasActiveFilters,
  state,
}: {
  hasActiveFilters: boolean;
  state: TutorStudentsRosterDto["state"];
}) {
  if (state === "no_profile") {
    return null;
  }

  if (hasActiveFilters) {
    return (
      <ScreenState
        action={
          <Link
            className={getButtonClassName({ variant: "secondary" })}
            href={STUDENTS_BASE_PATH as Route}
          >
            Clear filters
          </Link>
        }
        description="The current search and filter view is stricter than the roster you have."
        hints={[
          "Try clearing the search first.",
          "Switch back to all relationships and all subjects.",
        ]}
        kind="empty"
        title="No students match this view"
      />
    );
  }

  return (
    <ScreenState
      action={
        <Link
          className={getButtonClassName({ variant: "secondary" })}
          href={"/tutor/lessons" as Route}
        >
          Open lessons hub
        </Link>
      }
      description="Once you accept a lesson request, that student will appear here so you can continue the relationship."
      icon="users"
      kind="empty"
      title="No students yet"
    />
  );
}
