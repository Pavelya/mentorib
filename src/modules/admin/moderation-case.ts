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
