import Link from "next/link";

import { PersonSummary } from "@/components/continuity";
import {
  Card,
  Chip,
  DescriptionList,
  type DescriptionListItem,
  InlineNotice,
  PageHeader,
  Panel,
  getButtonClassName,
} from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { formatUtcDateTime } from "@/lib/datetime";
import {
  loadReviewModerationQueue,
  type ReviewModerationQueueItemDto,
} from "@/modules/admin/review-moderation-repository";
import { REVIEW_MAX_RATING } from "@/modules/reviews";

import { ReviewModerationForm } from "./review-moderation-form";
import styles from "./reviews.module.css";

export default async function InternalReviewsModerationPage() {
  await requireInternalAdminAccount();
  const queue = await loadReviewModerationQueue();

  return (
    <article className={styles.page}>
      <PageHeader
        eyebrow="Internal · Trust & Safety · Reviews"
        title="Review moderation"
        description="Published tutor reviews that were reported or flagged. Hiding or rejecting a review removes it from the tutor's public profile."
      />

      {queue.length === 0 ? (
        <InlineNotice tone="info" title="Nothing to moderate">
          <p>
            No reviews have been reported or flagged. Reported reviews appear
            here and as cases in the trust &amp; safety queue.
          </p>
        </InlineNotice>
      ) : (
        <ul className={styles.queueList}>
          {queue.map((item) => (
            <li key={item.reviewId}>
              <ReviewQueueCard item={item} />
            </li>
          ))}
        </ul>
      )}

      <Panel
        eyebrow="How this works"
        tone="mist"
        title="Hide vs reject"
        description="Hiding removes a review from the public profile while keeping it on record. Rejecting marks it as not meeting review standards. Both require a moderation note and are audited."
      />
    </article>
  );
}

function ReviewQueueCard({ item }: { item: ReviewModerationQueueItemDto }) {
  const detailItems: DescriptionListItem[] = [
    { label: "Reviewer", value: item.reviewerLabel },
    {
      label: "Rating",
      value: `${item.ratingValue} / ${REVIEW_MAX_RATING}`,
    },
    { label: "Submitted", value: formatUtcDateTime(item.submittedAt) },
  ];
  if (item.reasonSnippet) {
    detailItems.push({ label: "Latest report", value: item.reasonSnippet });
  }
  if (item.moderationNote) {
    detailItems.push({ label: "Moderation note", value: item.moderationNote });
  }

  const tutorLink = item.tutorProfileHref ? (
    <Link
      className={getButtonClassName({ size: "compact", variant: "ghost" })}
      href={item.tutorProfileHref}
      prefetch={false}
    >
      View public profile
    </Link>
  ) : null;

  return (
    <Card>
      <div className={styles.queueRow}>
        <PersonSummary
          action={tutorLink}
          avatarSrc={item.tutorAvatarSrc ?? undefined}
          badges={[
            { label: item.reviewStatusLabel, tone: item.reviewStatusTone },
          ]}
          descriptor="Tutor"
          name={item.tutorDisplayName}
          variant="operational"
        />

        <div className={styles.queueChips}>
          {item.reportCount > 0 ? (
            <Chip size="compact" tone="default">
              {item.reportCount === 1
                ? "1 report"
                : `${item.reportCount} reports`}
            </Chip>
          ) : null}
          {item.flaggedAt ? (
            <Chip size="compact" tone="default">
              Flagged
            </Chip>
          ) : null}
        </div>

        {item.comment ? (
          <p className={styles.reviewComment}>“{item.comment}”</p>
        ) : (
          <p className={styles.reviewComment}>
            This review has a rating but no written comment.
          </p>
        )}

        <DescriptionList items={detailItems} />

        {item.openCaseHref ? (
          <Link
            className={getButtonClassName({ size: "compact", variant: "ghost" })}
            href={item.openCaseHref}
            prefetch={false}
          >
            View report case
          </Link>
        ) : null}

        <ReviewModerationForm reviewId={item.reviewId} />
      </div>
    </Card>
  );
}
