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
  loadCaseEvidence,
  loadCaseReporterSummary,
  loadCaseSubjectSummary,
} from "@/modules/admin/moderation-case-evidence";
import {
  loadBlocksInvolvingSubject,
  loadModerationCaseDetail,
  loadModerationCaseNotes,
} from "@/modules/admin/moderation-case-repository";
import { loadLessonIssueDisputeDetail } from "@/modules/lessons/lesson-issue-dispute";

import { AddCaseNoteForm, CaseActionsPanel } from "./case-actions-panel";
import styles from "../moderation.module.css";

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

  // Lesson-issue cases extend the detail with a side-by-side participant-claim
  // view, loaded from the lessons module (the admin module never widens its DTO
  // surface into lesson internals).
  const dispute =
    detail.caseKind === "lesson_issue"
      ? await loadLessonIssueDisputeDetail(detail.subjectId)
      : null;

  const subjectLink = subjectSummary.publicProfileHref ? (
    <Link
      className={getButtonClassName({ size: "compact", variant: "ghost" })}
      href={subjectSummary.publicProfileHref}
      prefetch={false}
    >
      View public profile
    </Link>
  ) : subjectSummary.appUserId ? (
    <Link
      className={getButtonClassName({ size: "compact", variant: "ghost" })}
      href={`/internal/users/${subjectSummary.appUserId}` as Route}
      prefetch={false}
    >
      View user record
    </Link>
  ) : null;

  const subjectItems: DescriptionListItem[] = [
    { label: "Kind", value: subjectSummary.kindLabel },
  ];
  if (subjectSummary.secondaryLabel) {
    subjectItems.push({
      label: "Details",
      value: subjectSummary.secondaryLabel,
    });
  }
  if (subjectSummary.publicProfileHref) {
    subjectItems.push({
      label: "Public profile",
      value: (
        <Link href={subjectSummary.publicProfileHref} prefetch={false}>
          {subjectSummary.publicProfileHref}
        </Link>
      ),
    });
  }

  const technicalRefs: DescriptionListItem[] = [
    { label: "Case id", value: detail.caseId },
    { label: "Subject id", value: detail.subjectId },
  ];
  if (detail.triggeringEventId) {
    technicalRefs.push({
      label: "Triggering event id",
      value: detail.triggeringEventId,
    });
  }

  const disputeLessonItems: DescriptionListItem[] = dispute
    ? [
        { label: "Lesson", value: dispute.scheduledStartAtLabel },
        { label: "Reported issue", value: dispute.issueTypeLabel },
        {
          label: "Refund eligibility",
          value: dispute.refundEligible
            ? "Captured payment is refundable"
            : "No refundable captured payment",
        },
      ]
    : [];
  if (dispute?.resolutionOutcomeLabel) {
    disputeLessonItems.push({
      label: "Recorded outcome",
      value: dispute.resolutionOutcomeLabel,
    });
  }

  const studentClaimItems: DescriptionListItem[] = dispute
    ? [{ label: "Claim", value: dispute.student.claimLabel }]
    : [];
  if (dispute?.student.claimSummary) {
    studentClaimItems.push({
      label: "Details",
      value: dispute.student.claimSummary,
    });
  }

  const tutorClaimItems: DescriptionListItem[] = dispute
    ? [{ label: "Claim", value: dispute.tutor.claimLabel }]
    : [];
  if (dispute?.tutor.claimSummary) {
    tutorClaimItems.push({
      label: "Details",
      value: dispute.tutor.claimSummary,
    });
  }

  return (
    <article className={styles.page}>
      <PageHeader
        backLink={{ href: "/internal/moderation" as Route, label: "← Back to queue" }}
        eyebrow={`Internal · Moderation · ${detail.caseKindLabel}`}
        status={
          <>
            <StatusBadge tone={detail.caseStatusTone}>
              {detail.caseStatusLabel}
            </StatusBadge>
            {detail.resolutionKindLabel ? (
              <StatusBadge tone="info">{detail.resolutionKindLabel}</StatusBadge>
            ) : null}
            <span className={styles.statusMeta}>
              Opened {formatUtcDateTime(detail.createdAt)}
            </span>
          </>
        }
        title={subjectSummary.primaryLabel}
      />

      <div className={styles.detailGrid}>
        <div className={styles.detailColumn}>
          <Section eyebrow="Subject" title="Case subject" titleAs="h2">
            <Card>
              <PersonSummary
                action={subjectLink}
                avatarSrc={subjectSummary.avatarSrc ?? undefined}
                descriptor={subjectSummary.kindLabel}
                name={subjectSummary.primaryLabel}
                variant="header"
              />
              <DescriptionList items={subjectItems} />
            </Card>
          </Section>

          {dispute ? (
            <Section
              eyebrow="Dispute"
              title="Participant claims"
              titleAs="h2"
            >
              <Card>
                <DescriptionList items={disputeLessonItems} />
              </Card>
              <div className={styles.personPair}>
                <Card>
                  <PersonSummary
                    avatarSrc={dispute.student.avatarSrc ?? undefined}
                    descriptor={
                      dispute.student.isReporter
                        ? "Student · reporter"
                        : "Student"
                    }
                    name={dispute.student.displayName ?? "Unknown student"}
                    variant="standard"
                  />
                  <DescriptionList items={studentClaimItems} />
                </Card>
                <Card>
                  <PersonSummary
                    avatarSrc={dispute.tutor.avatarSrc ?? undefined}
                    descriptor={
                      dispute.tutor.isReporter ? "Tutor · reporter" : "Tutor"
                    }
                    name={dispute.tutor.displayName ?? "Unknown tutor"}
                    variant="standard"
                  />
                  <DescriptionList items={tutorClaimItems} />
                </Card>
              </div>
            </Section>
          ) : null}

          {reporterSummary ? (
            <Section eyebrow="Reporter" title="Who reported" titleAs="h2">
              <Card>
                <PersonSummary
                  avatarSrc={reporterSummary.avatarSrc ?? undefined}
                  descriptor="Reporter"
                  name={reporterSummary.displayName ?? "Unknown reporter"}
                  variant="standard"
                />
                {reporterSummary.reasonText ? (
                  <DescriptionList
                    items={[
                      { label: "Reason", value: reporterSummary.reasonText },
                    ]}
                  />
                ) : null}
              </Card>
            </Section>
          ) : null}

          <Section eyebrow="Evidence" title="Triggering content" titleAs="h2">
            {evidence.kind === "message" && evidence.message ? (
              <Card>
                <PersonSummary
                  avatarSrc={evidence.message.senderAvatarSrc ?? undefined}
                  descriptor="Message sender"
                  name={evidence.message.senderDisplayName ?? "Unknown sender"}
                  variant="standard"
                />
                <DescriptionList
                  items={[
                    { label: "Message body", value: evidence.message.body },
                    {
                      label: "Sent",
                      value: formatUtcDateTime(evidence.message.createdAt),
                    },
                  ]}
                />
              </Card>
            ) : null}
            {evidence.kind === "tutor_profile" && evidence.tutorProfile ? (
              <Card>
                <PersonSummary
                  action={
                    evidence.tutorProfile.publicProfileHref ? (
                      <Link
                        className={getButtonClassName({
                          size: "compact",
                          variant: "ghost",
                        })}
                        href={evidence.tutorProfile.publicProfileHref}
                        prefetch={false}
                      >
                        View public profile
                      </Link>
                    ) : null
                  }
                  avatarSrc={evidence.tutorProfile.avatarSrc ?? undefined}
                  descriptor="Tutor profile"
                  name={evidence.tutorProfile.displayName ?? "Tutor profile"}
                  variant="standard"
                />
              </Card>
            ) : null}
            {evidence.kind === "conversation" && evidence.conversation ? (
              <Card>
                <div className={styles.personPair}>
                  <PersonSummary
                    avatarSrc={
                      evidence.conversation.studentAvatarSrc ?? undefined
                    }
                    descriptor="Student"
                    name={
                      evidence.conversation.studentDisplayName ??
                      "Unknown student"
                    }
                    variant="compact"
                  />
                  <PersonSummary
                    avatarSrc={evidence.conversation.tutorAvatarSrc ?? undefined}
                    descriptor="Tutor"
                    name={
                      evidence.conversation.tutorDisplayName ?? "Unknown tutor"
                    }
                    variant="compact"
                  />
                </div>
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

          {!reporterSummary && detail.internalSummary ? (
            <Section eyebrow="Summary" title="Case summary" titleAs="h2">
              <Card>
                <DescriptionList
                  items={[{ label: "Summary", value: detail.internalSummary }]}
                />
              </Card>
            </Section>
          ) : null}

          {blocks.length > 0 ? (
            <Section
              eyebrow="Blocks"
              title="Existing blocks involving this subject"
              titleAs="h2"
            >
              <ul className={styles.blockList}>
                {blocks.map((block) => (
                  <li key={block.blockId}>
                    <Card>
                      <div className={styles.blockPair}>
                        <PersonSummary
                          avatarSrc={block.blockerAvatarSrc ?? undefined}
                          descriptor="Initiated block"
                          name={block.blockerDisplayName ?? "Unknown user"}
                          variant="compact"
                        />
                        <span className={styles.blockConnector}>blocked</span>
                        <PersonSummary
                          avatarSrc={block.blockedAvatarSrc ?? undefined}
                          descriptor="Blocked party"
                          name={block.blockedDisplayName ?? "Unknown user"}
                          variant="compact"
                        />
                        <StatusBadge tone={block.blockStatusTone}>
                          {block.blockStatusLabel}
                        </StatusBadge>
                        <span className={styles.blockConnector}>
                          {formatUtcDateTime(block.createdAt)}
                        </span>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section eyebrow="Notes" title="Internal notes" titleAs="h2">
            {notes.length === 0 ? (
              <InlineNotice tone="info" title="No notes on this case yet">
                <p>Notes are admin-only and never user-visible.</p>
              </InlineNotice>
            ) : (
              <ActivityList
                items={notes.map((note) => ({
                  body: note.body,
                  header: (
                    <PersonSummary
                      descriptor="Note author"
                      name={note.authorDisplayName ?? "Unknown operator"}
                      variant="compact"
                    />
                  ),
                  id: note.id,
                  timestamp: formatUtcDateTime(note.createdAt),
                }))}
              />
            )}
            <AddCaseNoteForm caseId={detail.caseId} />
          </Section>

          <details className={styles.technicalDisclosure}>
            <summary>Technical references</summary>
            <DescriptionList items={technicalRefs} />
          </details>
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
