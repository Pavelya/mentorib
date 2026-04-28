import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { createStripeServerClient, isStripeCheckoutConfigured } from "@/lib/stripe/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  createLessonIssueAcknowledgementNotification,
  createLessonUpdatedNotifications,
} from "@/modules/notifications/lifecycle";

import {
  type LessonIssueCaseStatus,
  type LessonIssueType,
  type LessonStatus,
  lessonIssueTypes,
} from "./constants";

const ISSUE_SUMMARY_MAX_LENGTH = 600;
const REFUND_FREE_NOTICE_MINUTES = 120;
const ISSUE_REPORT_LATE_WINDOW_MINUTES = 24 * 60;

const CANCELLABLE_LESSON_STATUSES: readonly LessonStatus[] = [
  "pending",
  "accepted",
  "upcoming",
  "in_progress",
];

const ISSUE_REPORTABLE_LESSON_STATUSES: readonly LessonStatus[] = [
  "accepted",
  "upcoming",
  "in_progress",
  "completed",
];

const TERMINAL_ISSUE_CASE_STATUSES: readonly LessonIssueCaseStatus[] = [
  "resolved",
  "dismissed",
];

export type ParticipantRole = "student" | "tutor";

const ROLE_REPORTABLE_ISSUE_TYPES: Record<ParticipantRole, readonly LessonIssueType[]> = {
  student: ["tutor_absent", "wrong_meeting_link", "technical_failure", "partial_delivery"],
  tutor: ["student_absent", "wrong_meeting_link", "technical_failure", "partial_delivery"],
};

export class LessonActionError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export type CancellationOutcome =
  | "authorization_released"
  | "refund_issued"
  | "no_refund";

export type CancellationPolicyView = {
  cancellable: boolean;
  hoursUntilStart: number | null;
  outcome: CancellationOutcome;
  reason: string;
};

type LessonRow = {
  cancelled_at: string | null;
  id: string;
  lesson_status: LessonStatus;
  scheduled_end_at: string;
  scheduled_start_at: string;
  student_profile_id: string;
  tutor_profile_id: string;
};

type PaymentRow = {
  id: string;
  payment_status:
    | "authorized"
    | "cancelled"
    | "failed"
    | "paid"
    | "pending"
    | "refunded";
  stripe_payment_intent_id: string | null;
};

type StudentProfileRow = { id: string };

type TutorProfileRow = { app_user_id: string; id: string };

export function buildCancellationPolicy(
  lesson: Pick<LessonRow, "lesson_status" | "scheduled_start_at" | "cancelled_at">,
  role: ParticipantRole,
  now: Date = new Date(),
): CancellationPolicyView {
  if (
    lesson.lesson_status === "cancelled" ||
    lesson.lesson_status === "declined" ||
    lesson.lesson_status === "completed" ||
    lesson.lesson_status === "reviewed"
  ) {
    return {
      cancellable: false,
      hoursUntilStart: null,
      outcome: "no_refund",
      reason: "This lesson can no longer be cancelled.",
    };
  }

  if (!CANCELLABLE_LESSON_STATUSES.includes(lesson.lesson_status)) {
    return {
      cancellable: false,
      hoursUntilStart: null,
      outcome: "no_refund",
      reason: "This lesson is not in a state that supports cancellation.",
    };
  }

  const minutesUntilStart = minutesBetween(
    now,
    new Date(lesson.scheduled_start_at),
  );
  const hoursUntilStart = minutesUntilStart / 60;

  if (lesson.lesson_status === "pending") {
    return {
      cancellable: true,
      hoursUntilStart,
      outcome: "authorization_released",
      reason:
        role === "student"
          ? "Your tutor has not accepted yet. Cancelling now releases the payment authorization without a charge."
          : "You have not accepted this request yet. Declining or cancelling here releases the student's payment authorization without a charge.",
    };
  }

  if (role === "tutor") {
    return {
      cancellable: true,
      hoursUntilStart,
      outcome: "refund_issued",
      reason:
        "Tutors can cancel a confirmed lesson at any time. The student receives a full refund and a reliability event is recorded against your account under the platform policy.",
    };
  }

  if (minutesUntilStart >= REFUND_FREE_NOTICE_MINUTES) {
    return {
      cancellable: true,
      hoursUntilStart,
      outcome: "refund_issued",
      reason:
        "You are cancelling at least 2 hours before the lesson, so the platform refunds the captured payment in full.",
    };
  }

  return {
    cancellable: true,
    hoursUntilStart,
    outcome: "no_refund",
    reason:
      "You are cancelling within 2 hours of the lesson, so the captured payment goes to your tutor under the platform cancellation policy.",
  };
}

