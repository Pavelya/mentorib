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

const TUTOR_LESSON_LIST_LIMIT = 50;

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
  id: string;
};

type AppUserSummaryRecord = {
  avatar_url: string | null;
  full_name: string | null;
  id: string;
  timezone: string;
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

export type TutorLessonStudentDto = {
  appUserId: string;
  avatarUrl: string | null;
  displayName: string;
  timezone: string;
};

export type TutorLessonScheduleDto = {
  endAt: string;
  isTrial: boolean;
  lessonTimezone: string;
  priceLabel: string;
  startAt: string;
};

export type TutorLessonContextDto = {
  focus: { id: string; label: string } | null;
  note: string | null;
  subject: { id: string; label: string } | null;
};

export type TutorLessonMeetingDto = {
  accessStatus: LessonMeetingAccessStatus;
  displayLabel: string | null;
  meetingMethod: LessonMeetingMethod;
  meetingUrl: string | null;
  normalizedHost: string | null;
  provider: string | null;
};

export type TutorLessonIssueDto = {
  caseStatus: LessonIssueCaseStatus;
  counterpartyDeadlineAt: string;
  id: string;
  issueType: LessonIssueType;
  reportedAt: string;
  reportedByCurrentActor: boolean;
  resolvedAt: string | null;
};

export type TutorLessonListItemDto = {
  context: TutorLessonContextDto;
  id: string;
  issue: TutorLessonIssueDto | null;
  lessonStatus: LessonStatus;
  requestExpiresAt: string;
  schedule: TutorLessonScheduleDto;
  student: TutorLessonStudentDto;
};

export type TutorLessonListGroupsDto = {
  pendingRequests: TutorLessonListItemDto[];
  upcoming: TutorLessonListItemDto[];
  past: TutorLessonListItemDto[];
};

export type TutorLessonListDto = {
  groups: TutorLessonListGroupsDto;
  state: "ready" | "preview" | "no_profile";
};

export type TutorLessonDetailDto = TutorLessonListItemDto & {
  isIssueEntryEligible: boolean;
  meeting: TutorLessonMeetingDto | null;
};

export async function getTutorLessonList(
  account: Pick<ResolvedAuthAccount, "id">,
): Promise<TutorLessonListDto> {
  const tutorProfile = await loadTutorProfile(account.id);

  if (!tutorProfile) {
    return {
      groups: { pendingRequests: [], upcoming: [], past: [] },
      state: "no_profile",
    };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: lessonRows, error: lessonError } = await supabase
    .from("lessons")
    .select(
      "id, cancelled_at, completed_at, currency_code, focus_snapshot, is_trial, lesson_status, lesson_timezone, meeting_method, price_amount, request_expires_at, scheduled_end_at, scheduled_start_at, student_note_snapshot, student_profile_id, subject_snapshot, tutor_profile_id",
    )
    .eq("tutor_profile_id", tutorProfile.id)
    .in("lesson_status", [...VISIBLE_LESSON_STATUSES])
    .order("scheduled_start_at", { ascending: true })
    .limit(TUTOR_LESSON_LIST_LIMIT)
    .returns<LessonRecord[]>();

  if (lessonError) {
    throw new Error("Could not load tutor lessons.");
  }

  const lessons = lessonRows ?? [];

  if (lessons.length === 0) {
    return {
      groups: { pendingRequests: [], upcoming: [], past: [] },
      state: "ready",
    };
  }

  const studentProfileIds = uniqueStrings(
    lessons.map((lesson) => lesson.student_profile_id),
  );
  const lessonIds = lessons.map((lesson) => lesson.id);

  const [studentLookup, issueLookup] = await Promise.all([
    loadStudentLookup(studentProfileIds),
    loadIssueLookup(lessonIds),
  ]);

  const items = lessons.flatMap<TutorLessonListItemDto>((lesson) => {
    const student = studentLookup.get(lesson.student_profile_id);

    if (!student) {
      return [];
    }

    const issueRecord = issueLookup.get(lesson.id) ?? null;

    return [
      buildLessonListItem({
        accountId: account.id,
        issueRecord,
        lesson,
        student,
      }),
    ];
  });

  const nowMs = Date.now();
  const pendingRequests: TutorLessonListItemDto[] = [];
  const upcoming: TutorLessonListItemDto[] = [];
  const past: TutorLessonListItemDto[] = [];

  for (const item of items) {
    if (item.lessonStatus === "pending") {
      pendingRequests.push(item);
      continue;
    }

    const startMs = new Date(item.schedule.startAt).getTime();

    if (
      (item.lessonStatus === "accepted" ||
        item.lessonStatus === "upcoming" ||
        item.lessonStatus === "in_progress") &&
      startMs >= nowMs - 60 * 60 * 1000
    ) {
      upcoming.push(item);
      continue;
    }

    past.push(item);
  }

  pendingRequests.sort(
    (left, right) =>
      new Date(left.requestExpiresAt).getTime() -
      new Date(right.requestExpiresAt).getTime(),
  );
  upcoming.sort(
    (left, right) =>
      new Date(left.schedule.startAt).getTime() -
      new Date(right.schedule.startAt).getTime(),
  );
  past.sort(
    (left, right) =>
      new Date(right.schedule.startAt).getTime() -
      new Date(left.schedule.startAt).getTime(),
  );

  return {
    groups: { pendingRequests, upcoming, past },
    state: "ready",
  };
}

export async function getTutorLessonDetail(
  account: Pick<ResolvedAuthAccount, "id">,
  lessonId: string,
): Promise<TutorLessonDetailDto | null> {
  if (!isUuid(lessonId)) {
    return null;
  }

  const tutorProfile = await loadTutorProfile(account.id);

  if (!tutorProfile) {
    return null;
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select(
      "id, cancelled_at, completed_at, currency_code, focus_snapshot, is_trial, lesson_status, lesson_timezone, meeting_method, price_amount, request_expires_at, scheduled_end_at, scheduled_start_at, student_note_snapshot, student_profile_id, subject_snapshot, tutor_profile_id",
    )
    .eq("id", lessonId)
    .eq("tutor_profile_id", tutorProfile.id)
    .maybeSingle<LessonRecord>();

  if (lessonError) {
    throw new Error("Could not load the tutor lesson.");
  }

  if (!lesson) {
    return null;
  }

  if (!VISIBLE_LESSON_STATUSES.includes(lesson.lesson_status)) {
    return null;
  }

  const studentLookup = await loadStudentLookup([lesson.student_profile_id]);
  const student = studentLookup.get(lesson.student_profile_id);

  if (!student) {
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
    student,
  });

  return {
    ...item,
    isIssueEntryEligible: isIssueEntryEligible(lesson.lesson_status, issueRecord),
    meeting: buildMeetingDto(lesson.lesson_status, meetingAccess),
  };
}

export function buildPreviewTutorLessonList(): TutorLessonListDto {
  const now = Date.now();
  const inTwoHours = new Date(now + 2 * 60 * 60 * 1000).toISOString();
  const inThreeHours = new Date(now + 3 * 60 * 60 * 1000).toISOString();
  const tomorrowStart = new Date(now + 26 * 60 * 60 * 1000).toISOString();
  const tomorrowEnd = new Date(now + 27 * 60 * 60 * 1000).toISOString();
  const expiresAt = new Date(now + 6 * 60 * 60 * 1000).toISOString();

  const pendingStudent: TutorLessonStudentDto = {
    appUserId: "preview-student-1",
    avatarUrl: null,
    displayName: "Lena Nowak",
    timezone: "Europe/Warsaw",
  };

  const upcomingStudent: TutorLessonStudentDto = {
    appUserId: "preview-student-2",
    avatarUrl: null,
    displayName: "Arjun Patel",
    timezone: "Asia/Kolkata",
  };

  return {
    groups: {
      pendingRequests: [
        {
          context: {
            focus: { id: "preview-focus", label: "Paper 2 essay structure" },
            note: "Wants help with argument scaffolding before the school checkpoint.",
            subject: { id: "preview-subject", label: "Biology HL" },
          },
          id: "preview-pending-1",
          issue: null,
          lessonStatus: "pending",
          requestExpiresAt: expiresAt,
          schedule: {
            endAt: inThreeHours,
            isTrial: false,
            lessonTimezone: "UTC",
            priceLabel: "$0.00",
            startAt: inTwoHours,
          },
          student: pendingStudent,
        },
      ],
      past: [],
      upcoming: [
        {
          context: {
            focus: { id: "preview-focus-2", label: "IA checkpoint review" },
            note: null,
            subject: { id: "preview-subject-2", label: "History HL" },
          },
          id: "preview-upcoming-1",
          issue: null,
          lessonStatus: "upcoming",
          requestExpiresAt: expiresAt,
          schedule: {
            endAt: tomorrowEnd,
            isTrial: false,
            lessonTimezone: "UTC",
            priceLabel: "$0.00",
            startAt: tomorrowStart,
          },
          student: upcomingStudent,
        },
      ],
    },
    state: "preview",
  };
}

export function buildPreviewTutorLessonDetail(): TutorLessonDetailDto {
  const list = buildPreviewTutorLessonList();
  const item = list.groups.pendingRequests[0];

  if (!item) {
    throw new Error("Preview tutor lesson list must contain a pending request.");
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

async function loadTutorProfile(
  appUserId: string,
): Promise<TutorProfileRecord | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("app_user_id, id")
    .eq("app_user_id", appUserId)
    .maybeSingle<TutorProfileRecord>();

  if (error) {
    throw new Error("Could not load the tutor profile.");
  }

  return data ?? null;
}

async function loadStudentLookup(
  studentProfileIds: readonly string[],
): Promise<Map<string, StudentProfileRecord & { user: AppUserSummaryRecord | null }>> {
  const uniqueIds = uniqueStrings(studentProfileIds);
  const lookup = new Map<
    string,
    StudentProfileRecord & { user: AppUserSummaryRecord | null }
  >();

  if (uniqueIds.length === 0) {
    return lookup;
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: studentRows, error: studentError } = await supabase
    .from("student_profiles")
    .select("app_user_id, id")
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
  student,
}: {
  accountId: string;
  issueRecord: IssueCaseRecord | null;
  lesson: LessonRecord;
  student: StudentProfileRecord & { user: AppUserSummaryRecord | null };
}): TutorLessonListItemDto {
  return {
    context: buildContextDto(lesson),
    id: lesson.id,
    issue: buildIssueDto(accountId, issueRecord),
    lessonStatus: lesson.lesson_status,
    requestExpiresAt: lesson.request_expires_at,
    schedule: buildScheduleDto(lesson),
    student: buildStudentDto(student),
  };
}

function buildContextDto(lesson: LessonRecord): TutorLessonContextDto {
  return {
    focus: parseSnapshotLabel(lesson.focus_snapshot),
    note: trimToNull(lesson.student_note_snapshot),
    subject: parseSnapshotLabel(lesson.subject_snapshot),
  };
}

function buildScheduleDto(lesson: LessonRecord): TutorLessonScheduleDto {
  return {
    endAt: lesson.scheduled_end_at,
    isTrial: lesson.is_trial,
    lessonTimezone: resolveTimezone(lesson.lesson_timezone),
    priceLabel: formatCurrencyFromMinorUnits(lesson.price_amount, lesson.currency_code),
    startAt: lesson.scheduled_start_at,
  };
}

function buildStudentDto(
  student: StudentProfileRecord & { user: AppUserSummaryRecord | null },
): TutorLessonStudentDto {
  const displayName =
    trimToNull(student.user?.full_name ?? null) ??
    "Mentor IB student";

  return {
    appUserId: student.app_user_id,
    avatarUrl: student.user?.avatar_url ?? null,
    displayName,
    timezone: resolveTimezone(student.user?.timezone ?? null),
  };
}

function buildIssueDto(
  accountId: string,
  issueRecord: IssueCaseRecord | null,
): TutorLessonIssueDto | null {
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
): TutorLessonMeetingDto | null {
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
