import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import type { CSSProperties } from "react";
import { redirect } from "next/navigation";

import { NeedSummaryBar, ScreenState } from "@/components/continuity";
import { TimezoneNotice } from "@/components/datetime";
import {
  getButtonClassName,
  InlineNotice,
  Panel,
  Section,
  StatusBadge,
} from "@/components/ui";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import {
  buildPostSignInRedirect,
  ensureAuthAccount,
} from "@/lib/auth/account-service";
import { getCurrentUserTimezone } from "@/lib/datetime/server";
import { routeFamilies } from "@/lib/routing/route-families";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  hasRole,
  isRestrictedAccount,
  requiresRoleSelection,
} from "@/modules/accounts/account-state";
import {
  buildPreviewMatchResultsDto,
  getStudentMatchResults,
  type MatchResultCardDto,
  type MatchResultsPageDto,
} from "@/modules/lessons/match-results";
import {
  COMPARE_CAP,
  getShortlistStateForLearningNeed,
  type ShortlistStateDto,
} from "@/modules/lessons/shortlist";
import { toggleCompareAction } from "@/modules/lessons/shortlist-actions";

import surfaceStyles from "../student-surfaces.module.css";
import styles from "./compare.module.css";

export const metadata: Metadata = {
  title: "Compare tutors",
};

type ComparePageData = {
  isPreview?: boolean;
  results: MatchResultsPageDto;
  shortlistState: ShortlistStateDto | null;
};

export default async function ComparePage() {
  const fallbackTimezone = await getCurrentUserTimezone();

  if (!isSupabaseAuthConfigured()) {
    const previewResults = buildPreviewMatchResultsDto(fallbackTimezone);
    return renderComparePage({
      isPreview: true,
      results: previewResults,
      shortlistState: buildPreviewShortlistState(previewResults),
    });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath("/compare") as Route);
  }

  let account: Awaited<ReturnType<typeof ensureAuthAccount>> | null = null;

  try {
    account = await ensureAuthAccount(user, fallbackTimezone);
  } catch {
    account = null;
  }

  if (!account) {
    return (
      <InlineNotice title="Compare unavailable" tone="warning">
        <p>
          We could not load your student context yet. Refresh the page or sign in
          again to continue.
        </p>
      </InlineNotice>
    );
  }

  if (requiresRoleSelection(account)) {
    redirect(routeFamilies.setup.defaultHref);
  }

  if (isRestrictedAccount(account)) {
    return (
      <InlineNotice title="Account access limited" tone="warning">
        <p>
          This account cannot review compared tutors right now. Please check your
          account status and try again later.
        </p>
      </InlineNotice>
    );
  }

  if (!hasRole(account, "student")) {
    redirect(buildPostSignInRedirect(account) as Route);
  }

  const results = await getStudentMatchResults(account);
  const shortlistState = results.currentNeed
    ? await safeGetShortlistState(account, results.currentNeed.id)
    : null;

  return renderComparePage({ results, shortlistState });
}

async function safeGetShortlistState(
  account: Awaited<ReturnType<typeof ensureAuthAccount>>,
  learningNeedId: string,
) {
  try {
    return await getShortlistStateForLearningNeed(account, learningNeedId);
  } catch {
    return null;
  }
}

