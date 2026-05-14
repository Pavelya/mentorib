import "server-only";

import type { Route } from "next";

import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { normalizeCurrencyCode } from "@/modules/pricing/money";
import {
  formatHourlyRate,
  formatTrialPrice,
} from "@/modules/pricing/tutor-pricing";
import {
  loadReferenceLanguagesByCodes,
  type ReferenceLanguage,
} from "@/modules/reference/catalog";
import { EXAMINER_TUTOR_CREDENTIAL_TYPE } from "@/modules/tutors/constants";
import {
  rankSeoCuratedTutors,
  selectSeoCuratedTutorsForDisplay,
  SEO_CURATED_LIST_MAX_VISIBLE,
  type SeoCuratedTutorScoreInput,
} from "@/modules/marketing/seo-landing/curated-tutors";

export type SeoCuratedTutorScope =
  | { focusAreaId: string; subjectId?: undefined }
  | { focusAreaId: string; subjectId: string }
  | { focusAreaId?: undefined; subjectId: string };

export type SeoCuratedTutorLanguageDto = {
  code: string;
  displayName: string;
};

export type SeoCuratedTutorCardDto = {
  bio: string | null;
  currencyCode: string;
  displayName: string;
  examinerBadgeForScope: boolean;
  headline: string | null;
  hourlyRateLabel: string | null;
  languages: readonly SeoCuratedTutorLanguageDto[];
  profileHref: Route;
  publicSlug: string;
  trialPriceLabel: string | null;
  tutorProfileId: string;
};

export type SeoCuratedTutorListDto = {
  acceptingTutorCount: number;
  visibleTutors: readonly SeoCuratedTutorCardDto[];
};

type CapabilityRow = {
  display_priority: number;
  subject_focus_area_id: string;
  subject_id: string;
  tutor_profile_id: string;
};

type ScheduleRow = {
  is_accepting_new_students: boolean;
  tutor_profile_id: string;
};

type ProfileRow = {
  app_user_id: string;
  bio: string | null;
  created_at: string;
  currency_code: string | null;
  display_name: string | null;
  headline: string | null;
  hourly_rate_minor: number | null;
  id: string;
  public_slug: string | null;
  trial_price_minor: number | null;
  updated_at: string;
};

type CredentialRow = {
  credential_subject_focus_area_id: string | null;
  credential_subject_id: string | null;
  tutor_profile_id: string;
};

type LanguageRow = {
  display_priority: number;
  language_code: string;
  tutor_profile_id: string;
};

