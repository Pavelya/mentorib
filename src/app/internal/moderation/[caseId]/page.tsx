import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import {
  Card,
  InlineNotice,
  Section,
  StatusBadge,
  getButtonClassName,
} from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { formatUtcDateTime } from "@/lib/datetime";
import type {
  ModerationCaseKind,
  ModerationCaseResolutionKind,
  ModerationCaseStatus,
} from "@/modules/admin/constants";
import {
  loadCaseEvidence,
  loadCaseReporterSummary,
  loadCaseSubjectSummary,
} from "@/modules/admin/moderation-case-evidence";
import {
  loadBlocksInvolvingSubject,
  loadModerationCaseDetail,
  loadModerationCaseNotes,
} from "@/modules/admin/moderation-case-repository";

import { AddCaseNoteForm, CaseActionsPanel } from "./case-actions-panel";
import styles from "../moderation.module.css";

const CASE_KIND_LABELS: Record<ModerationCaseKind, string> = {
  block: "Block",
  lesson_issue: "Lesson issue",
  public_content_takedown: "Public takedown",
  report: "Report",
};

const STATUS_LABELS: Record<ModerationCaseStatus, string> = {
  dismissed: "Dismissed",
  escalated: "Escalated",
  queued: "Queued",
  resolved: "Resolved",
  under_review: "Under review",
};

