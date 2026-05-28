// `P2-OPSFIX-001` admin view-model copy map.
//
// Single source of operator-facing labels and `StatusBadge` tones for every
// enum / `action_key` an admin surface can render. The admin DTO boundary
// (user-detail + moderation repositories) consumes these so no page ever has
// to print a raw enum value or a technical token. Each map is declared as a
// total `Record<EnumType, …>` so adding a new enum value fails the build until
// a label is supplied (the exhaustiveness guard called for in the plan).

import type { AccountStatus, Role, RoleStatus } from "@/modules/accounts/constants";
import { ADMIN_ACTION_KEYS, type AdminActionKey } from "@/modules/admin/actions";
import type {
  ModerationCaseKind,
  ModerationCaseResolutionKind,
  ModerationCaseStatus,
  ModerationCaseSubjectKind,
} from "@/modules/admin/constants";
import type { ReviewStatus } from "@/modules/reviews/constants";
import type {
  PayoutReadinessStatus,
  TutorApplicationStatus,
  TutorPublicListingStatus,
} from "@/modules/tutors/constants";

// `StatusBadge` accepts exactly these tones.
export type StatusTone =
  | "positive"
  | "warning"
  | "destructive"
  | "trust"
  | "info";

export type CaseInvolvement = "subject" | "reporter";
export type SubjectBlockStatus = "active" | "released";

// --- account ----------------------------------------------------------------

export const ACCOUNT_STATUS_LABELS = {
  active: "Active",
  closed: "Closed",
  limited: "Limited",
  suspended: "Suspended",
} as const satisfies Record<AccountStatus, string>;

export const ACCOUNT_STATUS_TONES = {
  active: "positive",
  closed: "destructive",
  limited: "warning",
  suspended: "destructive",
} as const satisfies Record<AccountStatus, StatusTone>;

// --- roles ------------------------------------------------------------------

export const ROLE_LABELS = {
  admin: "Admin",
  student: "Student",
  tutor: "Tutor",
} as const satisfies Record<Role, string>;

export const ROLE_STATUS_LABELS = {
  active: "Active",
  pending: "Pending",
  revoked: "Revoked",
  suspended: "Suspended",
} as const satisfies Record<RoleStatus, string>;

export const ROLE_STATUS_TONES = {
  active: "positive",
  pending: "info",
  revoked: "destructive",
  suspended: "warning",
} as const satisfies Record<RoleStatus, StatusTone>;

// --- tutor application / listing / payout -----------------------------------

export const APPLICATION_STATUS_LABELS = {
  approved: "Approved",
  changes_requested: "Changes requested",
  in_progress: "In progress",
  not_started: "Not started",
  rejected: "Rejected",
  submitted: "Submitted",
  under_review: "Under review",
  withdrawn: "Withdrawn",
} as const satisfies Record<TutorApplicationStatus, string>;

export const APPLICATION_STATUS_TONES = {
  approved: "positive",
  changes_requested: "warning",
  in_progress: "info",
  not_started: "trust",
  rejected: "destructive",
  submitted: "info",
  under_review: "info",
  withdrawn: "trust",
} as const satisfies Record<TutorApplicationStatus, StatusTone>;

export const LISTING_STATUS_LABELS = {
  delisted: "Delisted (admin hold)",
  eligible: "Eligible",
  listed: "Listed",
  not_listed: "Not listed",
  paused: "Paused (admin hold)",
} as const satisfies Record<TutorPublicListingStatus, string>;

export const LISTING_STATUS_TONES = {
  delisted: "destructive",
  eligible: "info",
  listed: "positive",
  not_listed: "trust",
  paused: "warning",
} as const satisfies Record<TutorPublicListingStatus, StatusTone>;

export const PAYOUT_READINESS_LABELS = {
  enabled: "Enabled",
  not_started: "Not started",
  pending_verification: "Pending verification",
  restricted: "Restricted",
} as const satisfies Record<PayoutReadinessStatus, string>;

export const PAYOUT_READINESS_TONES = {
  enabled: "positive",
  not_started: "trust",
  pending_verification: "info",
  restricted: "destructive",
} as const satisfies Record<PayoutReadinessStatus, StatusTone>;

// --- moderation -------------------------------------------------------------

export const CASE_KIND_LABELS = {
  block: "Block",
  finance_intervention: "Finance intervention",
  lesson_issue: "Lesson issue",
  public_content_takedown: "Public profile takedown",
  report: "Report",
} as const satisfies Record<ModerationCaseKind, string>;

