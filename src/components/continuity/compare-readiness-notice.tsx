import Link from "next/link";

import { getButtonClassName, InlineNotice } from "@/components/ui";
import type { ShortlistStateDto } from "@/modules/lessons/shortlist";

import styles from "./compare-readiness-notice.module.css";

type CompareReadinessOrigin = "results" | "saved" | "compare";

type CompareReadinessNoticeProps = {
  state: ShortlistStateDto;
  origin: CompareReadinessOrigin;
  className?: string;
};

export function CompareReadinessNotice({
  className,
  origin,
  state,
}: CompareReadinessNoticeProps) {
  const compareCount = state.comparedCandidateIds.length;
  const compareCap = state.compareCap;
  const isFull = state.isCompareFull;
  const hasComparing = compareCount > 0;

  const tone = isFull ? "warning" : hasComparing ? "success" : "info";
  const title = isFull
    ? `Compare is full · ${compareCount} of ${compareCap}`
    : hasComparing
      ? `Comparing ${compareCount} of ${compareCap} tutors`
      : `Pick up to ${compareCap} tutors to compare`;
  const description = isFull
    ? "Remove a tutor from compare before adding another. Saved tutors stay on the saved page."
    : hasComparing
      ? "Each column keeps the same need context. Book directly when one fit is clear."
      : "Use Compare on saved tutors or match results to line a few up side by side.";

  const showAction = origin !== "compare";

  return (
    <InlineNotice
      aria-live="polite"
      className={[styles.notice, className].filter(Boolean).join(" ")}
      showToneLabel={false}
      title={title}
      tone={tone}
    >
      <p>{description}</p>
      {showAction ? (
        <div className={styles.actions}>
          <Link
            className={getButtonClassName({
              size: "compact",
              variant: "secondary",
            })}
            href="/compare"
          >
            {hasComparing ? "Open compare" : "View compare"}
          </Link>
        </div>
      ) : null}
    </InlineNotice>
  );
}
