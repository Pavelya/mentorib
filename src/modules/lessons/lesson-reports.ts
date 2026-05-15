import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { captureServerEvent } from "@/lib/analytics/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  type LessonReportStatus,
  type LessonStatus,
  type PersistedLessonReportStatus,
  lessonReportStatuses,
} from "@/modules/lessons/constants";
import {
  canEditLessonReport,
  canShareLessonReport,
  canSubmitLessonReport,
  isLessonReportLocked,
  type LessonReportContent,
  type LessonReportContentInput,
} from "@/modules/lessons/lesson-report-state";
import { createLessonReportSharedNotification } from "@/modules/notifications/lifecycle";

export {
  canAcknowledgeLessonReport,
  canDraftLessonReport,
  canEditLessonReport,
  canShareLessonReport,
  canSubmitLessonReport,
  isLessonReportLocked,
  reportHasShareableContent,
} from "@/modules/lessons/lesson-report-state";
export type {
  LessonReportContent,
  LessonReportContentInput,
} from "@/modules/lessons/lesson-report-state";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const REPORT_FIELD_MAX_LENGTH = 2000;
const CONFIDENCE_SIGNAL_MAX_LENGTH = 500;

const TUTOR_RECENT_RECAPS_DEFAULT_LIMIT = 5;

// Lesson recap drafting opens once the lesson is completed. `reviewed` is
// treated the same so the tutor can still author / share / acknowledge a
// recap after a student leaves a review.
const REPORTABLE_LESSON_STATUSES: readonly LessonStatus[] = [
  "completed",
  "reviewed",
];

type LessonReportRow = {
  acknowledged_at: string | null;
  coverage_summary: string | null;
  created_at: string;
  goal_summary: string | null;
  id: string;
  lesson_id: string;
  next_steps_summary: string | null;
  report_status: PersistedLessonReportStatus;
  student_confidence_signal: string | null;
  student_visible_at: string | null;
  submitted_at: string | null;
  updated_at: string;
};

type LessonOwnershipRow = {
  completed_at: string | null;
  id: string;
  lesson_status: LessonStatus;
  scheduled_start_at: string;
  scheduled_end_at: string;
  student_profile_id: string;
  subject_snapshot: unknown;
  tutor_profile_id: string;
};

type StudentProfileRow = { id: string };

type TutorProfileRow = { app_user_id: string; id: string };

type RecentRecapLessonRow = {
  focus_snapshot: unknown;
  id: string;
  lesson_status: LessonStatus;
  scheduled_end_at: string;
  scheduled_start_at: string;
  student_profile_id: string;
  subject_snapshot: unknown;
};

export type TutorLessonReportDto = {
  acknowledgedAt: string | null;
  content: LessonReportContent;
  id: string;
  isLocked: boolean;
  reportStatus: PersistedLessonReportStatus;
  studentVisibleAt: string | null;
  submittedAt: string | null;
  updatedAt: string;
};

export type TutorLessonReportEligibility = {
  isEligibleToDraft: boolean;
  isEligibleToEdit: boolean;
  isEligibleToShare: boolean;
  isEligibleToSubmit: boolean;
};

export type TutorLessonReportView =
  | (TutorLessonReportEligibility & {
      kind: "due";
      report: null;
      status: "due";
    })
  | (TutorLessonReportEligibility & {
      kind: "report";
      report: TutorLessonReportDto;
      status: PersistedLessonReportStatus;
    })
  | (TutorLessonReportEligibility & {
      kind: "not_ready";
      report: null;
      status: "not_ready";
    });

export type StudentLessonReportDto = {
  acknowledgedAt: string | null;
  content: LessonReportContent;
  id: string;
  isEligibleToAcknowledge: boolean;
  reportStatus: Extract<PersistedLessonReportStatus, "shared" | "acknowledged">;
  studentVisibleAt: string;
};

export type RecentLessonRecapDto = {
  acknowledgedAt: string | null;
  focus: { id: string; label: string } | null;
  lessonHref: `/tutor/lessons/${string}`;
  lessonId: string;
  scheduledStartAt: string;
  sharedAt: string;
  subject: { id: string; label: string } | null;
};

