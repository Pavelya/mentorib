// Allowlist of canonical admin action keys. Every privileged write must
// register its key here in the same commit it ships. The audit-coverage
// rule in `P2-QUALITY-001` cross-checks this list against the Server
// Actions that write to `admin_action_logs`.

export const ADMIN_ACTION_KEYS = [
  // P2-APPLY-002 backfill
  "tutor_application.claim",
  "tutor_application.approve",
  "tutor_application.request_changes",
  "tutor_application.reject",
  "tutor_credential.set_review_status",
  // Bootstrap + role administration (UI lands in P2-OPS-002)
  "admin_role.bootstrap",
  "admin_role.grant",
  "admin_role.revoke",
  // Shared moderation-case lifecycle (consumed by P2-OPS-001 / P2-DISPUTE-001)
  "moderation_case.open",
  "moderation_case.claim",
  "moderation_case.resolve",
  "moderation_case.dismiss",
  "moderation_case.escalate",
  "moderation_case.note_added",
  // Trust-and-safety surfaces (P2-OPS-001)
  "tutor_listing.public_takedown",
  // Admin user-detail surface (P2-OPS-002)
  "tutor_listing.admin_pause",
  "tutor_listing.admin_delist",
  "tutor_listing.admin_lift_hold",
  "account.set_status",
  "finance_intervention.note",
  // Platform-level reference-data label edits (P2-OPS-003).
  // Each key edits the editable-field allowlist on the named vocabulary
  // row — slugs / keys / codes / identifiers are never editable.
  "reference_data.subject.update",
  "reference_data.subject_focus_area.update",
  "reference_data.language.update",
  "reference_data.meeting_provider.update",
  "reference_data.video_media_provider.update",
  // Policy-notice broadcast lifecycle (P2-OPS-003).
  "policy_notice.draft",
  "policy_notice.publish",
  "policy_notice.revoke",
] as const;

export type AdminActionKey = (typeof ADMIN_ACTION_KEYS)[number];

export function isAdminActionKey(value: string): value is AdminActionKey {
  return (ADMIN_ACTION_KEYS as readonly string[]).includes(value);
}
