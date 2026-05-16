import Link from "next/link";
import type { Route } from "next";

import {
  Card,
  Chip,
  InlineNotice,
  Panel,
  StatusBadge,
} from "@/components/ui";

type StatusBadgeTone =
  | "positive"
  | "warning"
  | "destructive"
  | "trust"
  | "info";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { formatUtcDateTime } from "@/lib/datetime";
import {
  loadTutorApplicationReviewQueue,
  normalizeQueueFilters,
} from "@/modules/tutors/application-review-repository";
import {
  TUTOR_APPLICATION_REVIEW_FILTER_STATUSES,
  type TutorApplicationReviewFilterStatus,
  type TutorApplicationReviewQueueRowDto,
} from "@/modules/tutors/application-review";
import type { TutorApplicationStatus } from "@/modules/tutors/constants";

import styles from "./tutor-reviews.module.css";

const FILTER_LABELS: Record<TutorApplicationReviewFilterStatus, string> = {
  queued: "Queued",
  under_review: "Under review",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InternalTutorReviewsPage({
  searchParams,
}: PageProps) {
  await requireInternalAdminAccount();
  const params = await searchParams;
  const filters = normalizeQueueFilters(parseFilters(params.status));
  const queue = await loadTutorApplicationReviewQueue({ filters });

  return (
    <article className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Internal · Tutor reviews</p>
        <h1 className={styles.title}>Tutor application queue</h1>
        <p className={styles.helperText}>
          Filter by review status, then open an application to claim it,
          request changes, approve, or reject.
        </p>
      </header>

      <div className={styles.filterRow}>
        {TUTOR_APPLICATION_REVIEW_FILTER_STATUSES.map((filter) => {
          const isActive = filters.includes(filter);
          const count =
            queue.counters.find((counter) => counter.status === filter)?.count ??
            0;
          const nextFilters = toggleFilter(filters, filter);
          return (
            <Link
              aria-pressed={isActive}
              className={styles.queueRowLink}
              href={buildQueueHref(nextFilters)}
              key={filter}
              prefetch={false}
            >
              <Chip pressed={isActive} size="compact" tone="default">
                {FILTER_LABELS[filter]} · {count}
              </Chip>
            </Link>
          );
        })}
      </div>

      {queue.rows.length === 0 ? (
        <InlineNotice tone="info" title="No applications match these filters">
          <p>
            Adjust the filters above or wait for a new tutor application to
            arrive.
          </p>
        </InlineNotice>
      ) : (
        <ul className={styles.queueList}>
          {queue.rows.map((row) => (
            <li key={row.applicationId}>
              <Link
                className={styles.queueRowLink}
                href={`/internal/tutor-reviews/${row.applicationId}` as Route}
                prefetch={false}
              >
                <Card>
                  <div className={styles.queueRow}>
                    <div className={styles.queueRowHeader}>
                      <h2 className={styles.queueRowTitle}>
                        {row.applicantDisplayName}
                      </h2>
                      <StatusBadge tone={getStatusBadgeTone(row.applicationStatus)}>
                        {getStatusLabel(row.applicationStatus)}
                      </StatusBadge>
                    </div>
                    <p className={styles.queueRowMeta}>
                      {buildQueueRowMeta(row)}
                    </p>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Panel eyebrow="Capacity" tone="mist" title="Queue limits">
        <p className={styles.helperText}>
          The queue shows the oldest 25 matching applications. As you claim and
          decide on them, more will surface on the next page load.
        </p>
      </Panel>
    </article>
  );
}

function parseFilters(
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

function toggleFilter(
  current: readonly TutorApplicationReviewFilterStatus[],
  candidate: TutorApplicationReviewFilterStatus,
): readonly TutorApplicationReviewFilterStatus[] {
  const set = new Set(current);
  if (set.has(candidate)) {
    set.delete(candidate);
  } else {
    set.add(candidate);
  }
  return Array.from(set);
}

function buildQueueHref(
  filters: readonly TutorApplicationReviewFilterStatus[],
): Route {
  if (filters.length === 0) {
    return "/internal/tutor-reviews" as Route;
  }
  const params = new URLSearchParams();
  for (const filter of filters) {
    params.append("status", filter);
  }
  return `/internal/tutor-reviews?${params.toString()}` as Route;
}

function buildQueueRowMeta(row: TutorApplicationReviewQueueRowDto): string {
  const parts: string[] = [];
  if (row.submittedAt) {
    parts.push(`Submitted ${formatUtcDateTime(row.submittedAt)}`);
  }
  if (row.lastReviewerSummary) {
    parts.push(row.lastReviewerSummary);
  }
  if (row.lastTransitionAt) {
    parts.push(`updated ${formatUtcDateTime(row.lastTransitionAt)}`);
  }
  return parts.length > 0
    ? parts.join(" · ")
    : "No prior review activity yet.";
}

function getStatusLabel(status: TutorApplicationStatus): string {
  switch (status) {
    case "submitted":
      return "Queued";
    case "under_review":
      return "Under review";
    case "changes_requested":
      return "Changes requested";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "withdrawn":
      return "Withdrawn";
    case "in_progress":
      return "In progress";
    case "not_started":
    default:
      return "Not started";
  }
}

function getStatusBadgeTone(status: TutorApplicationStatus): StatusBadgeTone {
  switch (status) {
    case "approved":
      return "positive";
    case "under_review":
      return "info";
    case "changes_requested":
      return "warning";
    case "rejected":
      return "destructive";
    case "submitted":
    default:
      return "trust";
  }
}