export class LessonReportActionError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export function isLessonReportStatus(value: string): value is LessonReportStatus {
  return (lessonReportStatuses as readonly string[]).includes(value);
}

// View assembly.

export async function getTutorLessonReportView(
  account: Pick<ResolvedAuthAccount, "id">,
  lessonId: string,
): Promise<TutorLessonReportView | null> {
  if (!isUuid(lessonId)) {
    return null;
  }

  const tutorProfile = await loadTutorProfile(account.id);

  if (!tutorProfile) {
    return null;
  }

  const lesson = await loadLessonForTutor(tutorProfile.id, lessonId);

  if (!lesson) {
    return null;
  }

  if (!REPORTABLE_LESSON_STATUSES.includes(lesson.lesson_status)) {
    return buildNotReadyView();
  }

  if (lesson.completed_at === null) {
    return buildNotReadyView();
  }

  const row = await loadLessonReportRow(lesson.id);

  if (!row) {
    return buildDueView();
  }

  return buildReportView(row);
}

export async function getStudentLessonReportView(
  account: Pick<ResolvedAuthAccount, "id">,
  lessonId: string,
): Promise<StudentLessonReportDto | null> {
  if (!isUuid(lessonId)) {
    return null;
  }

  const studentProfile = await loadStudentProfile(account.id);

  if (!studentProfile) {
    return null;
  }

  const lesson = await loadLessonForStudent(studentProfile.id, lessonId);

  if (!lesson) {
    return null;
  }

  const row = await loadLessonReportRow(lesson.id);

  if (!row || row.student_visible_at === null) {
    return null;
  }

  if (row.report_status !== "shared" && row.report_status !== "acknowledged") {
    return null;
  }

  return {
    acknowledgedAt: row.acknowledged_at,
    content: rowToContent(row),
    id: row.id,
    isEligibleToAcknowledge: row.report_status === "shared",
    reportStatus: row.report_status,
    studentVisibleAt: row.student_visible_at,
  };
}

// Mutations.

export async function saveTutorLessonReportDraft(
  account: Pick<ResolvedAuthAccount, "id">,
  lessonId: string,
  input: LessonReportContentInput,
): Promise<TutorLessonReportDto> {
  const lesson = await requireLessonForTutorWrite(account.id, lessonId);

  const content = normalizeContent(input);
  const supabase = createSupabaseServiceRoleClient();

  const existing = await loadLessonReportRow(lesson.id);

  if (existing && !canEditLessonReport(existing.report_status)) {
    throw new LessonReportActionError(
      "report_locked",
      "This recap has already been shared and is locked.",
    );
  }

  if (existing) {
    const { data, error } = await supabase
      .from("lesson_reports")
      .update({
        coverage_summary: content.coverageSummary,
        goal_summary: content.goalSummary,
        next_steps_summary: content.nextStepsSummary,
        student_confidence_signal: content.studentConfidenceSignal,
      })
      .eq("id", existing.id)
      .select(reportColumnSelect())
      .single<LessonReportRow>();

    if (error || !data) {
      throw new LessonReportActionError(
        "report_update_failed",
        "We couldn't save your recap draft. Please try again in a moment.",
      );
    }

    return rowToTutorDto(data);
  }

  const { data, error } = await supabase
    .from("lesson_reports")
    .insert({
      coverage_summary: content.coverageSummary,
      goal_summary: content.goalSummary,
      lesson_id: lesson.id,
      next_steps_summary: content.nextStepsSummary,
      report_status: "drafted",
      student_confidence_signal: content.studentConfidenceSignal,
    })
    .select(reportColumnSelect())
    .single<LessonReportRow>();

  if (error || !data) {
    throw new LessonReportActionError(
      "report_create_failed",
      "We couldn't start your recap draft. Please try again in a moment.",
    );
  }

  return rowToTutorDto(data);
}

