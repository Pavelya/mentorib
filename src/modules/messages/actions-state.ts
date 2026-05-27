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

export type ToggleReactionActionState = {
  action: "added" | "removed" | "switched" | null;
  code: string | null;
  message: string | null;
  messageId: string | null;
  reactionKey: string | null;
  submittedAt: number | null;
};

export const initialToggleReactionActionState: ToggleReactionActionState = {
  action: null,
  code: null,
  message: null,
  messageId: null,
  reactionKey: null,
  submittedAt: null,
};

export type ConversationFlagActionState = {
  action: "enabled" | "disabled" | null;
  code: string | null;
  conversationId: string | null;
  flag: "muted" | "archived" | null;
  message: string | null;
  submittedAt: number | null;
};

export const initialConversationFlagActionState: ConversationFlagActionState = {
  action: null,
  code: null,
  conversationId: null,
  flag: null,
  message: null,
  submittedAt: null,
};

export type ReportSubjectKind = "message" | "conversation";

export type ReportSubjectActionState = {
  code: string | null;
  caseId: string | null;
  message: string | null;
  submittedAt: number | null;
  subjectKind: ReportSubjectKind | null;
  subjectId: string | null;
};

export const initialReportSubjectActionState: ReportSubjectActionState = {
  caseId: null,
  code: null,
  message: null,
  submittedAt: null,
  subjectId: null,
  subjectKind: null,
};
