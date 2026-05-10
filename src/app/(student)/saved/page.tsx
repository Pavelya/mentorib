import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import {
  MatchRow,
  NeedSummaryBar,
  ScreenState,
  type MatchRowShortlistState,
} from "@/components/continuity";
import { TimezoneNotice } from "@/components/datetime";
import { Panel, getButtonClassName, InlineNotice } from "@/components/ui";
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
  getShortlistStateForLearningNeed,
  type ShortlistStateDto,
} from "@/modules/lessons/shortlist";

import styles from "./saved.module.css";

export default async function SavedPage() {
  const fallbackTimezone = await getCurrentUserTimezone();

  if (!isSupabaseAuthConfigured()) {
    const previewResults = buildPreviewMatchResultsDto(fallbackTimezone);
    return renderSavedPage({
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
    redirect(buildAuthSignInPath("/saved") as Route);
  }

  let account: Awaited<ReturnType<typeof ensureAuthAccount>> | null = null;

  try {
    account = await ensureAuthAccount(user, fallbackTimezone);
  } catch {
    account = null;
  }

  if (!account) {
    return (
      <InlineNotice title="Saved tutors unavailable" tone="warning">
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
          This account cannot review saved tutors right now. Please check your
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

  return renderSavedPage({ results, shortlistState });
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

function renderSavedPage({
  isPreview = false,
  results,
  shortlistState,
}: {
  isPreview?: boolean;
  results: MatchResultsPageDto;
  shortlistState: ShortlistStateDto | null;
}) {
  const savedIds = new Set(shortlistState?.shortlistedCandidateIds ?? []);
  const savedMatches = results.matches.filter((match) =>
    savedIds.has(match.candidateId),
  );
  const compareCount = shortlistState?.comparedCandidateIds.length ?? 0;
  const compareCap = shortlistState?.compareCap ?? 0;
  const hasComparing = compareCount > 0;
  const hasNoLearningNeed = !results.currentNeed;
  const hasSaved = savedMatches.length > 0;

  return (
    <article className={styles.page}>
      {results.currentNeed ? (
        <>
          <NeedSummaryBar
            action={
              <Link
                className={getButtonClassName({ size: "compact", variant: "secondary" })}
                href="/results"
              >
                Open results
              </Link>
            }
            label="Your request"
            mode="readOnly"
            need={results.currentNeed.headline}
            qualifiers={results.currentNeed.qualifiers}
            state={results.state === "queued" ? "draft" : "active"}
          />

          {hasSaved ? (
            <TimezoneNotice timezone={results.currentNeed.timezone} />
          ) : null}
        </>
      ) : null}

      <div className={styles.summaryGrid}>
        <Panel
          description={buildSummaryDescription({
            isPreview,
            results,
            savedCount: savedMatches.length,
          })}
          eyebrow="Saved tutors"
          title={buildSummaryTitle(savedMatches.length)}
          tone="warm"
        >
          <ul className={styles.summaryList}>
            <li>Saved tutors stay here across sessions and devices.</li>
            <li>
              Move tutors into compare from any saved row to weigh up to
              {" "}
              {compareCap || 3} side by side.
            </li>
            <li>Open a saved tutor profile to review proof without losing your shortlist.</li>
          </ul>
        </Panel>

        <Panel
          description="Compare lives inside Saved so the shortlist and the side-by-side view stay one decision."
          eyebrow="Compare"
          title={
            hasComparing
              ? `Comparing ${compareCount} of ${compareCap} tutors`
              : `Pick up to ${compareCap || 3} to compare`
          }
          tone="mist"
        >
          <ul className={styles.handoffList}>
            <li>Save what fits, then promote a few into compare for a closer read.</li>
            <li>Compare keeps the same need context and never adds a separate decision.</li>
          </ul>
          <Link
            className={getButtonClassName({ size: "compact" })}
            href="/compare"
          >
            {hasComparing ? "Open compare" : "View compare"}
          </Link>
        </Panel>
      </div>

      {hasSaved && shortlistState ? (
        <CompareReadiness state={shortlistState} />
      ) : null}

      {hasSaved ? (
        <section aria-label="Saved tutors" className={styles.savedList}>
          {savedMatches.map((match) => (
            <MatchRow
              key={match.candidateId}
              match={match}
              returnTo="/saved"
              shortlistState={
                isPreview
                  ? null
                  : resolveRowShortlistState(shortlistState, match.candidateId)
              }
            />
          ))}
        </section>
      ) : (
        <SavedEmptyState hasLearningNeed={!hasNoLearningNeed} />
      )}
    </article>
  );
}

function CompareReadiness({ state }: { state: ShortlistStateDto }) {
  const compareCount = state.comparedCandidateIds.length;
  const tone = state.isCompareFull ? "warning" : compareCount > 0 ? "success" : "info";
  const title = state.isCompareFull
    ? `Compare is full · ${compareCount} of ${state.compareCap}`
    : compareCount > 0
      ? `Comparing ${compareCount} of ${state.compareCap} tutors`
      : `Pick up to ${state.compareCap} tutors to compare`;

  return (
    <InlineNotice
      aria-live="polite"
      className={styles.notice}
      showToneLabel={false}
      title={title}
      tone={tone}
    >
      <p>
        {state.isCompareFull
          ? "Remove a tutor from compare before adding another. Saved tutors stay on this page."
          : compareCount > 0
            ? "Open compare to see them side by side, or keep refining your shortlist here."
            : "Use Compare on any saved row to line a few tutors up side by side."}
      </p>
      <div className={styles.noticeActions}>
        <Link
          className={getButtonClassName({ size: "compact", variant: "secondary" })}
          href="/compare"
        >
          {compareCount > 0 ? "Open compare" : "View compare"}
        </Link>
      </div>
    </InlineNotice>
  );
}

function SavedEmptyState({ hasLearningNeed }: { hasLearningNeed: boolean }) {
  if (!hasLearningNeed) {
    return (
      <ScreenState
        action={
          <Link className={getButtonClassName()} href="/match">
            Start matching
          </Link>
        }
        description="Saved tutors come from your match results. Start the guided match flow to see fit-ranked tutors you can save."
        hints={[
          "Saving keeps the shortlist with you across sessions and devices.",
          "Compare lives inside Saved once you have a few candidates.",
        ]}
        kind="empty"
        title="No saved tutors yet"
      />
    );
  }

  return (
    <ScreenState
      action={
        <Link className={getButtonClassName()} href="/results">
          Open results
        </Link>
      }
      description="Save tutors from your match results to keep them here. Saved tutors stay across sessions and devices."
      hints={[
        "Use Save on any result row to add a tutor here.",
        "Compare lives inside Saved once you have a few candidates.",
      ]}
      kind="empty"
      title="No saved tutors yet"
    />
  );
}

function resolveRowShortlistState(
  state: ShortlistStateDto | null,
  candidateId: string,
): MatchRowShortlistState | null {
  if (!state) {
    return null;
  }

  const entry = state.candidates.find(
    (candidate) => candidate.candidateId === candidateId,
  );

  return {
    isCompared: entry?.isCompared ?? false,
    isCompareFull: state.isCompareFull,
    isShortlisted: entry?.isShortlisted ?? false,
  };
}

function buildSummaryTitle(savedCount: number) {
  if (savedCount === 0) {
    return "Your saved tutors live here";
  }
  if (savedCount === 1) {
    return "1 saved tutor";
  }
  return `${savedCount} saved tutors`;
}

function buildSummaryDescription({
  isPreview,
  results,
  savedCount,
}: {
  isPreview: boolean;
  results: MatchResultsPageDto;
  savedCount: number;
}) {
  if (isPreview) {
    return "Preview of the saved tutors surface using the match DTO shape until live auth is configured.";
  }

  if (results.state === "queued") {
    return "The latest matching run is still preparing tutor fits — saved tutors will appear once results are ready.";
  }

  if (savedCount === 0) {
    return "Save tutors from your match results to come back to them later without losing context.";
  }

  return "Saved tutors stay here across sessions, with the same fit reasoning that surfaced in results.";
}

function buildPreviewShortlistState(
  results: MatchResultsPageDto,
): ShortlistStateDto | null {
  if (!results.currentNeed) {
    return null;
  }
  const previewSavedIds = results.matches
    .slice(0, 2)
    .map((match: MatchResultCardDto) => match.candidateId);

  return {
    candidates: previewSavedIds.map((id) => ({
      candidateId: id,
      comparedAt: null,
      isCompared: false,
      isShortlisted: true,
      matchRunId: "preview-match-run",
      shortlistedAt: "2026-04-23T10:00:00.000Z",
      tutorProfileId: id,
    })),
    comparedCandidateIds: [],
    compareCap: 3,
    isCompareFull: false,
    learningNeedId: results.currentNeed.id,
    matchRunId: "preview-match-run",
    shortlistedCandidateIds: previewSavedIds,
  };
}
