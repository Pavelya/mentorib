import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { resolveTimezone } from "@/lib/datetime";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  type LessonIssueCaseStatus,
  type LessonIssueType,
  type LessonStatus,
} from "@/modules/lessons/constants";
import { formatCurrencyFromMinorUnits } from "@/modules/pricing/money";
import {
  type PayoutReadinessStatus,
  type TutorApplicationStatus,
  type TutorProfileVisibilityStatus,
} from "@/modules/tutors/constants";

const PENDING_REQUEST_LIMIT = 5;
const UPCOMING_LESSON_LIMIT = 3;
const OPEN_ISSUE_LIMIT = 5;

const UPCOMING_LESSON_STATUSES: readonly LessonStatus[] = [
  "accepted",
  "upcoming",
  "in_progress",
];

const OPEN_ISSUE_CASE_STATUSES: readonly LessonIssueCaseStatus[] = [
  "reported",
  "counterparty_matched",
  "under_review",
];

type TutorProfileRecord = {
  application_status: TutorApplicationStatus;
  headline: string | null;
  id: string;
  payout_readiness_status: PayoutReadinessStatus;
  profile_visibility_status: TutorProfileVisibilityStatus;
  public_slug: string | null;
};

type LessonRecord = {
  currency_code: string;
  focus_snapshot: unknown;
  id: string;
  is_trial: boolean;
  lesson_status: LessonStatus;
  lesson_timezone: string;
  price_amount: number;
  request_expires_at: string;
  scheduled_end_at: string;
  scheduled_start_at: string;
  student_note_snapshot: string | null;
  student_profile_id: string;
  subject_snapshot: unknown;
};

type StudentProfileRecord = {
  app_user_id: string;
  display_name: string | null;
  id: string;
};

type AppUserSummaryRecord = {
  avatar_url: string | null;
  full_name: string | null;
  id: string;
  timezone: string;
};

type IssueCaseRecord = {
  case_status: LessonIssueCaseStatus;
  counterparty_deadline_at: string;
  id: string;
  issue_type: LessonIssueType;
  lesson_id: string;
  reported_at: string;
};

type StudentLookup = Map<
  string,
  StudentProfileRecord & { user: AppUserSummaryRecord | null }
>;

type LessonSnapshotLabel = {
  id: string;
  label: string;
};

export type TutorOverviewStudentDto = {
  appUserId: string;
  avatarUrl: string | null;
  displayName: string;
  timezone: string;
};

export type TutorOverviewLessonContextDto = {
  focus: { id: string; label: string } | null;
  note: string | null;
  subject: { id: string; label: string } | null;
};

export type TutorOverviewLessonDto = {
  context: TutorOverviewLessonContextDto;
  id: string;
  lessonStatus: LessonStatus;
  priceLabel: string;
  requestExpiresAt: string;
  scheduledEndAt: string;
  scheduledStartAt: string;
  student: TutorOverviewStudentDto;
};

export type TutorOverviewIssueDto = {
  caseStatus: LessonIssueCaseStatus;
  counterpartyDeadlineAt: string;
  id: string;
  issueType: LessonIssueType;
  lessonId: string;
  reportedAt: string;
  student: TutorOverviewStudentDto;
};

export type TutorOverviewReadinessDto = {
  applicationStatus: TutorApplicationStatus;
  payoutReadinessStatus: PayoutReadinessStatus;
  profileVisibilityStatus: TutorProfileVisibilityStatus;
};

export type TutorOverviewProfileDto = {
  displayName: string;
  headline: string | null;
};

export type TutorOverviewMetricsDto = {
  openIssueCount: number;
  pendingRequestCount: number;
  upcomingLessonCount: number;
};

export type TutorOverviewDto = {
  metrics: TutorOverviewMetricsDto;
  openIssues: TutorOverviewIssueDto[];
  pendingRequests: TutorOverviewLessonDto[];
  profile: TutorOverviewProfileDto;
  readiness: TutorOverviewReadinessDto;
  state: "ready" | "preview" | "no_profile";
  upcomingLessons: TutorOverviewLessonDto[];
};

