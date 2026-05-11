import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { resolveTimezone } from "@/lib/datetime";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { type LessonStatus } from "@/modules/lessons/constants";

const TUTOR_STUDENTS_ROSTER_LIMIT = 100;
const TUTOR_STUDENTS_LESSON_SCAN_LIMIT = 500;
const ACTIVE_RECENT_LESSON_WINDOW_DAYS = 60;
const ACTIVE_RECENT_LESSON_WINDOW_MS =
  ACTIVE_RECENT_LESSON_WINDOW_DAYS * 24 * 60 * 60 * 1000;

const ROSTER_LESSON_STATUSES: readonly LessonStatus[] = [
  "pending",
  "accepted",
  "upcoming",
  "in_progress",
  "completed",
  "reviewed",
];

const CONFIRMED_FUTURE_LESSON_STATUSES: readonly LessonStatus[] = [
  "accepted",
  "upcoming",
  "in_progress",
];

const PAST_RELATIONSHIP_LESSON_STATUSES: readonly LessonStatus[] = [
  "accepted",
  "upcoming",
  "in_progress",
  "completed",
  "reviewed",
];

const PENDING_REQUEST_LESSON_STATUSES: readonly LessonStatus[] = ["pending"];

const COMPLETED_LESSON_STATUSES: readonly LessonStatus[] = [
  "completed",
  "reviewed",
];

export const tutorStudentsRelationshipStates = ["active", "inactive"] as const;

export type TutorStudentsRelationshipState =
  (typeof tutorStudentsRelationshipStates)[number];

export type TutorStudentsRosterFilter = {
  relationshipState?: TutorStudentsRelationshipState;
  search?: string;
  subjectId?: string;
};

export type TutorStudentsRosterSubjectDto = {
  id: string;
  label: string;
};

export type TutorStudentsRosterItemDto = {
  appUserId: string;
  avatarUrl: string | null;
  completedLessonCount: number;
  displayName: string;
  lastLessonAt: string | null;
  pendingRequestCount: number;
  relationshipState: TutorStudentsRelationshipState;
  studentProfileId: string;
  subjects: TutorStudentsRosterSubjectDto[];
  timezone: string;
  upcomingLessonAt: string | null;
};

export type TutorStudentsRosterAvailableSubjectsDto =
  TutorStudentsRosterSubjectDto[];

export type TutorStudentsRosterDto = {
  availableSubjects: TutorStudentsRosterAvailableSubjectsDto;
  items: TutorStudentsRosterItemDto[];
  state: "ready" | "preview" | "no_profile";
};

export type TutorStudentRelationshipLessonDto = {
  endAt: string;
  focus: TutorStudentsRosterSubjectDto | null;
  id: string;
  lessonStatus: LessonStatus;
  startAt: string;
  subject: TutorStudentsRosterSubjectDto | null;
};

export type TutorStudentRelationshipDto = {
  appUserId: string;
  avatarUrl: string | null;
  completedLessonCount: number;
  displayName: string;
  lastLessonAt: string | null;
  pendingRequestCount: number;
  recentLessons: TutorStudentRelationshipLessonDto[];
  relationshipState: TutorStudentsRelationshipState;
  studentProfileId: string;
  subjects: TutorStudentsRosterSubjectDto[];
  timezone: string;
  upcomingLessonAt: string | null;
};

export type TutorStudentRelationshipResult =
  | { relationship: TutorStudentRelationshipDto; state: "ready" | "preview" }
  | { relationship: null; state: "no_profile" | "not_found" };

const RELATIONSHIP_RECENT_LESSONS_LIMIT = 5;

export type LessonRosterRecord = {
  focus_snapshot: unknown;
  id: string;
  lesson_status: LessonStatus;
  request_expires_at: string;
  scheduled_end_at: string;
  scheduled_start_at: string;
  student_profile_id: string;
  subject_snapshot: unknown;
};