export function buildStudentCancellationPolicy(
  lesson: Pick<LessonRow, "lesson_status" | "scheduled_start_at" | "cancelled_at">,
  now: Date = new Date(),
) {
  return buildCancellationPolicy(lesson, "student", now);
}

export function buildTutorCancellationPolicy(
  lesson: Pick<LessonRow, "lesson_status" | "scheduled_start_at" | "cancelled_at">,
  now: Date = new Date(),
) {
  return buildCancellationPolicy(lesson, "tutor", now);
}

export type CancelLessonInput = {
  account: Pick<ResolvedAuthAccount, "id" | "timezone">;
  lessonId: string;
  operationKey: string;
  role: ParticipantRole;
};

export async function cancelLessonAsParticipant(
  input: CancelLessonInput,
): Promise<CancellationOutcome> {
  const trimmedKey = input.operationKey.trim();

  if (!trimmedKey) {
    throw new LessonActionError(
      "missing_operation_key",
      "We couldn't secure the cancellation request. Refresh the page and try again.",
    );
  }

  const lesson = await loadLessonForParticipant(input.role, input.account.id, input.lessonId);

  if (!lesson) {
    throw new LessonActionError(
      "not_found",
      "We couldn't find this lesson on your account.",
    );
  }

  const operation = await ensureLessonCancelOperation(input.account.id, trimmedKey, lesson.id);
  const payment = await loadPaymentForLesson(lesson.id);

  if (operation.operation_status === "succeeded") {
    return inferOutcomeFromState(lesson, payment);
  }

  const policy = buildCancellationPolicy(lesson, input.role);

  if (!policy.cancellable) {
    throw new LessonActionError("not_cancellable", policy.reason);
  }

  if (policy.outcome !== "no_refund" && !isStripeCheckoutConfigured()) {
    throw new LessonActionError(
      "stripe_unconfigured",
      "Cancellation is unavailable until Stripe is configured on the server.",
    );
  }

  await applyStripeCancellationSideEffect(policy.outcome, payment);

  const cancelledAt = new Date().toISOString();
  await updateLessonStatus(lesson.id, cancelledAt);
  await updatePaymentForOutcome(payment, policy.outcome, cancelledAt);
  await insertLessonStatusHistory({
    bookingOperationId: operation.id,
    fromStatus: lesson.lesson_status,
    lessonId: lesson.id,
    reason: cancellationHistoryReason(policy.outcome, input.role),
    userId: input.account.id,
  });
  await markOperationStatus(operation.id, "succeeded");

  await notifyLessonCancelled({
    actorAppUserId: input.account.id,
    lesson,
    timezone: input.account.timezone,
  });

  return policy.outcome;
}

export function cancelStudentLesson(
  account: Pick<ResolvedAuthAccount, "id" | "timezone">,
  lessonId: string,
  operationKey: string,
) {
  return cancelLessonAsParticipant({
    account,
    lessonId,
    operationKey,
    role: "student",
  });
}

export function cancelTutorLesson(
  account: Pick<ResolvedAuthAccount, "id" | "timezone">,
  lessonId: string,
  operationKey: string,
) {
  return cancelLessonAsParticipant({
    account,
    lessonId,
    operationKey,
    role: "tutor",
  });
}