export async function getTutorOverview(
  account: Pick<ResolvedAuthAccount, "full_name" | "id">,
): Promise<TutorOverviewDto> {
  const tutorProfile = await loadTutorProfile(account.id);

  if (!tutorProfile) {
    return buildEmptyOverview("no_profile");
  }

  const [pendingRows, upcomingRows] = await Promise.all([
    loadPendingRequestRows(tutorProfile.id),
    loadUpcomingLessonRows(tutorProfile.id),
  ]);

  const lessonRows: LessonRecord[] = [...pendingRows, ...upcomingRows];

  const studentLookup = await loadStudentLookup(
    uniqueStrings(lessonRows.map((lesson) => lesson.student_profile_id)),
  );

  const pendingRequests = pendingRows
    .map((lesson) => buildLessonDto(lesson, studentLookup))
    .filter((dto): dto is TutorOverviewLessonDto => dto !== null);

  const upcomingLessons = upcomingRows
    .map((lesson) => buildLessonDto(lesson, studentLookup))
    .filter((dto): dto is TutorOverviewLessonDto => dto !== null);

  const issueRows = await loadOpenIssueRows(tutorProfile.id);

  const openIssues = await buildOpenIssueDtos(issueRows, studentLookup);

  return {
    metrics: {
      openIssueCount: openIssues.length,
      pendingRequestCount: pendingRequests.length,
      upcomingLessonCount: upcomingLessons.length,
    },
    openIssues,
    pendingRequests,
    profile: {
      displayName: trimToNull(account.full_name) ?? "Mentor IB tutor",
      headline: trimToNull(tutorProfile.headline),
    },
    readiness: {
      applicationStatus: tutorProfile.application_status,
      payoutReadinessStatus: tutorProfile.payout_readiness_status,
      profileVisibilityStatus: tutorProfile.profile_visibility_status,
    },
    state: "ready",
    upcomingLessons,
  };
}

export function buildPreviewTutorOverview(): TutorOverviewDto {
  const now = Date.now();
  const inTwoHours = new Date(now + 2 * 60 * 60 * 1000).toISOString();
  const inThreeHours = new Date(now + 3 * 60 * 60 * 1000).toISOString();
  const tomorrowStart = new Date(now + 26 * 60 * 60 * 1000).toISOString();
  const tomorrowEnd = new Date(now + 27 * 60 * 60 * 1000).toISOString();
  const expiresAt = new Date(now + 6 * 60 * 60 * 1000).toISOString();

  const pendingStudent: TutorOverviewStudentDto = {
    appUserId: "preview-student-1",
    avatarUrl: null,
    displayName: "Lena Nowak",
    timezone: "Europe/Warsaw",
  };

  const upcomingStudent: TutorOverviewStudentDto = {
    appUserId: "preview-student-2",
    avatarUrl: null,
    displayName: "Arjun Patel",
    timezone: "Asia/Kolkata",
  };

  return {
    metrics: {
      openIssueCount: 0,
      pendingRequestCount: 1,
      upcomingLessonCount: 1,
    },
    openIssues: [],
    pendingRequests: [
      {
        context: {
          focus: { id: "preview-focus", label: "Paper 2 essay structure" },
          note: "Wants help with argument scaffolding before the school checkpoint.",
          subject: { id: "preview-subject", label: "Biology HL" },
        },
        id: "preview-pending-1",
        lessonStatus: "pending",
        priceLabel: "$0.00",
        requestExpiresAt: expiresAt,
        scheduledEndAt: inThreeHours,
        scheduledStartAt: inTwoHours,
        student: pendingStudent,
      },
    ],
    profile: {
      displayName: "Maya Chen",
      headline: "IB History HL Examiner",
    },
    readiness: {
      applicationStatus: "approved",
      payoutReadinessStatus: "pending_verification",
      profileVisibilityStatus: "public_visible",
    },
    state: "preview",
    upcomingLessons: [
      {
        context: {
          focus: { id: "preview-focus-2", label: "IA checkpoint review" },
          note: null,
          subject: { id: "preview-subject-2", label: "History HL" },
        },
        id: "preview-upcoming-1",
        lessonStatus: "upcoming",
        priceLabel: "$0.00",
        requestExpiresAt: expiresAt,
        scheduledEndAt: tomorrowEnd,
        scheduledStartAt: tomorrowStart,
        student: upcomingStudent,
      },
    ],
  };
}

async function loadTutorProfile(
  appUserId: string,
): Promise<TutorProfileRecord | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select(
      "application_status, headline, id, payout_readiness_status, profile_visibility_status, public_slug",
    )
    .eq("app_user_id", appUserId)
    .maybeSingle<TutorProfileRecord>();

  if (error) {
    throw new Error("Could not load the tutor profile.");
  }

  return data ?? null;
}

