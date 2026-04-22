import type { Route } from "next";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import {
  evaluateTutorProfileIndexability,
  type TutorProfilePublicRouteInput,
} from "@/lib/seo/quality/public-indexability";

const PUBLIC_TUTOR_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type PublicTutorProfileRecord = {
  application_status: string;
  best_for_summary: string | null;
  bio: string | null;
  display_name: string | null;
  headline: string | null;
  id: string;
  intro_video_external_id: string | null;
  intro_video_provider: string | null;
  intro_video_url: string | null;
  pricing_summary: string | null;
  profile_visibility_status: string;
  public_listing_status: string;
  public_slug: string | null;
  teaching_style_summary: string | null;
  updated_at: string;
};

type TutorSubjectCapabilityRecord = {
  display_priority: number;
  experience_summary: string | null;
  subject_focus_area_id: string;
  subject_id: string;
  tutor_profile_id: string;
};

type SubjectRecord = {
  display_name: string;
  id: string;
  slug: string;
};

type SubjectFocusAreaRecord = SubjectRecord;

type TutorLanguageCapabilityRecord = {
  display_priority: number;
  language_code: string;
  tutor_profile_id: string;
};

type LanguageRecord = {
  display_name: string;
  language_code: string;
};

type TutorCredentialRecord = {
  issuing_body: string | null;
  title: string;
  tutor_profile_id: string;
};

type SchedulePolicyRecord = {
  is_accepting_new_students: boolean;
  timezone: string;
  tutor_profile_id: string;
};

export type PublicTutorCapabilityDto = {
  experienceSummary: string | null;
  focusArea: string;
  focusAreaSlug: string;
  subject: string;
  subjectSlug: string;
};

export type PublicTutorTrustProofDto = {
  body: string;
  title: string;
};

export type PublicTutorVideoReferenceDto = {
  embedUrl: string;
  provider: "Loom" | "Vimeo" | "YouTube";
  thumbnailUrl: string | null;
  title: string;
  watchUrl: string;
};

export type PublicTutorProfileDto = {
  availability: {
    acceptingNewStudents: boolean;
    summary: string;
    timezone: string | null;
  };
  bestForSummary: string | null;
  bio: string;
  bookingHref: Route | null;
  displayName: string;
  headline: string | null;
  introVideo: PublicTutorVideoReferenceDto | null;
  languages: string[];
  pricingSummary: string | null;
  primaryImage: {
    alt: string;
    url: string;
  } | null;
  seo: {
    description: string;
    imageUrl: string | null;
    title: string;
  };
  slug: string;
  subjects: PublicTutorCapabilityDto[];
  teachingStyleSummary: string | null;
  trustProofs: PublicTutorTrustProofDto[];
  updatedAt: string;
};

export type PublicTutorSitemapEntry = {
  pathname: `/tutors/${string}`;
  updatedAt: string;
};

export function normalizePublicTutorSlug(slug: string) {
  const normalizedSlug = slug.trim().toLowerCase();

  if (!PUBLIC_TUTOR_SLUG_PATTERN.test(normalizedSlug)) {
    return null;
  }

  return normalizedSlug;
}

export async function getPublicTutorProfileBySlug(
  slug: string,
): Promise<PublicTutorProfileDto | null> {
  const normalizedSlug = normalizePublicTutorSlug(slug);

  if (!normalizedSlug || !isSupabaseAuthConfigured()) {
    return null;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: profile, error: profileError } = await supabase
    .from("tutor_profiles")
    .select(
      [
        "id",
        "public_slug",
        "display_name",
        "headline",
        "bio",
        "teaching_style_summary",
        "best_for_summary",
        "pricing_summary",
        "profile_visibility_status",
        "application_status",
        "public_listing_status",
        "intro_video_provider",
        "intro_video_external_id",
        "intro_video_url",
        "updated_at",
      ].join(", "),
    )
    .eq("public_slug", normalizedSlug)
    .eq("profile_visibility_status", "public_visible")
    .eq("application_status", "approved")
    .eq("public_listing_status", "listed")
    .maybeSingle<PublicTutorProfileRecord>();

  if (profileError) {
    throw new Error("Could not load the public tutor profile.");
  }

  if (!profile?.public_slug || !profile.display_name || !profile.bio) {
    return null;
  }

  const relatedRecords = await loadPublicTutorProfileRelatedRecords(profile.id);

  return buildPublicTutorProfileDto(profile, relatedRecords);
}

