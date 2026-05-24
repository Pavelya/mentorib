import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import {
  CompareReadinessNotice,
  MatchRow,
  NeedSummaryBar,
  ScreenState,
  type MatchRowShortlistState,
} from "@/components/continuity";
import { TimezoneNotice } from "@/components/datetime";
import { getButtonClassName, InlineNotice } from "@/components/ui";
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

import surfaceStyles from "../student-surfaces.module.css";
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
  const hasNoLearningNeed = !results.currentNeed;
  const hasSaved = savedMatches.length > 0;

  return (
    <article className={styles.page}>
      <header className={surfaceStyles.intro}>
        <p className={surfaceStyles.eyebrow}>Saved tutors</p>
        <h1 className={surfaceStyles.title}>Your shortlist</h1>
        <p className={surfaceStyles.description}>
          Saved tutors stay here across sessions. Promote a few into compare for a
          closer read.
        </p>
      </header>

      {results.currentNeed ? (
        <>
          {hasSaved ? (
            <TimezoneNotice timezone={results.currentNeed.timezone} />
          ) : null}

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
        </>
      ) : null}

      {hasSaved && shortlistState ? (
        <CompareReadinessNotice
          className={styles.notice}
          origin="saved"
          state={shortlistState}
        />
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