function renderComparePage({
  isPreview = false,
  results,
  shortlistState,
}: ComparePageData) {
  const comparedIds = new Set(shortlistState?.comparedCandidateIds ?? []);
  const compareCap = shortlistState?.compareCap ?? COMPARE_CAP;
  const comparedMatches = orderForCompare(
    results.matches.filter((match) => comparedIds.has(match.candidateId)),
  ).slice(0, compareCap);
  const compareCount = comparedMatches.length;
  const hasCompared = compareCount > 0;
  const hasLearningNeed = Boolean(results.currentNeed);

  return (
    <article className={styles.page}>
      <header className={surfaceStyles.intro}>
        <p className={surfaceStyles.eyebrow}>Compare</p>
        <h1 className={surfaceStyles.title}>Side by side</h1>
        <p className={surfaceStyles.description}>
          Up to three tutors. The same need context stays attached on every
          column.
        </p>
      </header>

      {results.currentNeed ? (
        <>
          {hasCompared ? (
            <TimezoneNotice timezone={results.currentNeed.timezone} />
          ) : null}

          <NeedSummaryBar
            action={
              <Link
                className={getButtonClassName({
                  size: "compact",
                  variant: "secondary",
                })}
                href="/saved"
              >
                Edit shortlist
              </Link>
            }
            label="Your request"
            mode="readOnly"
            need={results.currentNeed.headline}
            qualifiers={results.currentNeed.qualifiers}
            state={results.state === "queued" ? "draft" : "active"}
          />
        </>
      ) : null}

      <div className={styles.summaryGrid}>
        <Panel
          description={buildSummaryDescription({
            compareCount,
            isPreview,
            results,
          })}
          eyebrow="Compare"
          title={buildSummaryTitle(compareCount, compareCap)}
          tone="warm"
        >
          <ul className={styles.summaryList}>
            <li>
              Compare keeps the same active need so the side-by-side review never
              starts a new decision.
            </li>
            <li>
              Up to {compareCap} tutors can sit here at once. Remove one to make
              room for another candidate.
            </li>
            <li>
              Booking and profile actions stay on each column, so the next step
              is never buried.
            </li>
          </ul>
        </Panel>

        <Panel
          description="Saved is where the shortlist lives. Compare is the closer read."
          eyebrow="Handoff"
          title="Pick a tutor to book, or refine the shortlist"
          tone="mist"
        >
          <ul className={styles.handoffList}>
            <li>
              Book directly from a column once one tutor is clearly the better
              fit.
            </li>
            <li>
              Return to saved tutors any time without losing the comparison.
            </li>
          </ul>
          <Link
            className={getButtonClassName({
              size: "compact",
              variant: "secondary",
            })}
            href="/saved"
          >
            Back to saved
          </Link>
        </Panel>
      </div>

      {shortlistState ? (
        <CompareStateNotice
          compareCap={compareCap}
          compareCount={compareCount}
        />
      ) : null}

      {hasCompared ? (
        <CompareMatrix
          comparedMatches={comparedMatches}
          isPreview={isPreview}
        />
      ) : (
        <CompareEmptyState hasLearningNeed={hasLearningNeed} />
      )}
    </article>
  );
}

function CompareMatrix({
  comparedMatches,
  isPreview,
}: {
  comparedMatches: MatchResultCardDto[];
  isPreview: boolean;
}) {
  const style: CSSProperties = {
    ["--compare-columns" as string]: comparedMatches.length.toString(),
  };

  return (
    <section
      aria-label="Compare tutors side by side"
      className={styles.matrix}
      style={style}
    >
      {comparedMatches.map((match) => (
        <CompareColumn
          isPreview={isPreview}
          key={match.candidateId}
          match={match}
        />
      ))}
    </section>
  );
}