async function loadPendingRequestRows(
  tutorProfileId: string,
): Promise<LessonRecord[]> {
  const supabase = createSupabaseServiceRoleClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("lessons")
    .select(
      "currency_code, focus_snapshot, id, is_trial, lesson_status, lesson_timezone, price_amount, request_expires_at, scheduled_end_at, scheduled_start_at, student_note_snapshot, student_profile_id, subject_snapshot",
    )
    .eq("tutor_profile_id", tutorProfileId)
    .eq("lesson_status", "pending")
    .gt("request_expires_at", nowIso)
    .order("request_expires_at", { ascending: true })
    .limit(PENDING_REQUEST_LIMIT)
    .returns<LessonRecord[]>();

  if (error) {
    throw new Error("Could not load tutor pending requests.");
  }

  return data ?? [];
}

async function loadUpcomingLessonRows(
  tutorProfileId: string,
): Promise<LessonRecord[]> {
  const supabase = createSupabaseServiceRoleClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("lessons")
    .select(
      "currency_code, focus_snapshot, id, is_trial, lesson_status, lesson_timezone, price_amount, request_expires_at, scheduled_end_at, scheduled_start_at, student_note_snapshot, student_profile_id, subject_snapshot",
    )
    .eq("tutor_profile_id", tutorProfileId)
    .in("lesson_status", [...UPCOMING_LESSON_STATUSES])
    .gte("scheduled_end_at", nowIso)
    .order("scheduled_start_at", { ascending: true })
    .limit(UPCOMING_LESSON_LIMIT)
    .returns<LessonRecord[]>();

  if (error) {
    throw new Error("Could not load tutor upcoming lessons.");
  }

  return data ?? [];
}

async function loadOpenIssueRows(
  tutorProfileId: string,
): Promise<Array<IssueCaseRecord & { studentProfileId: string }>> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: issueRows, error: issueError } = await supabase
    .from("lesson_issue_cases")
    .select(
      "case_status, counterparty_deadline_at, id, issue_type, lesson_id, reported_at",
    )
    .in("case_status", [...OPEN_ISSUE_CASE_STATUSES])
    .order("reported_at", { ascending: false })
    .limit(OPEN_ISSUE_LIMIT * 4)
    .returns<IssueCaseRecord[]>();

  if (issueError) {
    throw new Error("Could not load tutor open issue cases.");
  }

  const issues = issueRows ?? [];

  if (issues.length === 0) {
    return [];
  }

  const lessonIds = uniqueStrings(issues.map((issue) => issue.lesson_id));

  const { data: lessonRows, error: lessonError } = await supabase
    .from("lessons")
    .select("id, student_profile_id, tutor_profile_id")
    .in("id", lessonIds)
    .eq("tutor_profile_id", tutorProfileId)
    .returns<Array<{ id: string; student_profile_id: string; tutor_profile_id: string }>>();

  if (lessonError) {
    throw new Error("Could not match tutor open issues to lessons.");
  }

  const ownedLessonById = new Map(
    (lessonRows ?? []).map((row) => [row.id, row.student_profile_id]),
  );

  const tutorIssues = issues.flatMap<IssueCaseRecord & { studentProfileId: string }>(
    (issue) => {
      const studentProfileId = ownedLessonById.get(issue.lesson_id);

      if (!studentProfileId) {
        return [];
      }

      return [{ ...issue, studentProfileId }];
    },
  );

  return tutorIssues.slice(0, OPEN_ISSUE_LIMIT);
}

async function loadStudentLookup(
  studentProfileIds: readonly string[],
): Promise<StudentLookup> {
  const lookup: StudentLookup = new Map();
  const uniqueIds = uniqueStrings(studentProfileIds);

  if (uniqueIds.length === 0) {
    return lookup;
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: studentRows, error: studentError } = await supabase
    .from("student_profiles")
    .select("app_user_id, display_name, id")
    .in("id", uniqueIds)
    .returns<StudentProfileRecord[]>();

  if (studentError) {
    throw new Error("Could not load student profile summaries.");
  }

  const students = studentRows ?? [];
  const appUserIds = uniqueStrings(students.map((student) => student.app_user_id));
  const userById = await loadAppUserSummaries(appUserIds);

  for (const student of students) {
    lookup.set(student.id, {
      ...student,
      user: userById.get(student.app_user_id) ?? null,
    });
  }

  return lookup;
}

