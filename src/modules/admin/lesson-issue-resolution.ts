import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { ModerationCaseResolutionKind } from "@/modules/admin/constants";
import { openCase } from "@/modules/admin/moderation-case-service";
import {
  type LessonIssueResolutionOutcome,
  lessonIssueResolutionOutcomes,
  type TutorReliabilityEventKind,
} from "@/modules/lessons/constants";
import {
  processLessonRefund,
  releaseCapturedLessonPayment,
} from "@/modules/lessons/refund-service";

export class LessonIssueResolutionError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export function isLessonIssueResolutionOutcome(
  value: string,
): value is LessonIssueResolutionOutcome {
  return (lessonIssueResolutionOutcomes as readonly string[]).includes(value);
}

// Per-`case_kind` resolution validator for `lesson_issue` cases: maps the
// lesson-specific outcome vocabulary to the abstract `resolution_kind` bucket
// the shared moderation queue sorts by. The abstract value is what
// `resolveCase` records; the lesson-specific outcome is written separately into
// `lesson_issue_cases.resolution_outcome` by `applyLessonIssueResolution`.
const OUTCOME_TO_RESOLUTION_KIND = {
  duplicate_or_invalid: "dismiss",
  lesson_completed: "reject",
  partial_delivery_adjusted: "split",
  student_no_show_confirmed: "uphold",
  technical_issue_no_fault: "no_action",
  tutor_no_show_confirmed: "uphold",
  wrong_link_tutor_fault: "uphold",
} as const satisfies Record<
  LessonIssueResolutionOutcome,
  ModerationCaseResolutionKind
>;

export function lessonIssueOutcomeToResolutionKind(
  outcome: LessonIssueResolutionOutcome,
): ModerationCaseResolutionKind {
  return OUTCOME_TO_RESOLUTION_KIND[outcome];
}

type RefundPosture = "full" | "release" | "none";

// Refund / payout posture per outcome (lesson-issue-and-dispute-model §9.1).
// `full`    → full refund via `processLessonRefund`.
// `release` → captured payment stays with the tutor (no Stripe action).
// `none`    → no automatic Stripe action. `partial_delivery_adjusted` is `none`
//             because a partial amount can't be derived from the schema; the
//             admin records the agreed amount in a case note and issues the
//             partial refund operationally (documented caveat for this task).
const OUTCOME_REFUND_POSTURE = {
  duplicate_or_invalid: "none",
  lesson_completed: "release",
  partial_delivery_adjusted: "none",
  student_no_show_confirmed: "release",
  technical_issue_no_fault: "full",
  tutor_no_show_confirmed: "full",
  wrong_link_tutor_fault: "full",
} as const satisfies Record<LessonIssueResolutionOutcome, RefundPosture>;

// Reliability-event mapping (lesson-issue-and-dispute-model §12.1, reliability
// thresholds §4). Only confirmed tutor-fault and partial-delivery outcomes
// record an event; everything else is penalty-ineligible.
const OUTCOME_RELIABILITY_EVENT: Partial<
  Record<LessonIssueResolutionOutcome, TutorReliabilityEventKind>
> = {
  partial_delivery_adjusted: "partial_delivery",
  tutor_no_show_confirmed: "no_show_confirmed",
  wrong_link_tutor_fault: "wrong_link_fault",
};

export type LessonIssueResolutionResult = {
  studentAppUserId: string | null;
  tutorAppUserId: string | null;
  lessonIssueCaseId: string;
  dismissed: boolean;
};

