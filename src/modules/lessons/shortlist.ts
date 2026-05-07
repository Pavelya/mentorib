import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export const COMPARE_CAP = 3;

export type ShortlistMutationErrorCode =
  | "candidate_lookup_failed"
  | "candidate_update_failed"
  | "compare_cap_reached"
  | "not_found"
  | "not_owner"
  | "state_lookup_failed";

export class ShortlistMutationError extends Error {
  code: ShortlistMutationErrorCode;

  constructor(code: ShortlistMutationErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

type AuthorizedCandidateRow = {
  compared_at: string | null;
  id: string;
  match_run_id: string;
  shortlisted_at: string | null;
  tutor_profile_id: string;
};

type CandidateOwnershipRow = AuthorizedCandidateRow & {
  match_runs: {
    id: string;
    learning_need_id: string;
    learning_needs: {
      id: string;
      student_profiles: {
        id: string;
        app_users: {
          id: string;
        };
      };
    };
  };
};

type CompareCountRow = {
  count: number;
};

export type ShortlistMutationInput = {
  account: Pick<ResolvedAuthAccount, "id">;
  candidateId: string;
};

export type ShortlistCandidateState = {
  candidateId: string;
  comparedAt: string | null;
  isCompared: boolean;
  isShortlisted: boolean;
  matchRunId: string;
  shortlistedAt: string | null;
  tutorProfileId: string;
};

export type ShortlistStateDto = {
  candidates: ShortlistCandidateState[];
  comparedCandidateIds: string[];
  compareCap: number;
  isCompareFull: boolean;
  learningNeedId: string;
  matchRunId: string | null;
  shortlistedCandidateIds: string[];
};

export type CompareEntryDto = {
  candidateId: string;
  comparedAt: string;
  isShortlisted: boolean;
  matchRunId: string;
  rankPosition: number;
  tutorProfileId: string;
};

export type StudentCompareViewDto = {
  compareCap: number;
  entries: CompareEntryDto[];
  learningNeedId: string;
  matchRunId: string | null;
};

export async function addToShortlist(
  input: ShortlistMutationInput,
): Promise<ShortlistCandidateState> {
  const candidate = await loadAuthorizedCandidate(input);

  if (candidate.shortlisted_at) {
    return toCandidateState(candidate);
  }

  return await updateCandidateState(candidate.id, {
    shortlisted_at: new Date().toISOString(),
  });
}

export async function removeFromShortlist(
  input: ShortlistMutationInput,
): Promise<ShortlistCandidateState> {
  const candidate = await loadAuthorizedCandidate(input);

  if (!candidate.shortlisted_at) {
    return toCandidateState(candidate);
  }

  return await updateCandidateState(candidate.id, { shortlisted_at: null });
}

export async function addToCompare(
  input: ShortlistMutationInput,
): Promise<ShortlistCandidateState> {
  const candidate = await loadAuthorizedCandidate(input);

  if (candidate.compared_at) {
    return toCandidateState(candidate);
  }

  const currentCount = await countComparedCandidates(candidate.match_run_id, {
    excludeCandidateId: candidate.id,
  });

  if (currentCount >= COMPARE_CAP) {
    throw new ShortlistMutationError(
      "compare_cap_reached",
      `Compare is limited to ${COMPARE_CAP} tutors. Remove one to add another.`,
    );
  }

  return await updateCandidateState(candidate.id, {
    compared_at: new Date().toISOString(),
  });
}

export async function removeFromCompare(
  input: ShortlistMutationInput,
): Promise<ShortlistCandidateState> {
  const candidate = await loadAuthorizedCandidate(input);

  if (!candidate.compared_at) {
    return toCandidateState(candidate);
  }

  return await updateCandidateState(candidate.id, { compared_at: null });
}

export async function getShortlistStateForLearningNeed(
  account: Pick<ResolvedAuthAccount, "id">,
  learningNeedId: string,
): Promise<ShortlistStateDto | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: ownerRow, error: ownerError } = await supabase
    .from("learning_needs")
    .select(
      "id, student_profiles!inner(app_users!inner(id))",
    )
    .eq("id", learningNeedId)
    .eq("student_profiles.app_users.id", account.id)
    .maybeSingle<{ id: string }>();

