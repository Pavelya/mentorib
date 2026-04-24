import Link from "next/link";
import type { Route } from "next";
import type { ComponentProps } from "react";
import { redirect } from "next/navigation";

import {
  MatchRow,
  NeedSummaryBar,
  ScreenState,
} from "@/components/continuity";
import { TimezoneNotice } from "@/components/datetime";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import {
  buildPostSignInRedirect,
  ensureAuthAccount,
} from "@/lib/auth/account-service";
import { formatUtcDateTime } from "@/lib/datetime";
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
import { Panel, TabBar, getButtonClassName, InlineNotice } from "@/components/ui";

import styles from "./results.module.css";
import { QueuedResultsRefresh } from "./queued-results-refresh";

type ResultsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type ResultsFilter = "all" | "available-soon" | "high-confidence";
type ResultsSort = "availability" | "best-fit";
type LinkHref = ComponentProps<typeof Link>["href"];

const VALID_FILTERS = new Set<ResultsFilter>(["all", "available-soon", "high-confidence"]);
const VALID_SORTS = new Set<ResultsSort>(["availability", "best-fit"]);

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const fallbackTimezone = await getCurrentUserTimezone();
  const resolvedSearchParams = await searchParams;
  const filter = parseResultsFilter(resolvedSearchParams.filter);
  const sort = parseResultsSort(resolvedSearchParams.sort);

  if (!isSupabaseAuthConfigured()) {
    return renderResultsPage({
      filter,
      results: buildPreviewMatchResultsDto(fallbackTimezone),
      sort,
    });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(routeFamilies.student.defaultHref) as Route);
  }

  let account: Awaited<ReturnType<typeof ensureAuthAccount>> | null = null;

  try {
    account = await ensureAuthAccount(user, fallbackTimezone);
  } catch {
    account = null;
  }

  if (!account) {
    return (
      <>
        <InlineNotice className={styles.notice} title="Results unavailable" tone="warning">
          <p>
            We could not load your student context yet. Refresh the page or sign in again
            to continue.
          </p>
        </InlineNotice>
        {renderResultsPage({
          filter,
          results: buildPreviewMatchResultsDto(fallbackTimezone),
          sort,
        })}
      </>
    );
  }

  if (requiresRoleSelection(account)) {
    redirect(routeFamilies.setup.defaultHref);
  }

  if (isRestrictedAccount(account)) {
    return (
      <InlineNotice title="Account access limited" tone="warning">
        <p>
          This account cannot review match results right now. Please check your account
          status and try again later.
        </p>
      </InlineNotice>
    );
  }

  if (!hasRole(account, "student")) {
    redirect(buildPostSignInRedirect(account) as Route);
  }

  const results = await getStudentMatchResults(account);

  return renderResultsPage({ filter, results, sort });
}

