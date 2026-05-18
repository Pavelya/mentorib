import type { Route } from "next";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import {
  evaluateTutorProfileIndexability,
  type TutorProfilePublicRouteInput,
} from "@/lib/seo/quality/public-indexability";
import {
  loadReferenceLanguagesByCodes,
  loadReferenceSubjectFocusAreasByIds,
  loadReferenceSubjectsByIds,
  type ReferenceLanguage,
  type ReferenceSubject,
  type ReferenceSubjectFocusArea,
} from "@/modules/reference/catalog";
import { normalizeCurrencyCode } from "@/modules/pricing/money";
import {
  buildTutorPriceRangeLabel,
  formatHourlyRate,
  formatTrialPrice,
} from "@/modules/pricing/tutor-pricing";
import {
  buildEmptyPublicTutorReviewSummary,
  getPublicTutorReviewSummary,
  type PublicTutorReviewSummaryDto,
} from "@/modules/reviews";
import { loadExaminerBadgesForTutor } from "@/modules/tutors/examiner-credentials";
import type { ExaminerBadge } from "@/modules/tutors/examiner-credentials-builder";
import {
  TUTOR_PUBLIC_MEDIA_BUCKET,
  getTutorPublicMediaPublicUrl,
} from "@/modules/tutors/media-public-assets";

export { TUTOR_PUBLIC_MEDIA_BUCKET };

const PUBLIC_TUTOR_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type PublicTutorProfileRecord = {
  app_user_id: string;
  application_status: string;
  bio: string | null;
  headline: string | null;
  id: string;
  intro_video_external_id: string | null;
  intro_video_provider: string | null;
  intro_video_publication_status: string;
  intro_video_url: string | null;
  pricing_summary: string | null;
  trial_price_minor: number | null;
  hourly_rate_minor: number | null;
  currency_code: string | null;
  profile_visibility_status: string;
  public_listing_status: string;
  public_slug: string | null;
  updated_at: string;
};

type PublicTutorProfileWithName = PublicTutorProfileRecord & {
  display_name: string | null;
};

type TutorSubjectCapabilityRecord = {
  display_priority: number;
  experience_summary: string | null;
  subject_focus_area_id: string;
  subject_id: string;
  tutor_profile_id: string;
};

