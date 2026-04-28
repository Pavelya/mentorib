export type SendMessageActionState = {
  code: string | null;
  fieldErrors: Partial<Record<"body", string>>;
  message: string | null;
  submittedAt: number | null;
};

export const initialSendMessageActionState: SendMessageActionState = {
  code: null,
  fieldErrors: {},
  message: null,
  submittedAt: null,
};
