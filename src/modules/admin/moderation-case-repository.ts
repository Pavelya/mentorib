import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  ModerationCaseKind,
  ModerationCaseResolutionKind,
  ModerationCaseStatus,
  ModerationCaseSubjectKind,
} from "@/modules/admin/constants";
import {
  MODERATION_CASE_KINDS,
  MODERATION_CASE_STATUSES,
} from "@/modules/admin/constants";
import {
  MODERATION_CASE_QUEUE_PAGE_SIZE,
  type ModerationCaseDetailDto,
  type ModerationCaseQueueCounter,
  type ModerationCaseQueueDto,
  type ModerationCaseQueueFilter,
  type ModerationCaseQueueRowDto,
} from "@/modules/admin/moderation-case";

type CaseQueueRow = {
  case_kind: ModerationCaseKind;
  case_status: ModerationCaseStatus;
  claimed_at: string | null;
  created_at: string;
  id: string;
  priority: number;
  subject_id: string;
  subject_kind: ModerationCaseSubjectKind;
};

type CaseDetailRow = CaseQueueRow & {
  claimed_by_app_user_id: string | null;
  internal_summary: string | null;
  reporter_app_user_id: string | null;
  resolution_kind: ModerationCaseResolutionKind | null;
  resolved_at: string | null;
  resolved_by_app_user_id: string | null;
  triggering_event_id: string | null;
  triggering_event_kind: string | null;
};

export const DEFAULT_MODERATION_CASE_QUEUE_FILTERS: readonly ModerationCaseQueueFilter[] =
  ["queued", "under_review"];

export function isModerationCaseQueueFilter(
  value: string,
): value is ModerationCaseQueueFilter {
  return (MODERATION_CASE_STATUSES as readonly string[]).includes(value);
}

export function normalizeModerationCaseFilters(
  raw: readonly string[] | undefined,
): readonly ModerationCaseQueueFilter[] {
  if (!raw || raw.length === 0) {
    return DEFAULT_MODERATION_CASE_QUEUE_FILTERS;
  }
  const filtered = raw.filter(isModerationCaseQueueFilter);
  if (filtered.length === 0) {
    return DEFAULT_MODERATION_CASE_QUEUE_FILTERS;
  }
  return Array.from(new Set(filtered));
}

export async function loadModerationCaseQueue(input: {
  filters: readonly ModerationCaseQueueFilter[];
  caseKinds?: readonly ModerationCaseKind[];
}): Promise<ModerationCaseQueueDto> {
  const supabase = createSupabaseServiceRoleClient();
  const counters = await loadFilterCounters(input.caseKinds);

  if (input.filters.length === 0) {
    return { appliedFilters: input.filters, counters, rows: [] };
  }

  let query = supabase
    .from("moderation_cases")
    .select(
      "case_kind, case_status, claimed_at, created_at, id, priority, subject_id, subject_kind",
    )
    .in("case_status", input.filters as readonly ModerationCaseStatus[])
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(MODERATION_CASE_QUEUE_PAGE_SIZE);

  if (input.caseKinds && input.caseKinds.length > 0) {
    query = query.in("case_kind", input.caseKinds as readonly ModerationCaseKind[]);
  }

  const { data, error } = await query.returns<CaseQueueRow[]>();
  if (error) {
    throw new Error("Could not load the moderation case queue.");
  }

  return {
    appliedFilters: input.filters,
    counters,
    rows: (data ?? []).map(mapQueueRow),
  };
}

export async function loadModerationCaseDetail(
  caseId: string,
): Promise<ModerationCaseDetailDto | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("moderation_cases")
    .select(
      "case_kind, case_status, claimed_at, claimed_by_app_user_id, created_at, id, internal_summary, priority, reporter_app_user_id, resolution_kind, resolved_at, resolved_by_app_user_id, subject_id, subject_kind, triggering_event_id, triggering_event_kind",
    )
    .eq("id", caseId)
    .maybeSingle<CaseDetailRow>();

  if (error) {
    throw new Error("Could not load the moderation case detail.");
  }
  if (!data) {
    return null;
  }
  return mapDetailRow(data);
}

async function loadFilterCounters(
  caseKinds: readonly ModerationCaseKind[] | undefined,
): Promise<ModerationCaseQueueCounter[]> {
  const supabase = createSupabaseServiceRoleClient();
  const counts: ModerationCaseQueueCounter[] = [];

  await Promise.all(
    MODERATION_CASE_STATUSES.map(async (status) => {
      let countQuery = supabase
        .from("moderation_cases")
        .select("id", { count: "exact", head: true })
        .eq("case_status", status);
      if (caseKinds && caseKinds.length > 0) {
        countQuery = countQuery.in(
          "case_kind",
          caseKinds as readonly ModerationCaseKind[],
        );
      }
      const { count, error } = await countQuery;
      counts.push({ count: error ? 0 : count ?? 0, status });
    }),
  );

  return MODERATION_CASE_STATUSES.map(
    (status) =>
      counts.find((row) => row.status === status) ?? { count: 0, status },
  );
}

export async function loadModerationCaseCountsByKind(): Promise<
  Record<ModerationCaseKind, number>
> {
  const supabase = createSupabaseServiceRoleClient();
  const result: Record<ModerationCaseKind, number> = {
    block: 0,
    lesson_issue: 0,
    public_content_takedown: 0,
    report: 0,
  };

  await Promise.all(
    MODERATION_CASE_KINDS.map(async (kind) => {
      const { count, error } = await supabase
        .from("moderation_cases")
        .select("id", { count: "exact", head: true })
        .eq("case_kind", kind)
        .in("case_status", ["queued", "under_review"]);
      if (!error) {
        result[kind] = count ?? 0;
      }
    }),
  );

  return result;
}

function mapQueueRow(row: CaseQueueRow): ModerationCaseQueueRowDto {
  return {
    caseId: row.id,
    caseKind: row.case_kind,
    caseStatus: row.case_status,
    claimedAt: row.claimed_at,
    createdAt: row.created_at,
    priority: row.priority,
    subjectId: row.subject_id,
    subjectKind: row.subject_kind,
  };
}

function mapDetailRow(row: CaseDetailRow): ModerationCaseDetailDto {
  return {
    ...mapQueueRow(row),
    claimedByAppUserId: row.claimed_by_app_user_id,
    internalSummary: row.internal_summary,
    reporterAppUserId: row.reporter_app_user_id,
    resolutionKind: row.resolution_kind,
    resolvedAt: row.resolved_at,
    resolvedByAppUserId: row.resolved_by_app_user_id,
    triggeringEventId: row.triggering_event_id,
    triggeringEventKind: row.triggering_event_kind,
  };
}
