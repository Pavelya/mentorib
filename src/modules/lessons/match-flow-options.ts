import type {
  ReferenceLanguageFlagCode as MatchLanguageFlagCode,
  ReferenceSubjectIconKey as MatchSubjectIconKey,
} from "@/modules/reference/visuals";

export type MatchFlowField =
  | "freeTextNote"
  | "languageCode"
  | "needType"
  | "sessionFrequencyIntent"
  | "subjectSlug"
  | "supportStyle"
  | "timezone"
  | "urgencyLevel";

export type MatchFlowFieldErrors = Partial<Record<MatchFlowField, string>>;

export type MatchFlowFormValues = Record<MatchFlowField, string>;

export type MatchOption = {
  description?: string | null;
  flagCode?: MatchLanguageFlagCode | null;
  iconKey?: MatchSubjectIconKey | null;
  label: string;
  value: string;
};

export type MatchNeedTypeOption = MatchOption & {
  allowedSubjectCodes: readonly string[];
  focusAreaCode: string;
  focusAreaId?: string | null;
};

export type MatchSubjectOption = MatchOption & {
  subjectCode: string;
  subjectId?: string | null;
};

export type MatchLanguageOption = MatchOption;

export type MatchFlowOptionsByField = {
  languageCode: readonly MatchLanguageOption[];
  needType: readonly MatchNeedTypeOption[];
  sessionFrequencyIntent: readonly MatchOption[];
  subjectSlug: readonly MatchSubjectOption[];
  supportStyle: readonly MatchOption[];
  urgencyLevel: readonly MatchOption[];
};

export const emptyMatchFlowValues: MatchFlowFormValues = {
  freeTextNote: "",
  languageCode: "",
  needType: "",
  sessionFrequencyIntent: "",
  subjectSlug: "",
  supportStyle: "",
  timezone: "",
  urgencyLevel: "",
};

type MatchFlowFieldWithOptions = keyof MatchFlowOptionsByField;

export function getMatchOptionLabel(
  field: MatchFlowFieldWithOptions,
  value: string,
  optionsByField: MatchFlowOptionsByField,
) {
  return optionsByField[field].find((option) => option.value === value)?.label ?? value;
}

export function getNeedTypeOption(
  value: string,
  optionsByField: MatchFlowOptionsByField,
) {
  return optionsByField.needType.find((option) => option.value === value) ?? null;
}

export function getSubjectOption(
  value: string,
  optionsByField: MatchFlowOptionsByField,
) {
  return optionsByField.subjectSlug.find((option) => option.value === value) ?? null;
}

export function isKnownMatchOption(
  field: MatchFlowFieldWithOptions,
  value: string,
  optionsByField: MatchFlowOptionsByField,
) {
  return optionsByField[field].some((option) => option.value === value);
}

export function getCompatibleSubjectOptions(
  needTypeValue: string,
  optionsByField: MatchFlowOptionsByField,
) {
  const needType = getNeedTypeOption(needTypeValue, optionsByField);

  if (!needType || needType.allowedSubjectCodes.length === 0) {
    return optionsByField.subjectSlug;
  }

  const allowedSubjectCodes = new Set(needType.allowedSubjectCodes);

  return optionsByField.subjectSlug.filter((subject) =>
    allowedSubjectCodes.has(subject.subjectCode),
  );
}
