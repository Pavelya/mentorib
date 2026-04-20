export const tutorProfileVisibilityStatuses = [
  "draft",
  "private_preview",
  "public_visible",
  "hidden",
] as const;

export type TutorProfileVisibilityStatus =
  (typeof tutorProfileVisibilityStatuses)[number];

export const tutorApplicationStatuses = [
  "not_started",
  "in_progress",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "rejected",
  "withdrawn",
] as const;

export type TutorApplicationStatus = (typeof tutorApplicationStatuses)[number];

export const tutorPublicListingStatuses = [
  "not_listed",
  "eligible",
  "listed",
  "paused",
  "delisted",
] as const;

export type TutorPublicListingStatus =
  (typeof tutorPublicListingStatuses)[number];

export const payoutReadinessStatuses = [
  "not_started",
  "pending_verification",
  "enabled",
  "restricted",
] as const;

export type PayoutReadinessStatus = (typeof payoutReadinessStatuses)[number];

export const tutorCredentialReviewStatuses = [
  "uploaded",
  "pending_review",
  "approved",
  "rejected",
  "expired",
] as const;

export type TutorCredentialReviewStatus =
  (typeof tutorCredentialReviewStatuses)[number];

export const availabilityRuleVisibilityStatuses = [
  "active",
  "hidden",
  "disabled",
] as const;

export type AvailabilityRuleVisibilityStatus =
  (typeof availabilityRuleVisibilityStatuses)[number];

export const availabilityOverrideTypes = [
  "open_extra",
  "blocked",
  "edited_window",
] as const;

export type AvailabilityOverrideType = (typeof availabilityOverrideTypes)[number];
