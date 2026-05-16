import Link from "next/link";
import type { Route } from "next";

import { Chip, Flag, Icon, StatusBadge, getButtonClassName } from "@/components/ui";
import type { FlagCode } from "@/components/ui";
import {
  toggleCompareAction,
  toggleShortlistAction,
} from "@/modules/lessons/shortlist-actions";

import { PersonSummary } from "./continuity-primitives";
import type { MatchResultCardDto } from "@/modules/lessons/match-results";
import styles from "./match-row.module.css";

export type MatchRowShortlistState = {
  isCompared: boolean;
  isCompareFull: boolean;
  isShortlisted: boolean;
};

// Public-browse row payload. Kept narrow and copy-bearing on purpose so the
// component never has to reach into Algolia hit shapes or domain DTOs.
export type BrowseTutorRowDto = {
  objectId: string;
  slug: string;
  displayName: string;
  headline: string | null;
  bioPreview: string | null;
  subjects: string[];
  focusAreas: string[];
  languages: string[];
  languageFlagCodes: FlagCode[];
  priceRangeLabel: string | null;
  averageRating: number | null;
  reviewCount: number;
  hasFeaturedRating: boolean;
  hasExaminerBadge: boolean;
  hasIntroVideo: boolean;
  acceptingNewStudents: boolean;
};

type MatchRowMatchVariantProps = {
  variant?: "match";
  match: MatchResultCardDto;
  returnTo?: string;
  shortlistState?: MatchRowShortlistState | null;
};

type MatchRowBrowseVariantProps = {
  variant: "browse";
  tutor: BrowseTutorRowDto;
  onProfileClick?: () => void;
};

type MatchRowProps = MatchRowMatchVariantProps | MatchRowBrowseVariantProps;

export function MatchRow(props: MatchRowProps) {
  if (props.variant === "browse") {
    return <BrowseRow {...props} />;
  }
  return <MatchVariantRow {...props} />;
}

