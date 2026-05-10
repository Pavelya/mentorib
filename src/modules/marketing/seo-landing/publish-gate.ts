// Publish-gate thresholds for the SEO landing pages introduced in
// `P15-SEO-001`. Pages that fail the gate render `notFound()` at request time
// and are excluded from the sitemap.
//
// Combo pages set N higher than single-axis pages because the curated
// combination must clear a stricter "real-world demand" bar before being
// promoted to a public route.

export const SEO_SUBJECT_PAGE_MIN_TUTORS = 2;
export const SEO_SERVICE_PAGE_MIN_TUTORS = 2;
export const SEO_COMBO_PAGE_MIN_TUTORS = 3;

export type SeoLandingScopeKind = "subject" | "service" | "combo";

export function getSeoLandingMinimumTutors(scope: SeoLandingScopeKind) {
  switch (scope) {
    case "subject":
      return SEO_SUBJECT_PAGE_MIN_TUTORS;
    case "service":
      return SEO_SERVICE_PAGE_MIN_TUTORS;
    case "combo":
      return SEO_COMBO_PAGE_MIN_TUTORS;
  }
}

export type SeoLandingGateInput = {
  acceptingTutorCount: number;
  hasAuthoredCopy: boolean;
  scope: SeoLandingScopeKind;
};

export type SeoLandingGateResult = {
  blockers: readonly string[];
  isPublishable: boolean;
};

export function evaluateSeoLandingGate(
  input: SeoLandingGateInput,
): SeoLandingGateResult {
  const blockers: string[] = [];

  if (!input.hasAuthoredCopy) {
    blockers.push("authored content missing");
  }

  const minimum = getSeoLandingMinimumTutors(input.scope);
  if (input.acceptingTutorCount < minimum) {
    blockers.push(
      `tutor coverage below threshold (${input.acceptingTutorCount}/${minimum})`,
    );
  }

  return {
    blockers,
    isPublishable: blockers.length === 0,
  };
}