export async function submitTutorLessonReport(
  account: Pick<ResolvedAuthAccount, "id">,
  lessonId: string,
): Promise<TutorLessonReportDto> {
  const lesson = await requireLessonForTutorWrite(account.id, lessonId);

  const existing = await loadLessonReportRow(lesson.id);

  if (!existing) {
    throw new LessonReportActionError(
      "report_missing",
      "Save a draft of your recap before submitting it.",
    );
  }

  if (existing.report_status === "submitted") {
    return rowToTutorDto(existing);
  }

  if (!canSubmitLessonReport(existing.report_status, rowToContent(existing))) {
    throw new LessonReportActionError(
      "report_not_submittable",
      "Add at least one note before submitting this recap.",
    );
  }

  const submittedAt = new Date().toISOString();
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("lesson_reports")
    .update({
      report_status: "submitted",
      submitted_at: submittedAt,
    })
    .eq("id", existing.id)
    .select(reportColumnSelect())
    .single<LessonReportRow>();

  if (error || !data) {
    throw new LessonReportActionError(
      "report_update_failed",
      "We couldn't submit your recap. Please try again in a moment.",
    );
  }

  emitLessonRecapEvent({
    distinctId: account.id,
    eventName: "lesson_report_submitted",
    lessonId: lesson.id,
    subjectSnapshot: lesson.subject_snapshot,
  });

  return rowToTutorDto(data);
}

export async function shareTutorLessonReport(
  account: Pick<ResolvedAuthAccount, "id">,
  lessonId: string,
): Promise<TutorLessonReportDto> {
  const lesson = await requireLessonForTutorWrite(account.id, lessonId);

  const existing = await loadLessonReportRow(lesson.id);

  if (!existing) {
    throw new LessonReportActionError(
      "report_missing",
      "Submit your recap before sharing it with the student.",
    );
  }

  if (
    existing.report_status === "shared" ||
    existing.report_status === "acknowledged"
  ) {
    return rowToTutorDto(existing);
  }

  if (!canShareLessonReport(existing.report_status)) {
    throw new LessonReportActionError(
      "report_not_shareable",
      "Submit this recap before sharing it.",
    );
  }

  const sharedAt = new Date().toISOString();
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("lesson_reports")
    .update({
      report_status: "shared",
      student_visible_at: sharedAt,
    })
    .eq("id", existing.id)
    .select(reportColumnSelect())
    .single<LessonReportRow>();

  if (error || !data) {
    throw new LessonReportActionError(
      "report_update_failed",
      "We couldn't share your recap. Please try again in a moment.",
    );
  }

  emitLessonRecapEvent({
    distinctId: account.id,
    eventName: "lesson_report_shared",
    lessonId: lesson.id,
    subjectSnapshot: lesson.subject_snapshot,
  });

  await dispatchLessonReportSharedNotification({
    lessonId: lesson.id,
    studentProfileId: lesson.student_profile_id,
    tutorProfileId: lesson.tutor_profile_id,
  });

  return rowToTutorDto(data);
}

export async function acknowledgeStudentLessonReport(
  account: Pick<ResolvedAuthAccount, "id">,
  lessonId: string,
): Promise<StudentLessonReportDto> {
  if (!isUuid(lessonId)) {
    throw new LessonReportActionError(
      "not_found",
      "We couldn't find this lesson on your account.",
    );
  }

  const studentProfile = await loadStudentProfile(account.id);

  if (!studentProfile) {
    throw new LessonReportActionError(
      "not_found",
      "We couldn't find your student profile.",
    );
  }

  const lesson = await loadLessonForStudent(studentProfile.id, lessonId);

  if (!lesson) {
    throw new LessonReportActionError(
      "not_found",
      "We couldn't find this lesson on your account.",
    );
  }

  const existing = await loadLessonReportRow(lesson.id);

  if (
    !existing ||
    existing.student_visible_at === null ||
    (existing.report_status !== "shared" &&
      existing.report_status !== "acknowledged")
  ) {
    throw new LessonReportActionError(
      "report_not_visible",
      "This recap isn't available to acknowledge yet.",
    );
  }

  if (existing.report_status === "acknowledged") {
    return {
      acknowledgedAt: existing.acknowledged_at,
      content: rowToContent(existing),
      id: existing.id,
      isEligibleToAcknowledge: false,
      reportStatus: existing.report_status,
      studentVisibleAt: existing.student_visible_at,
    };
  }

  const acknowledgedAt = new Date().toISOString();
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("lesson_reports")
    .update({
      acknowledged_at: acknowledgedAt,
      report_status: "acknowledged",
    })
    .eq("id", existing.id)
    .select(reportColumnSelect())
    .single<LessonReportRow>();

  if (error || !data) {
    throw new LessonReportActionError(
      "report_update_failed",
      "We couldn't record your acknowledgement. Please try again in a moment.",
    );
  }

  if (data.report_status !== "shared" && data.report_status !== "acknowledged") {
    throw new LessonReportActionError(
      "report_inconsistent_state",
      "We couldn't finalize your acknowledgement. Please refresh and try again.",
    );
  }

  return {
    acknowledgedAt: data.acknowledged_at,
    content: rowToContent(data),
    id: data.id,
    isEligibleToAcknowledge: false,
    reportStatus: data.report_status,
    studentVisibleAt: data.student_visible_at ?? acknowledgedAt,
  };
}

