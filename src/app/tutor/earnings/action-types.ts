export type StartPayoutOnboardingFieldErrors = {
  country?: string;
};

export type StartPayoutOnboardingState = {
  code: string | null;
  fieldErrors: StartPayoutOnboardingFieldErrors;
  message: string | null;
  values: { country: string };
};

export const initialStartPayoutOnboardingState: StartPayoutOnboardingState = {
  code: null,
  fieldErrors: {},
  message: null,
  values: { country: "" },
};

export type ResumePayoutOnboardingState = {
  code: string | null;
  message: string | null;
};

export const initialResumePayoutOnboardingState: ResumePayoutOnboardingState = {
  code: null,
  message: null,
};