export async function listPublicTutorProfileSitemapEntries(): Promise<
  PublicTutorSitemapEntry[]
> {
  if (!isSupabaseAuthConfigured()) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: profiles, error: profilesError } = await supabase
    .from("tutor_profiles")
    .select(
      [
        "id",
        "public_slug",
        "display_name",
        "headline",
        "bio",
        "teaching_style_summary",
        "best_for_summary",
        "pricing_summary",
        "profile_visibility_status",
        "application_status",
        "public_listing_status",
        "intro_video_provider",
        "intro_video_external_id",
        "intro_video_url",
        "updated_at",
      ].join(", "),
    )
    .eq("profile_visibility_status", "public_visible")
    .eq("application_status", "approved")
    .eq("public_listing_status", "listed")
    .returns<PublicTutorProfileRecord[]>();

  if (profilesError || !profiles?.length) {
    if (profilesError) {
      throw new Error("Could not load public tutor sitemap candidates.");
    }

    return [];
  }

  const profileIds = profiles.map((profile) => profile.id);
  const [capabilitiesByTutorId, credentialsByTutorId, schedulesByTutorId] =
    await Promise.all([
      loadCapabilitiesByTutorIds(profileIds),
      loadCredentialsByTutorIds(profileIds),
      loadSchedulesByTutorIds(profileIds),
    ]);

  return profiles
    .filter((profile) => profile.public_slug && profile.display_name && profile.bio)
    .filter((profile) => {
      const indexabilityInput = buildPublicRouteInput({
        bio: profile.bio,
        displayName: profile.display_name,
        hasClearCta:
          schedulesByTutorId.get(profile.id)?.is_accepting_new_students ?? true,
        imageUrl: buildVideoReference(profile)?.thumbnailUrl ?? null,
        slug: profile.public_slug ?? "",
        subjects: capabilitiesByTutorId.get(profile.id)?.map((row) => row.subject_id) ?? [],
        trustSignals: buildTrustProofs({
          credentials: credentialsByTutorId.get(profile.id) ?? [],
          hasApprovedPublicListing: true,
        }).map((proof) => proof.title),
      });

      return evaluateTutorProfileIndexability(indexabilityInput).isSitemapEligible;
    })
    .map((profile) => ({
      pathname: `/tutors/${profile.public_slug}` as const,
      updatedAt: profile.updated_at,
    }));
}

export function buildTutorProfileIndexabilityInput(
  profile: PublicTutorProfileDto,
): TutorProfilePublicRouteInput {
  return buildPublicRouteInput({
    bio: profile.bio,
    displayName: profile.displayName,
    hasClearCta: Boolean(profile.bookingHref),
    imageUrl: profile.seo.imageUrl,
    slug: profile.slug,
    subjects: profile.subjects.map((subject) => subject.subject),
    trustSignals: profile.trustProofs.map((proof) => proof.title),
  });
}

type RelatedPublicTutorProfileRecords = {
  credentials: TutorCredentialRecord[];
  languages: TutorLanguageCapabilityRecord[];
  languageRows: LanguageRecord[];
  schedule: SchedulePolicyRecord | null;
  subjectCapabilities: TutorSubjectCapabilityRecord[];
  subjectFocusAreas: SubjectFocusAreaRecord[];
  subjects: SubjectRecord[];
};

