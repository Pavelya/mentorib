export const MODERATION_CASE_KINDS = [
  "report",
  "block",
  "lesson_issue",
  "public_content_takedown",
] as const;

export type ModerationCaseKind = (typeof MODERATION_CASE_KINDS)[number];

export const MODERATION_CASE_STATUSES = [
  "queued",
  "under_review",
  "resolved",
  "dismissed",
  "escalated",
] as const;

export type ModerationCaseStatus = (typeof MODERATION_CASE_STATUSES)[number];

export const MODERATION_CASE_SUBJECT_KINDS = [
  "app_user",
  "tutor_profile",
  "message",
  "conversation",
  "lesson_booking",
] as const;

export type ModerationCaseSubjectKind =
  (typeof MODERATION_CASE_SUBJECT_KINDS)[number];

export const MODERATION_CASE_RESOLUTION_KINDS = [
  "uphold",
  "reject",
  "split",
  "dismiss",
  "no_action",
  "escalated_to_legal",
] as const;

export type ModerationCaseResolutionKind =
  (typeof MODERATION_CASE_RESOLUTION_KINDS)[number];
