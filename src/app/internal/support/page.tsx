import Link from "next/link";
import type { Route } from "next";

import { PersonSummary } from "@/components/continuity";
import {
  Card,
  Chip,
  InlineNotice,
  PageHeader,
  Panel,
  getButtonClassName,
} from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { formatUtcDateTime } from "@/lib/datetime";
import {
  SUPPORT_TICKET_STATUSES,
  type SupportTicketStatus,
} from "@/modules/admin/constants";
import { SUPPORT_TICKET_STATUS_LABELS } from "@/modules/admin/labels";
import {
  loadSupportTicketQueue,
  type SupportTicketQueueItemDto,
} from "@/modules/admin/support-ticket-repository";

import styles from "./support.module.css";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = params[key];
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return "";
}

function isSupportTicketStatus(value: string): value is SupportTicketStatus {
  return (SUPPORT_TICKET_STATUSES as readonly string[]).includes(value);
}

function queueHref(
  status: SupportTicketStatus | null,
  page: number,
): Route {
  const query = new URLSearchParams();
  if (status) {
    query.set("status", status);
  }
  if (page > 0) {
    query.set("page", String(page));
  }
  const qs = query.toString();
  return (qs ? `/internal/support?${qs}` : "/internal/support") as Route;
}

export default async function InternalSupportPage({ searchParams }: PageProps) {
  await requireInternalAdminAccount();
  const params = await searchParams;
  const statusParam = readParam(params, "status");
  const status = isSupportTicketStatus(statusParam) ? statusParam : null;
  const pageParam = Number.parseInt(readParam(params, "page"), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 0;

  const queue = await loadSupportTicketQueue({ page, status });

  const filters: Array<{ label: string; status: SupportTicketStatus | null }> = [
    { label: "Open queue", status: null },
    ...SUPPORT_TICKET_STATUSES.map((value) => ({
      label: SUPPORT_TICKET_STATUS_LABELS[value],
      status: value,
    })),
  ];

  return (
    <article className={styles.page}>
      <PageHeader
        eyebrow="Internal · Support"
        title="Support tickets"
        description="Contact-us messages, oldest first. Open a ticket to reply by email and move it through triage. The default view shows tickets still awaiting action."
      />

      <div className={styles.filterRow}>
        {filters.map((filter) => {
          const active = filter.status === status;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={getButtonClassName({
                size: "compact",
                variant: active ? "secondary" : "ghost",
              })}
              href={queueHref(filter.status, 0)}
              key={filter.label}
              prefetch={false}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {queue.rows.length === 0 ? (
        <InlineNotice tone="info" title="Nothing in this view">
          <p>
            No tickets match this filter. New contact-us submissions arrive here
            as they come in.
          </p>
        </InlineNotice>
      ) : (
        <ul className={styles.queueList}>
          {queue.rows.map((ticket) => (
            <li key={ticket.ticketId}>
              <SupportQueueCard ticket={ticket} />
            </li>
          ))}
        </ul>
      )}

      {queue.totalCount > queue.pageSize ? (
        <nav aria-label="Pagination" className={styles.pagination}>
          {queue.hasPreviousPage ? (
            <Link
              className={getButtonClassName({ size: "compact", variant: "ghost" })}
              href={queueHref(status, queue.page - 1)}
              prefetch={false}
            >
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          {queue.hasNextPage ? (
            <Link
              className={getButtonClassName({ size: "compact", variant: "ghost" })}
              href={queueHref(status, queue.page + 1)}
              prefetch={false}
            >
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}

      <Panel
        eyebrow="How this works"
        tone="mist"
        title="Replies go out by email"
        description="Some senders are logged out, so every reply is sent to the requester's email via Resend. Replying, changing status, and assigning are each recorded in the audit log."
      />
    </article>
  );
}

function SupportQueueCard({ ticket }: { ticket: SupportTicketQueueItemDto }) {
  const requesterLink = ticket.requesterDetailHref ? (
    <Link
      className={getButtonClassName({ size: "compact", variant: "ghost" })}
      href={ticket.requesterDetailHref}
      prefetch={false}
    >
      View user record
    </Link>
  ) : null;

  return (
    <Card>
      <div className={styles.queueRow}>
        <PersonSummary
          action={requesterLink}
          avatarSrc={ticket.requesterAvatarSrc ?? undefined}
          badges={[{ label: ticket.statusLabel, tone: ticket.statusTone }]}
          descriptor={ticket.requesterEmail}
          name={ticket.requesterDisplayName ?? ticket.requesterEmail}
          variant="operational"
        />

        <Link href={ticket.detailHref} prefetch={false}>
          {ticket.subject}
        </Link>
        <p className={styles.bodySnippet}>{ticket.bodySnippet}</p>

        <div className={styles.queueChips}>
          <Chip size="compact" tone="default">
            Received {formatUtcDateTime(ticket.createdAt)}
          </Chip>
          {ticket.assignedToDisplayName ? (
            <Chip size="compact" tone="default">
              Assigned to {ticket.assignedToDisplayName}
            </Chip>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
