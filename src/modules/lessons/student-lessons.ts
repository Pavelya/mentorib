import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { resolveTimezone } from "@/lib/datetime";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  type LessonIssueCaseStatus,
  type LessonIssueType,
  type LessonMeetingAccessStatus,
  type LessonMeetingMethod,
  type LessonStatus,
} from "@/modules/lessons/constants";
import { formatCurrencyFromMinorUnits } from "@/modules/pricing/money";

const STUDENT_LESSON_LIST_LIMIT = 30;

const VISIBLE_LESSON_STATUSES: readonly LessonStatus[] = [
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "upcoming",
  "in_progress",
  "completed",
  "reviewed",
];

const MEETING_LINK_VISIBLE_STATUSES: readonly LessonStatus[] = [
  "accepted",
  "upcoming",
  "in_progress",
];

const ISSUE_ELIGIBLE_LESSON_STATUSES: readonly LessonStatus[] = [
  "accepted",
  "upcoming",
  "in_progress",
  "completed",
];

const TERMINAL_ISSUE_CASE_STATUSES: readonly LessonIssueCaseStatus[] = [
  "resolved",
  "dismissed",
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type LessonSnapshotLabel = {
  id: string;
  label: string;
  slug: string | null;
};

type LessonRecord = {
  cancelled_at: string | null;
  completed_at: string | null;
  currency_code: string;
  focus_snapshot: unknown;
  id: string;
  is_trial: boolean;
  lesson_status: LessonStatus;
  lesson_timezone: string;
  meeting_method: LessonMeetingMethod;
  price_amount: number;
  request_expires_at: string;
  scheduled_end_at: string;
  scheduled_start_at: string;
  student_note_snapshot: string | null;
  student_profile_id: string;
  subject_snapshot: unknown;
  tutor_profile_id: string;
};

type StudentProfileRecord = {
  app_user_id: string;
  id: string;
};

type TutorProfileRecord = {
  app_user_id: string;
  best_for_summary: string | null;
  display_name: string | null;
  headline: string | null;
  id: string;
  public_slug: string | null;
};

type AppUserSummaryRecord = {
  avatar_url: string | null;
  full_name: string | null;
  id: string;
};

type MeetingAccessRecord = {
  access_status: LessonMeetingAccessStatus;
  display_label: string | null;
  lesson_id: string;
  meeting_method: LessonMeetingMethod;
  meeting_url: string | null;
  normalized_host: string | null;
  provider: string | null;
};

type IssueCaseRecord = {
  case_status: LessonIssueCaseStatus;
  counterparty_deadline_at: string;
  id: string;
  issue_type: LessonIssueType;
  lesson_id: string;
  reported_at: string;
  reported_by_app_user_id: string;
  resolved_at: string | null;
};

export type StudentLessonTutorDto = {
  appUserId: string;
  avatarUrl: string | null;
  bestForSummary: string | null;
  displayName: string;
  headline: string | null;
  profileHref: `/tutors/${string}` | null;
};

export type StudentLessonScheduleDto = {
  endAt: string;
  isTrial: boolean;
  lessonTimezone: string;
  priceLabel: string;
  startAt: string;
};

export type StudentLessonContextDto = {
  focus: { id: string; label: string } | null;
  note: string | null;
  subject: { id: string; label: string } | null;
};

export type StudentLessonMeetingDto = {
  accessStatus: LessonMeetingAccessStatus;
  displayLabel: string | null;
  meetingMethod: LessonMeetingMethod;
  meetingUrl: string | null;
  normalizedHost: string | null;
  provider: string | null;
};

export type StudentLessonIssueDto = {
  caseStatus: LessonIssueCaseStatus;
  counterpartyDeadlineAt: string;
  id: string;
  issueType: LessonIssueType;
  reportedAt: string;
  reportedByCurrentActor: boolean;
  resolvedAt: string | null;
};

export type StudentLessonListItemDto = {
  context: StudentLessonContextDto;
  id: string;
  issue: StudentLessonIssueDto | null;
  lessonStatus: LessonStatus;
  schedule: StudentLessonScheduleDto;
  tutor: StudentLessonTutorDto;
};

export type StudentLessonListDto = {
  lessons: StudentLessonListItemDto[];
  state: "ready" | "preview";
};

export type StudentLessonDetailDto = StudentLessonListItemDto & {
  isIssueEntryEligible: boolean;
  meeting: StudentLessonMeetingDto | null;
};

export async function getStudentLessonList(
  account: Pick<ResolvedAuthAccount, "id">,
): Promise<StudentLessonListDto> {
  const supabase = createSupabaseServiceRoleClient();

  const studentProfile = await loadStudentProfile(account.id);

  if (!studentProfile) {
    return { lessons: [], state: "ready" };
  }

  const { data: lessonRows, error: lessonError } = await supabase
    .from("lessons")
    .select(
      "id, cancelled_at, completed_at, currency_code, focus_snapshot, is_trial, lesson_status, lesson_timezone, meeting_method, price_amount, request_expires_at, scheduled_end_at, scheduled_start_at, student_note_snapshot, student_profile_id, subject_snapshot, tutor_profile_id",
    )
    .eq("student_profile_id", studentProfile.id)
    .in("lesson_status", [...VISIBLE_LESSON_STATUSES])
    .order("scheduled_start_at", { ascending: false })
    .limit(STUDENT_LESSON_LIST_LIMIT)
    .returns<LessonRecord[]>();

  if (lessonError) {
    throw new Error("Could not load student lessons.");
  }

  const lessons = lessonRows ?? [];

  if (lessons.length === 0) {
    return { lessons: [], state: "ready" };
  }

  const tutorProfileIds = uniqueStrings(lessons.map((lesson) => lesson.tutor_profile_id));
  const lessonIds = lessons.map((lesson) => lesson.id);

  const [tutorLookup, issueLookup] = await Promise.all([
    loadTutorLookup(tutorProfileIds),
    loadIssueLookup(lessonIds),
  ]);

  const items = lessons.flatMap<StudentLessonListItemDto>((lesson) => {
    const tutor = tutorLookup.get(lesson.tutor_profile_id);

    if (!tutor) {
      return [];
    }

    const issueRecord = issueLookup.get(lesson.id) ?? null;

    return [
      buildLessonListItem({
        accountId: account.id,
        issueRecord,
        lesson,
        tutor,
      }),
    ];
  });

  return { lessons: items, state: "ready" };
}

export async function getStudentLessonDetail(
  account: Pick<ResolvedAuthAccount, "id">,
  lessonId: string,
): Promise<StudentLessonDetailDto | null> {
  if (!isUuid(lessonId)) {
    return null;
  }

  const studentProfile = await loadStudentProfile(account.id);

  if (!studentProfile) {
    return null;
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select(
      "id, cancelled_at, completed_at, currency_code, focus_snapshot, is_trial, lesson_status, lesson_timezone, meeting_method, price_amount, request_expires_at, scheduled_end_at, scheduled_start_at, student_note_snapshot, student_profile_id, subject_snapshot, tutor_profile_id",
    )
    .eq("id", lessonId)
    .eq("student_profile_id", studentProfile.id)
    .maybeSingle<LessonRecord>();

  if (lessonError) {
    throw new Error("Could not load the student lesson.");
  }

  if (!lesson) {
    return null;
  }

  if (!VISIBLE_LESSON_STATUSES.includes(lesson.lesson_status)) {
    return null;
  }

  const tutorLookup = await loadTutorLookup([lesson.tutor_profile_id]);
  const tutor = tutorLookup.get(lesson.tutor_profile_id);

  if (!tutor) {
    return null;
  }

  const [meetingAccess, issueRecord] = await Promise.all([
    loadMeetingAccess(lesson.id),
    loadIssueRecord(lesson.id),
  ]);

  const item = buildLessonListItem({
    accountId: account.id,
    issueRecord,
    lesson,
    tutor,
  });

  return {
    ...item,
    isIssueEntryEligible: isIssueEntryEligible(lesson.lesson_status, issueRecord),
    meeting: buildMeetingDto(lesson.lesson_status, meetingAccess),
  };
}

export function buildPreviewStudentLessonList(): StudentLessonListDto {
  const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const endAt = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

  return {
    lessons: [
      {
        context: {
          focus: { id: "preview-focus", label: "Paper 2 essay structure" },
          note: "Want to focus on argument scaffolding and source comparison.",
          subject: { id: "preview-subject", label: "History HL" },
        },
        id: "preview-lesson-1",
        issue: null,
        lessonStatus: "upcoming",
        schedule: {
          endAt,
          isTrial: false,
          lessonTimezone: "UTC",
          priceLabel: "$0.00",
          startAt,
        },
        tutor: {
          appUserId: "preview-tutor",
          avatarUrl: null,
          bestForSummary: "DP History HL students preparing for Paper 2.",
          displayName: "Maya Chen",
          headline: "IB History HL Examiner",
          profileHref: null,
        },
      },
    ],
    state: "preview",
  };
}

export function buildPreviewStudentLessonDetail(): StudentLessonDetailDto {
  const list = buildPreviewStudentLessonList();
  const item = list.lessons[0];

  if (!item) {
    throw new Error("Preview lesson list must contain a lesson.");
  }

  return {
    ...item,
    isIssueEntryEligible: false,
    meeting: {
      accessStatus: "missing",
      displayLabel: null,
      meetingMethod: "external_video_call",
      meetingUrl: null,
      normalizedHost: null,
      provider: null,
    },
  };
}

async function loadStudentProfile(
  appUserId: string,
): Promise<StudentProfileRecord | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("student_profiles")
    .select("app_user_id, id")
    .eq("app_user_id", appUserId)
    .maybeSingle<StudentProfileRecord>();

  if (error) {
    throw new Error("Could not load the student profile.");
  }

  return data ?? null;
}

async function loadTutorLookup(
  tutorProfileIds: readonly string[],
): Promise<Map<string, TutorProfileRecord & { user: AppUserSummaryRecord | null }>> {
  const uniqueIds = uniqueStrings(tutorProfileIds);
  const lookup = new Map<
    string,
    TutorProfileRecord & { user: AppUserSummaryRecord | null }
  >();

  if (uniqueIds.length === 0) {
    return lookup;
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: tutorRows, error: tutorError } = await supabase
    .from("tutor_profiles")
    .select("app_user_id, best_for_summary, display_name, headline, id, public_slug")
    .in("id", uniqueIds)
    .returns<TutorProfileRecord[]>();

  if (tutorError) {
    throw new Error("Could not load tutor profile summaries.");
  }

  const tutors = tutorRows ?? [];
  const appUserIds = uniqueStrings(tutors.map((tutor) => tutor.app_user_id));

  const userById = await loadAppUserSummaries(appUserIds);

  for (const tutor of tutors) {
    lookup.set(tutor.id, {
      ...tutor,
      user: userById.get(tutor.app_user_id) ?? null,
    });
  }

  return lookup;
}

async function loadAppUserSummaries(
  appUserIds: readonly string[],
): Promise<Map<string, AppUserSummaryRecord>> {
  const uniqueIds = uniqueStrings(appUserIds);
  const lookup = new Map<string, AppUserSummaryRecord>();

  if (uniqueIds.length === 0) {
    return lookup;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("avatar_url, full_name, id")
    .in("id", uniqueIds)
    .returns<AppUserSummaryRecord[]>();

  if (error) {
    throw new Error("Could not load tutor account summaries.");
  }

  for (const row of data ?? []) {
    lookup.set(row.id, row);
  }

  return lookup;
}

async function loadIssueLookup(
  lessonIds: readonly string[],
): Promise<Map<string, IssueCaseRecord>> {
  const uniqueIds = uniqueStrings(lessonIds);
  const lookup = new Map<string, IssueCaseRecord>();

  if (uniqueIds.length === 0) {
    return lookup;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("lesson_issue_cases")
    .select(
      "case_status, counterparty_deadline_at, id, issue_type, lesson_id, reported_at, reported_by_app_user_id, resolved_at",
    )
    .in("lesson_id", uniqueIds)
    .returns<IssueCaseRecord[]>();

  if (error) {
    throw new Error("Could not load lesson issue cases.");
  }

  for (const row of data ?? []) {
    lookup.set(row.lesson_id, row);
  }

  return lookup;
}

async function loadIssueRecord(lessonId: string): Promise<IssueCaseRecord | null> {
  const lookup = await loadIssueLookup([lessonId]);

  return lookup.get(lessonId) ?? null;
}

async function loadMeetingAccess(
  lessonId: string,
): Promise<MeetingAccessRecord | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("lesson_meeting_access")
    .select(
      "access_status, display_label, lesson_id, meeting_method, meeting_url, normalized_host, provider",
    )
    .eq("lesson_id", lessonId)
    .maybeSingle<MeetingAccessRecord>();

  if (error) {
    throw new Error("Could not load lesson meeting access.");
  }

  return data ?? null;
}

function buildLessonListItem({
  accountId,
  issueRecord,
  lesson,
  tutor,
}: {
  accountId: string;
  issueRecord: IssueCaseRecord | null;
  lesson: LessonRecord;
  tutor: TutorProfileRecord & { user: AppUserSummaryRecord | null };
}): StudentLessonListItemDto {
  return {
    context: buildContextDto(lesson),
    id: lesson.id,
    issue: buildIssueDto(accountId, issueRecord),
    lessonStatus: lesson.lesson_status,
    schedule: buildScheduleDto(lesson),
    tutor: buildTutorDto(tutor),
  };
}

function buildContextDto(lesson: LessonRecord): StudentLessonContextDto {
  return {
    focus: parseSnapshotLabel(lesson.focus_snapshot),
    note: trimToNull(lesson.student_note_snapshot),
    subject: parseSnapshotLabel(lesson.subject_snapshot),
  };
}

function buildScheduleDto(lesson: LessonRecord): StudentLessonScheduleDto {
  return {
    endAt: lesson.scheduled_end_at,
    isTrial: lesson.is_trial,
    lessonTimezone: resolveTimezone(lesson.lesson_timezone),
    priceLabel: formatCurrencyFromMinorUnits(lesson.price_amount, lesson.currency_code),
    startAt: lesson.scheduled_start_at,
  };
}

function buildTutorDto(
  tutor: TutorProfileRecord & { user: AppUserSummaryRecord | null },
): StudentLessonTutorDto {
  const displayName =
    trimToNull(tutor.display_name) ?? trimToNull(tutor.user?.full_name ?? null) ??
    "Mentor IB tutor";

  return {
    appUserId: tutor.app_user_id,
    avatarUrl: tutor.user?.avatar_url ?? null,
    bestForSummary: trimToNull(tutor.best_for_summary),
    displayName,
    headline: trimToNull(tutor.headline),
    profileHref: tutor.public_slug
      ? (`/tutors/${tutor.public_slug}` as `/tutors/${string}`)
      : null,
  };
}

function buildIssueDto(
  accountId: string,
  issueRecord: IssueCaseRecord | null,
): StudentLessonIssueDto | null {
  if (!issueRecord) {
    return null;
  }

  return {
    caseStatus: issueRecord.case_status,
    counterpartyDeadlineAt: issueRecord.counterparty_deadline_at,
    id: issueRecord.id,
    issueType: issueRecord.issue_type,
    reportedAt: issueRecord.reported_at,
    reportedByCurrentActor: issueRecord.reported_by_app_user_id === accountId,
    resolvedAt: issueRecord.resolved_at,
  };
}

function buildMeetingDto(
  lessonStatus: LessonStatus,
  record: MeetingAccessRecord | null,
): StudentLessonMeetingDto | null {
  if (!record) {
    return null;
  }

  const meetingLinkAllowed = MEETING_LINK_VISIBLE_STATUSES.includes(lessonStatus);
  const exposeUrl = meetingLinkAllowed && record.access_status === "ready";

  return {
    accessStatus: record.access_status,
    displayLabel: trimToNull(record.display_label),
    meetingMethod: record.meeting_method,
    meetingUrl: exposeUrl ? trimToNull(record.meeting_url) : null,
    normalizedHost: trimToNull(record.normalized_host),
    provider: trimToNull(record.provider),
  };
}

function isIssueEntryEligible(
  lessonStatus: LessonStatus,
  issueRecord: IssueCaseRecord | null,
): boolean {
  if (!ISSUE_ELIGIBLE_LESSON_STATUSES.includes(lessonStatus)) {
    return false;
  }

  if (!issueRecord) {
    return true;
  }

  return !TERMINAL_ISSUE_CASE_STATUSES.includes(issueRecord.case_status);
}

function parseSnapshotLabel(snapshot: unknown): { id: string; label: string } | null {
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

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
