import type { Route } from "next";
import { notFound } from "next/navigation";

import {
  Card,
  Chip,
  Icon,
  InlineNotice,
  PageHeader,
  Section,
  StatusBadge,
} from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { formatUtcDateTime, getTimezoneLabel } from "@/lib/datetime";
import { formatCurrencyFromMinorUnits } from "@/modules/pricing/money";
import { loadTutorApplicationReviewDetail } from "@/modules/tutors/application-review-repository";
import type { TutorApplicationReviewHistoryEntryDto } from "@/modules/tutors/application-review";
import type { TutorApplicationStatus } from "@/modules/tutors/constants";
import { getTutorCredentialsForAdmin } from "@/modules/tutors/media-credentials";
import type { TutorApplicationReviewStatus } from "@/modules/tutors/review-constants";

import { CredentialReviewPanel } from "./credential-review-panel";
import { ReviewActionsPanel } from "./review-actions-panel";
import styles from "../tutor-reviews.module.css";

type PageProps = {
  params: Promise<{ applicationId: string }>;
};

type StatusBadgeTone =
  | "positive"
  | "warning"
  | "destructive"
  | "trust"
  | "info";

export default async function InternalTutorReviewDetailPage({
  params,
}: PageProps) {
  await requireInternalAdminAccount();
  const { applicationId } = await params;
  const detail = await loadTutorApplicationReviewDetail(applicationId);

  if (!detail) {
    notFound();
  }

  const credentials = await getTutorCredentialsForAdmin(detail.applicationId);

  return (
    <article className={styles.page}>
      <PageHeader
        backLink={{ href: "/internal/tutor-reviews" as Route, label: "← Back to queue" }}
        eyebrow="Internal · Tutor reviews"
        status={
          <>
            <StatusBadge tone={getStatusBadgeTone(detail.applicationStatus)}>
              {getStatusLabel(detail.applicationStatus)}
            </StatusBadge>
            {detail.submittedAt ? (
              <span className={styles.queueRowMeta}>
                Submitted {formatUtcDateTime(detail.submittedAt)}
              </span>
            ) : null}
          </>
        }
        title={detail.applicantDisplayName}
      />

      <div className={styles.detailGrid}>
        <div>
          <Section
            density="default"
            eyebrow="Applicant"
            title="Application summary"
            titleAs="h2"
          >
            <Card>
              <ul className={styles.detailList}>
                {detail.fullName ? (
                  <DetailRow label="Full name" value={detail.fullName} />
                ) : null}
                {detail.headline ? (
                  <DetailRow label="Headline" value={detail.headline} />
                ) : null}
                {detail.bio ? (
                  <DetailRow label="Bio" value={detail.bio} />
                ) : null}
                {typeof detail.hourlyRateMinor === "number" ? (
                  <DetailRow
                    label="Hourly rate"
                    value={formatCurrencyFromMinorUnits(
                      detail.hourlyRateMinor,
                      detail.currencyCode,
                    )}
                  />
                ) : null}
                {detail.timezone ? (
                  <DetailRow
                    label="Timezone"
                    value={getTimezoneLabel(detail.timezone)}
                  />
                ) : null}
                {detail.subjectSummaries.length > 0 ? (
                  <li className={styles.detailRow}>
                    <p className={styles.detailLabel}>Subjects</p>
                    <div className={styles.filterRow}>
                      {detail.subjectSummaries.map((summary, index) => (
                        <Chip
                          key={`${summary.subjectLabel ?? "subject"}-${index}`}
                          size="compact"
                          tone="default"
                        >
                          {summary.iconKey ? (
                            <Icon name={summary.iconKey} size={14} />
                          ) : null}
                          <span>
                            {summary.subjectLabel ?? "Subject"}
                            {summary.focusAreaLabel
                              ? ` · ${summary.focusAreaLabel}`
                              : ""}
                          </span>
                        </Chip>
                      ))}
                    </div>
                  </li>
                ) : null}
                {detail.languageLabels.length > 0 ? (
                  <DetailRow
                    label="Languages"
                    value={detail.languageLabels.join(", ")}
                  />
                ) : null}
              </ul>
            </Card>
          </Section>

          <CredentialReviewPanel credentials={credentials.credentials} />

          <Section
            density="default"
            eyebrow="Audit trail"
            title="Review history"
            titleAs="h2"
          >
            {detail.history.length === 0 ? (
              <InlineNotice tone="info" title="No prior review activity">
                <p>This applicant is new to the queue.</p>
              </InlineNotice>
            ) : (
              <ul className={styles.historyList}>
                {detail.history.map((entry) => (
                  <li key={entry.id}>
                    <Card>
                      <div className={styles.historyEntry}>
                        <div className={styles.queueRowHeader}>
                          <StatusBadge
                            tone={getReviewBadgeTone(entry.reviewStatus)}
                          >
                            {getReviewStatusLabel(entry.reviewStatus)}
                          </StatusBadge>
                          <span className={styles.historyMeta}>
                            {entry.reviewerLabel} ·{" "}
                            {formatUtcDateTime(entry.createdAt)}
                          </span>
                        </div>
                        {renderHistoryNotes(entry)}
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <ReviewActionsPanel
          applicationId={detail.applicationId}
          availableActions={detail.availableActions}
        />
      </div>
    </article>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <li className={styles.detailRow}>
      <p className={styles.detailLabel}>{label}</p>
      <p className={styles.detailValue}>{value}</p>
    </li>
  );
}

function renderHistoryNotes(entry: TutorApplicationReviewHistoryEntryDto) {
  const elements: React.ReactNode[] = [];
  if (entry.reviewerNote) {
    elements.push(
      <p className={styles.historyNote} key="reviewer">
        <strong>Reviewer note:</strong> {entry.reviewerNote}
      </p>,
    );
  }
  if (entry.internalNote) {
    elements.push(
      <p className={styles.historyInternalNote} key="internal">
        <strong>Internal note:</strong> {entry.internalNote}
      </p>,
    );
  }
  return elements.length > 0 ? elements : null;
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

function getReviewStatusLabel(status: TutorApplicationReviewStatus): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "under_review":
      return "Claimed";
    case "changes_requested":
      return "Changes requested";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
  }
}

function getReviewBadgeTone(
  status: TutorApplicationReviewStatus,
): StatusBadgeTone {
  switch (status) {
    case "approved":
      return "positive";
    case "under_review":
      return "info";
    case "changes_requested":
      return "warning";
    case "rejected":
      return "destructive";
    case "queued":
    default:
      return "trust";
  }
}
