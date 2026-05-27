import Link from "next/link";
import type { Route } from "next";

import { Card, Chip, InlineNotice, Panel, StatusBadge } from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { formatUtcDateTime } from "@/lib/datetime";
import {
  DEFAULT_MODERATION_CASE_QUEUE_FILTERS,
  isModerationCaseQueueFilter,
  loadModerationCaseQueue,
  normalizeModerationCaseFilters,
} from "@/modules/admin/moderation-case-repository";
import type {
  ModerationCaseQueueFilter,
  ModerationCaseQueueRowDto,
} from "@/modules/admin/moderation-case";
import {
  MODERATION_CASE_KINDS,
  type ModerationCaseKind,
  type ModerationCaseStatus,
} from "@/modules/admin/constants";

import { OpenTakedownForm } from "./open-takedown-form";
import styles from "./moderation.module.css";

// Lesson-issue cases are surfaced separately in the dispute queue
// shipped by `P2-DISPUTE-001`; this surface intentionally hides them.
const VISIBLE_CASE_KINDS: readonly ModerationCaseKind[] = [
  "report",
  "block",
  "public_content_takedown",
];

const CASE_KIND_LABELS: Record<ModerationCaseKind, string> = {
  block: "Blocks",
  lesson_issue: "Lesson issues",
  public_content_takedown: "Takedowns",
  report: "Reports",
};

const CASE_STATUS_LABELS: Record<ModerationCaseStatus, string> = {
  dismissed: "Dismissed",
  escalated: "Escalated",
  queued: "Queued",
  resolved: "Resolved",
  under_review: "Under review",
};