export async function getRecentSharedLessonRecapsForTutor(
  account: Pick<ResolvedAuthAccount, "id">,
  studentProfileId: string,
  limit: number = TUTOR_RECENT_RECAPS_DEFAULT_LIMIT,
): Promise<RecentLessonRecapDto[]> {
  const trimmedStudentProfileId = studentProfileId.trim();

  if (!trimmedStudentProfileId) {
    return [];
  }

  const tutorProfile = await loadTutorProfile(account.id);

  if (!tutorProfile) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: lessonRows, error: lessonError } = await supabase
    .from("lessons")
    .select(
      "focus_snapshot, id, lesson_status, scheduled_end_at, scheduled_start_at, student_profile_id, subject_snapshot",
    )
    .eq("tutor_profile_id", tutorProfile.id)
    .eq("student_profile_id", trimmedStudentProfileId)
    .in("lesson_status", REPORTABLE_LESSON_STATUSES)
    .returns<RecentRecapLessonRow[]>();

  if (lessonError) {
    return [];
  }

  const lessons = lessonRows ?? [];

  if (lessons.length === 0) {
    return [];
  }

  const lessonsById = new Map<string, RecentRecapLessonRow>();
  for (const lesson of lessons) {
    lessonsById.set(lesson.id, lesson);
  }

  const { data: reportRows, error: reportError } = await supabase
    .from("lesson_reports")
    .select(
      "acknowledged_at, id, lesson_id, report_status, student_visible_at",
    )
    .in("lesson_id", Array.from(lessonsById.keys()))
    .not("student_visible_at", "is", null)
    .order("student_visible_at", { ascending: false })
    .limit(Math.max(1, Math.min(limit, 25)))
    .returns<
      Array<{
        acknowledged_at: string | null;
        id: string;
        lesson_id: string;
        report_status: PersistedLessonReportStatus;
        student_visible_at: string | null;
      }>
    >();

  if (reportError) {
    return [];
  }

  const recaps: RecentLessonRecapDto[] = [];

  for (const report of reportRows ?? []) {
    const lesson = lessonsById.get(report.lesson_id);

    if (!lesson || !report.student_visible_at) {
      continue;
    }

    if (
      report.report_status !== "shared" &&
      report.report_status !== "acknowledged"
    ) {
      continue;
    }

    recaps.push({
      acknowledgedAt: report.acknowledged_at,
      focus: parseSnapshotLabel(lesson.focus_snapshot),
      lessonHref: `/tutor/lessons/${lesson.id}` as `/tutor/lessons/${string}`,
      lessonId: lesson.id,
      scheduledStartAt: lesson.scheduled_start_at,
      sharedAt: report.student_visible_at,
      subject: parseSnapshotLabel(lesson.subject_snapshot),
    });
  }

  return recaps;
}

// Internals.

function buildDueView(): TutorLessonReportView {
  return {
    isEligibleToDraft: true,
    isEligibleToEdit: false,
    isEligibleToShare: false,
    isEligibleToSubmit: false,
    kind: "due",
    report: null,
    status: "due",
  };
}

function buildNotReadyView(): TutorLessonReportView {
  return {
    isEligibleToDraft: false,
    isEligibleToEdit: false,
    isEligibleToShare: false,
    isEligibleToSubmit: false,
    kind: "not_ready",
    report: null,
    status: "not_ready",
  };
}

