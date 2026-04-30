import type {
  LessonIssueCaseStatus,
  LessonIssueType,
  LessonMeetingAccessStatus,
  LessonMeetingMethod,
  LessonStatus,
} from "@/modules/lessons/constants";

type LessonSummaryStatus =
  | "pending"
  | "accepted"
  | "upcoming"
  | "in_progress"
  | "completed"
  | "reviewed"
  | "declined"
  | "cancelled";

const LESSON_STATUS_TO_SUMMARY: Record<LessonStatus, LessonSummaryStatus> = {
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
): LessonSummaryStatus {
  return LESSON_STATUS_TO_SUMMARY[lessonStatus];
}

export const ISSUE_CASE_LABELS: Record<LessonIssueCaseStatus, string> = {
  counterparty_matched: "Confirmed by both sides",
  dismissed: "Dismissed",
  reported: "Reported",
  resolved: "Resolved",
  under_review: "Under review",
};

export const ISSUE_TYPE_LABELS: Record<LessonIssueType, string> = {
  partial_delivery: "Lesson delivered only partially",
  student_absent: "Student did not attend",
  technical_failure: "Major technical problem",
  tutor_absent: "Tutor did not attend",
  wrong_meeting_link: "Wrong or missing meeting link",
};

export const MEETING_METHOD_LABELS: Record<LessonMeetingMethod, string> = {
  custom_external_room: "Custom meeting room",
  external_video_call: "External video call",
  in_person: "In person",
  no_meeting_link: "No meeting link required",
};

export const MEETING_ACCESS_HINTS: Record<LessonMeetingAccessStatus, string> = {
  invalid: "The saved meeting link is no longer valid. Update it before the lesson starts.",
  missing: "Add a meeting link before the lesson starts so the student can join.",
  ready: "The meeting link is ready. The student can open it from the lesson when joining.",
  replaced: "The meeting link has been updated. The latest link below is the active one.",
};
