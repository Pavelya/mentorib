import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  loadActiveReferenceLanguages,
  loadActiveReferenceSubjectFocusAreas,
  loadActiveReferenceSubjects,
} from "@/modules/reference/catalog";
import { getReferenceSubjectIconKey } from "@/modules/reference/visuals";
import {
  DEFAULT_TUTOR_APPLICATION_REVIEW_FILTERS,
  TUTOR_APPLICATION_REVIEW_FILTER_STATUSES,
  getAvailableReviewActions,
  isFilterStatus,
  type TutorApplicationReviewDetailDto,
  type TutorApplicationReviewFilterStatus,
  type TutorApplicationReviewHistoryEntryDto,
  type TutorApplicationReviewQueueCounter,
  type TutorApplicationReviewQueueDto,
  type TutorApplicationReviewQueueRowDto,
  type TutorApplicationReviewSubjectSummary,
} from "@/modules/tutors/application-review";
import type { TutorApplicationStatus } from "@/modules/tutors/constants";
import type { TutorApplicationReviewStatus } from "@/modules/tutors/review-constants";

const APPLICANT_NAME_FALLBACK = "Applicant";
const REVIEWER_NAME_FALLBACK = "Mentor IB reviewer";
export const TUTOR_APPLICATION_REVIEW_QUEUE_PAGE_SIZE = 25;

type QueueProfileRow = {
  app_user_id: string;
  application_status: TutorApplicationStatus;
  id: string;
  updated_at: string;
};

type LatestReviewRow = {
  created_at: string;
  review_status: TutorApplicationReviewStatus;
  reviewer_app_user_id: string;
  tutor_profile_id: string;
};

type AppUserNameRow = {
  full_name: string | null;
  id: string;
};

type DetailProfileRow = {
  app_user_id: string;
  application_status: TutorApplicationStatus;
  bio: string | null;
  currency_code: string;
  headline: string | null;
  hourly_rate_minor: number | null;
  id: string;
  updated_at: string;
};

type SubjectCapabilityRow = {
  subject_focus_area_id: string;
  subject_id: string;
};

type LanguageCapabilityRow = {
  language_code: string;
};

type SchedulePolicyRow = {
  timezone: string | null;
};

type HistoryRow = {
  created_at: string;
  id: string;
  internal_note: string | null;
  review_status: TutorApplicationReviewStatus;
  reviewer_app_user_id: string;
  reviewer_note: string | null;
};

const QUEUE_FILTER_TO_APPLICATION_STATUSES: Record<
  TutorApplicationReviewFilterStatus,
  readonly TutorApplicationStatus[]
> = {
  queued: ["submitted"],
  under_review: ["under_review"],
  changes_requested: ["changes_requested"],
  approved: ["approved"],
  rejected: ["rejected"],
};

export function normalizeQueueFilters(
  raw: readonly string[] | undefined,
): readonly TutorApplicationReviewFilterStatus[] {
  if (!raw || raw.length === 0) {
    return DEFAULT_TUTOR_APPLICATION_REVIEW_FILTERS;
  }
  const normalized = raw.filter(isFilterStatus);
  if (normalized.length === 0) {
    return DEFAULT_TUTOR_APPLICATION_REVIEW_FILTERS;
  }
  return Array.from(new Set(normalized));
}

export async function loadTutorApplicationReviewQueue(input: {
  filters: readonly TutorApplicationReviewFilterStatus[];
}): Promise<TutorApplicationReviewQueueDto> {
  const supabase = createSupabaseServiceRoleClient();
  const requestedApplicationStatuses = uniqueValues(
    input.filters.flatMap(
      (filter) => QUEUE_FILTER_TO_APPLICATION_STATUSES[filter] ?? [],
    ),
  );

  const counters = await loadFilterCounters();
  if (requestedApplicationStatuses.length === 0) {
    return {
      appliedFilters: input.filters,
      counters,
      rows: [],
    };
  }

  const { data: profileRows, error: profilesError } = await supabase
    .from("tutor_profiles")
    .select("app_user_id, application_status, id, updated_at")
    .in("application_status", requestedApplicationStatuses)
    .order("updated_at", { ascending: true })
    .limit(TUTOR_APPLICATION_REVIEW_QUEUE_PAGE_SIZE)
    .returns<QueueProfileRow[]>();

  if (profilesError) {
    throw new Error("Could not load the tutor review queue.");
  }

  const rows = profileRows ?? [];
  if (rows.length === 0) {
    return {
      appliedFilters: input.filters,
      counters,
      rows: [],
    };
  }

  const applicantIds = uniqueValues(rows.map((row) => row.app_user_id));
  const profileIds = uniqueValues(rows.map((row) => row.id));

  const [applicantNamesById, latestReviewByProfileId] = await Promise.all([
    loadAppUserNames(applicantIds),
    loadLatestReviewByProfileId(profileIds),
  ]);

  const reviewerIds = uniqueValues(
    Array.from(latestReviewByProfileId.values()).map(
      (review) => review.reviewer_app_user_id,
    ),
  );
  const reviewerNamesById = await loadAppUserNames(reviewerIds);

  const dtoRows: TutorApplicationReviewQueueRowDto[] = rows.map((profile) => {
    const review = latestReviewByProfileId.get(profile.id) ?? null;
    return {
      applicantDisplayName: resolveDisplayName(
        applicantNamesById.get(profile.app_user_id) ?? null,
      ),
      applicationId: profile.id,
      applicationStatus: profile.application_status,
      lastReviewerSummary: review
        ? buildLastReviewerSummary({
            reviewStatus: review.review_status,
            reviewerName: reviewerNamesById.get(review.reviewer_app_user_id) ?? null,
          })
        : null,
      lastTransitionAt: review?.created_at ?? null,
      submittedAt:
        profile.application_status === "submitted" ||
        profile.application_status === "under_review"
          ? profile.updated_at
          : null,
    };
  });

  return {
    appliedFilters: input.filters,
    counters,
    rows: dtoRows,
  };
}