function buildReportView(row: LessonReportRow): TutorLessonReportView {
  const dto = rowToTutorDto(row);
  const content = dto.content;

  return {
    isEligibleToDraft: false,
    isEligibleToEdit: canEditLessonReport(row.report_status),
    isEligibleToShare: canShareLessonReport(row.report_status),
    isEligibleToSubmit: canSubmitLessonReport(row.report_status, content),
    kind: "report",
    report: dto,
    status: row.report_status,
  };
}

function rowToTutorDto(row: LessonReportRow): TutorLessonReportDto {
  return {
    acknowledgedAt: row.acknowledged_at,
    content: rowToContent(row),
    id: row.id,
    isLocked: isLessonReportLocked(row.report_status),
    reportStatus: row.report_status,
    studentVisibleAt: row.student_visible_at,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
  };
}

function rowToContent(row: LessonReportRow): LessonReportContent {
  return {
    coverageSummary: trimToNull(row.coverage_summary),
    goalSummary: trimToNull(row.goal_summary),
    nextStepsSummary: trimToNull(row.next_steps_summary),
    studentConfidenceSignal: trimToNull(row.student_confidence_signal),
  };
}

function normalizeContent(
  input: LessonReportContentInput,
): LessonReportContent {
  return {
    coverageSummary: normalizeContentField(input.coverageSummary),
    goalSummary: normalizeContentField(input.goalSummary),
    nextStepsSummary: normalizeContentField(input.nextStepsSummary),
    studentConfidenceSignal: normalizeContentField(
      input.studentConfidenceSignal,
      CONFIDENCE_SIGNAL_MAX_LENGTH,
    ),
  };
}

function normalizeContentField(
  value: string | null | undefined,
  maxLength: number = REPORT_FIELD_MAX_LENGTH,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }

  return trimmed;
}

function trimToNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length === 0 ? null : trimmed;
}

async function requireLessonForTutorWrite(
  appUserId: string,
  lessonId: string,
): Promise<LessonOwnershipRow> {
  if (!isUuid(lessonId)) {
    throw new LessonReportActionError(
      "not_found",
      "We couldn't find this lesson on your account.",
    );
  }

  const tutorProfile = await loadTutorProfile(appUserId);

  if (!tutorProfile) {
    throw new LessonReportActionError(
      "tutor_profile_missing",
      "Your tutor profile is not set up.",
    );
  }

  const lesson = await loadLessonForTutor(tutorProfile.id, lessonId);

  if (!lesson) {
    throw new LessonReportActionError(
      "not_found",
      "We couldn't find this lesson on your account.",
    );
  }

  if (!REPORTABLE_LESSON_STATUSES.includes(lesson.lesson_status)) {
    throw new LessonReportActionError(
      "lesson_not_reportable",
      "Recaps can be authored once the lesson is marked completed.",
    );
  }

  if (lesson.completed_at === null) {
    throw new LessonReportActionError(
      "lesson_not_reportable",
      "Recaps can be authored once the lesson is marked completed.",
    );
  }

  return lesson;
}

async function loadTutorProfile(
  appUserId: string,
): Promise<TutorProfileRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("app_user_id, id")
    .eq("app_user_id", appUserId)
    .maybeSingle<TutorProfileRow>();

  if (error) {
    throw new LessonReportActionError(
      "profile_lookup_failed",
      "We couldn't load your tutor profile.",
    );
  }

  return data ?? null;
}

async function loadStudentProfile(
  appUserId: string,
): Promise<StudentProfileRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("app_user_id", appUserId)
    .maybeSingle<StudentProfileRow>();

  if (error) {
    throw new LessonReportActionError(
      "profile_lookup_failed",
      "We couldn't load your student profile.",
    );
  }

  return data ?? null;
}

async function loadLessonForTutor(
  tutorProfileId: string,
  lessonId: string,
): Promise<LessonOwnershipRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(
      "completed_at, id, lesson_status, scheduled_end_at, scheduled_start_at, student_profile_id, subject_snapshot, tutor_profile_id",
    )
    .eq("id", lessonId)
    .eq("tutor_profile_id", tutorProfileId)
    .maybeSingle<LessonOwnershipRow>();

  if (error) {
    throw new LessonReportActionError(
      "lesson_lookup_failed",
      "We couldn't load this lesson.",
    );
  }

  return data ?? null;
}

