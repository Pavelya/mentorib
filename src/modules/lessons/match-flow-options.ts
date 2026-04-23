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
  description: string;
  label: string;
  value: string;
};

type NeedTypeOption = MatchOption & {
  focusAreaCodes: readonly string[];
  focusAreaSlugs: readonly string[];
};

type SubjectOption = MatchOption & {
  subjectCodes: readonly string[];
  subjectSlugs: readonly string[];
};

export const matchNeedTypeOptions = [
  {
    description: "Draft feedback, criteria checks, and clearer next edits.",
    focusAreaCodes: ["ia_feedback", "internal_assessment"],
    focusAreaSlugs: ["ia-feedback", "internal-assessment"],
    label: "IA feedback",
    value: "ia_feedback",
  },
  {
    description: "Knowledge questions, essay structure, and presentation support.",
    focusAreaCodes: ["tok_essay", "tok"],
    focusAreaSlugs: ["tok-essay", "tok"],
    label: "TOK essay",
    value: "tok_essay",
  },
  {
    description: "Oral outline, speaking confidence, and practice feedback.",
    focusAreaCodes: ["io_practice", "oral_practice"],
    focusAreaSlugs: ["io-practice", "oral-practice"],
    label: "IO practice",
    value: "io_practice",
  },
  {
    description: "Research question, timeline, and supervisor-ready milestones.",
    focusAreaCodes: ["ee_planning", "extended_essay"],
    focusAreaSlugs: ["ee-planning", "extended-essay"],
    label: "EE planning",
    value: "ee_planning",
  },
  {
    description: "Fast review for HL papers, weak topics, or final exam strategy.",
    focusAreaCodes: ["exam_rescue", "exam_prep"],
    focusAreaSlugs: ["exam-rescue", "exam-prep"],
    label: "HL exam rescue",
    value: "exam_rescue",
  },
  {
    description: "Steady support, accountability, and less last-minute pressure.",
    focusAreaCodes: ["weekly_support", "ongoing_support"],
    focusAreaSlugs: ["weekly-support", "ongoing-support"],
    label: "Weekly support",
    value: "weekly_support",
  },
] as const satisfies readonly NeedTypeOption[];

export const matchSubjectOptions = [
  {
    description: "Commentary, HL essay, IO, and written analysis.",
    subjectCodes: ["english_a_hl", "english_a"],
    subjectSlugs: ["english-a-hl", "english-a"],
    label: "English A HL",
    value: "english-a-hl",
  },
  {
    description: "Literary analysis, IO structure, and essay confidence.",
    subjectCodes: ["english_a_sl", "english_a"],
    subjectSlugs: ["english-a-sl", "english-a"],
    label: "English A SL",
    value: "english-a-sl",
  },
  {
    description: "Paper 2 planning, IA methods, and topic rescue.",
    subjectCodes: ["biology_hl", "biology"],
    subjectSlugs: ["biology-hl", "biology"],
    label: "Biology HL",
    value: "biology-hl",
  },
  {
    description: "Problem practice, IA modeling, and exam strategy.",
    subjectCodes: ["math_aa_hl", "mathematics_aa", "math_aa"],
    subjectSlugs: ["math-aa-hl", "mathematics-analysis-and-approaches", "math-aa"],
    label: "Math AA HL",
    value: "math-aa-hl",
  },
  {
    description: "Knowledge questions, essay planning, and exhibition polish.",
    subjectCodes: ["tok", "theory_of_knowledge"],
    subjectSlugs: ["tok", "theory-of-knowledge"],
    label: "TOK",
    value: "tok",
  },
  {
    description: "Research question, structure, and milestone planning.",
    subjectCodes: ["extended_essay", "ee"],
    subjectSlugs: ["extended-essay", "ee"],
    label: "Extended essay",
    value: "extended-essay",
  },
  {
    description: "Use this when the exact IB subject is not listed yet.",
    subjectCodes: ["other", "general_ib"],
    subjectSlugs: ["other", "general-ib"],
    label: "Other IB subject",
    value: "other",
  },
] as const satisfies readonly SubjectOption[];

export const matchUrgencyOptions = [
  {
    description: "A deadline or exam is close and you need a clear plan quickly.",
    label: "This week",
    value: "this_week",
  },
  {
    description: "You have a little room, but the next milestone matters.",
    label: "Next two weeks",
    value: "next_two_weeks",
  },
  {
    description: "You want to build momentum without panic.",
    label: "This month",
    value: "this_month",
  },
  {
    description: "You need continuity more than emergency help.",
    label: "Steady support",
    value: "steady",
  },
] as const satisfies readonly MatchOption[];

export const matchFrequencyOptions = [
  {
    description: "One focused session to unblock the next step.",
    label: "One-off help",
    value: "one_off",
  },
  {
    description: "Two or three sessions around a deadline.",
    label: "Short burst",
    value: "short_burst",
  },
  {
    description: "Regular weekly lessons with continuity.",
    label: "Weekly rhythm",
    value: "weekly",
  },
] as const satisfies readonly MatchOption[];

export const matchSupportStyleOptions = [
  {
    description: "A tutor who makes the next few steps feel manageable.",
    label: "Calm structure",
    value: "calm_structure",
  },
  {
    description: "Clear critique on what to change and why.",
    label: "Direct feedback",
    value: "direct_feedback",
  },
  {
    description: "Practice, timing, and strategy for papers or orals.",
    label: "Exam strategy",
    value: "exam_strategy",
  },
  {
    description: "Check-ins, milestones, and steady accountability.",
    label: "Accountability",
    value: "accountability",
  },
] as const satisfies readonly MatchOption[];

export const matchLanguageOptions = [
  { description: "Primary tutoring language.", label: "English", value: "en" },
  { description: "Good for bilingual planning and parent context.", label: "Polish", value: "pl" },
  { description: "Useful for Spanish-speaking students or families.", label: "Spanish", value: "es" },
  { description: "Useful for French-speaking students or families.", label: "French", value: "fr" },
] as const satisfies readonly MatchOption[];

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

const optionListsByField = {
  languageCode: matchLanguageOptions,
  needType: matchNeedTypeOptions,
  sessionFrequencyIntent: matchFrequencyOptions,
  subjectSlug: matchSubjectOptions,
  supportStyle: matchSupportStyleOptions,
  urgencyLevel: matchUrgencyOptions,
} as const;

export function getMatchOptionLabel(field: keyof typeof optionListsByField, value: string) {
  return optionListsByField[field].find((option) => option.value === value)?.label ?? value;
}

export function getNeedTypeOption(value: string) {
  return matchNeedTypeOptions.find((option) => option.value === value) ?? null;
}

export function getSubjectOption(value: string) {
  return matchSubjectOptions.find((option) => option.value === value) ?? null;
}

export function isKnownMatchOption(field: keyof typeof optionListsByField, value: string) {
  return optionListsByField[field].some((option) => option.value === value);
}