  if (ownerError) {
    throw new ShortlistMutationError(
      "state_lookup_failed",
      "Could not verify shortlist ownership for this learning need.",
    );
  }

  if (!ownerRow) {
    return null;
  }

  const { data: matchRunRow, error: matchRunError } = await supabase
    .from("match_runs")
    .select("id")
    .eq("learning_need_id", learningNeedId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (matchRunError) {
    throw new ShortlistMutationError(
      "state_lookup_failed",
      "Could not load the latest match run for shortlist state.",
    );
  }

  if (!matchRunRow) {
    return {
      candidates: [],
      comparedCandidateIds: [],
      compareCap: COMPARE_CAP,
      isCompareFull: false,
      learningNeedId,
      matchRunId: null,
      shortlistedCandidateIds: [],
    };
  }

  const { data: candidateRows, error: candidatesError } = await supabase
    .from("match_candidates")
    .select("id, match_run_id, tutor_profile_id, shortlisted_at, compared_at")
    .eq("match_run_id", matchRunRow.id)
    .or("shortlisted_at.not.is.null,compared_at.not.is.null")
    .returns<AuthorizedCandidateRow[]>();

  if (candidatesError) {
    throw new ShortlistMutationError(
      "state_lookup_failed",
      "Could not load shortlist state for this match run.",
    );
  }

  const candidates = (candidateRows ?? []).map(toCandidateState);
  const shortlistedCandidateIds = candidates
    .filter((entry) => entry.isShortlisted)
    .map((entry) => entry.candidateId);
  const comparedCandidateIds = candidates
    .filter((entry) => entry.isCompared)
    .map((entry) => entry.candidateId);

  return {
    candidates,
    comparedCandidateIds,
    compareCap: COMPARE_CAP,
    isCompareFull: comparedCandidateIds.length >= COMPARE_CAP,
    learningNeedId,
    matchRunId: matchRunRow.id,
    shortlistedCandidateIds,
  };
}

export async function getStudentCompareView(
  account: Pick<ResolvedAuthAccount, "id">,
): Promise<StudentCompareViewDto | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: studentProfile, error: studentProfileError } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("app_user_id", account.id)
    .maybeSingle<{ id: string }>();

  if (studentProfileError) {
    throw new ShortlistMutationError(
      "state_lookup_failed",
      "Could not resolve the student profile for compare.",
    );
  }

  if (!studentProfile) {
    return null;
  }

  const { data: learningNeed, error: learningNeedError } = await supabase
    .from("learning_needs")
    .select("id")
    .eq("student_profile_id", studentProfile.id)
    .in("need_status", ["active", "matched", "booked", "draft"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (learningNeedError) {
    throw new ShortlistMutationError(
      "state_lookup_failed",
      "Could not load the current learning need for compare.",
    );
  }

  if (!learningNeed) {
    return null;
  }

  const { data: matchRunRow, error: matchRunError } = await supabase
    .from("match_runs")
    .select("id")
    .eq("learning_need_id", learningNeed.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (matchRunError) {
    throw new ShortlistMutationError(
      "state_lookup_failed",
      "Could not load the latest match run for compare.",
    );
  }

  if (!matchRunRow) {
    return {
      compareCap: COMPARE_CAP,
      entries: [],
      learningNeedId: learningNeed.id,
      matchRunId: null,
    };
  }

  const { data: comparedRows, error: comparedError } = await supabase
    .from("match_candidates")
    .select(
      "id, match_run_id, tutor_profile_id, rank_position, shortlisted_at, compared_at",
    )
    .eq("match_run_id", matchRunRow.id)
    .not("compared_at", "is", null)
    .order("rank_position", { ascending: true })
    .returns<
      Array<
        AuthorizedCandidateRow & { rank_position: number }
      >
    >();

  if (comparedError) {
    throw new ShortlistMutationError(
      "state_lookup_failed",
      "Could not load compared candidates.",
    );
  }

  const entries: CompareEntryDto[] = (comparedRows ?? [])
    .filter((row): row is typeof row & { compared_at: string } =>
      Boolean(row.compared_at),
    )
    .map((row) => ({
      candidateId: row.id,
      comparedAt: row.compared_at,
      isShortlisted: Boolean(row.shortlisted_at),
      matchRunId: row.match_run_id,
      rankPosition: row.rank_position,
      tutorProfileId: row.tutor_profile_id,
    }));

  return {
    compareCap: COMPARE_CAP,
    entries,
    learningNeedId: learningNeed.id,
    matchRunId: matchRunRow.id,
  };
}

async function loadAuthorizedCandidate(
  input: ShortlistMutationInput,
): Promise<AuthorizedCandidateRow> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("match_candidates")
    .select(
      "id, match_run_id, tutor_profile_id, shortlisted_at, compared_at, match_runs!inner(id, learning_need_id, learning_needs!inner(id, student_profiles!inner(id, app_users!inner(id))))",
    )
    .eq("id", input.candidateId)
    .maybeSingle<CandidateOwnershipRow>();

  if (error) {
    throw new ShortlistMutationError(
      "candidate_lookup_failed",
      "Could not load the match candidate.",
    );
  }

  if (!data) {
    throw new ShortlistMutationError(
      "not_found",
      "We couldn't find this candidate on your account.",
    );
  }

  const ownerAppUserId =
    data.match_runs?.learning_needs?.student_profiles?.app_users?.id;

  if (ownerAppUserId !== input.account.id) {
    throw new ShortlistMutationError(
      "not_owner",
      "This candidate does not belong to your account.",
    );
  }

  return {
    compared_at: data.compared_at,
    id: data.id,
    match_run_id: data.match_run_id,
    shortlisted_at: data.shortlisted_at,
    tutor_profile_id: data.tutor_profile_id,
  };
}

async function updateCandidateState(
  candidateId: string,
  patch:
    | { shortlisted_at: string | null }
    | { compared_at: string | null },
): Promise<ShortlistCandidateState> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("match_candidates")
    .update(patch)
    .eq("id", candidateId)
    .select("id, match_run_id, tutor_profile_id, shortlisted_at, compared_at")
    .single<AuthorizedCandidateRow>();

  if (error || !data) {
    if (error && /compare cap/i.test(error.message ?? "")) {
      throw new ShortlistMutationError(
        "compare_cap_reached",
        `Compare is limited to ${COMPARE_CAP} tutors. Remove one to add another.`,
      );
    }

    throw new ShortlistMutationError(
      "candidate_update_failed",
      "Could not update the candidate state.",
    );
  }

  return toCandidateState(data);
}

async function countComparedCandidates(
  matchRunId: string,
  options: { excludeCandidateId?: string } = {},
): Promise<number> {
  const supabase = createSupabaseServiceRoleClient();
  let query = supabase
    .from("match_candidates")
    .select("id", { count: "exact", head: true })
    .eq("match_run_id", matchRunId)
    .not("compared_at", "is", null);

  if (options.excludeCandidateId) {
    query = query.neq("id", options.excludeCandidateId);
  }

  const { count, error } = await query.returns<CompareCountRow[]>();

  if (error) {
    throw new ShortlistMutationError(
      "state_lookup_failed",
      "Could not check the compare cap.",
    );
  }

  return count ?? 0;
}

function toCandidateState(row: AuthorizedCandidateRow): ShortlistCandidateState {
  return {
    candidateId: row.id,
    comparedAt: row.compared_at,
    isCompared: Boolean(row.compared_at),
    isShortlisted: Boolean(row.shortlisted_at),
    matchRunId: row.match_run_id,
    shortlistedAt: row.shortlisted_at,
    tutorProfileId: row.tutor_profile_id,
  };
}
