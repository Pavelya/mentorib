import Link from "next/link";
import type { Route } from "next";

import { getButtonClassName, StatusBadge } from "@/components/ui";

import { PersonSummary } from "./continuity-primitives";
import type { MatchResultCardDto } from "@/modules/lessons/match-results";
import styles from "./match-row.module.css";

type MatchRowProps = {
  match: MatchResultCardDto;
};

export function MatchRow({ match }: MatchRowProps) {
  const availabilityTone = match.tutor.acceptingNewStudents ? "positive" : "warning";
  const statusLabel = match.tutor.acceptingNewStudents
    ? "Open for booking"
    : "Limited availability";

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

            <Link
              className={getButtonClassName({ size: "compact", variant: "ghost" })}
              href={match.compareHref as Route}
            >
              Compare later
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}