function renderResultsPage({
  filter,
  results,
  sort,
}: {
  filter: ResultsFilter;
  results: MatchResultsPageDto;
  sort: ResultsSort;
}) {
  const visibleMatches = sortMatches(filterMatches(results.matches, filter), sort);
  const countLabel =
    visibleMatches.length === 1 ? "1 tutor fit" : `${visibleMatches.length} tutor fits`;

  return (
    <article className={styles.page}>
      {results.currentNeed ? (
        <>
          <NeedSummaryBar
            action={
              <Link
                className={getButtonClassName({ size: "compact", variant: "secondary" })}
                href="/match"
              >
                Refine need
              </Link>
            }
            label="Current need"
            mode="editable"
            need={results.currentNeed.headline}
            qualifiers={results.currentNeed.qualifiers}
            state={results.state === "queued" ? "draft" : "active"}
          />

          <TimezoneNotice timezone={results.currentNeed.timezone} />
        </>
      ) : null}

      <div className={styles.headerGrid}>
        <Panel
          description={buildSummaryDescription({
            count: visibleMatches.length,
            filter,
            results,
            sort,
          })}
          eyebrow="Tutor results"
          title={buildSummaryTitle(results, countLabel)}
          tone="warm"
        >
          <ul className={styles.summaryList}>
            <li>Fit reasoning stays primary, with the need context still visible above.</li>
            <li>
              Tutor profiles and booking use the same result context instead of a generic
              card wall.
            </li>
            {results.currentNeed?.note ? <li>Student note: {results.currentNeed.note}</li> : null}
            <li>
              {results.run.createdAt
                ? `Latest match run started ${formatUtcDateTime(results.run.createdAt, {
                    timezone: results.currentNeed?.timezone,
                  })}.`
                : "Results will appear here once the match run is ready."}
            </li>
          </ul>
        </Panel>

        <Panel
          description="The next step should feel like a continuation of the same decision, not a restart."
          eyebrow="Handoff"
          title="Profiles and booking keep the match context"
          tone="mist"
        >
          <ul className={styles.handoffList}>
            <li>Open a tutor profile to review proof and teaching style without losing the fit rationale.</li>
            <li>Booking links use the candidate context so the selected match survives the handoff.</li>
            <li>Compare remains lightweight and secondary to the main fit-based decision.</li>
          </ul>
        </Panel>
      </div>

      {results.state === "ready" || results.state === "preview" ? (
        <>
          <section aria-label="Results controls" className={styles.controls}>
            <div className={styles.controlGroup}>
              <p className={styles.controlLabel}>Filter</p>
              <TabBar
                activeId={filter}
                ariaLabel="Filter tutor results"
                items={[
                  { href: buildResultsHref({ filter: "all", sort }), id: "all", label: "All" },
                  {
                    href: buildResultsHref({ filter: "high-confidence", sort }),
                    id: "high-confidence",
                    label: "High confidence",
                  },
                  {
                    href: buildResultsHref({ filter: "available-soon", sort }),
                    id: "available-soon",
                    label: "Available soon",
                  },
                ]}
              />
            </div>

            <div className={styles.controlGroup}>
              <p className={styles.controlLabel}>Sort</p>
              <TabBar
                activeId={sort}
                ariaLabel="Sort tutor results"
                items={[
                  {
                    href: buildResultsHref({ filter, sort: "best-fit" }),
                    id: "best-fit",
                    label: "Best fit",
                  },
                  {
                    href: buildResultsHref({ filter, sort: "availability" }),
                    id: "availability",
                    label: "Availability first",
                  },
                ]}
              />
            </div>
          </section>

          {visibleMatches.length > 0 ? (
            <section aria-label="Tutor match results" className={styles.resultList}>
              {visibleMatches.map((match) => (
                <MatchRow key={match.candidateId} match={match} />
              ))}
            </section>
          ) : (
            <ScreenState
              action={
                <Link className={getButtonClassName({ variant: "secondary" })} href="/results">
                  Clear filters
                </Link>
              }
              description="The current filter view is stricter than the available result set."
              hints={[
                "Try returning to all results first.",
                "If you still do not see the right fit, refine the learning need.",
              ]}
              kind="empty"
              title="No tutors match this filtered view"
            />
          )}
        </>
      ) : null}

      {results.state === "empty" ? (
        <ScreenState
          action={<Link className={getButtonClassName()} href="/match">Start matching</Link>}
          description="Start with the guided match flow so the results list can rank tutors around the real IB need."
          hints={[
            "The route keeps the need summary visible once you submit it.",
            "You can refine the need later without losing the results layout.",
          ]}
          kind="empty"
          title="No active learning need yet"
        />
      ) : null}

      {results.state === "queued" ? (
        <>
          <QueuedResultsRefresh />

          <Panel
            description="We saved your request and are preparing the shortlist now."
            eyebrow="Matching"
            title="Your tutor results are on the way"
            tone="warm"
          >
            <div aria-hidden="true" className={styles.loadingPreview}>
              <span className={[styles.loadingBar, styles.loadingBarStrong].join(" ")} />
              <span className={styles.loadingBar} />
              <span className={[styles.loadingBar, styles.loadingBarShort].join(" ")} />
            </div>

            <p className={styles.loadingHint}>
              We&apos;ll check again automatically for a short while while this run finishes.
            </p>

            <div className={styles.loadingActionRow}>
              <Link className={getButtonClassName({ variant: "secondary" })} href="/match">
                Adjust need
              </Link>
            </div>
          </Panel>
        </>
      ) : null}

      {results.state === "failed" ? (
        <ScreenState
          action={<Link className={getButtonClassName()} href="/match">Resubmit need</Link>}
          description="The last match run did not finish cleanly, so no tutor cards are ready to show yet."
          hints={[
            "Try resubmitting the need from the match flow.",
            "If the problem continues, refresh and try again in a moment.",
          ]}
          kind="error"
          title="We could not finish this match run"
        />
      ) : null}
    </article>
  );
}