async function loadLessonForStudent(
  studentProfileId: string,
  lessonId: string,
): Promise<LessonOwnershipRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(
      "completed_at, id, lesson_status, scheduled_end_at, scheduled_start_at, student_profile_id, subject_snapshot, tutor_profile_id",
    )
    .eq("id", lessonId)
    .eq("student_profile_id", studentProfileId)
    .maybeSingle<LessonOwnershipRow>();

  if (error) {
    throw new LessonReportActionError(
      "lesson_lookup_failed",
      "We couldn't load this lesson.",
    );
  }

  return data ?? null;
}

async function loadLessonReportRow(
  lessonId: string,
): Promise<LessonReportRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("lesson_reports")
    .select(reportColumnSelect())
    .eq("lesson_id", lessonId)
    .maybeSingle<LessonReportRow>();

  if (error) {
    throw new LessonReportActionError(
      "report_lookup_failed",
      "We couldn't load this lesson recap.",
    );
  }

  return data ?? null;
}

function reportColumnSelect() {
  return "acknowledged_at, coverage_summary, created_at, goal_summary, id, lesson_id, next_steps_summary, report_status, student_confidence_signal, student_visible_at, submitted_at, updated_at";
}

async function dispatchLessonReportSharedNotification({
  lessonId,
  studentProfileId,
  tutorProfileId,
}: {
  lessonId: string;
  studentProfileId: string;
  tutorProfileId: string;
}) {
  try {
    const supabase = createSupabaseServiceRoleClient();

    const [{ data: studentRow }, { data: tutorRow }] = await Promise.all([
      supabase
        .from("student_profiles")
        .select("app_user_id")
        .eq("id", studentProfileId)
        .maybeSingle<{ app_user_id: string }>(),
      supabase
        .from("tutor_profiles")
        .select("app_user_id")
        .eq("id", tutorProfileId)
        .maybeSingle<{ app_user_id: string }>(),
    ]);

    if (!studentRow?.app_user_id) {
      return;
    }

    const tutorDisplayName = tutorRow?.app_user_id
      ? await loadAppUserDisplayName(tutorRow.app_user_id)
      : null;

    await createLessonReportSharedNotification({
      lessonId,
      studentAppUserId: studentRow.app_user_id,
      tutorDisplayName,
    });
  } catch {
    // notification dispatch must not block the share outcome
  }
}

async function loadAppUserDisplayName(
  appUserId: string,
): Promise<string | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("app_users")
    .select("full_name")
    .eq("id", appUserId)
    .maybeSingle<{ full_name: string | null }>();

  return trimToNull(data?.full_name ?? null);
}

function emitLessonRecapEvent({
  distinctId,
  eventName,
  lessonId,
  subjectSnapshot,
}: {
  distinctId: string;
  eventName: "lesson_report_submitted" | "lesson_report_shared";
  lessonId: string;
  subjectSnapshot: unknown;
}) {
  // Per `docs/architecture/analytics-and-product-telemetry-architecture-v1.md`
  // §11.6 and `docs/architecture/privacy-and-data-retention-architecture-v1.md`
  // §19.1, only structured non-PII context flows through analytics — recap
  // free text never reaches the event payload.
  try {
    captureServerEvent({
      distinctId,
      name: eventName,
      properties: {
        lesson_id: lessonId,
        subject_slug: parseSnapshotSlug(subjectSnapshot),
      },
    });
  } catch {
    // analytics dispatch must not block the recap mutation outcome
  }
}

function parseSnapshotSlug(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const candidate = snapshot as { slug?: unknown; id?: unknown };

  if (typeof candidate.slug === "string" && candidate.slug.trim().length > 0) {
    return candidate.slug.trim();
  }

  if (typeof candidate.id === "string" && candidate.id.trim().length > 0) {
    return candidate.id.trim();
  }

  return null;
}

function parseSnapshotLabel(
  snapshot: unknown,
): { id: string; label: string } | null {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const candidate = snapshot as { id?: unknown; label?: unknown };
  const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
  const label =
    typeof candidate.label === "string" ? candidate.label.trim() : "";

  if (!id || !label) {
    return null;
  }

  return { id, label };
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
