import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { PersonSummary } from "@/components/continuity";
import {
  ActivityList,
  Card,
  DescriptionList,
  type DescriptionListItem,
  InlineNotice,
  PageHeader,
  Section,
  StatusBadge,
  getButtonClassName,
} from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { formatUtcDateTime } from "@/lib/datetime";
import {
  loadSupportTicketActivity,
  loadSupportTicketDetail,
} from "@/modules/admin/support-ticket-repository";

import { SupportTicketActions } from "../support-ticket-actions";
import styles from "../support.module.css";

type PageProps = {
  params: Promise<{ ticketId: string }>;
};

export default async function InternalSupportTicketDetailPage({
  params,
}: PageProps) {
  const admin = await requireInternalAdminAccount();
  const { ticketId } = await params;

  const detail = await loadSupportTicketDetail(ticketId);
  if (!detail) {
    notFound();
  }

  const activity = await loadSupportTicketActivity(detail.ticketId);

  const requesterLink = detail.requesterDetailHref ? (
    <Link
      className={getButtonClassName({ size: "compact", variant: "ghost" })}
      href={detail.requesterDetailHref}
      prefetch={false}
    >
      View user record
    </Link>
  ) : null;

  const detailItems: DescriptionListItem[] = [
    { label: "Channel", value: detail.channelLabel },
    {
      label: "Status",
      value: (
        <StatusBadge tone={detail.statusTone}>{detail.statusLabel}</StatusBadge>
      ),
    },
    { label: "Received", value: formatUtcDateTime(detail.createdAt) },
    { label: "Last updated", value: formatUtcDateTime(detail.updatedAt) },
    {
      label: "Assigned to",
      value: detail.assignedToDisplayName ?? "Unassigned",
    },
  ];

  return (
    <article className={styles.page}>
      <PageHeader
        backLink={{ href: "/internal/support" as Route, label: "← Back to queue" }}
        eyebrow="Internal · Support"
        status={
          <>
            <StatusBadge tone={detail.statusTone}>
              {detail.statusLabel}
            </StatusBadge>
            <span>Received {formatUtcDateTime(detail.createdAt)}</span>
          </>
        }
        title={detail.subject}
      />

      <div className={styles.detailGrid}>
        <div className={styles.detailColumn}>
          <Section eyebrow="Requester" title="Who sent this" titleAs="h2">
            <Card>
              <PersonSummary
                action={requesterLink}
                avatarSrc={detail.requesterAvatarSrc ?? undefined}
                descriptor={detail.requesterEmail}
                name={detail.requesterDisplayName ?? detail.requesterEmail}
                variant="header"
              />
              <DescriptionList items={detailItems} />
            </Card>
          </Section>

          <Section eyebrow="Message" title="What they wrote" titleAs="h2">
            <Card>
              <p className={styles.messageBody}>{detail.body}</p>
            </Card>
          </Section>

          <Section eyebrow="Activity" title="Replies and changes" titleAs="h2">
            {activity.length === 0 ? (
              <InlineNotice tone="info" title="No activity yet">
                <p>
                  Replies, status changes, and assignments appear here once an
                  operator acts on this ticket.
                </p>
              </InlineNotice>
            ) : (
              <ActivityList
                items={activity.map((entry) => ({
                  body: entry.note ?? undefined,
                  header: (
                    <PersonSummary
                      descriptor={entry.actionLabel}
                      name={entry.actorDisplayName ?? "Unknown operator"}
                      variant="compact"
                    />
                  ),
                  id: entry.id,
                  timestamp: formatUtcDateTime(entry.createdAt),
                }))}
              />
            )}
          </Section>
        </div>

        <Section eyebrow="Actions" title="Reply and triage" titleAs="h2">
          <SupportTicketActions
            currentStatus={detail.status}
            isAssignedToViewer={detail.assignedToAppUserId === admin.id}
            ticketId={detail.ticketId}
          />
        </Section>
      </div>
    </article>
  );
}
