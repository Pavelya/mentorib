import Link from "next/link";
import type { Route } from "next";

import { PersonSummary } from "@/components/continuity";
import {
  Card,
  Chip,
  InlineNotice,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { CASE_STATUS_LABELS } from "@/modules/admin/labels";
import type { ModerationCaseStatus } from "@/modules/admin/constants";
import type { ModerationCaseQueueFilter } from "@/modules/admin/moderation-case";
import {
  DEFAULT_MODERATION_CASE_QUEUE_FILTERS,
  isModerationCaseQueueFilter,
  loadModerationCaseQueue,
  normalizeModerationCaseFilters,
} from "@/modules/admin/moderation-case-repository";
import { loadLessonIssueDisputeSummary } from "@/modules/lessons/lesson-issue-dispute";

import styles from "../moderation/moderation.module.css";

const DISPUTE_STATUS_FILTERS: readonly ModerationCaseStatus[] = [
  "queued",
  "under_review",
  "resolved",
  "dismissed",
];

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InternalDisputesQueuePage({
  searchParams,
}: PageProps) {
  await requireInternalAdminAccount();
  const params = await searchParams;
  const filters = normalizeModerationCaseFilters(parseStringList(params.status));

  // The disputes queue is the shared moderation queue pre-filtered to
  // lesson-issue cases; it links to the same `/internal/moderation/[caseId]`
  // detail page for resolution.
  const queue = await loadModerationCaseQueue({
    caseKinds: ["lesson_issue"],
    filters,
  });
  const summaries = await Promise.all(
    queue.rows.map((row) => loadLessonIssueDisputeSummary(row.subjectId)),
  );

  return (
    <article className={styles.page}>
      <PageHeader
        eyebrow="Internal · Disputes"
        title="Lesson-issue disputes"
        description="Lesson issues that reached manual review because the participants' accounts conflict. Resolving a dispute drives the refund, payout, and reliability consequences."
      />

      <div className={styles.filterGroup}>
        <p className={styles.filterLabel}>Case status</p>
        <div className={styles.filterRow}>
          {DISPUTE_STATUS_FILTERS.map((status) => {
            const isActive = filters.includes(status);
            const counter = queue.counters.find((row) => row.status === status);
            const nextFilters = toggleStatusFilter(filters, status);
            return (
              <Link
                aria-pressed={isActive}
                className={styles.queueRowLink}
                href={buildQueueHref(nextFilters)}
                key={status}
                prefetch={false}
              >
                <Chip pressed={isActive} size="compact" tone="default">
                  {CASE_STATUS_LABELS[status]} · {counter?.count ?? 0}
                </Chip>
              </Link>
            );
          })}
        </div>
      </div>

      {queue.rows.length === 0 ? (
        <InlineNotice tone="info" title="No disputes match these filters">
          <p>
            Lesson issues only appear here once a participant contests the
            other&apos;s account and the case moves to manual review.
          </p>
        </InlineNotice>
      ) : (
        <ul className={styles.queueList}>
          {queue.rows.map((row, index) => {
            const summary = summaries[index];
            return (
              <li key={row.caseId}>
                <Link
                  className={styles.queueRowLink}
                  href={`/internal/moderation/${row.caseId}` as Route}
                  prefetch={false}
                >
                  <Card>
                    <div className={styles.queueRow}>
                      <div className={styles.queueChips}>
                        <StatusBadge tone={row.caseStatusTone}>
                          {row.caseStatusLabel}
                        </StatusBadge>
                        <Chip size="compact" tone="default">
                          {summary.issueTypeLabel}
                        </Chip>
                        <Chip size="compact" tone="default">
                          Lesson {summary.scheduledStartAtLabel}
                        </Chip>
                        {summary.refundEligible ? (
                          <Chip size="compact" tone="default">
                            Refund eligible
                          </Chip>
                        ) : null}
                      </div>
                      <div className={styles.personPair}>
                        <PersonSummary
                          descriptor="Student"
                          name={summary.studentDisplayName ?? "Unknown student"}
                          variant="compact"
                        />
                        <PersonSummary
                          descriptor="Tutor"
                          name={summary.tutorDisplayName ?? "Unknown tutor"}
                          variant="compact"
                        />
                      </div>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Panel
        eyebrow="Resolution"
        tone="mist"
        title="Resolving a dispute"
        description="Open a case to see both participant claims, then claim and resolve it. The resolution outcome you pick determines the refund, payout, and reliability consequences."
      />
    </article>
  );
}

function parseStringList(
  value: string | string[] | undefined,
): readonly string[] | undefined {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  if (Array.isArray(value)) {
    return value;
  }
  return undefined;
}

function toggleStatusFilter(
  current: readonly ModerationCaseQueueFilter[],
  candidate: ModerationCaseQueueFilter,
): readonly ModerationCaseQueueFilter[] {
  const set = new Set(current);
  if (set.has(candidate)) {
    set.delete(candidate);
  } else {
    set.add(candidate);
  }
  if (set.size === 0) {
    return DEFAULT_MODERATION_CASE_QUEUE_FILTERS;
  }
  return Array.from(set).filter(isModerationCaseQueueFilter);
}

function buildQueueHref(
  filters: readonly ModerationCaseQueueFilter[],
): Route {
  const isDefault =
    filters.length === DEFAULT_MODERATION_CASE_QUEUE_FILTERS.length &&
    DEFAULT_MODERATION_CASE_QUEUE_FILTERS.every((filter) =>
      filters.includes(filter),
    );
  if (isDefault) {
    return "/internal/disputes" as Route;
  }
  const params = new URLSearchParams();
  for (const filter of filters) {
    params.append("status", filter);
  }
  const search = params.toString();
  return (search
    ? `/internal/disputes?${search}`
    : "/internal/disputes") as Route;
}
