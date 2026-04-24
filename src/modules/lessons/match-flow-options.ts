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

export const previewMatchFlowOptions = {
  languageCode: [
    { description: "Primary tutoring language.", label: "English", value: "en" },
    { description: "Good for bilingual planning and parent context.", label: "Polish", value: "pl" },
    { description: "Useful for Spanish-speaking students or families.", label: "Spanish", value: "es" },
    { description: "Useful for French-speaking students or families.", label: "French", value: "fr" },
  ],
  needType: [
    {
      allowedSubjectCodes: [
        "english_a",
        "mathematics_aa",
        "mathematics_ai",
        "biology",
        "chemistry",
        "physics",
        "history",
        "business_management",
        "economics",
        "psychology",
        "tok",
      ],
      description: "You need a concept explained, practice on a topic, or help getting unstuck.",
      focusAreaCode: "topic_support",
      label: "Topic help",
      value: "topic_help",
    },
    {
      allowedSubjectCodes: [
        "mathematics_aa",
        "mathematics_ai",
        "biology",
        "chemistry",
        "physics",
        "history",
        "business_management",
        "economics",
        "psychology",
      ],
      description: "You already have work in progress and want clear, focused feedback.",
      focusAreaCode: "ia_feedback",
      label: "IA feedback",
      value: "ia_feedback",
    },
    {
      allowedSubjectCodes: [
        "english_a",
        "mathematics_aa",
        "mathematics_ai",
        "biology",
        "chemistry",
        "physics",
        "history",
        "business_management",
        "economics",
        "psychology",
      ],
      description: "You want targeted help before a test, mock, or final exam.",
      focusAreaCode: "exam_prep",
      label: "Exam prep",
      value: "exam_prep",
    },
    {
      allowedSubjectCodes: [
        "english_a",
        "history",
        "business_management",
        "economics",
        "psychology",
      ],
      description: "You want support with structure, argument, drafting, or written feedback.",
      focusAreaCode: "essay_support",
      label: "Essay help",
      value: "essay_help",
    },
    {
      allowedSubjectCodes: ["tok"],
      description: "You need help with your TOK essay or exhibition thinking.",
      focusAreaCode: "tok_essay",
      label: "TOK essay",
      value: "tok_essay",
    },
    {
      allowedSubjectCodes: [
        "english_a",
        "mathematics_aa",
        "mathematics_ai",
        "biology",
        "chemistry",
        "physics",
        "history",
        "business_management",
        "economics",
        "psychology",
      ],
      description: "You need help choosing a question, planning structure, or improving a draft.",
      focusAreaCode: "extended_essay",
      label: "Extended essay",
      value: "extended_essay",
    },
    {
      allowedSubjectCodes: ["english_a"],
      description: "You want speaking practice, timing help, and direct oral feedback.",
      focusAreaCode: "oral_practice",
      label: "Oral practice",
      value: "oral_practice",
    },
  ],
  sessionFrequencyIntent: [
    {
      description: "Start with one focused session and decide after that.",
      label: "One lesson first",
      value: "one_off",
    },
    {
      description: "A short run of lessons around a deadline or assessment.",
      label: "2-3 lessons",
      value: "short_burst",
    },
    {
      description: "Regular lessons with continuity and accountability.",
      label: "Weekly",
      value: "weekly",
    },
    {
      description: "You want to find the right tutor first and decide the rhythm later.",
      label: "Not sure yet",
      value: "not_sure",
    },
  ],
  subjectSlug: [
    { label: "English A", subjectCode: "english_a", value: "english-a" },
    {
      label: "Mathematics AA",
      subjectCode: "mathematics_aa",
      value: "mathematics-analysis-and-approaches",
    },
    {
      label: "Mathematics AI",
      subjectCode: "mathematics_ai",
      value: "mathematics-applications-and-interpretation",
    },
    { label: "Biology", subjectCode: "biology", value: "biology" },
    { label: "Chemistry", subjectCode: "chemistry", value: "chemistry" },
    { label: "Physics", subjectCode: "physics", value: "physics" },
    { label: "History", subjectCode: "history", value: "history" },
    {
      label: "Business Management",
      subjectCode: "business_management",
      value: "business-management",
    },
    { label: "Economics", subjectCode: "economics", value: "economics" },
    { label: "Psychology", subjectCode: "psychology", value: "psychology" },
    { label: "TOK", subjectCode: "tok", value: "tok" },
  ],
  supportStyle: [
    {
      description: "You want ideas broken down simply before moving into practice.",
      label: "Clear explanations",
      value: "clear_explanations",
    },
    {
      description: "You want clear critique on what to change and why.",
      label: "Direct feedback",
      value: "direct_feedback",
    },
    {
      description: "You want a tutor who makes the next steps feel manageable.",
      label: "Calm structure",
      value: "calm_structure",
    },
    {
      description: "You want timing, exam technique, and smart question approach.",
      label: "Exam strategy",
      value: "exam_strategy",
    },
    {
      description: "You want check-ins, milestones, and momentum between lessons.",
      label: "Accountability",
      value: "accountability",
    },
  ],
  urgencyLevel: [
    {
      description: "A deadline or exam is close and you need help soon.",
      label: "This week",
      value: "this_week",
    },
    {
      description: "You have a little room, but the next milestone matters.",
      label: "Next 2 weeks",
      value: "next_two_weeks",
    },
    {
      description: "You want to build momentum without last-minute panic.",
      label: "This month",
      value: "this_month",
    },
    {
      description: "You are planning ahead and want the right fit more than speed.",
      label: "Flexible",
      value: "flexible",
    },
  ],
} as const satisfies MatchFlowOptionsByField;

type MatchFlowFieldWithOptions = keyof MatchFlowOptionsByField;

export function getMatchOptionLabel(
  field: MatchFlowFieldWithOptions,
  value: string,
  optionsByField: MatchFlowOptionsByField = previewMatchFlowOptions,
) {
  return optionsByField[field].find((option) => option.value === value)?.label ?? value;
}

export function getNeedTypeOption(
  value: string,
  optionsByField: MatchFlowOptionsByField = previewMatchFlowOptions,
) {
  return optionsByField.needType.find((option) => option.value === value) ?? null;
}

export function getSubjectOption(
  value: string,
  optionsByField: MatchFlowOptionsByField = previewMatchFlowOptions,
) {
  return optionsByField.subjectSlug.find((option) => option.value === value) ?? null;
}

export function isKnownMatchOption(
  field: MatchFlowFieldWithOptions,
  value: string,
  optionsByField: MatchFlowOptionsByField = previewMatchFlowOptions,
) {
  return optionsByField[field].some((option) => option.value === value);
}

export function getCompatibleSubjectOptions(
  needTypeValue: string,
  optionsByField: MatchFlowOptionsByField = previewMatchFlowOptions,
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