function MatchVariantRow({
  match,
  returnTo = "/results",
  shortlistState,
}: MatchRowMatchVariantProps) {
  const availabilityTone = match.tutor.acceptingNewStudents ? "positive" : "warning";
  const statusLabel = match.tutor.acceptingNewStudents
    ? "Open for booking"
    : "Limited availability";
  const isShortlisted = shortlistState?.isShortlisted ?? false;
  const isCompared = shortlistState?.isCompared ?? false;
  const isCompareFull = shortlistState?.isCompareFull ?? false;
  const isShortlistInteractive = Boolean(shortlistState);
  const isCompareInteractive =
    isShortlistInteractive && (isCompared || !isCompareFull);

  return (
    <article
      aria-labelledby={`match-row-${match.candidateId}`}
      className={[
        styles.row,
        match.state === "high_confidence_match" ? styles.highConfidence : "",
        match.state === "limited_availability" ? styles.limitedAvailability : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.header}>
        <div className={styles.rankBlock}>
          <p className={styles.rankLabel}>Rank</p>
          <p className={styles.rankValue}>#{match.rankPosition}</p>
        </div>

        <div className={styles.badgeRow}>
          {match.confidenceLabel ? (
            <StatusBadge tone="trust">{match.confidenceLabel}</StatusBadge>
          ) : null}
          <StatusBadge tone={availabilityTone}>{statusLabel}</StatusBadge>
          {isShortlisted ? (
            <StatusBadge tone="info">Saved</StatusBadge>
          ) : null}
          {isCompared ? (
            <StatusBadge tone="trust">Comparing</StatusBadge>
          ) : null}
        </div>
      </div>

      <PersonSummary
        badges={match.trustSignals.map((signal) => ({ label: signal, tone: "info" as const }))}
        className={styles.identity}
        descriptor={match.fitSummary}
        eyebrow="Tutor match"
        meta={[
          ...(match.tutor.headline ? [match.tutor.headline] : []),
          ...(match.tutor.languages.length > 0
            ? [`Languages: ${match.tutor.languages.join(", ")}`]
            : []),
          ...(match.tutor.timezone ? [`Timezone: ${match.tutor.timezone}`] : []),
        ]}
        name={match.tutor.displayName}
        state={match.state === "high_confidence_match" ? "verified" : "default"}
      />

      <div className={styles.contentGrid}>
        <section aria-label={`${match.tutor.displayName} fit reasons`} className={styles.fitBlock}>
          <p className={styles.blockLabel}>Why this tutor fits</p>
          <ul className={styles.reasonList}>
            {match.fitReasons.map((reason) => (
              <li className={styles.reasonItem} key={reason}>
                {reason}
              </li>
            ))}
          </ul>
        </section>

        <aside aria-label={`${match.tutor.displayName} proof and next steps`} className={styles.sideRail}>
          <div className={styles.metaBlock}>
            <p className={styles.blockLabel}>Booking context</p>
            <ul className={styles.metaList}>
              {match.availabilitySignal ? (
                <li className={styles.metaItem}>{match.availabilitySignal}</li>
              ) : null}
              {match.tutor.pricingSummary ? (
                <li className={styles.metaItem}>{match.tutor.pricingSummary}</li>
              ) : null}
              {!match.availabilitySignal && !match.tutor.pricingSummary ? (
                <li className={styles.metaItem}>Booking details stay attached on the next step.</li>
              ) : null}
            </ul>
          </div>

          <div className={styles.actionRail}>
            {match.profileHref ? (
              <Link
                className={getButtonClassName({ size: "compact", variant: "secondary" })}
                href={match.profileHref as Route}
              >
                View profile
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className={getButtonClassName({ size: "compact", variant: "secondary" })}
              >
                Profile unavailable
              </span>
            )}

            {match.bookingHref ? (
              <Link
                className={getButtonClassName({ size: "compact" })}
                href={match.bookingHref as Route}
              >
                Book tutor
              </Link>
            ) : (
              <span aria-disabled="true" className={getButtonClassName({ size: "compact" })}>
                Booking unavailable
              </span>
            )}

            {isShortlistInteractive ? (
              <ShortlistToggleForm
                candidateId={match.candidateId}
                isShortlisted={isShortlisted}
                returnTo={returnTo}
                tutorName={match.tutor.displayName}
              />
            ) : null}

            {isShortlistInteractive ? (
              <CompareToggleForm
                candidateId={match.candidateId}
                isCompared={isCompared}
                isCompareInteractive={isCompareInteractive}
                returnTo={returnTo}
                tutorName={match.tutor.displayName}
              />
            ) : (
              <Link
                className={getButtonClassName({ size: "compact", variant: "ghost" })}
                href={match.compareHref as Route}
              >
                Compare later
              </Link>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

function BrowseRow({ tutor, onProfileClick }: MatchRowBrowseVariantProps) {
  const availabilityTone = tutor.acceptingNewStudents ? "positive" : "warning";
  const availabilityLabel = tutor.acceptingNewStudents
    ? "Open for booking"
    : "Limited availability";
  const profileHref = `/tutors/${tutor.slug}` as Route;
  const subjectChips = tutor.subjects.slice(0, 4);
  const subjectOverflow = tutor.subjects.length - subjectChips.length;
  const focusChips = tutor.focusAreas.slice(0, 3);
  const meta: string[] = [];
  if (tutor.headline) meta.push(tutor.headline);
  if (tutor.languages.length > 0) {
    meta.push(`Languages: ${tutor.languages.join(", ")}`);
  }

  return (
    <article
      aria-labelledby={`browse-tutor-row-${tutor.objectId}`}
      className={styles.row}
    >
      <div className={styles.header}>
        <p className={styles.rankLabel} id={`browse-tutor-row-${tutor.objectId}`}>
          Tutor
        </p>
        <div className={styles.badgeRow}>
          <StatusBadge tone={availabilityTone}>{availabilityLabel}</StatusBadge>
          {tutor.hasExaminerBadge ? (
            <StatusBadge tone="trust">IB examiner</StatusBadge>
          ) : null}
          {tutor.hasIntroVideo ? (
            <StatusBadge tone="info">Intro video</StatusBadge>
          ) : null}
        </div>
      </div>

      <PersonSummary
        className={styles.identity}
        descriptor={tutor.bioPreview ?? "Open the profile to read this tutor's full story."}
        eyebrow="Public tutor"
        meta={meta}
        name={tutor.displayName}
        state={tutor.hasFeaturedRating ? "verified" : "default"}
      />

      <div className={styles.contentGrid}>
        <section
          aria-label={`${tutor.displayName} subject coverage`}
          className={styles.fitBlock}
        >
          {subjectChips.length > 0 ? (
            <div>
              <p className={styles.blockLabel}>Subjects</p>
              <div className={styles.chipCluster}>
                {subjectChips.map((subject) => (
                  <Chip key={subject}>{subject}</Chip>
                ))}
                {subjectOverflow > 0 ? (
                  <Chip tone="support">+{subjectOverflow} more</Chip>
                ) : null}
              </div>
            </div>
          ) : null}
          {focusChips.length > 0 ? (
            <div>
              <p className={styles.blockLabel}>Focus areas</p>
              <div className={styles.chipCluster}>
                {focusChips.map((focus) => (
                  <Chip key={focus} tone="info">
                    {focus}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}
          {tutor.languageFlagCodes.length > 0 ? (
            <div>
              <p className={styles.blockLabel}>Language flags</p>
              <div className={styles.flagCluster} aria-hidden="true">
                {tutor.languageFlagCodes.map((flag) => (
                  <span className={styles.flagPill} key={flag}>
                    <Flag code={flag} />
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <aside
          aria-label={`${tutor.displayName} pricing and rating`}
          className={styles.sideRail}
        >
          <div className={styles.metaBlock}>
            <p className={styles.blockLabel}>Pricing</p>
            <ul className={styles.metaList}>
              <li className={styles.metaItem}>
                {tutor.priceRangeLabel ?? "Pricing shown on the profile."}
              </li>
            </ul>
          </div>

          {tutor.hasFeaturedRating && tutor.averageRating !== null ? (
            <div className={styles.metaBlock}>
              <p className={styles.blockLabel}>Student rating</p>
              <p className={styles.ratingLine}>
                <Icon filled name="star" size={16} />
                <span>{tutor.averageRating.toFixed(1)}</span>
                <span className={styles.ratingMeta}>
                  {tutor.reviewCount}{" "}
                  {tutor.reviewCount === 1 ? "review" : "reviews"}
                </span>
              </p>
            </div>
          ) : (
            <div className={styles.metaBlock}>
              <p className={styles.blockLabel}>Student rating</p>
              <p className={styles.ratingMeta}>
                {tutor.reviewCount > 0
                  ? `${tutor.reviewCount} ${tutor.reviewCount === 1 ? "review" : "reviews"} — rating shown after more lessons.`
                  : "New on Mentor IB — trust framed by approval and credentials."}
              </p>
            </div>
          )}

          <div className={styles.actionRail}>
            <Link
              className={getButtonClassName({ size: "compact" })}
              href={profileHref}
              onClick={onProfileClick}
            >
              View profile
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}

function ShortlistToggleForm({
  candidateId,
  isShortlisted,
  returnTo,
  tutorName,
}: {
  candidateId: string;
  isShortlisted: boolean;
  returnTo: string;
  tutorName: string;
}) {
  return (
    <form action={toggleShortlistAction} className={styles.toggleForm}>
      <input name="candidateId" type="hidden" value={candidateId} />
      <input
        name="intent"
        type="hidden"
        value={isShortlisted ? "remove" : "add"}
      />
      <input name="returnTo" type="hidden" value={returnTo} />
      <button
        aria-label={
          isShortlisted
            ? `Remove ${tutorName} from your shortlist`
            : `Save ${tutorName} to your shortlist`
        }
        aria-pressed={isShortlisted}
        className={getButtonClassName({
          size: "compact",
          variant: isShortlisted ? "secondary" : "ghost",
        })}
        type="submit"
      >
        {isShortlisted ? "Saved" : "Save"}
      </button>
    </form>
  );
}

function CompareToggleForm({
  candidateId,
  isCompared,
  isCompareInteractive,
  returnTo,
  tutorName,
}: {
  candidateId: string;
  isCompared: boolean;
  isCompareInteractive: boolean;
  returnTo: string;
  tutorName: string;
}) {
  if (!isCompared && !isCompareInteractive) {
    return (
      <button
        aria-disabled="true"
        aria-label={`Compare is full — remove a tutor before adding ${tutorName}`}
        className={getButtonClassName({ size: "compact", variant: "ghost" })}
        disabled
        type="button"
      >
        Compare full
      </button>
    );
  }

  return (
    <form action={toggleCompareAction} className={styles.toggleForm}>
      <input name="candidateId" type="hidden" value={candidateId} />
      <input
        name="intent"
        type="hidden"
        value={isCompared ? "remove" : "add"}
      />
      <input name="returnTo" type="hidden" value={returnTo} />
      <button
        aria-label={
          isCompared
            ? `Remove ${tutorName} from compare`
            : `Add ${tutorName} to compare`
        }
        aria-pressed={isCompared}
        className={getButtonClassName({
          size: "compact",
          variant: isCompared ? "secondary" : "ghost",
        })}
        type="submit"
      >
        {isCompared ? "In compare" : "Compare"}
      </button>
    </form>
  );
}
