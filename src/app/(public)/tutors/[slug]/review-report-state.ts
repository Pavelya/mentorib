// Non-action exports for the report-a-review Server Action. A "use server"
// file may only export async functions, so the state shape + initial value
// live here and are imported by both the action and the client control.

export type ReportReviewActionState = {
  code: string | null;
  message: string | null;
  submittedAt: number | null;
};

export const initialReportReviewActionState: ReportReviewActionState = {
  code: null,
  message: null,
  submittedAt: null,
};