function CompareColumn({
  isPreview,
  match,
}: {
  isPreview: boolean;
  match: MatchResultCardDto;
}) {
  const availabilityTone = match.tutor.acceptingNewStudents
    ? "positive"
    : "warning";
  const availabilityLabel = match.tutor.acceptingNewStudents
    ? "Open for booking"
    : "Limited availability";
  const fitReasons = match.fitReasons ?? [];
  const categories: CompareCategory[] = [
    {
      id: "best-for",
      label: "Best for",
      type: "text",
      value: match.fitSummary,
    },
    {
      id: "subject-fit",
      label: "Subject fit",
      items: fitReasons,
      type: "items",
    },
    {
      id: "teaching-style",
      label: "Teaching style",
      type: "text",
      value: match.tutor.headline,
    },
    {
      id: "languages",
      label: "Languages",
      type: "text",
      value:
        match.tutor.languages.length > 0
          ? match.tutor.languages.join(", ")
          : null,
    },
    {
      id: "timezone",
      label: "Timezone overlap",
      type: "text",
      value: match.tutor.timezone,
    },
    {
      id: "availability",
      label: "Availability",
      type: "text",
      value: match.availabilitySignal,
    },
    {
      id: "price",
      label: "Price",
      type: "text",
      value: match.tutor.pricingSummary,
    },
    {
      id: "trust-proof",
      label: "Trust proof",
      items: match.trustSignals,
      type: "items",
    },
  ];

  return (
    <Panel
      as="article"
      aria-labelledby={`compare-tutor-${match.candidateId}`}
      eyebrow={`Rank #${match.rankPosition}`}
      tone="warm"
    >
      <header className={styles.columnHeader}>
        <h2
          className={styles.columnTitle}
          id={`compare-tutor-${match.candidateId}`}
        >
          {match.tutor.displayName}
        </h2>
        <div className={styles.badgeRow}>
          {match.confidenceLabel ? (
            <StatusBadge tone="trust">{match.confidenceLabel}</StatusBadge>
          ) : null}
          <StatusBadge tone={availabilityTone}>{availabilityLabel}</StatusBadge>
        </div>
      </header>

      <div className={styles.categoryList}>
        {categories.map((category) => (
          <Section
            density="compact"
            divider="top"
            eyebrow={category.label}
            key={category.id}
          >
            <CompareCategoryValue category={category} />
          </Section>
        ))}
      </div>

      <div className={styles.actionStack}>
        {match.bookingHref ? (
          <Link
            className={getButtonClassName({ size: "compact" })}
            href={match.bookingHref as Route}
          >
            Book with {match.tutor.displayName}
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={[
              getButtonClassName({ size: "compact" }),
              styles.disabledAction,
            ].join(" ")}
          >
            Booking unavailable
          </span>
        )}

        {match.profileHref ? (
          <Link
            className={getButtonClassName({
              size: "compact",
              variant: "secondary",
            })}
            href={match.profileHref as Route}
          >
            View profile
          </Link>
        ) : null}

        {isPreview ? (
          <span
            aria-disabled="true"
            className={[
              getButtonClassName({ size: "compact", variant: "ghost" }),
              styles.disabledAction,
            ].join(" ")}
          >
            Remove from compare
          </span>
        ) : (
          <form action={toggleCompareAction} className={styles.removeForm}>
            <input name="candidateId" type="hidden" value={match.candidateId} />
            <input name="intent" type="hidden" value="remove" />
            <input name="returnTo" type="hidden" value="/compare" />
            <button
              aria-label={`Remove ${match.tutor.displayName} from compare`}
              className={getButtonClassName({
                size: "compact",
                variant: "ghost",
              })}
              type="submit"
            >
              Remove from compare
            </button>
          </form>
        )}
      </div>
    </Panel>
  );
}

type CompareCategory =
  | {
      id: string;
      items: string[];
      label: string;
      type: "items";
    }
  | {
      id: string;
      label: string;
      type: "text";
      value: string | null | undefined;
    };

