import type { LearningNeedOptionGroup } from "@/modules/lessons/constants";
import type {
  MatchFlowOptionsByField,
  MatchLanguageOption,
  MatchNeedTypeOption,
  MatchOption,
  MatchSubjectOption,
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
    languageCode: buildLanguageOptions(languages),
    needType: buildNeedTypeOptions({
      focusAreaIdsByCode,
      optionRows: optionGroups.need_type,
    }),
    sessionFrequencyIntent: buildGenericOptions(optionGroups.session_frequency_intent),
    subjectSlug: buildSubjectOptions(subjects),
    supportStyle: buildGenericOptions(optionGroups.support_style),
    urgencyLevel: buildGenericOptions(optionGroups.urgency_level),
  };
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
    description: subject.displayDescription,
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

  return options;
}

function buildGenericOptions(
  optionRows: ReferenceLearningNeedOptionValue[],
): MatchOption[] {
  return optionRows.map((optionRow) => ({
    description: optionRow.helperText,
    label: optionRow.displayLabel,
    value: optionRow.optionKey,
  }));
}