export type IssueReportInput = {
  issueType: LessonIssueType;
  summary: string;
};

export type ReportLessonIssueInput = {
  account: Pick<ResolvedAuthAccount, "id">;
  input: IssueReportInput;
  lessonId: string;
  role: ParticipantRole;
};

export async function reportLessonIssueAsParticipant({
  account,
  input,
  lessonId,
  role,
}: ReportLessonIssueInput): Promise<{ caseId: string; created: boolean }> {
  if (!lessonIssueTypes.includes(input.issueType)) {
    throw new LessonActionError(
      "invalid_issue_type",
      "Choose one of the listed issue reasons.",
    );
  }

  if (!ROLE_REPORTABLE_ISSUE_TYPES[role].includes(input.issueType)) {
    throw new LessonActionError(
      "issue_type_not_allowed_for_role",
      "That issue reason cannot be reported from this role.",
    );
  }

  const lesson = await loadLessonForParticipant(role, account.id, lessonId);

  if (!lesson) {
    throw new LessonActionError(
      "not_found",
      "We couldn't find this lesson on your account.",
    );
  }

  if (!ISSUE_REPORTABLE_LESSON_STATUSES.includes(lesson.lesson_status)) {
    throw new LessonActionError(
      "issue_not_eligible",
      "Lesson issue reports open after the tutor accepts and stay available through the lesson window.",
    );
  }

  const now = new Date();
  const start = new Date(lesson.scheduled_start_at);
  const end = new Date(lesson.scheduled_end_at);

  if (now.getTime() < start.getTime()) {
    throw new LessonActionError(
      "issue_too_early",
      "Lesson issues can be reported once the lesson is scheduled to start.",
    );
  }

  const minutesAfterEnd = minutesBetween(end, now);

  if (minutesAfterEnd > ISSUE_REPORT_LATE_WINDOW_MINUTES) {
    throw new LessonActionError(
      "issue_too_late",
      "The 24-hour reporting window has closed for this lesson.",
    );
  }

  const summary = normalizeIssueSummary(input.summary);

  const existingCase = await loadIssueCaseForLesson(lesson.id);

  if (existingCase && !TERMINAL_ISSUE_CASE_STATUSES.includes(existingCase.case_status)) {
    if (existingCase.reported_by_app_user_id === account.id) {
      if (existingCase.issue_type !== input.issueType) {
        throw new LessonActionError(
          "issue_type_locked",
          "Your existing report uses a different reason. Reach out to support if it needs to change.",
        );
      }

      const updated = await updateIssueCase(existingCase.id, {
        reporter_summary: summary,
      });

      return { caseId: updated.id, created: false };
    }

    const updated = await updateIssueCase(existingCase.id, {
      counterparty_response_type: input.issueType,
      counterparty_summary: summary,
      case_status: alignedIssueCaseStatus(existingCase.issue_type, input.issueType),
    });

    return { caseId: updated.id, created: false };
  }

  const created = await insertIssueCase({
    issueType: input.issueType,
    lessonId: lesson.id,
    reporterAppUserId: account.id,
    summary,
  });

  try {
    await createLessonIssueAcknowledgementNotification({
      appUserId: account.id,
      caseId: created.id,
      lessonId: lesson.id,
    });
  } catch {
    // notification dispatch must not block the report outcome
  }

  return { caseId: created.id, created: true };
}

export function reportStudentLessonIssue(
  account: Pick<ResolvedAuthAccount, "id">,
  lessonId: string,
  input: IssueReportInput,
) {
  return reportLessonIssueAsParticipant({
    account,
    input,
    lessonId,
    role: "student",
  });
}

export function reportTutorLessonIssue(
  account: Pick<ResolvedAuthAccount, "id">,
  lessonId: string,
  input: IssueReportInput,
) {
  return reportLessonIssueAsParticipant({
    account,
    input,
    lessonId,
    role: "tutor",
  });
}