async function loadAppUserSummaries(
  appUserIds: readonly string[],
): Promise<Map<string, AppUserSummaryRecord>> {
  const lookup = new Map<string, AppUserSummaryRecord>();
  const uniqueIds = uniqueStrings(appUserIds);

  if (uniqueIds.length === 0) {
    return lookup;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("avatar_url, full_name, id, timezone")
    .in("id", uniqueIds)
    .returns<AppUserSummaryRecord[]>();

  if (error) {
    throw new Error("Could not load student account summaries.");
  }

  for (const row of data ?? []) {
    lookup.set(row.id, row);
  }

  return lookup;
}

function buildLessonDto(
  lesson: LessonRecord,
  studentLookup: StudentLookup,
): TutorOverviewLessonDto | null {
  const studentRecord = studentLookup.get(lesson.student_profile_id);

  if (!studentRecord) {
    return null;
  }

  return {
    context: {
      focus: parseSnapshotLabel(lesson.focus_snapshot),
      note: trimToNull(lesson.student_note_snapshot),
      subject: parseSnapshotLabel(lesson.subject_snapshot),
    },
    id: lesson.id,
    lessonStatus: lesson.lesson_status,
    priceLabel: formatCurrencyFromMinorUnits(
      lesson.price_amount,
      lesson.currency_code,
    ),
    requestExpiresAt: lesson.request_expires_at,
    scheduledEndAt: lesson.scheduled_end_at,
    scheduledStartAt: lesson.scheduled_start_at,
    student: buildStudentDto(studentRecord),
  };
}

async function buildOpenIssueDtos(
  issueRows: Array<IssueCaseRecord & { studentProfileId: string }>,
  studentLookup: StudentLookup,
): Promise<TutorOverviewIssueDto[]> {
  if (issueRows.length === 0) {
    return [];
  }

  const missingStudentIds = issueRows
    .map((issue) => issue.studentProfileId)
    .filter((id) => !studentLookup.has(id));

  if (missingStudentIds.length > 0) {
    const additional = await loadStudentLookup(missingStudentIds);

    for (const [id, value] of additional) {
      studentLookup.set(id, value);
    }
  }

  return issueRows.flatMap<TutorOverviewIssueDto>((issue) => {
    const studentRecord = studentLookup.get(issue.studentProfileId);

    if (!studentRecord) {
      return [];
    }

    return [
      {
        caseStatus: issue.case_status,
        counterpartyDeadlineAt: issue.counterparty_deadline_at,
        id: issue.id,
        issueType: issue.issue_type,
        lessonId: issue.lesson_id,
        reportedAt: issue.reported_at,
        student: buildStudentDto(studentRecord),
      },
    ];
  });
}

function buildStudentDto(
  studentRecord: StudentProfileRecord & { user: AppUserSummaryRecord | null },
): TutorOverviewStudentDto {
  const displayName =
    trimToNull(studentRecord.display_name) ??
    trimToNull(studentRecord.user?.full_name ?? null) ??
    "Mentor IB student";

  return {
    appUserId: studentRecord.app_user_id,
    avatarUrl: studentRecord.user?.avatar_url ?? null,
    displayName,
    timezone: resolveTimezone(studentRecord.user?.timezone ?? null),
  };
}

function buildEmptyOverview(state: "no_profile"): TutorOverviewDto {
  return {
    metrics: {
      openIssueCount: 0,
      pendingRequestCount: 0,
      upcomingLessonCount: 0,
    },
    openIssues: [],
    pendingRequests: [],
    profile: {
      displayName: "Mentor IB tutor",
      headline: null,
    },
    readiness: {
      applicationStatus: "not_started",
      payoutReadinessStatus: "not_started",
      profileVisibilityStatus: "draft",
    },
    state,
    upcomingLessons: [],
  };
}

function parseSnapshotLabel(
  snapshot: unknown,
): { id: string; label: string } | null {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const candidate = snapshot as Partial<LessonSnapshotLabel>;
  const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
  const label = typeof candidate.label === "string" ? candidate.label.trim() : "";

  if (!id || !label) {
    return null;
  }

  return { id, label };
}

function trimToNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length === 0 ? null : trimmed;
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}
