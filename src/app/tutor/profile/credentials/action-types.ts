export type TutorCredentialActionState = {
  code: string | null;
  fieldErrors: Record<string, string[]>;
  message: string | null;
  successMessage: string | null;
};

export const initialTutorCredentialActionState: TutorCredentialActionState = {
  code: null,
  fieldErrors: {},
  message: null,
  successMessage: null,
};