export function getReportableIssueTypesForRole(role: ParticipantRole): readonly LessonIssueType[] {
  return ROLE_REPORTABLE_ISSUE_TYPES[role];
}

async function loadParticipantProfileId(
  role: ParticipantRole,
  appUserId: string,
): Promise<string | null> {
  const supabase = createSupabaseServiceRoleClient();

  if (role === "student") {
    const { data, error } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("app_user_id", appUserId)
      .maybeSingle<StudentProfileRow>();

    if (error) {
      throw new LessonActionError(
        "profile_lookup_failed",
        "We couldn't load your student profile.",
      );
    }

    return data?.id ?? null;
  }

  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("id, app_user_id")
    .eq("app_user_id", appUserId)
    .maybeSingle<TutorProfileRow>();

  if (error) {
    throw new LessonActionError(
      "profile_lookup_failed",
      "We couldn't load your tutor profile.",
    );
  }

  return data?.id ?? null;
}

async function loadLessonForParticipant(
  role: ParticipantRole,
  appUserId: string,
  lessonId: string,
): Promise<LessonRow | null> {
  const profileId = await loadParticipantProfileId(role, appUserId);

  if (!profileId) {
    return null;
  }

  const supabase = createSupabaseServiceRoleClient();
  const filterColumn =
    role === "student" ? "student_profile_id" : "tutor_profile_id";

  const { data, error } = await supabase
    .from("lessons")
    .select(
      "cancelled_at, id, lesson_status, scheduled_end_at, scheduled_start_at, student_profile_id, tutor_profile_id",
    )
    .eq("id", lessonId)
    .eq(filterColumn, profileId)
    .maybeSingle<LessonRow>();

  if (error) {
    throw new LessonActionError(
      "lesson_lookup_failed",
      "We couldn't load this lesson.",
    );
  }

  return data ?? null;
}

async function loadPaymentForLesson(lessonId: string): Promise<PaymentRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, payment_status, stripe_payment_intent_id")
    .eq("lesson_id", lessonId)
    .maybeSingle<PaymentRow>();

  if (error) {
    throw new LessonActionError(
      "payment_lookup_failed",
      "We couldn't read the payment state for this lesson.",
    );
  }

  return data ?? null;
}

async function ensureLessonCancelOperation(
  actorAppUserId: string,
  operationKey: string,
  lessonId: string,
) {
  const supabase = createSupabaseServiceRoleClient();
  const fingerprint = `lesson_cancel:${lessonId}`;

  const { data: inserted, error: insertError } = await supabase
    .from("booking_operations")
    .insert({
      actor_app_user_id: actorAppUserId,
      operation_key: operationKey,
      operation_status: "started",
      operation_type: "lesson_cancel",
      request_fingerprint: fingerprint,
    })
    .select("id, request_fingerprint, operation_status, operation_type")
    .single<{
      id: string;
      operation_status: string;
      operation_type: string;
      request_fingerprint: string;
    }>();

  if (!insertError && inserted) {
    return inserted;
  }

  if (insertError && insertError.code !== "23505") {
    throw new LessonActionError(
      "operation_create_failed",
      "We couldn't secure this cancellation attempt. Please try again.",
    );
  }

  const { data: existing, error: lookupError } = await supabase
    .from("booking_operations")
    .select("id, request_fingerprint, operation_status, operation_type")
    .eq("actor_app_user_id", actorAppUserId)
    .eq("operation_key", operationKey)
    .maybeSingle<{
      id: string;
      operation_status: string;
      operation_type: string;
      request_fingerprint: string;
    }>();

  if (lookupError || !existing) {
    throw new LessonActionError(
      "operation_lookup_failed",
      "We couldn't recover the cancellation attempt safely. Please try again.",
    );
  }

  if (
    existing.operation_type !== "lesson_cancel" ||
    existing.request_fingerprint !== fingerprint
  ) {
    throw new LessonActionError(
      "operation_key_reused",
      "This cancellation attempt changed mid-flight. Refresh the page and try again.",
    );
  }

  return existing;
}

