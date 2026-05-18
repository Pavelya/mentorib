import type { TutorCredentialReviewActionKey } from "@/modules/tutors/application-review-service";

export const REVIEW_INTENTS = [
  "claim",
  "request_changes",
  "approve",
  "reject",
] as const;
export type ReviewIntent = (typeof REVIEW_INTENTS)[number];

export type TutorApplicationReviewActionState = {
  code: string;
  intent: ReviewIntent;
  message: string | null;
  successMessage: string | null;
};

export const initialReviewActionState: TutorApplicationReviewActionState = {
  code: "idle",
  intent: "claim",
  message: null,
  successMessage: null,
};

export type TutorCredentialReviewActionState = {
  code: string;
  credentialId: string | null;
  intent: TutorCredentialReviewActionKey;
  message: string | null;
  successMessage: string | null;
};

export const initialCredentialReviewActionState: TutorCredentialReviewActionState =
  {
    code: "idle",
    credentialId: null,
    intent: "approve",
    message: null,
    successMessage: null,
  };
