import {
  type LessonIssueCaseStatus,
  type LessonIssueType,
  type LessonStatus,
} from "@/modules/lessons/constants";
import {
  type PayoutReadinessStatus,
  type TutorApplicationStatus,
  type TutorProfileVisibilityStatus,
} from "@/modules/tutors/constants";

type SummaryStatus =
  | "pending"
  | "accepted"
  | "upcoming"
  | "in_progress"
  | "completed"
  | "reviewed"
  | "declined"
  | "cancelled";

const LESSON_STATUS_TO_SUMMARY: Record<LessonStatus, SummaryStatus> = {
  accepted: "accepted",
  cancelled: "cancelled",
  completed: "completed",
  declined: "declined",
  draft_request: "pending",
  in_progress: "in_progress",
  pending: "pending",
  reviewed: "reviewed",
  upcoming: "upcoming",
};

export function mapLessonStatusToSummary(
  lessonStatus: LessonStatus,
): SummaryStatus {
  return LESSON_STATUS_TO_SUMMARY[lessonStatus];
}

type Tone = "default" | "positive" | "warning" | "destructive" | "trust" | "info";

export type ReadinessChip = {
  label: string;
  tone: Tone;
};

const APPLICATION_STATUS_LABELS: Record<TutorApplicationStatus, string> = {
  approved: "Application approved",
  changes_requested: "Application: changes requested",
  in_progress: "Application in progress",
  not_started: "Application not started",
  rejected: "Application not approved",
  submitted: "Application submitted",
  under_review: "Application under review",
  withdrawn: "Application withdrawn",
};

const APPLICATION_STATUS_TONES: Record<TutorApplicationStatus, Tone> = {
  approved: "trust",
  changes_requested: "warning",
  in_progress: "info",
  not_started: "warning",
  rejected: "destructive",
  submitted: "info",
  under_review: "info",
  withdrawn: "destructive",
};

const PROFILE_VISIBILITY_LABELS: Record<TutorProfileVisibilityStatus, string> = {
  draft: "Profile draft",
  hidden: "Profile hidden",
  private_preview: "Profile private preview",
  public_visible: "Profile public",
};

const PROFILE_VISIBILITY_TONES: Record<TutorProfileVisibilityStatus, Tone> = {
  draft: "warning",
  hidden: "warning",
  private_preview: "info",
  public_visible: "positive",
};

const PAYOUT_READINESS_LABELS: Record<PayoutReadinessStatus, string> = {
  enabled: "Payouts enabled",
  not_started: "Payout setup needed",
  pending_verification: "Payouts: verification pending",
  restricted: "Payouts restricted",
};

const PAYOUT_READINESS_TONES: Record<PayoutReadinessStatus, Tone> = {
  enabled: "positive",
  not_started: "warning",
  pending_verification: "info",
  restricted: "destructive",
};

export function buildReadinessChips(readiness: {
  applicationStatus: TutorApplicationStatus;
  payoutReadinessStatus: PayoutReadinessStatus;
  profileVisibilityStatus: TutorProfileVisibilityStatus;
}): ReadinessChip[] {
  return [
    {
      label: APPLICATION_STATUS_LABELS[readiness.applicationStatus],
      tone: APPLICATION_STATUS_TONES[readiness.applicationStatus],
    },
    {
      label: PROFILE_VISIBILITY_LABELS[readiness.profileVisibilityStatus],
      tone: PROFILE_VISIBILITY_TONES[readiness.profileVisibilityStatus],
    },
    {
      label: PAYOUT_READINESS_LABELS[readiness.payoutReadinessStatus],
      tone: PAYOUT_READINESS_TONES[readiness.payoutReadinessStatus],
    },
  ];
}

const ISSUE_TYPE_LABELS: Record<LessonIssueType, string> = {
  partial_delivery: "Lesson delivered only partially",
  student_absent: "Student did not attend",
  technical_failure: "Major technical problem",
  tutor_absent: "Tutor did not attend",
  wrong_meeting_link: "Wrong or missing meeting link",
};

const ISSUE_CASE_LABELS: Record<LessonIssueCaseStatus, string> = {
  counterparty_matched: "Confirmed by both sides",
  dismissed: "Dismissed",
  reported: "Awaiting tutor response",
  resolved: "Resolved",
  under_review: "Under review",
};

export function getIssueTypeLabel(issueType: LessonIssueType): string {
  return ISSUE_TYPE_LABELS[issueType];
}

export function getIssueCaseLabel(caseStatus: LessonIssueCaseStatus): string {
  return ISSUE_CASE_LABELS[caseStatus];
}