type StudentProfileRecord = {
  app_user_id: string;
  display_name: string | null;
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

type LessonSnapshotLabel = {
  id: string;
  label: string;
};

type RosterAggregate = {
  completedLessonCount: number;
  lastLessonAt: string | null;
  pendingRequestCount: number;
  studentProfileId: string;
  subjects: Map<string, string>;
  upcomingLessonAt: string | null;
};

export async function getTutorStudentsRoster(
  account: Pick<ResolvedAuthAccount, "id">,
  filter: TutorStudentsRosterFilter = {},
): Promise<TutorStudentsRosterDto> {
  const tutorProfile = await loadTutorProfile(account.id);

  if (!tutorProfile) {
    return {
      availableSubjects: [],
      items: [],
      state: "no_profile",
    };
  }

  const lessons = await loadRosterLessons(tutorProfile.id);

  if (lessons.length === 0) {
    return {
      availableSubjects: [],
      items: [],
      state: "ready",
    };
  }

  const aggregateByStudent = aggregateLessonsByStudent(lessons);
  const studentProfileIds = Array.from(aggregateByStudent.keys());
  const studentLookup = await loadStudentLookup(studentProfileIds);

  const items = studentProfileIds.flatMap<TutorStudentsRosterItemDto>(
    (studentProfileId) => {
      const aggregate = aggregateByStudent.get(studentProfileId);
      const student = studentLookup.get(studentProfileId);

      if (!aggregate || !student) {
        return [];
      }

      return [buildRosterItem(aggregate, student)];
    },
  );

  const availableSubjects = collectAvailableSubjects(items);
  const filteredItems = applyRosterFilter(items, filter)
    .sort(compareRosterItems)
    .slice(0, TUTOR_STUDENTS_ROSTER_LIMIT);

  return {
    availableSubjects,
    items: filteredItems,
    state: "ready",
  };
}

export async function getTutorStudentRelationship(
  account: Pick<ResolvedAuthAccount, "id">,
  studentProfileId: string,
): Promise<TutorStudentRelationshipResult> {
  const trimmedId = studentProfileId.trim();

  if (trimmedId.length === 0) {
    return { relationship: null, state: "not_found" };
  }

  const tutorProfile = await loadTutorProfile(account.id);

  if (!tutorProfile) {
    return { relationship: null, state: "no_profile" };
  }

  const lessons = await loadRelationshipLessons(tutorProfile.id, trimmedId);

  if (lessons.length === 0) {
    return { relationship: null, state: "not_found" };
  }

  const aggregateByStudent = aggregateLessonsByStudent(lessons);
  const aggregate = aggregateByStudent.get(trimmedId);

  if (!aggregate) {
    return { relationship: null, state: "not_found" };
  }

  const studentLookup = await loadStudentLookup([trimmedId]);
  const student = studentLookup.get(trimmedId);

  if (!student) {
    return { relationship: null, state: "not_found" };
  }

  const rosterItem = buildRosterItem(aggregate, student);

  return {
    relationship: {
      ...rosterItem,
      recentLessons: buildRecentLessons(lessons),
    },
    state: "ready",
  };
}

export function buildPreviewTutorStudentRelationship(
  studentProfileId: string,
): TutorStudentRelationshipResult {
  const preview = buildPreviewTutorStudentsRoster();
  const item = preview.items.find(
    (candidate) => candidate.studentProfileId === studentProfileId,
  );

  if (!item) {
    return { relationship: null, state: "not_found" };
  }

  const now = Date.now();
  const upcomingLessonAt = item.upcomingLessonAt;
  const recentLessons: TutorStudentRelationshipLessonDto[] = [];

  if (upcomingLessonAt) {
    const startMs = new Date(upcomingLessonAt).getTime();
    recentLessons.push({
      endAt: new Date(startMs + 60 * 60 * 1000).toISOString(),
      focus: null,
      id: `${item.studentProfileId}-upcoming`,
      lessonStatus: "accepted",
      startAt: upcomingLessonAt,
      subject: item.subjects[0] ?? null,
    });
  }

  if (item.lastLessonAt) {
    const startMs = new Date(item.lastLessonAt).getTime();
    recentLessons.push({
      endAt: new Date(startMs + 60 * 60 * 1000).toISOString(),
      focus: null,
      id: `${item.studentProfileId}-recent`,
      lessonStatus: "completed",
      startAt: item.lastLessonAt,
      subject: item.subjects[0] ?? null,
    });
  }

  if (recentLessons.length === 0) {
    recentLessons.push({
      endAt: new Date(now).toISOString(),
      focus: null,
      id: `${item.studentProfileId}-placeholder`,
      lessonStatus: "pending",
      startAt: new Date(now).toISOString(),
      subject: item.subjects[0] ?? null,
    });
  }

  return {
    relationship: { ...item, recentLessons },
    state: "preview",
  };
}

export function buildRecentLessons(
  lessons: readonly LessonRosterRecord[],
): TutorStudentRelationshipLessonDto[] {
  return [...lessons]
    .sort(
      (left, right) =>
        new Date(right.scheduled_start_at).getTime() -
        new Date(left.scheduled_start_at).getTime(),
    )
    .slice(0, RELATIONSHIP_RECENT_LESSONS_LIMIT)
    .map((lesson) => ({
      endAt: lesson.scheduled_end_at,
      focus: parseSnapshotLabel(lesson.focus_snapshot),
      id: lesson.id,
      lessonStatus: lesson.lesson_status,
      startAt: lesson.scheduled_start_at,
      subject: parseSnapshotLabel(lesson.subject_snapshot),
    }));
}

export function buildPreviewTutorStudentsRoster(): TutorStudentsRosterDto {
  const now = Date.now();
  const upcomingLessonAt = new Date(now + 26 * 60 * 60 * 1000).toISOString();
  const recentLessonAt = new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString();
  const olderLessonAt = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();

  return {
    availableSubjects: [
      { id: "preview-subject-bio", label: "Biology HL" },
      { id: "preview-subject-history", label: "History HL" },
    ],
    items: [
      {
        appUserId: "preview-student-1",
        avatarUrl: null,
        completedLessonCount: 4,
        displayName: "Lena Nowak",
        lastLessonAt: recentLessonAt,
        pendingRequestCount: 1,
        relationshipState: "active",
        studentProfileId: "preview-student-profile-1",
        subjects: [{ id: "preview-subject-bio", label: "Biology HL" }],
        timezone: "Europe/Warsaw",
        upcomingLessonAt,
      },
      {
        appUserId: "preview-student-2",
        avatarUrl: null,
        completedLessonCount: 2,
        displayName: "Arjun Patel",
        lastLessonAt: olderLessonAt,
        pendingRequestCount: 0,
        relationshipState: "inactive",
        studentProfileId: "preview-student-profile-2",
        subjects: [{ id: "preview-subject-history", label: "History HL" }],
        timezone: "Asia/Kolkata",
        upcomingLessonAt: null,
      },
    ],
    state: "preview",
  };
}

export function aggregateLessonsByStudent(
  lessons: readonly LessonRosterRecord[],
  nowMs: number = Date.now(),
): Map<string, RosterAggregate> {
  const aggregate = new Map<string, RosterAggregate>();

  for (const lesson of lessons) {
    const existing =
      aggregate.get(lesson.student_profile_id) ??
      ({
        completedLessonCount: 0,
        lastLessonAt: null,
        pendingRequestCount: 0,
        studentProfileId: lesson.student_profile_id,
        subjects: new Map<string, string>(),
        upcomingLessonAt: null,
      } satisfies RosterAggregate);

    const startMs = new Date(lesson.scheduled_start_at).getTime();
    const isUpcoming =
      CONFIRMED_FUTURE_LESSON_STATUSES.includes(lesson.lesson_status) &&
      startMs >= nowMs;
    const isPastRelationshipLesson =
      PAST_RELATIONSHIP_LESSON_STATUSES.includes(lesson.lesson_status) &&
      startMs < nowMs;
    const isCompleted = COMPLETED_LESSON_STATUSES.includes(lesson.lesson_status);
    const isPendingRequest = PENDING_REQUEST_LESSON_STATUSES.includes(
      lesson.lesson_status,
    );

    if (isPendingRequest) {
      existing.pendingRequestCount += 1;
    }

    if (isCompleted) {
      existing.completedLessonCount += 1;
    }

    if (
      isPastRelationshipLesson &&
      (existing.lastLessonAt === null ||
        startMs > new Date(existing.lastLessonAt).getTime())
    ) {
      existing.lastLessonAt = lesson.scheduled_start_at;
    }

    if (
      isUpcoming &&
      (existing.upcomingLessonAt === null ||
        startMs < new Date(existing.upcomingLessonAt).getTime())
    ) {
      existing.upcomingLessonAt = lesson.scheduled_start_at;
    }

    const subject = parseSnapshotLabel(lesson.subject_snapshot);
    if (subject && !existing.subjects.has(subject.id)) {
      existing.subjects.set(subject.id, subject.label);
    }

    aggregate.set(lesson.student_profile_id, existing);
  }

  return aggregate;
}

export function deriveRelationshipState(
  aggregate: Pick<RosterAggregate, "lastLessonAt" | "upcomingLessonAt">,
  nowMs: number = Date.now(),
): TutorStudentsRelationshipState {
  if (aggregate.upcomingLessonAt) {
    return "active";
  }

  if (aggregate.lastLessonAt) {
    const lastMs = new Date(aggregate.lastLessonAt).getTime();
    if (nowMs - lastMs <= ACTIVE_RECENT_LESSON_WINDOW_MS) {
      return "active";
    }
  }

  return "inactive";
}

export function applyRosterFilter(
  items: readonly TutorStudentsRosterItemDto[],
  filter: TutorStudentsRosterFilter,
): TutorStudentsRosterItemDto[] {
  const search = filter.search?.trim().toLocaleLowerCase() ?? "";
  const subjectId = filter.subjectId?.trim() ?? "";
  const relationshipState = filter.relationshipState ?? null;

  return items.filter((item) => {
    if (search.length > 0) {
      if (!item.displayName.toLocaleLowerCase().includes(search)) {
        return false;
      }
    }

    if (relationshipState && item.relationshipState !== relationshipState) {
      return false;
    }

    if (subjectId.length > 0) {
      const matchesSubject = item.subjects.some(
        (subject) => subject.id === subjectId,
      );
      if (!matchesSubject) {
        return false;
      }
    }

    return true;
  });
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

async function loadRosterLessons(
  tutorProfileId: string,
): Promise<LessonRosterRecord[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(
      "focus_snapshot, id, lesson_status, request_expires_at, scheduled_end_at, scheduled_start_at, student_profile_id, subject_snapshot",
    )
    .eq("tutor_profile_id", tutorProfileId)
    .in("lesson_status", [...ROSTER_LESSON_STATUSES])
    .order("scheduled_start_at", { ascending: false })
    .limit(TUTOR_STUDENTS_LESSON_SCAN_LIMIT)
    .returns<LessonRosterRecord[]>();

  if (error) {
    throw new Error("Could not load tutor students roster lessons.");
  }

  return data ?? [];
}

async function loadRelationshipLessons(
  tutorProfileId: string,
  studentProfileId: string,
): Promise<LessonRosterRecord[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(
      "focus_snapshot, id, lesson_status, request_expires_at, scheduled_end_at, scheduled_start_at, student_profile_id, subject_snapshot",
    )
    .eq("tutor_profile_id", tutorProfileId)
    .eq("student_profile_id", studentProfileId)
    .in("lesson_status", [...ROSTER_LESSON_STATUSES])
    .order("scheduled_start_at", { ascending: false })
    .limit(TUTOR_STUDENTS_LESSON_SCAN_LIMIT)
    .returns<LessonRosterRecord[]>();

  if (error) {
    throw new Error("Could not load tutor student relationship lessons.");
  }

  return data ?? [];
}

async function loadStudentLookup(
  studentProfileIds: readonly string[],
): Promise<
  Map<string, StudentProfileRecord & { user: AppUserSummaryRecord | null }>
> {
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
    .select("app_user_id, display_name, id")
    .in("id", uniqueIds)
    .returns<StudentProfileRecord[]>();

  if (studentError) {
    throw new Error("Could not load tutor students roster student profiles.");
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
    throw new Error("Could not load tutor students roster account summaries.");
  }

  for (const row of data ?? []) {
    lookup.set(row.id, row);
  }

  return lookup;
}

function buildRosterItem(
  aggregate: RosterAggregate,
  student: StudentProfileRecord & { user: AppUserSummaryRecord | null },
): TutorStudentsRosterItemDto {
  const subjects = Array.from(aggregate.subjects.entries())
    .map(([id, label]) => ({ id, label }))
    .sort((left, right) => left.label.localeCompare(right.label));

  const displayName =
    trimToNull(student.display_name) ??
    trimToNull(student.user?.full_name ?? null) ??
    "Mentor IB student";

  return {
    appUserId: student.app_user_id,
    avatarUrl: student.user?.avatar_url ?? null,
    completedLessonCount: aggregate.completedLessonCount,
    displayName,
    lastLessonAt: aggregate.lastLessonAt,
    pendingRequestCount: aggregate.pendingRequestCount,
    relationshipState: deriveRelationshipState(aggregate),
    studentProfileId: aggregate.studentProfileId,
    subjects,
    timezone: resolveTimezone(student.user?.timezone ?? null),
    upcomingLessonAt: aggregate.upcomingLessonAt,
  };
}

function collectAvailableSubjects(
  items: readonly TutorStudentsRosterItemDto[],
): TutorStudentsRosterSubjectDto[] {
  const lookup = new Map<string, string>();

  for (const item of items) {
    for (const subject of item.subjects) {
      if (!lookup.has(subject.id)) {
        lookup.set(subject.id, subject.label);
      }
    }
  }

  return Array.from(lookup.entries())
    .map(([id, label]) => ({ id, label }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function compareRosterItems(
  left: TutorStudentsRosterItemDto,
  right: TutorStudentsRosterItemDto,
): number {
  const leftRecency = recencyScore(left);
  const rightRecency = recencyScore(right);

  if (leftRecency !== rightRecency) {
    return rightRecency - leftRecency;
  }

  return left.displayName.localeCompare(right.displayName);
}

function recencyScore(item: TutorStudentsRosterItemDto): number {
  if (item.upcomingLessonAt) {
    return new Date(item.upcomingLessonAt).getTime();
  }

  if (item.lastLessonAt) {
    return new Date(item.lastLessonAt).getTime();
  }

  return 0;
}

function parseSnapshotLabel(snapshot: unknown): LessonSnapshotLabel | null {
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

export const tutorStudentsRosterTestables = {
  ACTIVE_RECENT_LESSON_WINDOW_DAYS,
  ROSTER_LESSON_STATUSES,
  TUTOR_STUDENTS_ROSTER_LIMIT,
};
