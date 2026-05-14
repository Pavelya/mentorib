// Lesson-linked tutor review constants for the rating-and-review-trust system.
//
// The locked decisions from `docs/architecture/rating-and-review-trust-architecture-v1.md`
// (sections 9, 11, 15) live here so the database trigger math, the public
// rating loader, and the public profile presentation share one source of
// truth. Any change to these thresholds must also update the matching SQL
// defaults in `supabase/migrations/20260514140000_lesson_review_trust_baseline.sql`.

export const reviewStatuses = [
  "submitted",
  "under_review",
  "published",
  "hidden",
  "rejected",
] as const;

export type ReviewStatus = (typeof reviewStatuses)[number];

export const REVIEW_MIN_RATING = 1 as const;
export const REVIEW_MAX_RATING = 5 as const;
export const REVIEW_COMMENT_MAX_LENGTH = 1000 as const;

// Smoothing prior locked in section 11.3 of the trust architecture.
export const REVIEW_PRIOR_REVIEW_COUNT = 5 as const;
export const REVIEW_PRIOR_RATING_VALUE = 4.5 as const;

// Public-display threshold locked in section 11.4 of the trust architecture.
// Below this published count, the public surface avoids foregrounding a star
// rating and uses new-tutor framing instead.
export const REVIEW_PUBLIC_RATING_THRESHOLD = 3 as const;

export const REVIEW_LIST_PUBLIC_DEFAULT_LIMIT = 6 as const;
