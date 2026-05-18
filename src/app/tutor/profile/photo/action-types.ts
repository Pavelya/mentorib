export type TutorProfilePhotoActionState = {
  code: string | null;
  fieldErrors: Record<string, string[]>;
  message: string | null;
  successMessage: string | null;
};

export const initialTutorProfilePhotoActionState: TutorProfilePhotoActionState = {
  code: null,
  fieldErrors: {},
  message: null,
  successMessage: null,
};
