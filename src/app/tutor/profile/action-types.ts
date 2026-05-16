import {
  emptyTutorApplicationDraft,
  type TutorApplicationDraftInput,
  type TutorApplicationFieldErrors,
  type TutorApplicationReadinessGate,
} from "@/modules/tutors/application";

export type TutorProfileUpdateActionState = {
  code: string | null;
  fieldErrors: TutorApplicationFieldErrors;
  message: string | null;
  successMessage: string | null;
  values: TutorApplicationDraftInput;
};

export const initialTutorProfileUpdateActionState: TutorProfileUpdateActionState =
  {
    code: null,
    fieldErrors: {},
    message: null,
    successMessage: null,
    values: emptyTutorApplicationDraft,
  };

export type TutorProfilePublicationActionState = {
  code: string | null;
  message: string | null;
  missingGateKeys: TutorApplicationReadinessGate["key"][];
  successMessage: string | null;
};

export const initialTutorProfilePublicationActionState: TutorProfilePublicationActionState =
  {
    code: null,
    message: null,
    missingGateKeys: [],
    successMessage: null,
  };
