// Pure ranking logic for the curated tutor list rendered on every SEO landing
// page introduced in `P15-SEO-001`. The existing `mvp-ranking-v1` ranker
// requires a learning-need wizard payload and is unusable on an anonymous SEO
// surface, so we use a small deterministic public ordering that depends only
// on signals already in the schema.
//
// Inputs (all already collected by the repository before scoring):
//   - matchingCapabilityCount: how many `tutor_subject_capabilities` rows match
//     the page scope (subject and/or focus area).
//   - bestDisplayPriority: the lowest `display_priority` the tutor uses across
//     the matching capabilities (smaller = stronger).
//   - hasExaminerCredentialForScope: whether the tutor has an approved
//     examiner credential for the page's subject or focus area.
//   - publicListingUpdatedAt: the most-recent timestamp at which the tutor's
//     public listing or profile was approved or updated.
//   - createdAt: tie-breaker only — earlier rows win to keep ordering stable.

export type SeoCuratedTutorScoreInput = {
  bestDisplayPriority: number;
  createdAt: string;
  hasExaminerCredentialForScope: boolean;
  matchingCapabilityCount: number;
  publicListingUpdatedAt: string;
  tutorProfileId: string;
};

export const SEO_CURATED_LIST_MAX_VISIBLE = 3;

function compareSeoCuratedTutors(
  left: SeoCuratedTutorScoreInput,
  right: SeoCuratedTutorScoreInput,
): number {
  if (left.hasExaminerCredentialForScope !== right.hasExaminerCredentialForScope) {
    return left.hasExaminerCredentialForScope ? -1 : 1;
  }

  if (left.bestDisplayPriority !== right.bestDisplayPriority) {
    return left.bestDisplayPriority - right.bestDisplayPriority;
  }

  if (left.matchingCapabilityCount !== right.matchingCapabilityCount) {
    return right.matchingCapabilityCount - left.matchingCapabilityCount;
  }

  const leftListed = Date.parse(left.publicListingUpdatedAt) || 0;
  const rightListed = Date.parse(right.publicListingUpdatedAt) || 0;
  if (leftListed !== rightListed) {
    return rightListed - leftListed;
  }

  const leftCreated = Date.parse(left.createdAt) || 0;
  const rightCreated = Date.parse(right.createdAt) || 0;
  if (leftCreated !== rightCreated) {
    return leftCreated - rightCreated;
  }

  return left.tutorProfileId.localeCompare(right.tutorProfileId);
}

export function rankSeoCuratedTutors(
  candidates: readonly SeoCuratedTutorScoreInput[],
): SeoCuratedTutorScoreInput[] {
  return [...candidates].sort(compareSeoCuratedTutors);
}

export function selectSeoCuratedTutorsForDisplay(
  candidates: readonly SeoCuratedTutorScoreInput[],
  visibleLimit: number = SEO_CURATED_LIST_MAX_VISIBLE,
): SeoCuratedTutorScoreInput[] {
  return rankSeoCuratedTutors(candidates).slice(0, visibleLimit);
}