// Applies the refund/payout, reliability, and lesson-issue-case consequences of
// a dispute resolution. The consequence work runs BEFORE the moderation-case
// transition (in the caller) so a failed refund leaves the case in
// `under_review` for retry; `processLessonRefund` is idempotent, so retrying
// after a partial success never double-refunds. Returns the participant ids so
// the caller can fire the mandatory `lesson_issue_resolution` notification once
// the case is resolved.
export async function applyLessonIssueResolution(input: {
  lessonId: string;
  outcome: LessonIssueResolutionOutcome;
  actorAppUserId: string;
  reason: string | null;
}): Promise<LessonIssueResolutionResult> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, student_profile_id, tutor_profile_id")
    .eq("id", input.lessonId)
    .maybeSingle<{
      id: string;
      student_profile_id: string;
      tutor_profile_id: string;
    }>();
  if (lessonError || !lesson) {
    throw new LessonIssueResolutionError(
      "lesson_not_found",
      "We couldn't load the disputed lesson.",
    );
  }

  const { data: issueCase, error: issueError } = await supabase
    .from("lesson_issue_cases")
    .select("id")
    .eq("lesson_id", input.lessonId)
    .maybeSingle<{ id: string }>();
  if (issueError || !issueCase) {
    throw new LessonIssueResolutionError(
      "issue_case_not_found",
      "We couldn't load the lesson-issue record for this dispute.",
    );
  }

  const [studentResult, tutorResult] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("app_user_id")
      .eq("id", lesson.student_profile_id)
      .maybeSingle<{ app_user_id: string }>(),
    supabase
      .from("tutor_profiles")
      .select("app_user_id")
      .eq("id", lesson.tutor_profile_id)
      .maybeSingle<{ app_user_id: string }>(),
  ]);
  const studentAppUserId = studentResult.data?.app_user_id ?? null;
  const tutorAppUserId = tutorResult.data?.app_user_id ?? null;

  // 1. Refund / payout posture.
  const posture = OUTCOME_REFUND_POSTURE[input.outcome];
  if (posture === "full") {
    await processLessonRefund(input.lessonId);
  } else if (posture === "release") {
    await releaseCapturedLessonPayment();
  }

  // 2. Reliability event (confirmed tutor-fault / partial outcomes only).
  const eventKind = OUTCOME_RELIABILITY_EVENT[input.outcome];
  if (eventKind) {
    const { error: reliabilityError } = await supabase
      .from("tutor_reliability_events")
      .insert({
        event_kind: eventKind,
        source_id: issueCase.id,
        source_kind: "lesson_issue_resolution",
        tutor_profile_id: lesson.tutor_profile_id,
      });
    if (reliabilityError) {
      throw new LessonIssueResolutionError(
        "reliability_write_failed",
        "We couldn't record the reliability event for this resolution.",
      );
    }
  }

  // 3. Lesson-specific outcome write (companion to the abstract resolution_kind
  // recorded on the moderation case by the caller's resolveCase call).
  const dismissed = input.outcome === "duplicate_or_invalid";
  const { error: outcomeError } = await supabase
    .from("lesson_issue_cases")
    .update({
      case_status: dismissed ? "dismissed" : "resolved",
      resolution_note: input.reason,
      resolution_outcome: input.outcome,
      resolved_at: new Date().toISOString(),
      resolved_by_app_user_id: input.actorAppUserId,
    })
    .eq("id", issueCase.id);
  if (outcomeError) {
    throw new LessonIssueResolutionError(
      "issue_outcome_write_failed",
      "We couldn't record the lesson-issue resolution outcome.",
    );
  }

  return {
    dismissed,
    lessonIssueCaseId: issueCase.id,
    studentAppUserId,
    tutorAppUserId,
  };
}

// Bridge from the lesson-issue model into the shared moderation queue: opens
// the `moderation_cases` row that backs `/internal/disputes` when a lesson
// issue is contested into manual review. Idempotent — an open lesson-issue
// case for the same lesson is reused rather than duplicated.
export async function ensureLessonIssueDisputeCase(input: {
  lessonId: string;
  lessonIssueCaseId: string;
  reporterAppUserId: string;
  actorAppUserId: string;
}): Promise<{ caseId: string }> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: existing } = await supabase
    .from("moderation_cases")
    .select("id")
    .eq("case_kind", "lesson_issue")
    .eq("subject_id", input.lessonId)
    .in("case_status", ["queued", "under_review"])
    .maybeSingle<{ id: string }>();
  if (existing) {
    return { caseId: existing.id };
  }

  return openCase({
    actorAppUserId: input.actorAppUserId,
    caseKind: "lesson_issue",
    reporterAppUserId: input.reporterAppUserId,
    subjectId: input.lessonId,
    subjectKind: "lesson_booking",
    triggeringEventId: input.lessonIssueCaseId,
    triggeringEventKind: "lesson_issue_case",
  });
}
