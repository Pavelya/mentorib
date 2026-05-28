import type { Route } from "next";

import type {
  ModerationCaseKind,
  ModerationCaseResolutionKind,
  ModerationCaseStatus,
  ModerationCaseSubjectKind,
} from "@/modules/admin/constants";
import type { StatusTone } from "@/modules/admin/labels";

export type ModerationCaseQueueFilter = ModerationCaseStatus;

export const MODERATION_CASE_QUEUE_PAGE_SIZE = 25;

// D7 (admin scope) DTO. Carries only the fields needed to render the queue
// list — no triggering content, no raw subject rows, no `internal_summary`.
// Per `P2-OPSFIX-001` every enum ships with a display label/tone so the queue
// never prints a raw `case_kind` / `case_status` / `subject_kind` token.
export type ModerationCaseQueueRowDto = {
  caseId: string;
  caseKind: ModerationCaseKind;
  caseKindLabel: string;
  caseStatus: ModerationCaseStatus;
  caseStatusLabel: string;
  caseStatusTone: StatusTone;
  claimedAt: string | null;
  createdAt: string;
  priority: number;
  subjectKind: ModerationCaseSubjectKind;
  subjectKindLabel: string;
  subjectId: string;
};

// The queue list adds a short, truncated reason snippet to the base row so an
// operator can triage at a glance (`P2-OPSFIX-004`). The snippet is derived
// and length-capped at the repository boundary — the full `internal_summary`
// and all triggering content stay out of the list payload.
export type ModerationCaseQueueItemDto = ModerationCaseQueueRowDto & {
  reasonSnippet: string | null;
};

export type ModerationCaseQueueCounter = {
  count: number;
  status: ModerationCaseQueueFilter;
};

export type ModerationCaseQueueDto = {
  appliedFilters: readonly ModerationCaseQueueFilter[];
  counters: readonly ModerationCaseQueueCounter[];
  rows: readonly ModerationCaseQueueItemDto[];
};

// D7 (admin scope) DTO. The detail surface adds `internalSummary` and the
// resolution shape, but still excludes any triggering content body — that
// lands via a dedicated evidence loader so the case list never pulls it.
export type ModerationCaseDetailDto = ModerationCaseQueueRowDto & {
  claimedByAppUserId: string | null;
  internalSummary: string | null;
  reporterAppUserId: string | null;
  resolutionKind: ModerationCaseResolutionKind | null;
  resolutionKindLabel: string | null;
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
    senderDisplayName: string | null;
    senderAvatarSrc: string | null;
  };
  tutorProfile?: {
    // `publicProfileUrl` is retained for the current (pre-`P2-OPSFIX-004`)
    // detail page; new consumers should use the typed `publicProfileHref`.
    publicProfileUrl: string | null;
    publicProfileHref: Route | null;
    publicSlug: string | null;
    tutorProfileId: string;
    displayName: string | null;
    avatarSrc: string | null;
  };
  conversation?: {
    conversationId: string;
    studentAppUserId: string;
    studentDisplayName: string | null;
    studentAvatarSrc: string | null;
    tutorAppUserId: string;
    tutorDisplayName: string | null;
    tutorAvatarSrc: string | null;
  };
};

// D7 (admin scope) summary of an existing user_blocks row, scoped to a
// single subject (used only inside the case-detail "Existing blocks" panel).
// Never surfaced outside the admin lane. Both participants resolve to a
// display name + avatar so the panel renders `PersonSummary` pairs instead of
// raw UUID arrows (`P2-OPSFIX-001`).
export type ModerationSubjectBlockDto = {
  blockId: string;
  blockedAppUserId: string;
  blockedDisplayName: string | null;
  blockedAvatarSrc: string | null;
  blockerAppUserId: string;
  blockerDisplayName: string | null;
  blockerAvatarSrc: string | null;
  blockStatus: "active" | "released";
  blockStatusLabel: string;
  blockStatusTone: StatusTone;
  createdAt: string;
};

// D7 (admin scope) summary of who the case subject is, composed by the
// case-detail page from cross-domain summary functions (e.g.,
// `getPublicTutorProfileBySlug`). The DTO carries display labels only,
// never raw rows.
export type ModerationCaseSubjectSummaryDto = {
  kind: ModerationCaseSubjectKind;
  kindLabel: string;
  primaryLabel: string;
  secondaryLabel: string | null;
  avatarSrc: string | null;
  publicProfileHref: Route | null;
  appUserId: string | null;
  tutorProfileId: string | null;
  tutorPublicSlug: string | null;
  // Raw identifier kept only for an explicit "copy id" disclosure, never as a
  // display field. `null` for subjects that have a human primary label.
  technicalRef: string | null;
};

// D7 (admin scope) summary of who the reporter is — display name + avatar.
// Never carries email, phone, or other reporter contact info.
export type ModerationCaseReporterSummaryDto = {
  appUserId: string;
  displayName: string | null;
  avatarSrc: string | null;
  reasonText: string | null;
};