async function applyStripeCancellationSideEffect(
  outcome: CancellationOutcome,
  payment: PaymentRow | null,
) {
  if (outcome === "no_refund") {
    return;
  }

  if (!payment?.stripe_payment_intent_id) {
    return;
  }

  const stripe = createStripeServerClient();

  if (outcome === "authorization_released") {
    if (
      payment.payment_status === "authorized" ||
      payment.payment_status === "pending"
    ) {
      await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id);
    }

    return;
  }

  if (outcome === "refund_issued" && payment.payment_status === "paid") {
    await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
    });
  }

  if (outcome === "refund_issued" && payment.payment_status === "authorized") {
    await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id);
  }
}

async function updateLessonStatus(lessonId: string, cancelledAt: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("lessons")
    .update({
      cancelled_at: cancelledAt,
      lesson_status: "cancelled",
    })
    .eq("id", lessonId);

  if (error) {
    throw new LessonActionError(
      "lesson_update_failed",
      "We couldn't update the lesson status.",
    );
  }
}

async function updatePaymentForOutcome(
  payment: PaymentRow | null,
  outcome: CancellationOutcome,
  cancelledAt: string,
) {
  if (!payment) {
    return;
  }

  const supabase = createSupabaseServiceRoleClient();

  if (outcome === "no_refund") {
    return;
  }

  if (outcome === "authorization_released") {
    const { error } = await supabase
      .from("payments")
      .update({
        capture_cancelled_at: cancelledAt,
        payment_status: "cancelled",
      })
      .eq("id", payment.id);

    if (error) {
      throw new LessonActionError(
        "payment_update_failed",
        "We couldn't update the payment record after release.",
      );
    }

    return;
  }

  if (outcome === "refund_issued") {
    const nextStatus = payment.payment_status === "paid" ? "refunded" : "cancelled";
    const { error } = await supabase
      .from("payments")
      .update({
        payment_status: nextStatus,
        refunded_at: nextStatus === "refunded" ? cancelledAt : null,
        capture_cancelled_at: nextStatus === "cancelled" ? cancelledAt : null,
      })
      .eq("id", payment.id);

    if (error) {
      throw new LessonActionError(
        "payment_update_failed",
        "We couldn't update the payment record after the refund.",
      );
    }
  }
}

async function insertLessonStatusHistory({
  bookingOperationId,
  fromStatus,
  lessonId,
  reason,
  userId,
}: {
  bookingOperationId: string;
  fromStatus: LessonStatus;
  lessonId: string;
  reason: string;
  userId: string;
}) {
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("lesson_status_history").upsert(
    {
      booking_operation_id: bookingOperationId,
      change_reason: reason,
      changed_by_app_user_id: userId,
      from_status: fromStatus,
      lesson_id: lessonId,
      to_status: "cancelled",
    },
    { onConflict: "booking_operation_id" },
  );

  if (error) {
    throw new LessonActionError(
      "history_update_failed",
      "We couldn't record the cancellation in the lesson history.",
    );
  }
}

async function markOperationStatus(
  operationId: string,
  status: "succeeded" | "failed",
) {
  const supabase = createSupabaseServiceRoleClient();
  await supabase
    .from("booking_operations")
    .update({
      operation_status: status,
    })
    .eq("id", operationId);
}

async function notifyLessonCancelled({
  actorAppUserId,
  lesson,
  timezone,
}: {
  actorAppUserId: string;
  lesson: LessonRow;
  timezone: string;
}) {
  const studentAppUserId = await loadStudentAppUserId(lesson.student_profile_id);
  const tutor = await loadTutorAppUserId(lesson.tutor_profile_id);
  const recipients = [actorAppUserId, studentAppUserId, tutor?.app_user_id].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );

  if (recipients.length === 0) {
    return;
  }

  try {
    await createLessonUpdatedNotifications({
      appUserIds: recipients,
      changeType: "cancelled",
      lessonId: lesson.id,
      scheduledStartAt: lesson.scheduled_start_at,
      timezone,
    });
  } catch {
    // notification dispatch must not block the cancellation outcome
  }
}