export async function loadTutorApplicationReviewDetail(
  applicationId: string,
): Promise<TutorApplicationReviewDetailDto | null> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: profile, error: profileError } = await supabase
    .from("tutor_profiles")
    .select(
      "app_user_id, application_status, bio, currency_code, headline, hourly_rate_minor, id, updated_at",
    )
    .eq("id", applicationId)
    .maybeSingle<DetailProfileRow>();

  if (profileError) {
    throw new Error("Could not load the tutor review detail.");
  }

  if (!profile) {
    return null;
  }

  const [
    [subjects, focusAreas, languages],
    capabilities,
    languageCapabilities,
    schedulePolicy,
    history,
    applicantNamesById,
  ] = await Promise.all([
    Promise.all([
      loadActiveReferenceSubjects(),
      loadActiveReferenceSubjectFocusAreas(),
      loadActiveReferenceLanguages(),
    ]),
    loadProfileSubjectCapabilities(profile.id),
    loadProfileLanguageCapabilities(profile.id),
    loadSchedulePolicy(profile.id),
    loadHistory(profile.id),
    loadAppUserNames([profile.app_user_id]),
  ]);

  const subjectsById = new Map(subjects.map((subject) => [subject.id, subject]));
  const focusAreasById = new Map(
    focusAreas.map((focusArea) => [focusArea.id, focusArea]),
  );
  const languageLabelsByCode = new Map(
    languages.map((language) => [language.languageCode, language.displayName]),
  );

  const subjectSummaries: TutorApplicationReviewSubjectSummary[] = capabilities.map(
    (capability) => {
      const subject = subjectsById.get(capability.subject_id) ?? null;
      const focusArea = focusAreasById.get(capability.subject_focus_area_id) ?? null;
      return {
        focusAreaLabel: focusArea?.displayName ?? null,
        iconKey: subject ? getReferenceSubjectIconKey(subject.subjectCode) : null,
        subjectLabel: subject?.displayName ?? null,
      };
    },
  );

  const languageLabels = uniqueValues(
    languageCapabilities
      .map((row) => languageLabelsByCode.get(row.language_code) ?? row.language_code),
  );

  const reviewerIds = uniqueValues(
    history.map((entry) => entry.reviewer_app_user_id),
  );
  const reviewerNamesById = await loadAppUserNames(reviewerIds);

  const historyDtos: TutorApplicationReviewHistoryEntryDto[] = history
    .map((entry) => ({
      createdAt: entry.created_at,
      id: entry.id,
      internalNote: entry.internal_note,
      reviewStatus: entry.review_status,
      reviewerLabel: resolveReviewerLabel(
        reviewerNamesById.get(entry.reviewer_app_user_id) ?? null,
      ),
      reviewerNote: entry.reviewer_note,
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const applicantFullName =
    applicantNamesById.get(profile.app_user_id) ?? null;

  return {
    applicantDisplayName: resolveDisplayName(applicantFullName),
    applicationId: profile.id,
    applicationStatus: profile.application_status,
    availableActions: getAvailableReviewActions(profile.application_status),
    bio: profile.bio,
    currencyCode: profile.currency_code,
    fullName: applicantFullName,
    headline: profile.headline,
    history: historyDtos,
    hourlyRateMinor: profile.hourly_rate_minor,
    languageLabels,
    subjectSummaries,
    submittedAt:
      profile.application_status === "submitted" ||
      profile.application_status === "under_review"
        ? profile.updated_at
        : null,
    timezone: schedulePolicy?.timezone ?? null,
  };
}

async function loadFilterCounters(): Promise<TutorApplicationReviewQueueCounter[]> {
  const supabase = createSupabaseServiceRoleClient();
  const counts: TutorApplicationReviewQueueCounter[] = [];

  await Promise.all(
    TUTOR_APPLICATION_REVIEW_FILTER_STATUSES.map(async (filter) => {
      const statuses = QUEUE_FILTER_TO_APPLICATION_STATUSES[filter];
      if (statuses.length === 0) {
        counts.push({ count: 0, status: filter });
        return;
      }
      const { count, error } = await supabase
        .from("tutor_profiles")
        .select("id", { count: "exact", head: true })
        .in("application_status", statuses);
      if (error) {
        counts.push({ count: 0, status: filter });
        return;
      }
      counts.push({ count: count ?? 0, status: filter });
    }),
  );

  return TUTOR_APPLICATION_REVIEW_FILTER_STATUSES.map(
    (filter) => counts.find((row) => row.status === filter) ?? {
      count: 0,
      status: filter,
    },
  );
}

async function loadAppUserNames(
  ids: readonly string[],
): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();
  if (ids.length === 0) {
    return result;
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("full_name, id")
    .in("id", ids)
    .returns<AppUserNameRow[]>();
  if (error) {
    return result;
  }
  for (const row of data ?? []) {
    result.set(row.id, row.full_name);
  }
  return result;
}

async function loadLatestReviewByProfileId(
  profileIds: readonly string[],
): Promise<Map<string, LatestReviewRow>> {
  const result = new Map<string, LatestReviewRow>();
  if (profileIds.length === 0) {
    return result;
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_application_reviews")
    .select("created_at, review_status, reviewer_app_user_id, tutor_profile_id")
    .in("tutor_profile_id", profileIds)
    .order("created_at", { ascending: false })
    .returns<LatestReviewRow[]>();
  if (error) {
    return result;
  }
  for (const row of data ?? []) {
    if (!result.has(row.tutor_profile_id)) {
      result.set(row.tutor_profile_id, row);
    }
  }
  return result;
}

async function loadProfileSubjectCapabilities(
  tutorProfileId: string,
): Promise<SubjectCapabilityRow[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_subject_capabilities")
    .select("subject_focus_area_id, subject_id")
    .eq("tutor_profile_id", tutorProfileId)
    .order("display_priority", { ascending: true })
    .returns<SubjectCapabilityRow[]>();
  if (error) {
    return [];
  }
  return data ?? [];
}

async function loadProfileLanguageCapabilities(
  tutorProfileId: string,
): Promise<LanguageCapabilityRow[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_language_capabilities")
    .select("language_code")
    .eq("tutor_profile_id", tutorProfileId)
    .order("display_priority", { ascending: true })
    .returns<LanguageCapabilityRow[]>();
  if (error) {
    return [];
  }
  return data ?? [];
}

async function loadSchedulePolicy(
  tutorProfileId: string,
): Promise<SchedulePolicyRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("schedule_policies")
    .select("timezone")
    .eq("tutor_profile_id", tutorProfileId)
    .maybeSingle<SchedulePolicyRow>();
  if (error) {
    return null;
  }
  return data ?? null;
}

async function loadHistory(
  tutorProfileId: string,
): Promise<HistoryRow[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_application_reviews")
    .select(
      "created_at, id, internal_note, review_status, reviewer_app_user_id, reviewer_note",
    )
    .eq("tutor_profile_id", tutorProfileId)
    .order("created_at", { ascending: false })
    .returns<HistoryRow[]>();
  if (error) {
    return [];
  }
  return data ?? [];
}

function resolveDisplayName(fullName: string | null): string {
  const trimmed = fullName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : APPLICANT_NAME_FALLBACK;
}

function resolveReviewerLabel(fullName: string | null): string {
  const trimmed = fullName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : REVIEWER_NAME_FALLBACK;
}

function buildLastReviewerSummary(input: {
  reviewStatus: TutorApplicationReviewStatus;
  reviewerName: string | null;
}): string {
  const verb = (() => {
    switch (input.reviewStatus) {
      case "under_review":
        return "claimed";
      case "changes_requested":
        return "requested changes";
      case "approved":
        return "approved";
      case "rejected":
        return "rejected";
      case "queued":
      default:
        return "queued";
    }
  })();
  return `${resolveReviewerLabel(input.reviewerName)} · ${verb}`;
}

function uniqueValues<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}