type TutorLanguageCapabilityRecord = {
  display_priority: number;
  language_code: string;
  tutor_profile_id: string;
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

type PublishedProfilePhotoRecord = {
  storage_object_path: string;
  alt_text: string | null;
};

type PublishedProfilePhoto = {
  alt: string;
  url: string;
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

export type PublicTutorLanguageDto = {
  code: string;
  displayName: string;
};

export type PublicTutorProfileDto = {
  accountAvatarUrl: string | null;
  availability: {
    acceptingNewStudents: boolean;
    summary: string;
    timezone: string | null;
  };
  bio: string;
  bookingHref: Route | null;
  displayName: string;
  examinerBadges: ExaminerBadge[];
  headline: string | null;
  id: string;
  introVideo: PublicTutorVideoReferenceDto | null;
  languages: PublicTutorLanguageDto[];
  pricingSummary: string | null;
  trialPriceMinor: number | null;
  hourlyRateMinor: number | null;
  currencyCode: string;
  trialPriceLabel: string | null;
  hourlyRateLabel: string | null;
  priceRangeLabel: string | null;
  primaryImage: {
    alt: string;
    url: string;
  } | null;
  profilePhoto: {
    alt: string;
    url: string;
  } | null;
  reviewSummary: PublicTutorReviewSummaryDto;
  seo: {
    description: string;
    imageUrl: string | null;
    title: string;
  };
  slug: string;
  subjects: PublicTutorCapabilityDto[];
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
        "app_user_id",
        "public_slug",
        "headline",
        "bio",
        "pricing_summary",
        "trial_price_minor",
        "hourly_rate_minor",
        "currency_code",
        "profile_visibility_status",
        "application_status",
        "public_listing_status",
        "intro_video_provider",
        "intro_video_external_id",
        "intro_video_publication_status",
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

  if (!profile?.public_slug || !profile.bio) {
    return null;
  }

  const accountIdentity = await loadAccountIdentityByAppUserId(profile.app_user_id);

  if (!accountIdentity?.displayName) {
    return null;
  }

  const enrichedProfile: PublicTutorProfileWithName = {
    ...profile,
    display_name: accountIdentity.displayName,
  };

  const [relatedRecords, reviewSummary] = await Promise.all([
    loadPublicTutorProfileRelatedRecords(profile.id),
    getPublicTutorReviewSummary(profile.id),
  ]);

  return buildPublicTutorProfileDto(
    enrichedProfile,
    {
      ...relatedRecords,
      accountAvatarUrl: accountIdentity.avatarUrl,
    },
    reviewSummary,
  );
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
        "app_user_id",
        "public_slug",
        "headline",
        "bio",
        "pricing_summary",
        "trial_price_minor",
        "hourly_rate_minor",
        "currency_code",
        "profile_visibility_status",
        "application_status",
        "public_listing_status",
        "intro_video_provider",
        "intro_video_external_id",
        "intro_video_publication_status",
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
  const appUserIds = uniqueValues(profiles.map((profile) => profile.app_user_id));
  const [capabilitiesByTutorId, credentialsByTutorId, schedulesByTutorId, namesByAppUserId] =
    await Promise.all([
      loadCapabilitiesByTutorIds(profileIds),
      loadCredentialsByTutorIds(profileIds),
      loadSchedulesByTutorIds(profileIds),
      loadDisplayNamesByAppUserIds(appUserIds),
    ]);

  return profiles
    .map((profile): PublicTutorProfileWithName => ({
      ...profile,
      display_name: namesByAppUserId.get(profile.app_user_id) ?? null,
    }))
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
  examinerBadges: ExaminerBadge[];
  languages: TutorLanguageCapabilityRecord[];
  languageRows: ReferenceLanguage[];
  publishedProfilePhoto: PublishedProfilePhoto | null;
  schedule: SchedulePolicyRecord | null;
  subjectCapabilities: TutorSubjectCapabilityRecord[];
  subjectFocusAreas: ReferenceSubjectFocusArea[];
  subjects: ReferenceSubject[];
};

type RelatedPublicTutorProfileRecordsWithIdentity =
  RelatedPublicTutorProfileRecords & {
    accountAvatarUrl: string | null;
  };

async function loadPublicTutorProfileRelatedRecords(
  tutorProfileId: string,
): Promise<RelatedPublicTutorProfileRecords> {
  const supabase = createSupabaseServiceRoleClient();

  const [
    subjectCapabilitiesResult,
    languagesResult,
    credentialsResult,
    scheduleResult,
    publishedPhotoResult,
  ] = await Promise.all([
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
    supabase
      .from("tutor_public_media_assets")
      .select("storage_object_path, alt_text")
      .eq("tutor_profile_id", tutorProfileId)
      .eq("media_role", "profile_photo")
      .eq("publication_status", "published")
      .maybeSingle<PublishedProfilePhotoRecord>(),
  ]);

  if (
    subjectCapabilitiesResult.error ||
    languagesResult.error ||
    credentialsResult.error ||
    scheduleResult.error ||
    publishedPhotoResult.error
  ) {
    throw new Error("Could not load public tutor profile details.");
  }

  const subjectCapabilities = subjectCapabilitiesResult.data ?? [];
  const languageCapabilities = languagesResult.data ?? [];
  const [subjects, subjectFocusAreas, languageRows, examinerBadges] = await Promise.all([
    loadSubjects(subjectCapabilities.map((row) => row.subject_id)),
    loadSubjectFocusAreas(subjectCapabilities.map((row) => row.subject_focus_area_id)),
    loadLanguages(languageCapabilities.map((row) => row.language_code)),
    loadExaminerBadgesForTutor(tutorProfileId),
  ]);

  return {
    credentials: credentialsResult.data ?? [],
    examinerBadges,
    languages: languageCapabilities,
    languageRows,
    publishedProfilePhoto: mapPublishedProfilePhoto(publishedPhotoResult.data ?? null),
    schedule: scheduleResult.data ?? null,
    subjectCapabilities,
    subjectFocusAreas,
    subjects,
  };
}

function mapPublishedProfilePhoto(
  row: PublishedProfilePhotoRecord | null,
): PublishedProfilePhoto | null {
  if (!row?.storage_object_path) {
    return null;
  }

  const altText = row.alt_text?.trim();

  return {
    alt: altText && altText.length > 0 ? altText : "",
    url: getTutorPublicMediaPublicUrl(row.storage_object_path),
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
  try {
    return await loadReferenceSubjectsByIds(subjectIds);
  } catch {
    throw new Error("Could not load public tutor subjects.");
  }
}

async function loadSubjectFocusAreas(focusAreaIds: string[]) {
  try {
    return await loadReferenceSubjectFocusAreasByIds(focusAreaIds);
  } catch {
    throw new Error("Could not load public tutor focus areas.");
  }
}

async function loadLanguages(languageCodes: string[]) {
  try {
    return await loadReferenceLanguagesByCodes(languageCodes);
  } catch {
    throw new Error("Could not load public tutor languages.");
  }
}

function buildPublicTutorProfileDto(
  profile: PublicTutorProfileWithName,
  relatedRecords: RelatedPublicTutorProfileRecordsWithIdentity,
  reviewSummary: PublicTutorReviewSummaryDto = buildEmptyPublicTutorReviewSummary(),
): PublicTutorProfileDto {
  const displayName = profile.display_name?.trim() || "Mentor IB tutor";
  const publishedPhoto = relatedRecords.publishedProfilePhoto;
  const profilePhotoCandidate = publishedPhoto
    ? {
        alt: publishedPhoto.alt || `${displayName} profile photo`,
        url: publishedPhoto.url,
      }
    : null;
  const videoCandidate = buildVideoReference(profile, {
    photoAlt: publishedPhoto?.alt ?? null,
  });
  const isIntroVideoPublished =
    profile.intro_video_publication_status === "published";
  const candidateImageUrl =
    profilePhotoCandidate?.url ??
    (isIntroVideoPublished ? videoCandidate?.thumbnailUrl ?? null : null);
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
  const bookingHref = availability.acceptingNewStudents
    ? (`/book/${profile.public_slug}` as Route)
    : null;

  const indexability = evaluateTutorProfileIndexability(
    buildPublicRouteInput({
      bio: profile.bio,
      displayName,
      hasClearCta: Boolean(bookingHref),
      imageUrl: candidateImageUrl,
      slug: profile.public_slug ?? "",
      subjects: subjects.map((subject) => subject.subject),
      trustSignals: trustProofs.map((proof) => proof.title),
    }),
  );

  const isPublishable = indexability.isIndexable;
  const profilePhoto = isPublishable ? profilePhotoCandidate : null;
  const introVideo =
    isPublishable && isIntroVideoPublished ? videoCandidate : null;
  const primaryImage =
    profilePhoto ??
    (introVideo?.thumbnailUrl
      ? {
          alt: `${displayName} intro video thumbnail`,
          url: introVideo.thumbnailUrl,
        }
      : null);

  return {
    accountAvatarUrl: relatedRecords.accountAvatarUrl,
    availability,
    bio: profile.bio?.trim() ?? "",
    bookingHref,
    displayName,
    examinerBadges: relatedRecords.examinerBadges,
    headline: normalizeOptionalText(profile.headline),
    id: profile.id,
    introVideo,
    languages,
    pricingSummary: normalizeOptionalText(profile.pricing_summary),
    trialPriceMinor:
      typeof profile.trial_price_minor === "number"
        ? profile.trial_price_minor
        : null,
    hourlyRateMinor:
      typeof profile.hourly_rate_minor === "number"
        ? profile.hourly_rate_minor
        : null,
    currencyCode: normalizeCurrencyCode(profile.currency_code),
    trialPriceLabel: formatTrialPrice({
      trialPriceMinor: profile.trial_price_minor,
      currencyCode: profile.currency_code,
    }),
    hourlyRateLabel: formatHourlyRate({
      hourlyRateMinor: profile.hourly_rate_minor,
      currencyCode: profile.currency_code,
    }),
    priceRangeLabel: buildTutorPriceRangeLabel({
      trialPriceMinor: profile.trial_price_minor,
      hourlyRateMinor: profile.hourly_rate_minor,
      currencyCode: profile.currency_code,
    }),
    primaryImage,
    profilePhoto,
    reviewSummary,
    seo: buildSeoSummary({
      bio: profile.bio ?? "",
      displayName,
      headline: profile.headline,
      imageUrl: primaryImage?.url ?? null,
      subjects,
    }),
    slug: profile.public_slug ?? "",
    subjects,
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
        focusArea: focusArea.displayName,
        focusAreaSlug: focusArea.slug,
        subject: subject.displayName,
        subjectSlug: subject.slug,
      };
    })
    .filter((capability): capability is PublicTutorCapabilityDto => Boolean(capability));
}

function buildLanguages({
  languages,
  languageRows,
}: Pick<RelatedPublicTutorProfileRecords, "languages" | "languageRows">): PublicTutorLanguageDto[] {
  const languageRowsByCode = new Map(
    languageRows.map((language) => [language.languageCode, language]),
  );

  return languages
    .map((language) => {
      const row = languageRowsByCode.get(language.language_code);
      if (!row) {
        return null;
      }
      return { code: row.languageCode, displayName: row.displayName };
    })
    .filter((language): language is PublicTutorLanguageDto => Boolean(language));
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
    PublicTutorProfileWithName,
    "display_name" | "intro_video_external_id" | "intro_video_provider" | "intro_video_url"
  >,
  options: { photoAlt?: string | null } = {},
): PublicTutorVideoReferenceDto | null {
  const externalId = profile.intro_video_external_id?.trim();
  const provider = profile.intro_video_provider?.trim();

  if (!externalId || !provider) {
    return null;
  }

  const safeExternalId = encodeURIComponent(externalId);
  const displayName = profile.display_name?.trim() || "Tutor";
  const photoAlt = options.photoAlt?.trim();
  const baseTitle = photoAlt && photoAlt.length > 0 ? photoAlt : null;
  const providerTitle = (label: string) =>
    baseTitle ?? `${displayName} intro video on ${label}`;
  const watchUrl = normalizeHttpsUrl(profile.intro_video_url);

  switch (provider) {
    case "youtube":
      return {
        embedUrl: `https://www.youtube-nocookie.com/embed/${safeExternalId}`,
        provider: "YouTube",
        thumbnailUrl: `https://i.ytimg.com/vi/${safeExternalId}/hqdefault.jpg`,
        title: providerTitle("YouTube"),
        watchUrl: watchUrl ?? `https://www.youtube.com/watch?v=${safeExternalId}`,
      };
    case "vimeo":
      return {
        embedUrl: `https://player.vimeo.com/video/${safeExternalId}`,
        provider: "Vimeo",
        thumbnailUrl: null,
        title: providerTitle("Vimeo"),
        watchUrl: watchUrl ?? `https://vimeo.com/${safeExternalId}`,
      };
    case "loom":
      return {
        embedUrl: `https://www.loom.com/embed/${safeExternalId}`,
        provider: "Loom",
        thumbnailUrl: null,
        title: providerTitle("Loom"),
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

async function loadAccountIdentityByAppUserId(
  appUserId: string,
): Promise<{ avatarUrl: string | null; displayName: string | null } | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("full_name, avatar_url")
    .eq("id", appUserId)
    .maybeSingle<{ avatar_url: string | null; full_name: string | null }>();

  if (error) {
    throw new Error("Could not load tutor account identity.");
  }

  return {
    avatarUrl: normalizeHttpsUrl(data?.avatar_url ?? null),
    displayName: normalizeOptionalText(data?.full_name ?? null),
  };
}

async function loadDisplayNamesByAppUserIds(
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
    throw new Error("Could not load tutor account names.");
  }

  for (const row of data ?? []) {
    const name = normalizeOptionalText(row.full_name);
    if (name) {
      lookup.set(row.id, name);
    }
  }

  return lookup;
}