export async function getSeoCuratedTutorsForScope(
  scope: SeoCuratedTutorScope,
): Promise<SeoCuratedTutorListDto> {
  if (!isSupabaseAuthConfigured()) {
    return { acceptingTutorCount: 0, visibleTutors: [] };
  }

  const capabilityRows = await loadCapabilityRows(scope);
  if (capabilityRows.length === 0) {
    return { acceptingTutorCount: 0, visibleTutors: [] };
  }

  const matchingTutorIds = uniqueStrings(
    capabilityRows.map((row) => row.tutor_profile_id),
  );

  const acceptingTutorIds = await loadAcceptingTutorIds(matchingTutorIds);
  if (acceptingTutorIds.length === 0) {
    return { acceptingTutorCount: 0, visibleTutors: [] };
  }

  const profileRows = await loadListedTutorProfiles(acceptingTutorIds);
  if (profileRows.length === 0) {
    return { acceptingTutorCount: 0, visibleTutors: [] };
  }

  const eligibleProfileIds = profileRows.map((row) => row.id);
  const [examinerForScope, languageRows] = await Promise.all([
    loadExaminersForScope(eligibleProfileIds, scope),
    loadLanguagesForTutors(eligibleProfileIds),
  ]);

  const capabilityCountByTutor = countCapabilitiesByTutor(
    capabilityRows.filter((row) => eligibleProfileIds.includes(row.tutor_profile_id)),
  );
  const bestPriorityByTutor = bestDisplayPriorityByTutor(
    capabilityRows.filter((row) => eligibleProfileIds.includes(row.tutor_profile_id)),
  );

  const scoreInputs: SeoCuratedTutorScoreInput[] = profileRows.map((row) => ({
    bestDisplayPriority: bestPriorityByTutor.get(row.id) ?? Number.MAX_SAFE_INTEGER,
    createdAt: row.created_at,
    hasExaminerCredentialForScope: examinerForScope.has(row.id),
    matchingCapabilityCount: capabilityCountByTutor.get(row.id) ?? 0,
    publicListingUpdatedAt: row.updated_at,
    tutorProfileId: row.id,
  }));

  const ranked = rankSeoCuratedTutors(scoreInputs);
  const visibleScored = selectSeoCuratedTutorsForDisplay(
    ranked,
    SEO_CURATED_LIST_MAX_VISIBLE,
  );

  const appUserIds = uniqueStrings(profileRows.map((row) => row.app_user_id));
  const namesByAppUserId = await loadFullNamesByAppUserIds(appUserIds);
  for (const row of profileRows) {
    row.display_name = namesByAppUserId.get(row.app_user_id) ?? null;
  }
  const profileById = new Map(profileRows.map((row) => [row.id, row]));
  const languagesByTutor = await materializeLanguageDtos(languageRows);

  const visibleTutors: SeoCuratedTutorCardDto[] = visibleScored.flatMap((scored) => {
    const profile = profileById.get(scored.tutorProfileId);
    if (!profile || !profile.public_slug || !profile.display_name) {
      return [];
    }

    return [
      {
        bio: normalizeOptionalText(profile.bio),
        currencyCode: normalizeCurrencyCode(profile.currency_code),
        displayName: profile.display_name,
        examinerBadgeForScope: scored.hasExaminerCredentialForScope,
        headline: normalizeOptionalText(profile.headline),
        hourlyRateLabel: formatHourlyRate({
          currencyCode: profile.currency_code,
          hourlyRateMinor: profile.hourly_rate_minor,
        }),
        languages: languagesByTutor.get(profile.id) ?? [],
        profileHref: `/tutors/${profile.public_slug}` as Route,
        publicSlug: profile.public_slug,
        trialPriceLabel: formatTrialPrice({
          currencyCode: profile.currency_code,
          trialPriceMinor: profile.trial_price_minor,
        }),
        tutorProfileId: profile.id,
      },
    ];
  });

  return {
    acceptingTutorCount: profileRows.length,
    visibleTutors,
  };
}

async function loadCapabilityRows(
  scope: SeoCuratedTutorScope,
): Promise<CapabilityRow[]> {
  const supabase = createSupabaseServiceRoleClient();
  let query = supabase
    .from("tutor_subject_capabilities")
    .select("tutor_profile_id, subject_id, subject_focus_area_id, display_priority");

  if ("subjectId" in scope && scope.subjectId) {
    query = query.eq("subject_id", scope.subjectId);
  }
  if ("focusAreaId" in scope && scope.focusAreaId) {
    query = query.eq("subject_focus_area_id", scope.focusAreaId);
  }

  const { data, error } = await query.returns<CapabilityRow[]>();
  if (error) {
    throw new Error("Could not load tutor capabilities for SEO scope.");
  }
  return data ?? [];
}

async function loadAcceptingTutorIds(
  tutorProfileIds: readonly string[],
): Promise<string[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("schedule_policies")
    .select("tutor_profile_id, is_accepting_new_students")
    .in("tutor_profile_id", tutorProfileIds)
    .returns<ScheduleRow[]>();
  if (error) {
    throw new Error("Could not load schedule policies for SEO scope.");
  }
  return (data ?? [])
    .filter((row) => row.is_accepting_new_students)
    .map((row) => row.tutor_profile_id);
}

