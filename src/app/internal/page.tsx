import Link from "next/link";
import type { Route } from "next";

import { Card, Chip, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { CASE_KIND_LABELS } from "@/modules/admin/labels";
import type { ModerationCaseKind } from "@/modules/admin/constants";
import { loadModerationCaseCountsByKind } from "@/modules/admin/moderation-case-repository";
import { loadOpenSupportTicketCount } from "@/modules/admin/support-ticket-repository";
import {
  TUTOR_APPLICATION_REVIEW_FILTER_STATUSES,
  type TutorApplicationReviewFilterStatus,
} from "@/modules/tutors/application-review";
import {
  loadTutorApplicationReviewQueue,
  normalizeQueueFilters,
} from "@/modules/tutors/application-review-repository";

import styles from "./internal-home.module.css";

const PENDING_TUTOR_REVIEW_FILTERS: readonly TutorApplicationReviewFilterStatus[] =
  ["queued", "under_review", "changes_requested"];

const TUTOR_REVIEW_FILTER_LABELS: Record<TutorApplicationReviewFilterStatus, string> = {
  queued: "Queued",
  under_review: "Under review",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
};

// Trust-lane case kinds shown on the moderation card, in display order.
// `finance_intervention` and `lesson_issue` surface in their own queues.
const MODERATION_CARD_KINDS: readonly ModerationCaseKind[] = [
  "report",
  "block",
  "public_content_takedown",
];

export default async function InternalHomePage() {
  await requireInternalAdminAccount();

  const [tutorReviewQueue, moderationCounts, openSupportTicketCount] =
    await Promise.all([
      loadTutorApplicationReviewQueue({
        filters: normalizeQueueFilters(undefined),
      }),
      loadModerationCaseCountsByKind(),
      loadOpenSupportTicketCount(),
    ]);

  const pendingTutorReviewCount = TUTOR_APPLICATION_REVIEW_FILTER_STATUSES.filter(
    (status) => PENDING_TUTOR_REVIEW_FILTERS.includes(status),
  ).reduce((sum, status) => {
    const counter = tutorReviewQueue.counters.find((row) => row.status === status);
    return sum + (counter?.count ?? 0);
  }, 0);

  const trustOpenCount = totalTrustOpenCount(moderationCounts);

  return (
    <article className={styles.page}>
      <PageHeader
        eyebrow="Internal · Home"
        title="Operational queues"
        description="Each queue lives behind a dedicated surface. Counts reflect work waiting on a reviewer right now."
      />

      {/* Queue cards attach here; later capability queues join the same grid. */}
      <ul className={styles.queueGrid}>
        <li>
          <Link
            className={styles.queueLink}
            href={"/internal/tutor-reviews" as Route}
            prefetch={false}
          >
            <Card>
              <div className={styles.queueRow}>
                <div className={styles.queueRowHeader}>
                  <h2 className={styles.queueRowTitle}>Tutor reviews</h2>
                  <StatusBadge
                    tone={pendingTutorReviewCount > 0 ? "info" : "positive"}
                  >
                    {pendingTutorReviewCount > 0
                      ? `${pendingTutorReviewCount} waiting`
                      : "Caught up"}
                  </StatusBadge>
                </div>
                <p className={styles.queueRowMeta}>
                  Claim a tutor application, request changes, approve, or
                  reject.
                </p>
                <div className={styles.queueChips}>
                  {TUTOR_APPLICATION_REVIEW_FILTER_STATUSES.map((status) => {
                    const counter = tutorReviewQueue.counters.find(
                      (row) => row.status === status,
                    );
                    return (
                      <Chip key={status} size="compact" tone="default">
                        {TUTOR_REVIEW_FILTER_LABELS[status]} · {counter?.count ?? 0}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            </Card>
          </Link>
        </li>
        <li>
          <Link
            className={styles.queueLink}
            href={"/internal/moderation" as Route}
            prefetch={false}
          >
            <Card>
              <div className={styles.queueRow}>
                <div className={styles.queueRowHeader}>
                  <h2 className={styles.queueRowTitle}>Moderation cases</h2>
                  <StatusBadge tone={trustOpenCount > 0 ? "info" : "positive"}>
                    {trustOpenCount > 0 ? `${trustOpenCount} open` : "Caught up"}
                  </StatusBadge>
                </div>
                <p className={styles.queueRowMeta}>
                  Claim reports, action public-content takedowns, and review
                  block-related cases.
                </p>
                <div className={styles.queueChips}>
                  {MODERATION_CARD_KINDS.map((kind) => (
                    <Chip key={kind} size="compact" tone="default">
                      {CASE_KIND_LABELS[kind]} · {moderationCounts[kind]}
                    </Chip>
                  ))}
                </div>
              </div>
            </Card>
          </Link>
        </li>
        <li>
          <Link
            className={styles.queueLink}
            href={"/internal/disputes" as Route}
            prefetch={false}
          >
            <Card>
              <div className={styles.queueRow}>
                <div className={styles.queueRowHeader}>
                  <h2 className={styles.queueRowTitle}>Lesson disputes</h2>
                  <StatusBadge
                    tone={
                      moderationCounts.lesson_issue > 0 ? "info" : "positive"
                    }
                  >
                    {moderationCounts.lesson_issue > 0
                      ? `${moderationCounts.lesson_issue} open`
                      : "Caught up"}
                  </StatusBadge>
                </div>
                <p className={styles.queueRowMeta}>
                  Resolve contested lesson issues. The outcome drives the
                  refund, payout, and reliability consequences.
                </p>
              </div>
            </Card>
          </Link>
        </li>
        <li>
          <Link
            className={styles.queueLink}
            href={"/internal/support" as Route}
            prefetch={false}
          >
            <Card>
              <div className={styles.queueRow}>
                <div className={styles.queueRowHeader}>
                  <h2 className={styles.queueRowTitle}>Support tickets</h2>
                  <StatusBadge
                    tone={openSupportTicketCount > 0 ? "info" : "positive"}
                  >
                    {openSupportTicketCount > 0
                      ? `${openSupportTicketCount} open`
                      : "Caught up"}
                  </StatusBadge>
                </div>
                <p className={styles.queueRowMeta}>
                  Triage contact-us messages and reply to the requester by
                  email.
                </p>
              </div>
            </Card>
          </Link>
        </li>
        <li>
          <Link
            className={styles.queueLink}
            href={"/internal/reference-data" as Route}
            prefetch={false}
          >
            <Card>
              <div className={styles.queueRow}>
                <div className={styles.queueRowHeader}>
                  <h2 className={styles.queueRowTitle}>Reference data</h2>
                  <StatusBadge tone="info">Editable labels</StatusBadge>
                </div>
                <p className={styles.queueRowMeta}>
                  Edit display labels, descriptions, sort order, and the active
                  toggle on existing reference rows. Publish or revoke Terms
                  and Privacy notices.
                </p>
              </div>
            </Card>
          </Link>
        </li>
      </ul>

      <Panel
        eyebrow="Audit"
        tone="mist"
        title="Every privileged write is logged"
        description="Each admin action emits an admin_action_logs row in the same transaction as the underlying state change. The audit table is the source of truth for who did what when; a dedicated viewer surface is reserved for a later phase."
      />
    </article>
  );
}

// Trust-lane subtotal — excludes lesson_issue, which surfaces in its own
// dispute queue (P2-DISPUTE-001).
function totalTrustOpenCount(
  counts: Awaited<ReturnType<typeof loadModerationCaseCountsByKind>>,
): number {
  return counts.block + counts.public_content_takedown + counts.report;
}
