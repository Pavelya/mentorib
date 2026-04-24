export const bookingOperationTypes = [
  "lesson_request_create",
  "lesson_accept",
  "lesson_decline",
  "lesson_cancel",
  "lesson_complete",
  "payment_authorize",
  "payment_capture",
  "payment_release",
] as const;

export type BookingOperationType = (typeof bookingOperationTypes)[number];

export const bookingOperationStatuses = [
  "started",
  "succeeded",
  "failed",
  "cancelled",
] as const;

export type BookingOperationStatus =
  (typeof bookingOperationStatuses)[number];

export const learningNeedStatuses = [
  "draft",
  "active",
  "matched",
  "booked",
  "archived",
] as const;

export type LearningNeedStatus = (typeof learningNeedStatuses)[number];

export const learningNeedOptionGroups = [
  "need_type",
  "urgency_level",
  "session_frequency_intent",
  "support_style",
] as const;

export type LearningNeedOptionGroup =
  (typeof learningNeedOptionGroups)[number];

export const matchRunStatuses = [
  "queued",
  "running",
  "completed",
  "failed",
  "expired",
] as const;

export type MatchRunStatus = (typeof matchRunStatuses)[number];

export const matchCandidateStates = [
  "candidate",
  "shortlisted",
  "compared",
  "contacted",
  "booked",
  "dismissed",
] as const;

export type MatchCandidateState = (typeof matchCandidateStates)[number];

export const lessonStatuses = [
  "draft_request",
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "upcoming",
  "in_progress",
  "completed",
  "reviewed",
] as const;

export type LessonStatus = (typeof lessonStatuses)[number];

export const lessonMeetingMethods = [
  "external_video_call",
  "custom_external_room",
  "in_person",
  "no_meeting_link",
] as const;

export type LessonMeetingMethod = (typeof lessonMeetingMethods)[number];

export const lessonMeetingSourceTypes = [
  "tutor_default_room",
  "tutor_custom_lesson_link",
  "internal_override",
  "future_platform_generated",
] as const;

export type LessonMeetingSourceType =
  (typeof lessonMeetingSourceTypes)[number];

export const lessonMeetingAccessStatuses = [
  "missing",
  "ready",
  "invalid",
  "replaced",
] as const;

export type LessonMeetingAccessStatus =
  (typeof lessonMeetingAccessStatuses)[number];

export const lessonIssueTypes = [
  "tutor_absent",
  "student_absent",
  "wrong_meeting_link",
  "technical_failure",
  "partial_delivery",
] as const;

export type LessonIssueType = (typeof lessonIssueTypes)[number];

export const lessonIssueCounterpartyResponseTypes = [
  ...lessonIssueTypes,
  "confirmed",
  "contested",
] as const;

export type LessonIssueCounterpartyResponseType =
  (typeof lessonIssueCounterpartyResponseTypes)[number];

export const lessonIssueCaseStatuses = [
  "reported",
  "counterparty_matched",
  "under_review",
  "resolved",
  "dismissed",
] as const;

export type LessonIssueCaseStatus =
  (typeof lessonIssueCaseStatuses)[number];

export const lessonIssueResolutionOutcomes = [
  "student_no_show_confirmed",
  "tutor_no_show_confirmed",
  "wrong_link_tutor_fault",
  "technical_issue_no_fault",
  "partial_delivery_adjusted",
  "lesson_completed",
  "duplicate_or_invalid",
] as const;

export type LessonIssueResolutionOutcome =
  (typeof lessonIssueResolutionOutcomes)[number];

export const paymentProviders = ["stripe"] as const;

export type PaymentProvider = (typeof paymentProviders)[number];

export const paymentStatuses = [
  "pending",
  "authorized",
  "paid",
  "refunded",
  "failed",
  "cancelled",
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];