async function loadPublicTutorProfileRelatedRecords(
  tutorProfileId: string,
): Promise<RelatedPublicTutorProfileRecords> {
  const supabase = createSupabaseServiceRoleClient();

  const [subjectCapabilitiesResult, languagesResult, credentialsResult, scheduleResult] =
    await Promise.all([
      supabase
        .from("tutor_subject_capabilities")
        .select(
          "tutor_profile_id, subject_id, subject_focus_area_id, experience_summary, display_priority",
        )
        .eq("tutor_profile_id", tutorProfileId)
        .order("display_priority", { ascending: true })
        .returns<TutorSubjectCapabilityRecord[]>(),
      supabase
        .from("tutor_language_capabilities")
        .select("tutor_profile_id, language_code, display_priority")
        .eq("tutor_profile_id", tutorProfileId)
        .order("display_priority", { ascending: true })
        .returns<TutorLanguageCapabilityRecord[]>(),
      supabase
        .from("tutor_credentials")
        .select("tutor_profile_id, title, issuing_body")
        .eq("tutor_profile_id", tutorProfileId)
        .eq("review_status", "approved")
        .eq("public_display_preference", true)
        .returns<TutorCredentialRecord[]>(),
      supabase
        .from("schedule_policies")
        .select("tutor_profile_id, timezone, is_accepting_new_students")
        .eq("tutor_profile_id", tutorProfileId)
        .maybeSingle<SchedulePolicyRecord>(),
    ]);

  if (
    subjectCapabilitiesResult.error ||
    languagesResult.error ||
    credentialsResult.error ||
    scheduleResult.error
  ) {
    throw new Error("Could not load public tutor profile details.");
  }

  const subjectCapabilities = subjectCapabilitiesResult.data ?? [];
  const languageCapabilities = languagesResult.data ?? [];
  const [subjects, subjectFocusAreas, languageRows] = await Promise.all([
    loadSubjects(subjectCapabilities.map((row) => row.subject_id)),
    loadSubjectFocusAreas(subjectCapabilities.map((row) => row.subject_focus_area_id)),
    loadLanguages(languageCapabilities.map((row) => row.language_code)),
  ]);

  return {
    credentials: credentialsResult.data ?? [],
    languages: languageCapabilities,
    languageRows,
    schedule: scheduleResult.data ?? null,
    subjectCapabilities,
    subjectFocusAreas,
    subjects,
  };
}

