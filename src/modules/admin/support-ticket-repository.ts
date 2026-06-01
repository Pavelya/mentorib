import "server-only";

import type { Route } from "next";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { adminActionLabel } from "@/modules/admin/labels";
import {
  SUPPORT_TICKET_OPEN_STATUSES,
  type SupportTicketStatus,
} from "@/modules/admin/constants";
import {
  SUPPORT_TICKET_STATUS_LABELS,
  SUPPORT_TICKET_STATUS_TONES,
  type StatusTone,
} from "@/modules/admin/labels";

// `P2-ADMIN-SUPPORT-001` support-ticket read DTOs.
//
// Every row is display-ready: the requester renders through a `PersonSummary`
// (name + email + optional avatar + optional user-record link), status is a
// label + tone, and the operator never sees a raw enum or UUID as body text.
//
// People are resolved with a second batched `app_users` lookup (the house
// pattern, mirroring people-directory's photo lookup) rather than a PostgREST
// embed, so the queries don't depend on foreign-key embed-hint resolution.

const QUEUE_PAGE_SIZE = 20;
const BODY_SNIPPET_LENGTH = 160;

type AppUserLite = {
  avatar_url: string | null;
  full_name: string | null;
  id: string;
};

// Batches a set of app_user ids into a single lookup keyed by id.
async function loadAppUsersById(
  appUserIds: Array<string | null | undefined>,
): Promise<Map<string, AppUserLite>> {
  const ids = Array.from(
    new Set(appUserIds.filter((value): value is string => Boolean(value))),
  );
  const lookup = new Map<string, AppUserLite>();
  if (ids.length === 0) {
    return lookup;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("id, full_name, avatar_url")
    .in("id", ids)
    .returns<AppUserLite[]>();

  if (error || !data) {
    return lookup;
  }
  for (const row of data) {
    lookup.set(row.id, row);
  }
  return lookup;
}

function displayName(user: AppUserLite | undefined): string | null {
  return user?.full_name?.trim() || null;
}

function avatarSrc(user: AppUserLite | undefined): string | null {
  return user?.avatar_url?.trim() || null;
}

function requesterDetailHref(requesterId: string | null): Route | null {
  return requesterId ? (`/internal/users/${requesterId}` as Route) : null;
}

export type SupportTicketQueueItemDto = {
  ticketId: string;
  detailHref: Route;
  requesterDisplayName: string | null;
  requesterEmail: string;
  requesterAvatarSrc: string | null;
  requesterDetailHref: Route | null;
  subject: string;
  bodySnippet: string;
  statusLabel: string;
  statusTone: StatusTone;
  assignedToDisplayName: string | null;
  createdAt: string;
};

export type SupportTicketQueuePage = {
  rows: SupportTicketQueueItemDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  status: SupportTicketStatus | null;
};

type SupportTicketRow = {
  assigned_to_app_user_id: string | null;
  body: string;
  channel: string;
  created_at: string;
  id: string;
  requester_app_user_id: string | null;
  requester_email: string;
  status: SupportTicketStatus;
  subject: string;
  updated_at: string;
};

const TICKET_COLUMNS =
  "id, subject, body, channel, requester_email, requester_app_user_id, " +
  "assigned_to_app_user_id, status, created_at, updated_at";

function snippet(body: string): string {
  const collapsed = body.replace(/\s+/g, " ").trim();
  if (collapsed.length <= BODY_SNIPPET_LENGTH) {
    return collapsed;
  }
  return `${collapsed.slice(0, BODY_SNIPPET_LENGTH).trimEnd()}…`;
}

export type SupportTicketQueueQuery = {
  status?: SupportTicketStatus | null;
  page?: number;
};

export async function loadSupportTicketQueue(
  query: SupportTicketQueueQuery,
): Promise<SupportTicketQueuePage> {
  const supabase = createSupabaseServiceRoleClient();
  const page =
    query.page && Number.isFinite(query.page) && query.page > 0
      ? Math.floor(query.page)
      : 0;
  const from = page * QUEUE_PAGE_SIZE;
  const to = from + QUEUE_PAGE_SIZE - 1;

  let builder = supabase
    .from("support_tickets")
    .select(TICKET_COLUMNS, { count: "exact" });

  if (query.status) {
    builder = builder.eq("status", query.status);
  } else {
    // The default queue shows only actionable tickets, oldest-first.
    builder = builder.in("status", [...SUPPORT_TICKET_OPEN_STATUSES]);
  }

  const { data, count, error } = await builder
    .order("created_at", { ascending: true })
    .range(from, to)
    .returns<SupportTicketRow[]>();

  if (error) {
    throw new Error("Could not load the support queue.");
  }

  const ticketRows = data ?? [];
  const people = await loadAppUsersById(
    ticketRows.flatMap((row) => [
      row.requester_app_user_id,
      row.assigned_to_app_user_id,
    ]),
  );

  const rows: SupportTicketQueueItemDto[] = ticketRows.map((row) => {
    const requester = row.requester_app_user_id
      ? people.get(row.requester_app_user_id)
      : undefined;
    const assignee = row.assigned_to_app_user_id
      ? people.get(row.assigned_to_app_user_id)
      : undefined;
    return {
      assignedToDisplayName: displayName(assignee),
      bodySnippet: snippet(row.body),
      createdAt: row.created_at,
      detailHref: `/internal/support/${row.id}` as Route,
      requesterAvatarSrc: avatarSrc(requester),
      requesterDetailHref: requesterDetailHref(row.requester_app_user_id),
      requesterDisplayName: displayName(requester),
      requesterEmail: row.requester_email,
      statusLabel: SUPPORT_TICKET_STATUS_LABELS[row.status],
      statusTone: SUPPORT_TICKET_STATUS_TONES[row.status],
      subject: row.subject,
      ticketId: row.id,
    };
  });

  const totalCount = count ?? 0;

  return {
    hasNextPage: (page + 1) * QUEUE_PAGE_SIZE < totalCount,
    hasPreviousPage: page > 0,
    page,
    pageSize: QUEUE_PAGE_SIZE,
    rows,
    status: query.status ?? null,
    totalCount,
  };
}

export type SupportTicketDetailDto = {
  ticketId: string;
  subject: string;
  body: string;
  channelLabel: string;
  statusLabel: string;
  statusTone: StatusTone;
  status: SupportTicketStatus;
  requesterDisplayName: string | null;
  requesterEmail: string;
  requesterAvatarSrc: string | null;
  requesterDetailHref: Route | null;
  assignedToDisplayName: string | null;
  assignedToAppUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function loadSupportTicketDetail(
  ticketId: string,
): Promise<SupportTicketDetailDto | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select(TICKET_COLUMNS)
    .eq("id", ticketId)
    .maybeSingle<SupportTicketRow>();

  if (error) {
    throw new Error("Could not load the support ticket.");
  }
  if (!data) {
    return null;
  }

  const people = await loadAppUsersById([
    data.requester_app_user_id,
    data.assigned_to_app_user_id,
  ]);
  const requester = data.requester_app_user_id
    ? people.get(data.requester_app_user_id)
    : undefined;
  const assignee = data.assigned_to_app_user_id
    ? people.get(data.assigned_to_app_user_id)
    : undefined;

  return {
    assignedToAppUserId: data.assigned_to_app_user_id,
    assignedToDisplayName: displayName(assignee),
    body: data.body,
    channelLabel: "Contact form",
    createdAt: data.created_at,
    requesterAvatarSrc: avatarSrc(requester),
    requesterDetailHref: requesterDetailHref(data.requester_app_user_id),
    requesterDisplayName: displayName(requester),
    requesterEmail: data.requester_email,
    status: data.status,
    statusLabel: SUPPORT_TICKET_STATUS_LABELS[data.status],
    statusTone: SUPPORT_TICKET_STATUS_TONES[data.status],
    subject: data.subject,
    ticketId: data.id,
    updatedAt: data.updated_at,
  };
}

export type SupportTicketActivityDto = {
  id: string;
  actionLabel: string;
  actorDisplayName: string | null;
  note: string | null;
  createdAt: string;
};

type SupportTicketActivityRow = {
  action_key: string;
  actor_app_user_id: string;
  created_at: string;
  id: string;
  reason: string | null;
};

export async function loadSupportTicketActivity(
  ticketId: string,
): Promise<SupportTicketActivityDto[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("admin_action_logs")
    .select("id, action_key, actor_app_user_id, reason, created_at")
    .eq("target_type", "support_ticket")
    .eq("target_id", ticketId)
    .order("created_at", { ascending: false })
    .returns<SupportTicketActivityRow[]>();

  if (error) {
    throw new Error("Could not load the ticket activity.");
  }

  const rows = data ?? [];
  const actors = await loadAppUsersById(rows.map((row) => row.actor_app_user_id));

  return rows.map((row) => ({
    actionLabel: adminActionLabel(row.action_key),
    actorDisplayName: displayName(actors.get(row.actor_app_user_id)),
    createdAt: row.created_at,
    id: row.id,
    note: row.action_key === "support.reply" ? row.reason : null,
  }));
}

export async function loadOpenSupportTicketCount(): Promise<number> {
  const supabase = createSupabaseServiceRoleClient();
  const { count, error } = await supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .in("status", [...SUPPORT_TICKET_OPEN_STATUSES]);

  if (error) {
    return 0;
  }
  return count ?? 0;
}