const RESOLUTION_LABELS: Record<ModerationCaseResolutionKind, string> = {
  dismiss: "Dismissed",
  escalated_to_legal: "Escalated to legal",
  no_action: "No action",
  reject: "Rejected",
  split: "Split outcome",
  uphold: "Upheld",
};

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function InternalModerationCaseDetailPage({
  params,
}: PageProps) {
  await requireInternalAdminAccount();
  const { caseId } = await params;
  const detail = await loadModerationCaseDetail(caseId);
  if (!detail) {
    notFound();
  }

  const [subjectSummary, reporterSummary, evidence, notes, blocks] =
    await Promise.all([
      loadCaseSubjectSummary(detail),
      loadCaseReporterSummary(detail),
      loadCaseEvidence(detail),
      loadModerationCaseNotes(detail.caseId),
      detail.subjectKind === "app_user"
        ? loadBlocksInvolvingSubject("app_user", detail.subjectId)
        : Promise.resolve([]),
    ]);

  return (
    <article className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>
          Internal · Moderation · {CASE_KIND_LABELS[detail.caseKind]}
        </p>
        <h1 className={styles.title}>
          {subjectSummary.primaryLabel}
        </h1>
        <p className={styles.helperText}>
          <Link
            className={getButtonClassName({
              size: "compact",
              variant: "ghost",
            })}
            href={"/internal/moderation" as Route}
            prefetch={false}
          >
            ← Back to queue
          </Link>
        </p>
        <p>
          <StatusBadge tone={getStatusTone(detail.caseStatus)}>
            {STATUS_LABELS[detail.caseStatus]}
          </StatusBadge>
          <span className={styles.queueRowMeta}>
            {" · Opened "}
            {formatUtcDateTime(detail.createdAt)}
          </span>
          {detail.resolutionKind ? (
            <span className={styles.queueRowMeta}>
              {" · "}
              {RESOLUTION_LABELS[detail.resolutionKind]}
            </span>
          ) : null}
        </p>
      </header>

      <div className={styles.detailGrid}>
        <div>
          <Section eyebrow="Subject" title="Case subject" titleAs="h2">
            <Card>
              <ul className={styles.detailList}>
                <DetailRow
                  label="Subject"
                  value={subjectSummary.primaryLabel}
                />
                {subjectSummary.secondaryLabel ? (
                  <DetailRow
                    label="Details"
                    value={subjectSummary.secondaryLabel}
                  />
                ) : null}
                {subjectSummary.tutorPublicSlug ? (
                  <DetailRow
                    label="Public profile"
                    value={`/tutors/${subjectSummary.tutorPublicSlug}`}
                  />
                ) : null}
                <DetailRow label="Kind" value={detail.subjectKind} />
                <DetailRow label="Subject id" value={detail.subjectId} />
              </ul>
            </Card>
          </Section>

          {reporterSummary ? (
            <Section eyebrow="Reporter" title="Who reported" titleAs="h2">
              <Card>
                <ul className={styles.detailList}>
                  <DetailRow
                    label="Display name"
                    value={reporterSummary.displayName ?? "Unknown"}
                  />
                  {reporterSummary.reasonText ? (
                    <DetailRow
                      label="Reason"
                      value={reporterSummary.reasonText}
                    />
                  ) : null}
                </ul>
              </Card>
            </Section>
          ) : null}

          <Section eyebrow="Evidence" title="Triggering content" titleAs="h2">
            {evidence.kind === "message" && evidence.message ? (
              <Card>
                <ul className={styles.detailList}>
                  <DetailRow
                    label="Message body"
                    value={evidence.message.body}
                  />
                  <DetailRow
                    label="Sent"
                    value={formatUtcDateTime(evidence.message.createdAt)}
                  />
                  <DetailRow
                    label="Conversation id"
                    value={evidence.message.conversationId}
                  />
                </ul>
              </Card>
            ) : null}
            {evidence.kind === "tutor_profile" && evidence.tutorProfile ? (
              <Card>
                <ul className={styles.detailList}>
                  {evidence.tutorProfile.publicProfileUrl ? (
                    <DetailRow
                      label="Public profile"
                      value={evidence.tutorProfile.publicProfileUrl}
                    />
                  ) : null}
                  <DetailRow
                    label="Tutor profile id"
                    value={evidence.tutorProfile.tutorProfileId}
                  />
                </ul>
              </Card>
            ) : null}
            {evidence.kind === "conversation" && evidence.conversation ? (
              <Card>
                <ul className={styles.detailList}>
                  <DetailRow
                    label="Conversation id"
                    value={evidence.conversation.conversationId}
                  />
                </ul>
              </Card>
            ) : null}
            {evidence.kind === "none" ? (
              <InlineNotice tone="info" title="No evidence attached">
                <p>
                  This case carries no inline evidence — review notes and the
                  audit log for context.
                </p>
              </InlineNotice>
            ) : null}
          </Section>

          {detail.internalSummary ? (
            <Section eyebrow="Summary" title="Case summary" titleAs="h2">
              <Card>
                <p className={styles.detailValue}>{detail.internalSummary}</p>
              </Card>
            </Section>
          ) : null}

          {blocks.length > 0 ? (
            <Section
              eyebrow="Blocks"
              title="Existing blocks involving this subject"
              titleAs="h2"
            >
              <Card>
                <ul className={styles.detailList}>
                  {blocks.map((block) => (
                    <li className={styles.detailRow} key={block.blockId}>
                      <p className={styles.detailLabel}>
                        {block.blockStatus === "active" ? "Active" : "Released"}
                      </p>
                      <p className={styles.detailValue}>
                        {block.blockerAppUserId} → {block.blockedAppUserId}
                        {" · "}
                        {formatUtcDateTime(block.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            </Section>
          ) : null}

          <Section eyebrow="Notes" title="Internal notes" titleAs="h2">
            {notes.length === 0 ? (
              <InlineNotice tone="info" title="No notes on this case yet">
                <p>Notes are admin-only and never user-visible.</p>
              </InlineNotice>
            ) : (
              <ul className={styles.notesList}>
                {notes.map((note) => (
                  <li key={note.id}>
                    <Card>
                      <div className={styles.noteEntry}>
                        <p className={styles.noteMeta}>
                          {note.authorDisplayName ?? note.authorAppUserId}
                          {" · "}
                          {formatUtcDateTime(note.createdAt)}
                        </p>
                        <p className={styles.noteBody}>{note.body}</p>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
            <AddCaseNoteForm caseId={detail.caseId} />
          </Section>
        </div>

        <CaseActionsPanel
          caseId={detail.caseId}
          caseKind={detail.caseKind}
          caseStatus={detail.caseStatus}
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