async function loadCapabilitiesByTutorIds(tutorProfileIds: string[]) {
  if (tutorProfileIds.length === 0) {
    return new Map<string, TutorSubjectCapabilityRecord[]>();
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_subject_capabilities")
    .select("tutor_profile_id, subject_id, subject_focus_area_id, experience_summary, display_priority")
    .in("tutor_profile_id", tutorProfileIds)
    .returns<TutorSubjectCapabilityRecord[]>();

  if (error) {
    throw new Error("Could not load public tutor sitemap subjects.");
  }

  return groupByTutorProfileId(data ?? []);
}

async function loadCredentialsByTutorIds(tutorProfileIds: string[]) {
  if (tutorProfileIds.length === 0) {
    return new Map<string, TutorCredentialRecord[]>();
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_credentials")
    .select("tutor_profile_id, title, issuing_body")
    .in("tutor_profile_id", tutorProfileIds)
    .eq("review_status", "approved")
    .eq("public_display_preference", true)
    .returns<TutorCredentialRecord[]>();

  if (error) {
    throw new Error("Could not load public tutor sitemap trust proof.");
  }

  return groupByTutorProfileId(data ?? []);
}

async function loadSchedulesByTutorIds(tutorProfileIds: string[]) {
  if (tutorProfileIds.length === 0) {
    return new Map<string, SchedulePolicyRecord>();
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("schedule_policies")
    .select("tutor_profile_id, timezone, is_accepting_new_students")
    .in("tutor_profile_id", tutorProfileIds)
    .returns<SchedulePolicyRecord[]>();

  if (error) {
    throw new Error("Could not load public tutor sitemap booking state.");
  }

  return new Map((data ?? []).map((row) => [row.tutor_profile_id, row]));
}

async function loadSubjects(subjectIds: string[]) {
  const uniqueIds = uniqueValues(subjectIds);

  if (uniqueIds.length === 0) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("id, display_name, slug")
    .in("id", uniqueIds)
    .returns<SubjectRecord[]>();

  if (error) {
    throw new Error("Could not load public tutor subjects.");
  }

  return data ?? [];
}

async function loadSubjectFocusAreas(focusAreaIds: string[]) {
  const uniqueIds = uniqueValues(focusAreaIds);

  if (uniqueIds.length === 0) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("subject_focus_areas")
    .select("id, display_name, slug")
    .in("id", uniqueIds)
    .returns<SubjectFocusAreaRecord[]>();

  if (error) {
    throw new Error("Could not load public tutor focus areas.");
  }

  return data ?? [];
}

async function loadLanguages(languageCodes: string[]) {
  const uniqueCodes = uniqueValues(languageCodes);

  if (uniqueCodes.length === 0) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("languages")
    .select("language_code, display_name")
    .in("language_code", uniqueCodes)
    .returns<LanguageRecord[]>();

  if (error) {
    throw new Error("Could not load public tutor languages.");
  }

  return data ?? [];
}

function buildPublicTutorProfileDto(
  profile: PublicTutorProfileRecord,
  relatedRecords: RelatedPublicTutorProfileRecords,
): PublicTutorProfileDto {
  const introVideo = buildVideoReference(profile);
  const subjects = buildSubjectCapabilities(relatedRecords);
  const languages = buildLanguages(relatedRecords);
  const trustProofs = buildTrustProofs({
    credentials: relatedRecords.credentials,
    hasApprovedPublicListing:
      profile.application_status === "approved" &&
      profile.profile_visibility_status === "public_visible" &&
      profile.public_listing_status === "listed",
  });
  const availability = buildAvailabilitySummary(relatedRecords.schedule);
  const primaryImage = introVideo?.thumbnailUrl
    ? {
        alt: `${profile.display_name} intro video thumbnail`,
        url: introVideo.thumbnailUrl,
      }
    : null;

  return {
    availability,
    bestForSummary: normalizeOptionalText(profile.best_for_summary),
    bio: profile.bio?.trim() ?? "",
    bookingHref: availability.acceptingNewStudents
      ? (`/book/${profile.public_slug}` as Route)
      : null,
    displayName: profile.display_name?.trim() ?? "Mentor IB tutor",
    headline: normalizeOptionalText(profile.headline),
    introVideo,
    languages,
    pricingSummary: normalizeOptionalText(profile.pricing_summary),
    primaryImage,
    seo: buildSeoSummary({
      bio: profile.bio ?? "",
      displayName: profile.display_name ?? "Mentor IB tutor",
      headline: profile.headline,
      imageUrl: primaryImage?.url ?? null,
      subjects,
    }),
    slug: profile.public_slug ?? "",
    subjects,
    teachingStyleSummary: normalizeOptionalText(profile.teaching_style_summary),
    trustProofs,
    updatedAt: profile.updated_at,
  };
}

function buildSubjectCapabilities({
  subjectCapabilities,
  subjectFocusAreas,
  subjects,
}: Pick<
  RelatedPublicTutorProfileRecords,
  "subjectCapabilities" | "subjectFocusAreas" | "subjects"
>): PublicTutorCapabilityDto[] {
  const subjectsById = new Map(subjects.map((subject) => [subject.id, subject]));
  const focusAreasById = new Map(
    subjectFocusAreas.map((focusArea) => [focusArea.id, focusArea]),
  );

  return subjectCapabilities
    .map((capability) => {
      const subject = subjectsById.get(capability.subject_id);
      const focusArea = focusAreasById.get(capability.subject_focus_area_id);

      if (!subject || !focusArea) {
        return null;
      }

      return {
        experienceSummary: normalizeOptionalText(capability.experience_summary),
        focusArea: focusArea.display_name,
        focusAreaSlug: focusArea.slug,
        subject: subject.display_name,
        subjectSlug: subject.slug,
      };
    })
    .filter((capability): capability is PublicTutorCapabilityDto => Boolean(capability));
}

function buildLanguages({
  languages,
  languageRows,
}: Pick<RelatedPublicTutorProfileRecords, "languages" | "languageRows">) {
  const languageRowsByCode = new Map(
    languageRows.map((language) => [language.language_code, language]),
  );

  return languages
    .map((language) => languageRowsByCode.get(language.language_code)?.display_name)
    .filter((language): language is string => Boolean(language));
}

function buildTrustProofs({
  credentials,
  hasApprovedPublicListing,
}: {
  credentials: TutorCredentialRecord[];
  hasApprovedPublicListing: boolean;
}): PublicTutorTrustProofDto[] {
  const profileReviewProof = hasApprovedPublicListing
    ? [
        {
          body: "Mentor IB has approved this profile for the public tutor surface.",
          title: "Profile reviewed",
        },
      ]
    : [];

  const credentialProofs = credentials.map((credential) => ({
    body: credential.issuing_body
      ? `${credential.title} from ${credential.issuing_body}`
      : credential.title,
    title: "Verified qualification",
  }));

  return [...profileReviewProof, ...credentialProofs];
}

function buildAvailabilitySummary(schedule: SchedulePolicyRecord | null) {
  if (schedule && !schedule.is_accepting_new_students) {
    return {
      acceptingNewStudents: false,
      summary: "This tutor is not accepting new requests right now.",
      timezone: schedule.timezone,
    };
  }

  if (!schedule) {
    return {
      acceptingNewStudents: true,
      summary: "Open for booking handoff. Exact lesson times are confirmed in the booking flow.",
      timezone: null,
    };
  }

  return {
    acceptingNewStudents: true,
    summary: `Open for booking handoff. Times are shown against ${schedule.timezone}.`,
    timezone: schedule.timezone,
  };
}

function buildVideoReference(
  profile: Pick<
    PublicTutorProfileRecord,
    "display_name" | "intro_video_external_id" | "intro_video_provider" | "intro_video_url"
  >,
): PublicTutorVideoReferenceDto | null {
  const externalId = profile.intro_video_external_id?.trim();
  const provider = profile.intro_video_provider?.trim();

  if (!externalId || !provider) {
    return null;
  }

  const safeExternalId = encodeURIComponent(externalId);
  const title = `${profile.display_name ?? "Tutor"} intro video`;
  const watchUrl = normalizeHttpsUrl(profile.intro_video_url);

  switch (provider) {
    case "youtube":
      return {
        embedUrl: `https://www.youtube-nocookie.com/embed/${safeExternalId}`,
        provider: "YouTube",
        thumbnailUrl: `https://i.ytimg.com/vi/${safeExternalId}/hqdefault.jpg`,
        title,
        watchUrl: watchUrl ?? `https://www.youtube.com/watch?v=${safeExternalId}`,
      };
    case "vimeo":
      return {
        embedUrl: `https://player.vimeo.com/video/${safeExternalId}`,
        provider: "Vimeo",
        thumbnailUrl: null,
        title,
        watchUrl: watchUrl ?? `https://vimeo.com/${safeExternalId}`,
      };
    case "loom":
      return {
        embedUrl: `https://www.loom.com/embed/${safeExternalId}`,
        provider: "Loom",
        thumbnailUrl: null,
        title,
        watchUrl: watchUrl ?? `https://www.loom.com/share/${safeExternalId}`,
      };
    default:
      return null;
  }
}

function buildSeoSummary({
  bio,
  displayName,
  headline,
  imageUrl,
  subjects,
}: {
  bio: string;
  displayName: string;
  headline: string | null;
  imageUrl: string | null;
  subjects: PublicTutorCapabilityDto[];
}) {
  const subjectSummary = uniqueValues(subjects.map((subject) => subject.subject))
    .slice(0, 3)
    .join(", ");
  const title = headline?.trim()
    ? `${displayName} - ${headline.trim()}`
    : `${displayName} IB Tutor Profile`;
  const descriptionSource = headline?.trim() || bio.trim();
  const descriptionPrefix = subjectSummary
    ? `${displayName} supports ${subjectSummary} on Mentor IB.`
    : `${displayName} is a Mentor IB tutor.`;
  const description = `${descriptionPrefix} ${descriptionSource}`.slice(0, 220);

  return {
    description,
    imageUrl,
    title,
  };
}

function buildPublicRouteInput({
  bio,
  displayName,
  hasClearCta,
  imageUrl,
  slug,
  subjects,
  trustSignals,
}: {
  bio: string | null;
  displayName: string | null;
  hasClearCta: boolean;
  imageUrl: string | null;
  slug: string;
  subjects: string[];
  trustSignals: string[];
}): TutorProfilePublicRouteInput {
  return {
    bio,
    hasClearCta,
    imageUrl,
    isApprovedForPublicListing: true,
    isMostlyDuplicate: false,
    publicName: displayName,
    slug,
    subjects,
    trustSignals,
  };
}

function groupByTutorProfileId<T extends { tutor_profile_id: string }>(rows: T[]) {
  return rows.reduce((groups, row) => {
    const group = groups.get(row.tutor_profile_id) ?? [];
    group.push(row);
    groups.set(row.tutor_profile_id, group);
    return groups;
  }, new Map<string, T[]>());
}

function normalizeHttpsUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeOptionalText(value: string | null) {
  const normalizedValue = value?.trim();

  return normalizedValue || null;
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
