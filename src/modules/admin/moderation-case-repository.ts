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
  CASE_KIND_LABELS,
  CASE_RESOLUTION_LABELS,
  CASE_STATUS_LABELS,
  CASE_STATUS_TONES,
  SUBJECT_BLOCK_STATUS_LABELS,
  SUBJECT_BLOCK_STATUS_TONES,
  SUBJECT_KIND_LABELS,
} from "@/modules/admin/labels";
import {
  MODERATION_CASE_QUEUE_PAGE_SIZE,
  type ModerationCaseDetailDto,
  type ModerationCaseNoteDto,
  type ModerationCaseQueueCounter,
  type ModerationCaseQueueDto,
  type ModerationCaseQueueFilter,
  type ModerationCaseQueueItemDto,
  type ModerationCaseQueueRowDto,
  type ModerationSubjectBlockDto,
} from "@/modules/admin/moderation-case";

// One-line reason snippets keep the list scannable without pulling the full
// reporter-supplied text through the queue payload.
const QUEUE_REASON_SNIPPET_MAX = 140;

function toReasonSnippet(value: string | null): string | null {
  const text = value?.trim();
  if (!text) {
    return null;
  }
  if (text.length <= QUEUE_REASON_SNIPPET_MAX) {
    return text;
  }
  return `${text.slice(0, QUEUE_REASON_SNIPPET_MAX - 1).trimEnd()}…`;
}

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

// The queue select pulls `internal_summary` only to derive a truncated reason
// snippet; the raw column never reaches the list DTO.
type CaseQueueSelectRow = CaseQueueRow & {
  internal_summary: string | null;
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
      "case_kind, case_status, claimed_at, created_at, id, internal_summary, priority, subject_id, subject_kind",
    )
    .in("case_status", input.filters as readonly ModerationCaseStatus[])
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(MODERATION_CASE_QUEUE_PAGE_SIZE);

  if (input.caseKinds && input.caseKinds.length > 0) {
    query = query.in("case_kind", input.caseKinds as readonly ModerationCaseKind[]);
  }

  const { data, error } = await query.returns<CaseQueueSelectRow[]>();
  if (error) {
    throw new Error("Could not load the moderation case queue.");
  }

  return {
    appliedFilters: input.filters,
    counters,
    rows: (data ?? []).map(mapQueueItem),
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
    finance_intervention: 0,
    lesson_issue: 0,
    public_content_takedown: 0,
    report: 0,
    review: 0,
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
    caseKindLabel: CASE_KIND_LABELS[row.case_kind],
    caseStatus: row.case_status,
    caseStatusLabel: CASE_STATUS_LABELS[row.case_status],
    caseStatusTone: CASE_STATUS_TONES[row.case_status],
    claimedAt: row.claimed_at,
    createdAt: row.created_at,
    priority: row.priority,
    subjectId: row.subject_id,
    subjectKind: row.subject_kind,
    subjectKindLabel: SUBJECT_KIND_LABELS[row.subject_kind],
  };
}

function mapQueueItem(row: CaseQueueSelectRow): ModerationCaseQueueItemDto {
  return {
    ...mapQueueRow(row),
    reasonSnippet: toReasonSnippet(row.internal_summary),
  };
}

type CaseNoteRow = {
  author_app_user_id: string;
  body: string;
  created_at: string;
  id: string;
};

export async function loadModerationCaseNotes(
  caseId: string,
): Promise<ModerationCaseNoteDto[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("moderation_case_notes")
    .select("author_app_user_id, body, created_at, id")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true })
    .returns<CaseNoteRow[]>();

  if (error) {
    throw new Error("Could not load moderation case notes.");
  }
  if (!data || data.length === 0) {
    return [];
  }

  const authorIds = Array.from(new Set(data.map((row) => row.author_app_user_id)));
  const authorNames = await loadDisplayNamesByAppUserIds(authorIds);

  return data.map((row) => ({
    authorAppUserId: row.author_app_user_id,
    authorDisplayName: authorNames.get(row.author_app_user_id) ?? null,
    body: row.body,
    createdAt: row.created_at,
    id: row.id,
  }));
}

type BlockRow = {
  block_status: "active" | "released";
  blocked_app_user_id: string;
  blocker_app_user_id: string;
  created_at: string;
  id: string;
};

