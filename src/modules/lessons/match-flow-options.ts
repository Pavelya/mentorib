import type {
  MatchLanguageFlagCode,
  MatchSubjectIconKey,
} from "@/modules/lessons/match-flow-visual-config";
import {
  getLanguageFlagCode,
  getSubjectIconKey,
} from "@/modules/lessons/match-flow-visual-config";

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

const subjectDescriptionsByCode: Record<string, string> = {
  biology: "Concepts, data questions, lab work, and revision.",
  business_management: "Case analysis, structure, and exam support.",
  chemistry: "Calculations, data, concepts, and lab support.",
  economics: "Diagrams, explanations, essays, and data response.",
  english_a: "Commentary, oral work, essays, and written analysis.",
  history: "Source work, essays, structure, and revision.",
  mathematics_aa: "Algebra, functions, calculus, and proof-heavy work.",
  mathematics_ai: "Modeling, statistics, interpretation, and real-world math.",
  physics: "Concepts, calculations, and exam-style problems.",
  psychology: "Studies, essays, and structured argument.",
  tok: "Essay, exhibition, claims, and knowledge questions.",
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
    { flagCode: getLanguageFlagCode("en"), label: "English", value: "en" },
    { flagCode: getLanguageFlagCode("pl"), label: "Polish", value: "pl" },
    { flagCode: getLanguageFlagCode("es"), label: "Spanish", value: "es" },
    { flagCode: getLanguageFlagCode("fr"), label: "French", value: "fr" },
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
      description: "You need help understanding a topic or getting unstuck.",
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
      description: "You already have a draft and want clear feedback.",
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
      description: "You want focused help for a test, mock, or final.",
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
      description: "You want help with planning, structure, or written feedback.",
      focusAreaCode: "essay_support",
      label: "Essay help",
      value: "essay_help",
    },
    {
      allowedSubjectCodes: ["tok"],
      description: "You need help with your TOK essay or exhibition.",
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
      description: "You want help choosing a question, planning, or improving a draft.",
      focusAreaCode: "extended_essay",
      label: "Extended essay",
      value: "extended_essay",
    },
    {
      allowedSubjectCodes: ["english_a"],
      description: "You want speaking practice and direct feedback.",
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
    {
      description: subjectDescriptionsByCode.english_a,
      iconKey: getSubjectIconKey("english_a"),
      label: "English A",
      subjectCode: "english_a",
      value: "english-a",
    },
    {
      description: subjectDescriptionsByCode.mathematics_aa,
      iconKey: getSubjectIconKey("mathematics_aa"),
      label: "Mathematics AA",
      subjectCode: "mathematics_aa",
      value: "mathematics-analysis-and-approaches",
    },
    {
      description: subjectDescriptionsByCode.mathematics_ai,
      iconKey: getSubjectIconKey("mathematics_ai"),
      label: "Mathematics AI",
      subjectCode: "mathematics_ai",
      value: "mathematics-applications-and-interpretation",
    },
    {
      description: subjectDescriptionsByCode.biology,
      iconKey: getSubjectIconKey("biology"),
      label: "Biology",
      subjectCode: "biology",
      value: "biology",
    },
    {
      description: subjectDescriptionsByCode.chemistry,
      iconKey: getSubjectIconKey("chemistry"),
      label: "Chemistry",
      subjectCode: "chemistry",
      value: "chemistry",
    },
    {
      description: subjectDescriptionsByCode.physics,
      iconKey: getSubjectIconKey("physics"),
      label: "Physics",
      subjectCode: "physics",
      value: "physics",
    },
    {
      description: subjectDescriptionsByCode.history,
      iconKey: getSubjectIconKey("history"),
      label: "History",
      subjectCode: "history",
      value: "history",
    },
    {
      description: subjectDescriptionsByCode.business_management,
      iconKey: getSubjectIconKey("business_management"),
      label: "Business Management",
      subjectCode: "business_management",
      value: "business-management",
    },
    {
      description: subjectDescriptionsByCode.economics,
      iconKey: getSubjectIconKey("economics"),
      label: "Economics",
      subjectCode: "economics",
      value: "economics",
    },
    {
      description: subjectDescriptionsByCode.psychology,
      iconKey: getSubjectIconKey("psychology"),
      label: "Psychology",
      subjectCode: "psychology",
      value: "psychology",
    },
    {
      description: subjectDescriptionsByCode.tok,
      iconKey: getSubjectIconKey("tok"),
      label: "TOK",
      subjectCode: "tok",
      value: "tok",
    },
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

export function getSubjectDescription(subjectCode: string) {
  return subjectDescriptionsByCode[subjectCode];
}
