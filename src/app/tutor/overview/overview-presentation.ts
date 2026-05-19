import {
  type LessonIssueCaseStatus,
  type LessonIssueType,
  type LessonStatus,
} from "@/modules/lessons/constants";

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
