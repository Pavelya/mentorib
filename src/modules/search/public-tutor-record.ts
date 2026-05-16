import type { FlagCode } from "@/components/ui";
import {
  buildTutorPriceRangeLabel,
  formatHourlyRate,
  formatTrialPrice,
} from "@/modules/pricing/tutor-pricing";
import { normalizeCurrencyCode } from "@/modules/pricing/money";
import type {
  PublicTutorCapabilityDto,
  PublicTutorLanguageDto,
  PublicTutorProfileDto,
  PublicTutorVideoReferenceDto,
} from "@/modules/tutors/public-profile";
import { getReferenceLanguageFlagCode } from "@/modules/reference/visuals";
import type { PublicTutorReviewSummaryDto } from "@/modules/reviews";

// Public-safe projection of a tutor profile suitable for the public browse
// search index. Strictly excludes application answers, contact details,
// internal trust signals, moderation data, and any non-public lifecycle
// state. The shape is also the data contract for the `/tutors` page.
export type PublicTutorSearchRecord = {
  objectID: string;
  slug: string;
  displayName: string;
  headline: string | null;
  bioPreview: string | null;
  subjects: string[];
  subjectSlugs: string[];
  focusAreas: string[];
  focusAreaSlugs: string[];
  languages: string[];
  languageCodes: string[];
  languageFlagCodes: FlagCode[];
  trialPriceMinor: number | null;
  hourlyRateMinor: number | null;
  currencyCode: string;
  trialPriceLabel: string | null;
  hourlyRateLabel: string | null;
  priceRangeLabel: string | null;
  averageRating: number | null;
  reviewCount: number;
  hasFeaturedRating: boolean;
  hasExaminerBadge: boolean;
  hasIntroVideo: boolean;
  acceptingNewStudents: boolean;
  // Cents-based identifier used by Algolia's custom ranking. Cleaner than
  // sorting by `hourlyRateMinor` directly because nulls should rank low.
  rankingHourlyRateMinor: number;
  updatedAt: string;
};

const BIO_PREVIEW_MAX_LENGTH = 280;

type PublicTutorSearchBuilderInput = {
  profile: PublicTutorProfileDto;
};

export function buildPublicTutorSearchRecord(
  input: PublicTutorSearchBuilderInput,
): PublicTutorSearchRecord {
  const { profile } = input;
  const subjects = uniqueSorted(profile.subjects.map((capability) => capability.subject));
  const subjectSlugs = uniqueSorted(
    profile.subjects.map((capability) => capability.subjectSlug),
  );
  const focusAreas = uniqueSorted(profile.subjects.map((capability) => capability.focusArea));
  const focusAreaSlugs = uniqueSorted(
    profile.subjects.map((capability) => capability.focusAreaSlug),
  );
  const languages = uniqueSorted(
    profile.languages.map((language) => language.displayName),
  );
  const languageCodes = uniqueSorted(
    profile.languages.map((language) => language.code),
  );
  const languageFlagCodes = collectLanguageFlagCodes(profile.languages);
  const trialPriceLabel = formatTrialPrice({
    trialPriceMinor: profile.trialPriceMinor,
    hourlyRateMinor: profile.hourlyRateMinor,
    currencyCode: profile.currencyCode,
  });
  const hourlyRateLabel = formatHourlyRate({
    trialPriceMinor: profile.trialPriceMinor,
    hourlyRateMinor: profile.hourlyRateMinor,
    currencyCode: profile.currencyCode,
  });
  const priceRangeLabel = buildTutorPriceRangeLabel({
    trialPriceMinor: profile.trialPriceMinor,
    hourlyRateMinor: profile.hourlyRateMinor,
    currencyCode: profile.currencyCode,
  });
  const rating = profile.reviewSummary.rating;

  return {
    objectID: profile.id,
    slug: profile.slug,
    displayName: profile.displayName,
    headline: profile.headline,
    bioPreview: buildBioPreview(profile.bio),
    subjects,
    subjectSlugs,
    focusAreas,
    focusAreaSlugs,
    languages,
    languageCodes,
    languageFlagCodes,
    trialPriceMinor: profile.trialPriceMinor,
    hourlyRateMinor: profile.hourlyRateMinor,
    currencyCode: normalizeCurrencyCode(profile.currencyCode),
    trialPriceLabel,
    hourlyRateLabel,
    priceRangeLabel,
    averageRating: rating.smoothedRatingValue,
    reviewCount: rating.publishedReviewCount,
    hasFeaturedRating: rating.hasPublicRating,
    hasExaminerBadge: profile.examinerBadges.length > 0,
    hasIntroVideo: hasIntroVideo(profile.introVideo),
    acceptingNewStudents: profile.availability.acceptingNewStudents,
    rankingHourlyRateMinor:
      typeof profile.hourlyRateMinor === "number"
        ? profile.hourlyRateMinor
        : Number.MAX_SAFE_INTEGER,
    updatedAt: profile.updatedAt,
  };
}

// Re-export of the rating threshold input so the builder accepts the same
// review-summary shape used by `getPublicTutorProfileBySlug`.
export type PublicTutorSearchReviewInput = PublicTutorReviewSummaryDto;

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function collectLanguageFlagCodes(
  languages: PublicTutorLanguageDto[],
): FlagCode[] {
  const flags = new Set<FlagCode>();
  for (const language of languages) {
    const flag = getReferenceLanguageFlagCode(language.code);
    if (flag) {
      flags.add(flag);
    }
  }
  return Array.from(flags);
}

function hasIntroVideo(
  introVideo: PublicTutorVideoReferenceDto | null,
): boolean {
  return introVideo !== null;
}

function buildBioPreview(bio: string): string | null {
  const trimmed = bio.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length <= BIO_PREVIEW_MAX_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, BIO_PREVIEW_MAX_LENGTH).trimEnd()}…`;
}

// Re-exported here so call sites that work with capabilities/languages while
// projecting records don't have to reach back into `@/modules/tutors`.
export type { PublicTutorCapabilityDto, PublicTutorLanguageDto };
