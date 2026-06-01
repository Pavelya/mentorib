import "server-only";

import { formatUtcDateTime } from "@/lib/datetime";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  LESSON_ISSUE_OUTCOME_LABELS,
  LESSON_ISSUE_TYPE_LABELS,
} from "@/modules/admin/labels";

import type {
  LessonIssueCounterpartyResponseType,
  LessonIssueResolutionOutcome,
  LessonIssueType,
} from "./constants";

// D7 (admin scope) display summary of a lesson-issue dispute, keyed by the
// lesson id stored on the backing `moderation_cases` row (`subject_id`). Carries
// display-ready labels only — never raw enums or UUIDs. Used by the disputes
// queue (`/internal/disputes`).
export type LessonIssueDisputeSummary = {
  lessonId: string;
  scheduledStartAtLabel: string;
  issueTypeLabel: string;
  refundEligible: boolean;
  studentDisplayName: string | null;
  tutorDisplayName: string | null;
};

export type LessonIssueDisputeParticipantClaim = {
  role: "student" | "tutor";
  displayName: string | null;
  avatarSrc: string | null;
  isReporter: boolean;
  claimLabel: string;
  claimSummary: string | null;
};

// The case-detail extension for `case_kind = 'lesson_issue'`: the side-by-side
// participant claims plus the lesson context. Lives in the lessons module so
// the admin module never widens its DTO surface into lesson internals.
export type LessonIssueDisputeDetail = LessonIssueDisputeSummary & {
  reportedByRole: "student" | "tutor" | null;
  resolutionOutcomeLabel: string | null;
  student: LessonIssueDisputeParticipantClaim;
  tutor: LessonIssueDisputeParticipantClaim;
};

type LessonRow = {
  id: string;
  scheduled_start_at: string;
  student_profile_id: string;
  tutor_profile_id: string;
};

type IssueCaseRow = {
  counterparty_response_type: LessonIssueCounterpartyResponseType | null;
  counterparty_summary: string | null;
  issue_type: LessonIssueType;
  reported_by_app_user_id: string;
  reporter_summary: string | null;
  resolution_outcome: LessonIssueResolutionOutcome | null;
};

type ProfileUserRow = { app_user_id: string };

type AppUserRow = {
  avatar_url: string | null;
  full_name: string | null;
  id: string;
};

type DisputeContext = {
  lesson: LessonRow;
  issueCase: IssueCaseRow | null;
  refundEligible: boolean;
  studentAppUserId: string | null;
  tutorAppUserId: string | null;
  identities: Map<string, AppUserRow>;
};

async function loadDisputeContext(
  lessonId: string,
): Promise<DisputeContext | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, scheduled_start_at, student_profile_id, tutor_profile_id")
    .eq("id", lessonId)
    .maybeSingle<LessonRow>();
  if (!lesson) {
    return null;
  }

  const [issueResult, paymentResult, studentResult, tutorResult] =
    await Promise.all([
      supabase
        .from("lesson_issue_cases")
        .select(
          "counterparty_response_type, counterparty_summary, issue_type, reported_by_app_user_id, reporter_summary, resolution_outcome",
        )
        .eq("lesson_id", lessonId)
        .maybeSingle<IssueCaseRow>(),
      supabase
        .from("payments")
        .select("payment_status")
        .eq("lesson_id", lessonId)
        .maybeSingle<{ payment_status: string }>(),
      supabase
        .from("student_profiles")
        .select("app_user_id")
        .eq("id", lesson.student_profile_id)
        .maybeSingle<ProfileUserRow>(),
      supabase
        .from("tutor_profiles")
        .select("app_user_id")
        .eq("id", lesson.tutor_profile_id)
        .maybeSingle<ProfileUserRow>(),
    ]);

  const studentAppUserId = studentResult.data?.app_user_id ?? null;
  const tutorAppUserId = tutorResult.data?.app_user_id ?? null;
  const identities = await loadAppUsers([studentAppUserId, tutorAppUserId]);

  return {
    identities,
    issueCase: issueResult.data ?? null,
    lesson,
    refundEligible: paymentResult.data?.payment_status === "paid",
    studentAppUserId,
    tutorAppUserId,
  };
}