export const CASE_STATUS_LABELS = {
  dismissed: "Dismissed",
  escalated: "Escalated",
  queued: "Queued",
  resolved: "Resolved",
  under_review: "Under review",
} as const satisfies Record<ModerationCaseStatus, string>;

export const CASE_STATUS_TONES = {
  dismissed: "trust",
  escalated: "destructive",
  queued: "info",
  resolved: "positive",
  under_review: "warning",
} as const satisfies Record<ModerationCaseStatus, StatusTone>;

export const CASE_RESOLUTION_LABELS = {
  dismiss: "Dismissed",
  escalated_to_legal: "Escalated to legal",
  no_action: "No action",
  reject: "Rejected",
  split: "Split decision",
  uphold: "Upheld",
} as const satisfies Record<ModerationCaseResolutionKind, string>;

export const SUBJECT_KIND_LABELS = {
  app_user: "User",
  conversation: "Conversation",
  lesson_booking: "Lesson booking",
  message: "Message",
  tutor_profile: "Tutor profile",
} as const satisfies Record<ModerationCaseSubjectKind, string>;

export const INVOLVEMENT_LABELS = {
  reporter: "Reporter",
  subject: "Subject of report",
} as const satisfies Record<CaseInvolvement, string>;

export const SUBJECT_BLOCK_STATUS_LABELS = {
  active: "Active",
  released: "Released",
} as const satisfies Record<SubjectBlockStatus, string>;

export const SUBJECT_BLOCK_STATUS_TONES = {
  active: "warning",
  released: "trust",
} as const satisfies Record<SubjectBlockStatus, StatusTone>;

// --- reviews ----------------------------------------------------------------

export const REVIEW_STATUS_LABELS = {
  hidden: "Hidden",
  published: "Published",
  rejected: "Rejected",
  submitted: "Submitted",
  under_review: "Under review",
} as const satisfies Record<ReviewStatus, string>;

export const REVIEW_STATUS_TONES = {
  hidden: "warning",
  published: "positive",
  rejected: "destructive",
  submitted: "trust",
  under_review: "info",
} as const satisfies Record<ReviewStatus, StatusTone>;

// --- admin action keys ------------------------------------------------------

const ADMIN_ACTION_LABELS = {
  "account.set_status": "Changed account status",
  "admin_role.bootstrap": "Bootstrapped admin role",
  "admin_role.grant": "Granted admin role",
  "admin_role.revoke": "Revoked admin role",
  "finance_intervention.note": "Logged a finance intervention note",
  "moderation_case.claim": "Claimed a moderation case",
  "moderation_case.dismiss": "Dismissed a moderation case",
  "moderation_case.escalate": "Escalated a moderation case",
  "moderation_case.note_added": "Added a case note",
  "moderation_case.open": "Opened a moderation case",
  "moderation_case.resolve": "Resolved a moderation case",
  "policy_notice.draft": "Drafted a policy notice",
  "policy_notice.publish": "Published a policy notice",
  "policy_notice.revoke": "Revoked a policy notice",
  "reference_data.language.update": "Updated language reference data",
  "reference_data.meeting_provider.update": "Updated meeting-provider reference data",
  "reference_data.subject.update": "Updated subject reference data",
  "reference_data.subject_focus_area.update":
    "Updated focus-area reference data",
  "reference_data.video_media_provider.update":
    "Updated video-provider reference data",
  "tutor_application.approve": "Approved tutor application",
  "tutor_application.claim": "Claimed a tutor application",
  "tutor_application.reject": "Rejected tutor application",
  "tutor_application.request_changes": "Requested changes to tutor application",
  "tutor_credential.set_review_status": "Updated tutor credential review status",
  "tutor_listing.admin_delist": "Delisted public tutor listing",
  "tutor_listing.admin_lift_hold": "Lifted a listing hold",
  "tutor_listing.admin_pause": "Paused public tutor listing",
  "tutor_listing.public_takedown": "Took down a public tutor profile",
} as const satisfies Record<AdminActionKey, string>;

// Humanize an unknown / legacy action key into a readable phrase so the UI
// never falls back to a raw `domain.verb` token, even for keys minted before
// this map existed.
function humanizeActionKey(key: string): string {
  const words = key.replace(/[._]/g, " ").trim();
  if (!words) {
    return "Admin action";
  }
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function adminActionLabel(key: string): string {
  if ((ADMIN_ACTION_KEYS as readonly string[]).includes(key)) {
    return ADMIN_ACTION_LABELS[key as AdminActionKey];
  }
  return humanizeActionKey(key);
}
