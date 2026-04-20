export type PublicIndexability = {
  blockers: string[];
  isIndexable: boolean;
  isPubliclyValid: boolean;
  isSchemaEligible: boolean;
  isSitemapEligible: boolean;
};

export type TutorProfilePublicRouteInput = {
  bio?: string | null;
  hasClearCta: boolean;
  imageUrl?: string | null;
  isApprovedForPublicListing: boolean;
  isMostlyDuplicate: boolean;
  publicName?: string | null;
  slug: string;
  subjects: string[];
  trustSignals: string[];
};

export function createPendingPublicIndexability(blocker: string): PublicIndexability {
  return {
    blockers: [blocker],
    isIndexable: false,
    isPubliclyValid: true,
    isSchemaEligible: false,
    isSitemapEligible: false,
  };
}

export function createApprovedPublicIndexability(): PublicIndexability {
  return {
    blockers: [],
    isIndexable: true,
    isPubliclyValid: true,
    isSchemaEligible: true,
    isSitemapEligible: true,
  };
}

export function evaluateTutorProfileIndexability(
  profile: TutorProfilePublicRouteInput | null,
): PublicIndexability {
  if (!profile) {
    return createPendingPublicIndexability(
      "Tutor profile data is not connected to the public quality gate yet.",
    );
  }

  const blockers: string[] = [];

  if (!profile.isApprovedForPublicListing) {
    blockers.push("Tutor is not approved for public listing.");
  }

  if (!profile.slug.trim()) {
    blockers.push("Tutor profile is missing a stable public slug.");
  }

  if (!profile.publicName?.trim()) {
    blockers.push("Tutor profile is missing a public display name.");
  }

  if (!profile.imageUrl?.trim()) {
    blockers.push("Tutor profile is missing a public image.");
  }

  if (!profile.bio?.trim()) {
    blockers.push("Tutor profile is missing a meaningful public bio.");
  }

  if (profile.subjects.length === 0) {
    blockers.push("Tutor profile is missing visible subject coverage.");
  }

  if (profile.trustSignals.length === 0) {
    blockers.push("Tutor profile is missing visible trust proof.");
  }

  if (!profile.hasClearCta) {
    blockers.push("Tutor profile is missing a clear next action.");
  }

  if (profile.isMostlyDuplicate) {
    blockers.push("Tutor profile is too duplicative to be indexable.");
  }

  if (blockers.length > 0) {
    return {
      blockers,
      isIndexable: false,
      isPubliclyValid: true,
      isSchemaEligible: false,
      isSitemapEligible: false,
    };
  }

  return createApprovedPublicIndexability();
}