function parseResultsFilter(value: string | string[] | undefined): ResultsFilter {
  const singleValue = getSingleValue(value);

  return singleValue && VALID_FILTERS.has(singleValue as ResultsFilter)
    ? (singleValue as ResultsFilter)
    : "all";
}

function parseResultsSort(value: string | string[] | undefined): ResultsSort {
  const singleValue = getSingleValue(value);

  return singleValue && VALID_SORTS.has(singleValue as ResultsSort)
    ? (singleValue as ResultsSort)
    : "best-fit";
}

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildResultsHref({
  filter,
  sort,
}: {
  filter: ResultsFilter;
  sort: ResultsSort;
}): LinkHref {
  const searchParams = new URLSearchParams();

  if (filter !== "all") {
    searchParams.set("filter", filter);
  }

  if (sort !== "best-fit") {
    searchParams.set("sort", sort);
  }

  const query = searchParams.toString();

  return query ? `/results?${query}` : "/results";
}

function filterMatches(matches: MatchResultCardDto[], filter: ResultsFilter) {
  switch (filter) {
    case "available-soon":
      return matches.filter((match) => match.tutor.acceptingNewStudents);
    case "high-confidence":
      return matches.filter((match) => match.state === "high_confidence_match");
    case "all":
    default:
      return matches;
  }
}

function sortMatches(matches: MatchResultCardDto[], sort: ResultsSort) {
  const orderedMatches = [...matches];

  orderedMatches.sort((left, right) => {
    if (sort === "availability") {
      const leftScore = getAvailabilityPriority(left);
      const rightScore = getAvailabilityPriority(right);

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }
    }

    return left.rankPosition - right.rankPosition;
  });

  return orderedMatches;
}

function getAvailabilityPriority(match: MatchResultCardDto) {
  let score = match.tutor.acceptingNewStudents ? 2 : 0;
  const signal = (match.availabilitySignal ?? "").toLowerCase();

  if (signal.includes("this week") || signal.includes("today") || signal.includes("soon")) {
    score += 2;
  } else if (signal.includes("overlap")) {
    score += 1;
  }

  return score;
}

function buildSummaryDescription({
  count,
  filter,
  results,
  sort,
}: {
  count: number;
  filter: ResultsFilter;
  results: MatchResultsPageDto;
  sort: ResultsSort;
}) {
  if (results.state === "preview") {
    return "Results route preview using the D4 match DTO shape until live auth and match data are configured.";
  }

  if (results.state === "queued") {
    return "The latest matching run has been created, but tutor rows are not ready yet.";
  }

  if (results.state === "failed") {
    return "The last run failed before it could produce a result set.";
  }

  if (results.state === "empty") {
    return "Start from the guided match flow to generate a fit-ranked result set.";
  }

  const filterLabel =
    filter === "high-confidence"
      ? "high-confidence only"
      : filter === "available-soon"
        ? "available-soon only"
        : "all active results";
  const sortLabel = sort === "availability" ? "availability first" : "best-fit order";

  return `${count} cards shown from ${filterLabel}, sorted by ${sortLabel}.`;
}

function buildSummaryTitle(results: MatchResultsPageDto, countLabel: string) {
  switch (results.state) {
    case "empty":
      return "Ready for the first fit-ranked result set";
    case "failed":
      return "The latest match run needs another try";
    case "preview":
      return "Previewing the fit-first results layout";
    case "queued":
      return "Matching is still preparing tutor fits";
    case "ready":
    default:
      return countLabel;
  }
}
