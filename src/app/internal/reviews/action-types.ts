// Non-action exports for the review-moderation Server Action. A "use server"
// file may only export async functions, so the state shape + initial value
// live here and are imported by both the action and the client form.

export type ReviewModerationActionState = {
  code: string | null;
  message: string | null;
  reviewId: string | null;
  successMessage: string | null;
};

export const initialReviewModerationActionState: ReviewModerationActionState = {
  code: null,
  message: null,
  reviewId: null,
  successMessage: null,
};
