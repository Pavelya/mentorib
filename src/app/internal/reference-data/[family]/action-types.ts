export type ReferenceEditActionState = {
  code: string | null;
  family: string | null;
  id: string | null;
  message: string | null;
  successMessage: string | null;
};

export const initialReferenceEditActionState: ReferenceEditActionState = {
  code: null,
  family: null,
  id: null,
  message: null,
  successMessage: null,
};
