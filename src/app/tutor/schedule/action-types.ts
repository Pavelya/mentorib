import {
  emptyMeetingPreferenceFormValues,
  emptySchedulePolicyFormValues,
  type AvailabilityRuleFieldErrors,
  type AvailabilityRuleFormValues,
  type MeetingPreferenceFieldErrors,
  type MeetingPreferenceFormValues,
  type SchedulePolicyFieldErrors,
  type SchedulePolicyFormValues,
} from "@/modules/tutors/tutor-schedule";

export type SchedulePolicyActionState = {
  code: string | null;
  fieldErrors: SchedulePolicyFieldErrors;
  message: string | null;
  values: SchedulePolicyFormValues;
};

export type AvailabilityRuleActionState = {
  code: string | null;
  fieldErrors: AvailabilityRuleFieldErrors;
  message: string | null;
  values: AvailabilityRuleFormValues;
};

export type MeetingPreferenceActionState = {
  code: string | null;
  fieldErrors: MeetingPreferenceFieldErrors;
  message: string | null;
  values: MeetingPreferenceFormValues;
};

export type ReplaceAvailabilityRulesActionState = {
  code: string | null;
  message: string | null;
};

export const initialReplaceAvailabilityRulesState: ReplaceAvailabilityRulesActionState =
  {
    code: null,
    message: null,
  };

export const emptyAvailabilityRuleValues: AvailabilityRuleFormValues = {
  dayOfWeek: "",
  endLocalTime: "",
  startLocalTime: "",
};

export const initialSchedulePolicyState: SchedulePolicyActionState = {
  code: null,
  fieldErrors: {},
  message: null,
  values: emptySchedulePolicyFormValues,
};

export const initialAvailabilityRuleState: AvailabilityRuleActionState = {
  code: null,
  fieldErrors: {},
  message: null,
  values: emptyAvailabilityRuleValues,
};

export const initialMeetingPreferenceState: MeetingPreferenceActionState = {
  code: null,
  fieldErrors: {},
  message: null,
  values: emptyMeetingPreferenceFormValues,
};
