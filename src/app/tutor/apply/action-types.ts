import {
  emptyTutorApplicationDraft,
  type TutorApplicationDraftInput,
  type TutorApplicationFieldErrors,
} from "@/modules/tutors/application";

export type TutorApplicationActionIntent = "save" | "submit" | "withdraw";

export type TutorApplicationActionState = {
  code: string | null;
  fieldErrors: TutorApplicationFieldErrors;
  intent: TutorApplicationActionIntent | null;
  message: string | null;
  successMessage: string | null;
  values: TutorApplicationDraftInput;
};

export const initialTutorApplicationActionState: TutorApplicationActionState = {
  code: null,
  fieldErrors: {},
  intent: null,
  message: null,
  successMessage: null,
  values: emptyTutorApplicationDraft,
};