const VISIBLE_STATUS_FILTERS: readonly ModerationCaseStatus[] = [
  "queued",
  "under_review",
  "resolved",
  "dismissed",
];

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InternalModerationQueuePage({
  searchParams,
}: PageProps) {
  await requireInternalAdminAccount();
  const params = await searchParams;
  const filters = normalizeModerationCaseFilters(
    parseStringList(params.status),
  );
  const requestedKinds = parseKindList(params.kind);
  const activeKinds =
    requestedKinds.length > 0 ? requestedKinds : VISIBLE_CASE_KINDS;

  const queue = await loadModerationCaseQueue({
    caseKinds: activeKinds,
    filters,
  });

  return (
    <article className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Internal · Moderation</p>
        <h1 className={styles.title}>Trust &amp; safety queue</h1>
        <p className={styles.helperText}>
          Reports, block-related cases, and admin-initiated public-content
          takedowns. Lesson-issue disputes live in their own queue.
        </p>
      </header>

      <div className={styles.filterGroup}>
        <p className={styles.filterLabel}>Case kind</p>
        <div className={styles.filterRow}>
          {VISIBLE_CASE_KINDS.map((kind) => {
            const isActive =
              requestedKinds.length === 0 || requestedKinds.includes(kind);
            const nextKinds = toggleKindFilter(requestedKinds, kind);
            return (
              <Link
                aria-pressed={isActive}
                className={styles.queueRowLink}
                href={buildQueueHref(nextKinds, filters)}
                key={kind}
                prefetch={false}
              >
                <Chip pressed={isActive} size="compact" tone="default">
                  {CASE_KIND_LABELS[kind]}
                </Chip>
              </Link>
            );
          })}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <p className={styles.filterLabel}>Case status</p>
        <div className={styles.filterRow}>
          {VISIBLE_STATUS_FILTERS.map((status) => {
            const isActive = filters.includes(status);
            const counter = queue.counters.find(
              (row) => row.status === status,
            );
            const nextFilters = toggleStatusFilter(filters, status);
            return (
              <Link
                aria-pressed={isActive}
                className={styles.queueRowLink}
                href={buildQueueHref(requestedKinds, nextFilters)}
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
        <InlineNotice tone="info" title="No cases match these filters">
          <p>
            Adjust the filters above, or wait for a new report or takedown to
            arrive.
          </p>
        </InlineNotice>
      ) : (
        <ul className={styles.queueList}>
          {queue.rows.map((row) => (
            <li key={row.caseId}>
              <Link
                className={styles.queueRowLink}
                href={`/internal/moderation/${row.caseId}` as Route}
                prefetch={false}
              >
                <Card>
                  <div className={styles.queueRow}>
                    <div className={styles.queueRowHeader}>
                      <h2 className={styles.queueRowTitle}>
                        {CASE_KIND_LABELS[row.caseKind]}
                      </h2>
                      <StatusBadge tone={getStatusTone(row.caseStatus)}>
                        {CASE_STATUS_LABELS[row.caseStatus]}
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

      <OpenTakedownForm />

      <Panel eyebrow="Capacity" tone="mist" title="Queue limits">
        <p className={styles.helperText}>
          The queue shows the oldest matching cases first. Resolve or dismiss
          a case to surface the next one.
        </p>
      </Panel>
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

function parseKindList(
  value: string | string[] | undefined,
): readonly ModerationCaseKind[] {
  const list = parseStringList(value);
  if (!list || list.length === 0) {
    return [];
  }
  const valid: ModerationCaseKind[] = [];
  for (const entry of list) {
    if (
      (MODERATION_CASE_KINDS as readonly string[]).includes(entry) &&
      (VISIBLE_CASE_KINDS as readonly string[]).includes(entry)
    ) {
      valid.push(entry as ModerationCaseKind);
    }
  }
  return valid;
}

function toggleKindFilter(
  current: readonly ModerationCaseKind[],
  candidate: ModerationCaseKind,
): readonly ModerationCaseKind[] {
  const effective = current.length === 0 ? [...VISIBLE_CASE_KINDS] : [...current];
  const idx = effective.indexOf(candidate);
  if (idx >= 0) {
    effective.splice(idx, 1);
  } else {
    effective.push(candidate);
  }
  return effective;
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
  kinds: readonly ModerationCaseKind[],
  filters: readonly ModerationCaseQueueFilter[],
): Route {
  const params = new URLSearchParams();
  for (const kind of kinds) {
    params.append("kind", kind);
  }
  for (const filter of filters) {
    if (
      filter !== DEFAULT_MODERATION_CASE_QUEUE_FILTERS[0] ||
      filters.length !== DEFAULT_MODERATION_CASE_QUEUE_FILTERS.length ||
      !DEFAULT_MODERATION_CASE_QUEUE_FILTERS.every((f) => filters.includes(f))
    ) {
      params.append("status", filter);
    }
  }
  const search = params.toString();
  return (search ? `/internal/moderation?${search}` : "/internal/moderation") as Route;
}

function buildQueueRowMeta(row: ModerationCaseQueueRowDto): string {
  const parts: string[] = [];
  parts.push(`Opened ${formatUtcDateTime(row.createdAt)}`);
  parts.push(`Subject: ${humanizeSubjectKind(row.subjectKind)}`);
  if (row.priority > 0) {
    parts.push(`Priority ${row.priority}`);
  }
  if (row.claimedAt) {
    parts.push(`Claimed ${formatUtcDateTime(row.claimedAt)}`);
  }
  return parts.join(" · ");
}

function humanizeSubjectKind(kind: ModerationCaseQueueRowDto["subjectKind"]): string {
  switch (kind) {
    case "app_user":
      return "User";
    case "tutor_profile":
      return "Tutor profile";
    case "message":
      return "Message";
    case "conversation":
      return "Conversation";
    case "lesson_booking":
      return "Lesson";
  }
}

function getStatusTone(
  status: ModerationCaseStatus,
): "positive" | "warning" | "destructive" | "trust" | "info" {
  switch (status) {
    case "resolved":
      return "positive";
    case "under_review":
      return "info";
    case "dismissed":
      return "warning";
    case "escalated":
      return "destructive";
    case "queued":
    default:
      return "trust";
  }
}