async function loadStudentAppUserId(
  studentProfileId: string,
): Promise<string | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("student_profiles")
    .select("app_user_id, id")
    .eq("id", studentProfileId)
    .maybeSingle<{ app_user_id: string; id: string }>();

  return data?.app_user_id ?? null;
}

async function loadTutorAppUserId(
  tutorProfileId: string,
): Promise<TutorProfileRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("tutor_profiles")
    .select("app_user_id, id")
    .eq("id", tutorProfileId)
    .maybeSingle<TutorProfileRow>();

  return data ?? null;
}

async function loadIssueCaseForLesson(lessonId: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("lesson_issue_cases")
    .select(
      "case_status, counterparty_response_type, counterparty_summary, id, issue_type, lesson_id, reported_by_app_user_id, reporter_summary",
    )
    .eq("lesson_id", lessonId)
    .maybeSingle<{
      case_status: LessonIssueCaseStatus;
      counterparty_response_type: LessonIssueType | "confirmed" | "contested" | null;
      counterparty_summary: string | null;
      id: string;
      issue_type: LessonIssueType;
      lesson_id: string;
      reported_by_app_user_id: string;
      reporter_summary: string | null;
    }>();

  if (error) {
    throw new LessonActionError(
      "issue_lookup_failed",
      "We couldn't load the existing lesson issue.",
    );
  }

  return data ?? null;
}

async function insertIssueCase({
  issueType,
  lessonId,
  reporterAppUserId,
  summary,
}: {
  issueType: LessonIssueType;
  lessonId: string;
  reporterAppUserId: string;
  summary: string | null;
}) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("lesson_issue_cases")
    .insert({
      issue_type: issueType,
      lesson_id: lessonId,
      reported_by_app_user_id: reporterAppUserId,
      reporter_summary: summary,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new LessonActionError(
      "issue_create_failed",
      "We couldn't record this lesson issue. Please try again.",
    );
  }

  return data;
}

async function updateIssueCase(
  id: string,
  patch: {
    case_status?: LessonIssueCaseStatus;
    counterparty_response_type?: LessonIssueType | "confirmed" | "contested";
    counterparty_summary?: string | null;
    reporter_summary?: string | null;
  },
) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("lesson_issue_cases")
    .update(patch)
    .eq("id", id)
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new LessonActionError(
      "issue_update_failed",
      "We couldn't update this lesson issue. Please try again.",
    );
  }

  return data;
}

function inferOutcomeFromState(
  lesson: LessonRow,
  payment: PaymentRow | null,
): CancellationOutcome {
  if (payment?.payment_status === "refunded") {
    return "refund_issued";
  }

  if (payment?.payment_status === "cancelled") {
    return "authorization_released";
  }

  return "no_refund";
}

function alignedIssueCaseStatus(
  reporterIssueType: LessonIssueType,
  counterpartyIssueType: LessonIssueType,
): LessonIssueCaseStatus {
  return reporterIssueType === counterpartyIssueType
    ? "counterparty_matched"
    : "under_review";
}

function cancellationHistoryReason(
  outcome: CancellationOutcome,
  actorRole: "student" | "tutor",
) {
  switch (outcome) {
    case "authorization_released":
      return `${actorRole}_cancel_authorization_released`;
    case "refund_issued":
      return `${actorRole}_cancel_refund_issued`;
    case "no_refund":
      return `${actorRole}_cancel_no_refund`;
  }
}

function normalizeIssueSummary(value: string): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > ISSUE_SUMMARY_MAX_LENGTH) {
    return trimmed.slice(0, ISSUE_SUMMARY_MAX_LENGTH);
  }

  return trimmed;
}

function minutesBetween(from: Date, to: Date) {
  return (to.getTime() - from.getTime()) / 60000;
}