async function loadAppUsers(
  ids: ReadonlyArray<string | null>,
): Promise<Map<string, AppUserRow>> {
  const lookup = new Map<string, AppUserRow>();
  const uniqueIds = Array.from(
    new Set(ids.filter((id): id is string => Boolean(id))),
  );
  if (uniqueIds.length === 0) {
    return lookup;
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("app_users")
    .select("avatar_url, full_name, id")
    .in("id", uniqueIds)
    .returns<AppUserRow[]>();
  for (const row of data ?? []) {
    lookup.set(row.id, row);
  }
  return lookup;
}

function toSummary(context: DisputeContext): LessonIssueDisputeSummary {
  const student = context.studentAppUserId
    ? context.identities.get(context.studentAppUserId)
    : undefined;
  const tutor = context.tutorAppUserId
    ? context.identities.get(context.tutorAppUserId)
    : undefined;
  return {
    issueTypeLabel: context.issueCase
      ? LESSON_ISSUE_TYPE_LABELS[context.issueCase.issue_type]
      : "Lesson issue",
    lessonId: context.lesson.id,
    refundEligible: context.refundEligible,
    scheduledStartAtLabel: formatUtcDateTime(context.lesson.scheduled_start_at),
    studentDisplayName: student?.full_name?.trim() || null,
    tutorDisplayName: tutor?.full_name?.trim() || null,
  };
}

export async function loadLessonIssueDisputeSummary(
  lessonId: string,
): Promise<LessonIssueDisputeSummary> {
  const context = await loadDisputeContext(lessonId);
  if (!context) {
    return {
      issueTypeLabel: "Lesson issue",
      lessonId,
      refundEligible: false,
      scheduledStartAtLabel: "Unknown lesson",
      studentDisplayName: null,
      tutorDisplayName: null,
    };
  }
  return toSummary(context);
}

function counterpartyClaimLabel(
  value: LessonIssueCounterpartyResponseType | null,
): string {
  if (!value) {
    return "No response yet";
  }
  if (value === "confirmed") {
    return "Confirmed the report";
  }
  if (value === "contested") {
    return "Contested the report";
  }
  return LESSON_ISSUE_TYPE_LABELS[value];
}

export async function loadLessonIssueDisputeDetail(
  lessonId: string,
): Promise<LessonIssueDisputeDetail | null> {
  const context = await loadDisputeContext(lessonId);
  if (!context) {
    return null;
  }
  const summary = toSummary(context);
  const issueCase = context.issueCase;

  const studentIdentity = context.studentAppUserId
    ? context.identities.get(context.studentAppUserId)
    : undefined;
  const tutorIdentity = context.tutorAppUserId
    ? context.identities.get(context.tutorAppUserId)
    : undefined;

  const reporterIsStudent = Boolean(
    issueCase &&
      context.studentAppUserId &&
      issueCase.reported_by_app_user_id === context.studentAppUserId,
  );
  const reporterIsTutor = Boolean(
    issueCase &&
      context.tutorAppUserId &&
      issueCase.reported_by_app_user_id === context.tutorAppUserId,
  );

  const reporterClaimLabel = issueCase
    ? LESSON_ISSUE_TYPE_LABELS[issueCase.issue_type]
    : "No claim recorded";
  const counterpartyLabel = issueCase
    ? counterpartyClaimLabel(issueCase.counterparty_response_type)
    : "No claim recorded";

  const student: LessonIssueDisputeParticipantClaim = {
    avatarSrc: studentIdentity?.avatar_url?.trim() || null,
    claimLabel: reporterIsStudent ? reporterClaimLabel : counterpartyLabel,
    claimSummary: reporterIsStudent
      ? issueCase?.reporter_summary ?? null
      : issueCase?.counterparty_summary ?? null,
    displayName: studentIdentity?.full_name?.trim() || null,
    isReporter: reporterIsStudent,
    role: "student",
  };

  const tutor: LessonIssueDisputeParticipantClaim = {
    avatarSrc: tutorIdentity?.avatar_url?.trim() || null,
    claimLabel: reporterIsTutor ? reporterClaimLabel : counterpartyLabel,
    claimSummary: reporterIsTutor
      ? issueCase?.reporter_summary ?? null
      : issueCase?.counterparty_summary ?? null,
    displayName: tutorIdentity?.full_name?.trim() || null,
    isReporter: reporterIsTutor,
    role: "tutor",
  };

  return {
    ...summary,
    reportedByRole: reporterIsStudent
      ? "student"
      : reporterIsTutor
        ? "tutor"
        : null,
    resolutionOutcomeLabel: issueCase?.resolution_outcome
      ? LESSON_ISSUE_OUTCOME_LABELS[issueCase.resolution_outcome]
      : null,
    student,
    tutor,
  };
}
