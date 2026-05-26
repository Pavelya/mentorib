import Link from "next/link";
import type { Route } from "next";

import { ScreenState } from "@/components/continuity";
import { Card, Chip, Panel, StatusBadge } from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { loadModerationCaseCountsByKind } from "@/modules/admin/moderation-case-repository";
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

export default async function InternalHomePage() {
  await requireInternalAdminAccount();

  const [tutorReviewQueue, moderationCounts] = await Promise.all([
    loadTutorApplicationReviewQueue({
      filters: normalizeQueueFilters(undefined),
    }),
    loadModerationCaseCountsByKind(),
  ]);

  const pendingTutorReviewCount = TUTOR_APPLICATION_REVIEW_FILTER_STATUSES.filter(
    (status) => PENDING_TUTOR_REVIEW_FILTERS.includes(status),
  ).reduce((sum, status) => {
    const counter = tutorReviewQueue.counters.find((row) => row.status === status);
    return sum + (counter?.count ?? 0);
  }, 0);

  return (
    <article className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Internal · Home</p>
        <h1 className={styles.title}>Operational queues</h1>
        <p className={styles.helperText}>
          Each queue lives behind a dedicated surface. Counts reflect work
          waiting on a reviewer right now.
        </p>
      </header>

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
          <Card>
            <div className={styles.queueRow}>
              <div className={styles.queueRowHeader}>
                <h2 className={styles.queueRowTitle}>Moderation cases</h2>
                <StatusBadge tone="trust">
                  {totalModerationOpenCount(moderationCounts) > 0
                    ? `${totalModerationOpenCount(moderationCounts)} open`
                    : "0 open"}
                </StatusBadge>
              </div>
              <ScreenState
                description={
                  totalModerationOpenCount(moderationCounts) === 0
                    ? "No queue UI is mounted yet. The trust and report surface lands in P2-OPS-001; the lesson-issue dispute surface lands in P2-DISPUTE-001."
                    : "Open cases exist but the queue UI is not yet mounted. Surfaces land in P2-OPS-001 and P2-DISPUTE-001."
                }
                kind="empty"
                title="Queue UI not yet mounted"
              />
              <div className={styles.queueChips}>
                <Chip size="compact" tone="default">
                  Reports · {moderationCounts.report}
                </Chip>
                <Chip size="compact" tone="default">
                  Blocks · {moderationCounts.block}
                </Chip>
                <Chip size="compact" tone="default">
                  Lesson issues · {moderationCounts.lesson_issue}
                </Chip>
                <Chip size="compact" tone="default">
                  Takedowns · {moderationCounts.public_content_takedown}
                </Chip>
              </div>
            </div>
          </Card>
        </li>
        <li>
          <Card>
            <div className={styles.queueRow}>
              <div className={styles.queueRowHeader}>
                <h2 className={styles.queueRowTitle}>Reference data</h2>
                <StatusBadge tone="trust">Not mounted</StatusBadge>
              </div>
              <ScreenState
                description="The reference-data editor lands in P2-OPS-003. No live counter is available yet."
                kind="empty"
                title="Queue UI not yet mounted"
              />
            </div>
          </Card>
        </li>
      </ul>

      <Panel eyebrow="Audit" tone="mist" title="Every privileged write is logged">
        <p className={styles.helperText}>
          Each admin action emits an `admin_action_logs` row in the same
          transaction as the underlying state change. The audit table is the
          source of truth for &ldquo;who did what when&rdquo;; a dedicated viewer surface
          is reserved for a later phase.
        </p>
      </Panel>
    </article>
  );
}

function totalModerationOpenCount(
  counts: Awaited<ReturnType<typeof loadModerationCaseCountsByKind>>,
): number {
  return (
    counts.block +
    counts.lesson_issue +
    counts.public_content_takedown +
    counts.report
  );
}
