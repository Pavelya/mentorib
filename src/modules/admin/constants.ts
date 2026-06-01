export const MODERATION_CASE_KINDS = [
  "report",
  "block",
  "lesson_issue",
  "public_content_takedown",
  "finance_intervention",
  "review",
] as const;

// Sub-vocabulary for `case_kind = 'finance_intervention'` cases opened by
// the admin user-detail surface (`P2-OPS-002`). Stored in
// `moderation_cases.internal_summary` alongside the operator-provided body
// so the case detail page can re-render the intent label.
export const FINANCE_INTERVENTION_KINDS = [
  "payout_hold",
  "refund_anomaly",
  "general_finance",
] as const;

export type FinanceInterventionKind =
  (typeof FINANCE_INTERVENTION_KINDS)[number];

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

// Support tickets (`P2-ADMIN-SUPPORT-001`). The public contact-us form is the
// only ingestion channel this wave; status drives the internal triage queue.
export const SUPPORT_TICKET_CHANNELS = ["contact_form"] as const;

export type SupportTicketChannel = (typeof SUPPORT_TICKET_CHANNELS)[number];

export const SUPPORT_TICKET_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

// Statuses an operator can still act on (queue defaults to these, oldest-first).
export const SUPPORT_TICKET_OPEN_STATUSES = [
  "open",
  "in_progress",
] as const satisfies readonly SupportTicketStatus[];
