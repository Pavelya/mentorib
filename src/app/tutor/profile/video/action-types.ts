export type TutorIntroVideoActionState = {
  code: string | null;
  fieldErrors: Record<string, string[]>;
  message: string | null;
  successMessage: string | null;
};

export const initialTutorIntroVideoActionState: TutorIntroVideoActionState = {
  code: null,
  fieldErrors: {},
  message: null,
  successMessage: null,
};
