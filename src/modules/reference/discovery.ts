import type { LearningNeedOptionGroup } from "@/modules/lessons/constants";
import {
  getSubjectDescription,
  previewMatchFlowOptions,
  type MatchFlowOptionsByField,
  type MatchLanguageOption,
  type MatchNeedTypeOption,
  type MatchOption,
  type MatchSubjectOption,
} from "@/modules/lessons/match-flow-options";

import {
  loadActiveReferenceLanguages,
  loadActiveReferenceLearningNeedOptionValues,
  loadActiveReferenceSubjectFocusAreas,
  loadActiveReferenceSubjects,
  type ReferenceLanguage,
  type ReferenceLearningNeedOptionValue,
  type ReferenceSubject,
} from "./catalog";
import {
  getReferenceLanguageFlagCode,
  getReferenceSubjectIconKey,
} from "./visuals";

export type DiscoveryOptionsByField = MatchFlowOptionsByField;

const EMPTY_OPTION_GROUPS: Record<LearningNeedOptionGroup, ReferenceLearningNeedOptionValue[]> =
  {
    need_type: [],
    session_frequency_intent: [],
    support_style: [],
    urgency_level: [],
  };

export async function loadDiscoveryOptions(): Promise<DiscoveryOptionsByField> {
  try {
    const [subjects, focusAreas, languages, optionRows] = await Promise.all([
      loadActiveReferenceSubjects(),
      loadActiveReferenceSubjectFocusAreas(),
      loadActiveReferenceLanguages(),
      loadActiveReferenceLearningNeedOptionValues(),
    ]);
    const focusAreaIdsByCode = new Map(
      focusAreas.map((focusArea) => [focusArea.focusAreaCode, focusArea.id]),
    );
    const optionGroups = groupLearningNeedOptionRows(optionRows);

    return {
      languageCode:
        languages.length > 0 ? buildLanguageOptions(languages) : buildPreviewLanguages(),
      needType: buildNeedTypeOptions({
        focusAreaIdsByCode,
        optionRows: optionGroups.need_type,
      }),
      sessionFrequencyIntent: buildGenericOptions({
        fallback: previewMatchFlowOptions.sessionFrequencyIntent,
        optionRows: optionGroups.session_frequency_intent,
      }),
      subjectSlug:
        subjects.length > 0 ? buildSubjectOptions(subjects) : buildPreviewSubjects(),
      supportStyle: buildGenericOptions({
        fallback: previewMatchFlowOptions.supportStyle,
        optionRows: optionGroups.support_style,
      }),
      urgencyLevel: buildGenericOptions({
        fallback: previewMatchFlowOptions.urgencyLevel,
        optionRows: optionGroups.urgency_level,
      }),
    };
  } catch {
    return previewMatchFlowOptions;
  }
}

function groupLearningNeedOptionRows(rows: ReferenceLearningNeedOptionValue[]) {
  return rows.reduce<Record<LearningNeedOptionGroup, ReferenceLearningNeedOptionValue[]>>(
    (groupedRows, row) => {
      groupedRows[row.optionGroup].push(row);
      return groupedRows;
    },
    {
      ...EMPTY_OPTION_GROUPS,
      need_type: [],
      session_frequency_intent: [],
      support_style: [],
      urgency_level: [],
    },
  );
}

function buildSubjectOptions(subjects: ReferenceSubject[]): MatchSubjectOption[] {
  return subjects.map((subject) => ({
    description: getSubjectDescription(subject.subjectCode),
    iconKey: getReferenceSubjectIconKey(subject.subjectCode),
    label: subject.displayName,
    subjectCode: subject.subjectCode,
    subjectId: subject.id,
    value: subject.slug,
  }));
}

function buildLanguageOptions(languages: ReferenceLanguage[]): MatchLanguageOption[] {
  return languages.map((language) => ({
    flagCode: getReferenceLanguageFlagCode(language.languageCode),
    label: language.displayName,
    value: language.languageCode,
  }));
}

function buildNeedTypeOptions({
  focusAreaIdsByCode,
  optionRows,
}: {
  focusAreaIdsByCode: Map<string, string>;
  optionRows: ReferenceLearningNeedOptionValue[];
}): MatchNeedTypeOption[] {
  const fallback = previewMatchFlowOptions.needType.map((option) => ({
    ...option,
    focusAreaId: focusAreaIdsByCode.get(option.focusAreaCode) ?? null,
  }));

  if (optionRows.length === 0) {
    return fallback;
  }

  const options: MatchNeedTypeOption[] = [];

  for (const optionRow of optionRows) {
    const focusAreaCode = optionRow.subjectFocusAreaCode;

    if (!focusAreaCode) {
      continue;
    }

    const focusAreaId = focusAreaIdsByCode.get(focusAreaCode);

    if (!focusAreaId) {
      continue;
    }

    options.push({
      allowedSubjectCodes: [...optionRow.allowedSubjectCodes],
      description: optionRow.helperText,
      focusAreaCode,
      focusAreaId,
      label: optionRow.displayLabel,
      value: optionRow.optionKey,
    });
  }

  return options.length > 0 ? options : fallback;
}

function buildGenericOptions({
  fallback,
  optionRows,
}: {
  fallback: readonly MatchOption[];
  optionRows: ReferenceLearningNeedOptionValue[];
}) {
  if (optionRows.length === 0) {
    return [...fallback];
  }

  return optionRows.map((optionRow) => ({
    description: optionRow.helperText,
    label: optionRow.displayLabel,
    value: optionRow.optionKey,
  }));
}

function buildPreviewLanguages() {
  return [...previewMatchFlowOptions.languageCode];
}

function buildPreviewSubjects() {
  return [...previewMatchFlowOptions.subjectSlug];
}
