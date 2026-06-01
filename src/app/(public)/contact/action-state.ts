// Non-action exports for the contact-us Server Action. A "use server" file may
// only export async functions, so the state shape + initial value live here.

export type ContactFormState = {
  code: string | null;
  message: string | null;
  // Bumped on every submission so the client can react even when the same
  // error repeats.
  submittedAt: number | null;
};

export const initialContactFormState: ContactFormState = {
  code: null,
  message: null,
  submittedAt: null,
};
