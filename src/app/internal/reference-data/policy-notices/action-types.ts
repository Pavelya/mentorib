export type PolicyNoticeActionState = {
  code: string | null;
  intent: "draft" | "publish" | "revoke" | null;
  message: string | null;
  successMessage: string | null;
};

export const initialPolicyNoticeActionState: PolicyNoticeActionState = {
  code: null,
  intent: null,
  message: null,
  successMessage: null,
};