function CompareCategoryValue({ category }: { category: CompareCategory }) {
  if (category.type === "items") {
    if (category.items.length === 0) {
      return (
        <p className={[styles.categoryValue, styles.categoryMuted].join(" ")}>
          Not specified
        </p>
      );
    }

    return (
      <ul className={styles.categoryItems}>
        {category.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if (!category.value) {
    return (
      <p className={[styles.categoryValue, styles.categoryMuted].join(" ")}>
        Not specified
      </p>
    );
  }

  return <p className={styles.categoryValue}>{category.value}</p>;
}

function CompareStateNotice({
  compareCap,
  compareCount,
}: {
  compareCap: number;
  compareCount: number;
}) {
  if (compareCount === 0) {
    return (
      <InlineNotice
        aria-live="polite"
        className={styles.notice}
        showToneLabel={false}
        title={`Pick up to ${compareCap} tutors to compare`}
        tone="info"
      >
        <p>
          Use Compare on saved tutors or match results to line a few up side by
          side.
        </p>
        <div className={styles.noticeActions}>
          <Link
            className={getButtonClassName({
              size: "compact",
              variant: "secondary",
            })}
            href="/saved"
          >
            Open saved
          </Link>
        </div>
      </InlineNotice>
    );
  }

  const isFull = compareCount >= compareCap;
  const tone = isFull ? "warning" : "success";
  const title = isFull
    ? `Compare is full · ${compareCount} of ${compareCap}`
    : `Comparing ${compareCount} of ${compareCap} tutors`;

  return (
    <InlineNotice
      aria-live="polite"
      className={styles.notice}
      showToneLabel={false}
      title={title}
      tone={tone}
    >
      <p>
        {isFull
          ? "Remove a tutor from compare before adding another. Saved tutors stay on the saved page."
          : "Each column keeps the same need context. Book directly when one fit is clear."}
      </p>
    </InlineNotice>
  );
}

function CompareEmptyState({
  hasLearningNeed,
}: {
  hasLearningNeed: boolean;
}) {
  if (!hasLearningNeed) {
    return (
      <ScreenState
        action={
          <Link className={getButtonClassName()} href="/match">
            Start matching
          </Link>
        }
        description="Compare lines up your shortlisted tutors side by side. Start the guided match flow to see fit-ranked tutors you can save and compare."
        hints={[
          "Compare lives next to saved, so the shortlist and the closer read stay one decision.",
          "Up to three tutors can sit in compare at once.",
        ]}
        kind="empty"
        title="No tutors in compare yet"
      />
    );
  }

  return (
    <ScreenState
      action={
        <Link className={getButtonClassName()} href="/saved">
          Open saved
        </Link>
      }
      description="Add tutors from saved or match results to line them up here. Compare keeps the same need context."
      hints={[
        "Use Compare on any saved tutor row to add them to this view.",
        "Compare is capped at three tutors so the side-by-side read stays focused.",
      ]}
      kind="empty"
      title="No tutors in compare yet"
    />
  );
}

function orderForCompare(matches: MatchResultCardDto[]) {
  return [...matches].sort((left, right) => left.rankPosition - right.rankPosition);
}

function buildSummaryTitle(compareCount: number, compareCap: number) {
  if (compareCount === 0) {
    return `Pick up to ${compareCap} tutors to compare`;
  }
  if (compareCount === 1) {
    return "1 tutor in compare";
  }
  return `${compareCount} tutors side by side`;
}

function buildSummaryDescription({
  compareCount,
  isPreview,
  results,
}: {
  compareCount: number;
  isPreview: boolean;
  results: MatchResultsPageDto;
}) {
  if (isPreview) {
    return "Preview of the compare surface using the match DTO shape until live auth is configured.";
  }

  if (results.state === "queued") {
    return "The latest matching run is still preparing tutor fits — compared tutors will appear once results are ready.";
  }

  if (compareCount === 0) {
    return "Add tutors from saved or match results to read them side by side without losing the need context.";
  }

  return "Each column uses the same fit reasoning that surfaced in results, ordered by rank.";
}

function buildPreviewShortlistState(
  results: MatchResultsPageDto,
): ShortlistStateDto | null {
  if (!results.currentNeed) {
    return null;
  }

  const previewComparedIds = results.matches
    .slice(0, 2)
    .map((match) => match.candidateId);

  return {
    candidates: previewComparedIds.map((id) => ({
      candidateId: id,
      comparedAt: "2026-04-23T10:30:00.000Z",
      isCompared: true,
      isShortlisted: true,
      matchRunId: "preview-match-run",
      shortlistedAt: "2026-04-23T10:00:00.000Z",
      tutorProfileId: id,
    })),
    comparedCandidateIds: previewComparedIds,
    compareCap: COMPARE_CAP,
    isCompareFull: previewComparedIds.length >= COMPARE_CAP,
    learningNeedId: results.currentNeed.id,
    matchRunId: "preview-match-run",
    shortlistedCandidateIds: previewComparedIds,
  };
}