// Admin-only loader for the case-detail "Existing blocks involving this
// subject" panel. Returns D7-shaped rows scoped to a single subject —
// never widens visibility into the broader block table.
export async function loadBlocksInvolvingSubject(
  subjectKind: "app_user",
  subjectAppUserId: string,
): Promise<ModerationSubjectBlockDto[]> {
  if (subjectKind !== "app_user") {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("user_blocks")
    .select("block_status, blocked_app_user_id, blocker_app_user_id, created_at, id")
    .or(
      `blocker_app_user_id.eq.${subjectAppUserId},blocked_app_user_id.eq.${subjectAppUserId}`,
    )
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<BlockRow[]>();

  if (error) {
    throw new Error("Could not load blocks involving the subject.");
  }

  const rows = data ?? [];
  const identities = await loadAppUserIdentities(
    rows.flatMap((row) => [row.blocker_app_user_id, row.blocked_app_user_id]),
  );

  return rows.map((row) => {
    const blocker = identities.get(row.blocker_app_user_id);
    const blocked = identities.get(row.blocked_app_user_id);
    return {
      blockedAppUserId: row.blocked_app_user_id,
      blockedAvatarSrc: blocked?.avatarUrl ?? null,
      blockedDisplayName: blocked?.displayName ?? null,
      blockerAppUserId: row.blocker_app_user_id,
      blockerAvatarSrc: blocker?.avatarUrl ?? null,
      blockerDisplayName: blocker?.displayName ?? null,
      blockId: row.id,
      blockStatus: row.block_status,
      blockStatusLabel: SUBJECT_BLOCK_STATUS_LABELS[row.block_status],
      blockStatusTone: SUBJECT_BLOCK_STATUS_TONES[row.block_status],
      createdAt: row.created_at,
    };
  });
}

// Display-ready identity for an app user: trimmed name + account avatar URL.
// Shared across the admin DTO boundary so subjects, reporters, note authors,
// audit actors, and block participants all resolve a `PersonSummary`-ready
// name and avatar from one place (`P2-OPSFIX-001`).
export type AdminAppUserIdentity = {
  displayName: string | null;
  avatarUrl: string | null;
};

export async function loadAppUserIdentities(
  appUserIds: readonly string[],
): Promise<Map<string, AdminAppUserIdentity>> {
  const lookup = new Map<string, AdminAppUserIdentity>();
  const uniqueIds = Array.from(new Set(appUserIds)).filter(Boolean);
  if (uniqueIds.length === 0) {
    return lookup;
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("avatar_url, full_name, id")
    .in("id", uniqueIds)
    .returns<
      Array<{ avatar_url: string | null; full_name: string | null; id: string }>
    >();

  if (error) {
    return lookup;
  }

  for (const row of data ?? []) {
    lookup.set(row.id, {
      avatarUrl: row.avatar_url?.trim() || null,
      displayName: row.full_name?.trim() || null,
    });
  }
  return lookup;
}

export async function loadAppUserIdentity(
  appUserId: string,
): Promise<AdminAppUserIdentity> {
  const identities = await loadAppUserIdentities([appUserId]);
  return identities.get(appUserId) ?? { avatarUrl: null, displayName: null };
}

async function loadDisplayNamesByAppUserIds(
  appUserIds: readonly string[],
): Promise<Map<string, string>> {
  const identities = await loadAppUserIdentities(appUserIds);
  const lookup = new Map<string, string>();
  for (const [id, identity] of identities) {
    if (identity.displayName) {
      lookup.set(id, identity.displayName);
    }
  }
  return lookup;
}

export async function loadAppUserDisplayName(
  appUserId: string,
): Promise<string | null> {
  const identity = await loadAppUserIdentity(appUserId);
  return identity.displayName;
}

function mapDetailRow(row: CaseDetailRow): ModerationCaseDetailDto {
  return {
    ...mapQueueRow(row),
    claimedByAppUserId: row.claimed_by_app_user_id,
    internalSummary: row.internal_summary,
    reporterAppUserId: row.reporter_app_user_id,
    resolutionKind: row.resolution_kind,
    resolutionKindLabel: row.resolution_kind
      ? CASE_RESOLUTION_LABELS[row.resolution_kind]
      : null,
    resolvedAt: row.resolved_at,
    resolvedByAppUserId: row.resolved_by_app_user_id,
    triggeringEventId: row.triggering_event_id,
    triggeringEventKind: row.triggering_event_kind,
  };
}
