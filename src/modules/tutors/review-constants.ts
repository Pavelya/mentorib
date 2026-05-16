export const tutorApplicationReviewStatuses = [
  "queued",
  "under_review",
  "changes_requested",
  "approved",
  "rejected",
] as const;

export type TutorApplicationReviewStatus =
  (typeof tutorApplicationReviewStatuses)[number];

export const TUTOR_APPLICATION_REVIEW_ACTIVE_STATUSES: readonly TutorApplicationReviewStatus[] =
  ["queued", "under_review"];

export const TUTOR_APPLICATION_REVIEW_TERMINAL_STATUSES: readonly TutorApplicationReviewStatus[] =
  ["approved", "rejected"];

export const TUTOR_APPLICATION_REVIEW_APPLICANT_VISIBLE_STATUSES: readonly TutorApplicationReviewStatus[] =
  ["changes_requested", "approved", "rejected"];
