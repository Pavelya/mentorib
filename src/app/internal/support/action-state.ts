// Non-action exports for the support-ticket Server Actions. A "use server"
// file may only export async functions, so the shared state shape + initial
// value live here and are imported by both the actions and the client forms.

export type SupportActionState = {
  code: string | null;
  message: string | null;
  successMessage: string | null;
};

export const initialSupportActionState: SupportActionState = {
  code: null,
  message: null,
  successMessage: null,
};