async function loadListedTutorProfiles(
  tutorProfileIds: readonly string[],
): Promise<ProfileRow[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select(
      [
        "id",
        "app_user_id",
        "public_slug",
        "headline",
        "bio",
        "trial_price_minor",
        "hourly_rate_minor",
        "currency_code",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .in("id", tutorProfileIds)
    .eq("application_status", "approved")
    .eq("public_listing_status", "listed")
    .eq("profile_visibility_status", "public_visible")
    .returns<ProfileRow[]>();
  if (error) {
    throw new Error("Could not load tutor profiles for SEO scope.");
  }
  return data ?? [];
}

async function loadFullNamesByAppUserIds(
  appUserIds: readonly string[],
): Promise<Map<string, string>> {
  const lookup = new Map<string, string>();
  if (appUserIds.length === 0) {
    return lookup;
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("full_name, id")
    .in("id", appUserIds)
    .returns<Array<{ full_name: string | null; id: string }>>();
  if (error) {
    throw new Error("Could not load tutor account names for SEO scope.");
  }
  for (const row of data ?? []) {
    const trimmed = row.full_name?.trim();
    if (trimmed) {
      lookup.set(row.id, trimmed);
    }
  }
  return lookup;
}

async function loadExaminersForScope(
  tutorProfileIds: readonly string[],
  scope: SeoCuratedTutorScope,
): Promise<Set<string>> {
  if (tutorProfileIds.length === 0) {
    return new Set();
  }
  const supabase = createSupabaseServiceRoleClient();
  let query = supabase
    .from("tutor_credentials")
    .select(
      "tutor_profile_id, credential_subject_id, credential_subject_focus_area_id",
    )
    .in("tutor_profile_id", tutorProfileIds)
    .eq("credential_type", EXAMINER_TUTOR_CREDENTIAL_TYPE)
    .eq("review_status", "approved");

  if ("subjectId" in scope && scope.subjectId) {
    query = query.eq("credential_subject_id", scope.subjectId);
  } else if ("focusAreaId" in scope && scope.focusAreaId) {
    query = query.eq("credential_subject_focus_area_id", scope.focusAreaId);
  }

  const { data, error } = await query.returns<CredentialRow[]>();
  if (error) {
    throw new Error("Could not load examiner credentials for SEO scope.");
  }
  return new Set((data ?? []).map((row) => row.tutor_profile_id));
}

async function loadLanguagesForTutors(
  tutorProfileIds: readonly string[],
): Promise<LanguageRow[]> {
  if (tutorProfileIds.length === 0) {
    return [];
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_language_capabilities")
    .select("tutor_profile_id, language_code, display_priority")
    .in("tutor_profile_id", tutorProfileIds)
    .order("display_priority", { ascending: true })
    .returns<LanguageRow[]>();
  if (error) {
    throw new Error("Could not load tutor languages for SEO scope.");
  }
  return data ?? [];
}

async function materializeLanguageDtos(
  rows: readonly LanguageRow[],
): Promise<Map<string, SeoCuratedTutorLanguageDto[]>> {
  if (rows.length === 0) {
    return new Map();
  }

  const codes = uniqueStrings(rows.map((row) => row.language_code));
  let referenceRows: ReferenceLanguage[] = [];
  try {
    referenceRows = await loadReferenceLanguagesByCodes(codes);
  } catch {
    referenceRows = [];
  }
  const byCode = new Map(referenceRows.map((row) => [row.languageCode, row]));

  const grouped = new Map<string, SeoCuratedTutorLanguageDto[]>();
  for (const row of rows) {
    const reference = byCode.get(row.language_code);
    if (!reference) {
      continue;
    }
    const list = grouped.get(row.tutor_profile_id) ?? [];
    list.push({ code: reference.languageCode, displayName: reference.displayName });
    grouped.set(row.tutor_profile_id, list);
  }
  return grouped;
}

function countCapabilitiesByTutor(rows: readonly CapabilityRow[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.tutor_profile_id, (counts.get(row.tutor_profile_id) ?? 0) + 1);
  }
  return counts;
}

function bestDisplayPriorityByTutor(rows: readonly CapabilityRow[]) {
  const best = new Map<string, number>();
  for (const row of rows) {
    const current = best.get(row.tutor_profile_id);
    if (current === undefined || row.display_priority < current) {
      best.set(row.tutor_profile_id, row.display_priority);
    }
  }
  return best;
}

function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeOptionalText(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
