import type {
  ModerationCaseKind,
  ModerationCaseResolutionKind,
  ModerationCaseStatus,
  ModerationCaseSubjectKind,
} from "@/modules/admin/constants";

export type ModerationCaseQueueFilter = ModerationCaseStatus;

export const MODERATION_CASE_QUEUE_PAGE_SIZE = 25;

// D7 (admin scope) DTO. Carries only the fields needed to render the queue
// list — no triggering content, no raw subject rows, no `internal_summary`.
export type ModerationCaseQueueRowDto = {
  caseId: string;
  caseKind: ModerationCaseKind;
  caseStatus: ModerationCaseStatus;
  claimedAt: string | null;
  createdAt: string;
  priority: number;
  subjectKind: ModerationCaseSubjectKind;
  subjectId: string;
};

export type ModerationCaseQueueCounter = {
  count: number;
  status: ModerationCaseQueueFilter;
};

export type ModerationCaseQueueDto = {
  appliedFilters: readonly ModerationCaseQueueFilter[];
  counters: readonly ModerationCaseQueueCounter[];
  rows: readonly ModerationCaseQueueRowDto[];
};

// D7 (admin scope) DTO. The detail surface adds `internalSummary` and the
// resolution shape, but still excludes any triggering content body — that
// lands via a dedicated evidence loader so the case list never pulls it.
export type ModerationCaseDetailDto = ModerationCaseQueueRowDto & {
  claimedByAppUserId: string | null;
  internalSummary: string | null;
  reporterAppUserId: string | null;
  resolutionKind: ModerationCaseResolutionKind | null;
  resolvedAt: string | null;
  resolvedByAppUserId: string | null;
  triggeringEventId: string | null;
  triggeringEventKind: string | null;
};

// D7 (admin scope) note row. Used by the case-detail "Notes" panel only.
// Never surfaced in any user-visible payload.
export type ModerationCaseNoteDto = {
  authorAppUserId: string;
  authorDisplayName: string | null;
  body: string;
  createdAt: string;
  id: string;
};

// D7 (admin scope) evidence payload. Loaded lazily — the queue list
// never pulls evidence to avoid carrying raw message bodies or other
// triggering content through admin reads that don't need them.
export type ModerationCaseEvidenceDto = {
  kind: "message" | "tutor_profile" | "conversation" | "none";
  message?: {
    body: string;
    createdAt: string;
    messageId: string;
    conversationId: string;
    senderAppUserId: string;
  };
  tutorProfile?: {
    publicProfileUrl: string | null;
    publicSlug: string | null;
    tutorProfileId: string;
  };
  conversation?: {
    conversationId: string;
    studentAppUserId: string;
    tutorAppUserId: string;
  };
};

// D7 (admin scope) summary of an existing user_blocks row, scoped to a
// single subject (used only inside the case-detail "Existing blocks" panel).
// Never surfaced outside the admin lane.
export type ModerationSubjectBlockDto = {
  blockId: string;
  blockedAppUserId: string;
  blockerAppUserId: string;
  blockStatus: "active" | "released";
  createdAt: string;
};

// D7 (admin scope) summary of who the case subject is, composed by the
// case-detail page from cross-domain summary functions (e.g.,
// `getPublicTutorProfileBySlug`). The DTO carries display labels only,
// never raw rows.
export type ModerationCaseSubjectSummaryDto = {
  kind: ModerationCaseSubjectKind;
  primaryLabel: string;
  secondaryLabel: string | null;
  appUserId: string | null;
  tutorProfileId: string | null;
  tutorPublicSlug: string | null;
};

// D7 (admin scope) summary of who the reporter is — display name only.
// Never carries email, phone, or other reporter contact info.
export type ModerationCaseReporterSummaryDto = {
  appUserId: string;
  displayName: string | null;
  reasonText: string | null;
};
