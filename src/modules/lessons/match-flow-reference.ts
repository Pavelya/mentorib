import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { LearningNeedOptionGroup } from "@/modules/lessons/constants";

import {
  previewMatchFlowOptions,
  type MatchFlowOptionsByField,
  type MatchLanguageOption,
  type MatchNeedTypeOption,
  type MatchOption,
  type MatchSubjectOption,
} from "./match-flow-options";

type SubjectRecord = {
  display_name: string;
  id: string;
  slug: string;
  sort_order: number;
  subject_code: string;
};

type FocusAreaRecord = {
  display_name: string;
  focus_area_code: string;
  id: string;
  sort_order: number;
};

type LanguageRecord = {
  display_name: string;
  language_code: string;
  sort_order: number;
};

type LearningNeedOptionValueRecord = {
  allowed_subject_codes: string[];
  display_label: string;
  helper_text: string | null;
  option_group: LearningNeedOptionGroup;
  option_key: string;
  sort_order: number;
  subject_focus_area_code: string | null;
};

const EMPTY_OPTION_GROUPS: Record<LearningNeedOptionGroup, LearningNeedOptionValueRecord[]> = {
  need_type: [],
  session_frequency_intent: [],
  support_style: [],
  urgency_level: [],
};

export async function loadMatchFlowOptions(): Promise<MatchFlowOptionsByField> {
  try {
    const supabase = createSupabaseServiceRoleClient();
    const [subjectsResult, focusAreasResult, languagesResult, optionRows] = await Promise.all([
      supabase
        .from("subjects")
        .select("id, subject_code, slug, display_name, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .returns<SubjectRecord[]>(),
      supabase
        .from("subject_focus_areas")
        .select("id, focus_area_code, display_name, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .returns<FocusAreaRecord[]>(),
      supabase
        .from("languages")
        .select("language_code, display_name, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .returns<LanguageRecord[]>(),
      loadLearningNeedOptionRows(),
    ]);

    const subjects = subjectsResult.error
      ? buildPreviewSubjects()
      : buildSubjectOptions(subjectsResult.data ?? []);
    const focusAreas = focusAreasResult.error ? [] : focusAreasResult.data ?? [];
    const languages = languagesResult.error
      ? buildPreviewLanguages()
      : buildLanguageOptions(languagesResult.data ?? []);
    const focusAreaIdsByCode = new Map(
      focusAreas.map((focusArea) => [focusArea.focus_area_code, focusArea.id]),
    );
    const optionGroups = groupLearningNeedOptionRows(optionRows);

    return {
      languageCode: languages.length > 0 ? languages : buildPreviewLanguages(),
      needType: buildNeedTypeOptions({
        focusAreaIdsByCode,
        optionRows: optionGroups.need_type,
      }),
      sessionFrequencyIntent: buildGenericOptions({
        fallback: previewMatchFlowOptions.sessionFrequencyIntent,
        optionRows: optionGroups.session_frequency_intent,
      }),
      subjectSlug: subjects.length > 0 ? subjects : buildPreviewSubjects(),
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

async function loadLearningNeedOptionRows() {
  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("learning_need_option_values")
      .select(
        "option_group, option_key, display_label, helper_text, subject_focus_area_code, allowed_subject_codes, sort_order",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .returns<LearningNeedOptionValueRecord[]>();

    if (error) {
      return [];
    }

    return data ?? [];
  } catch {
    return [];
  }
}

function groupLearningNeedOptionRows(rows: LearningNeedOptionValueRecord[]) {
  return rows.reduce<Record<LearningNeedOptionGroup, LearningNeedOptionValueRecord[]>>(
    (groupedRows, row) => {
      groupedRows[row.option_group].push(row);
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

function buildSubjectOptions(subjects: SubjectRecord[]): MatchSubjectOption[] {
  if (subjects.length === 0) {
    return buildPreviewSubjects();
  }

  return subjects.map((subject) => ({
    label: subject.display_name,
    subjectCode: subject.subject_code,
    subjectId: subject.id,
    value: subject.slug,
  }));
}

function buildLanguageOptions(languages: LanguageRecord[]): MatchLanguageOption[] {
  if (languages.length === 0) {
    return buildPreviewLanguages();
  }

  return languages.map((language) => ({
    label: language.display_name,
    value: language.language_code,
  }));
}

function buildNeedTypeOptions({
  focusAreaIdsByCode,
  optionRows,
}: {
  focusAreaIdsByCode: Map<string, string>;
  optionRows: LearningNeedOptionValueRecord[];
}): MatchNeedTypeOption[] {
  const fallback = previewMatchFlowOptions.needType
    .map((option) => ({
      ...option,
      focusAreaId: focusAreaIdsByCode.get(option.focusAreaCode) ?? null,
    }));

  if (optionRows.length === 0) {
    return fallback;
  }

  const options: MatchNeedTypeOption[] = [];

  for (const optionRow of optionRows) {
    const focusAreaCode = optionRow.subject_focus_area_code;

    if (!focusAreaCode) {
      continue;
    }

    const focusAreaId = focusAreaIdsByCode.get(focusAreaCode);

    if (!focusAreaId) {
      continue;
    }

    options.push({
      allowedSubjectCodes: [...optionRow.allowed_subject_codes],
      description: optionRow.helper_text,
      focusAreaCode,
      focusAreaId,
      label: optionRow.display_label,
      value: optionRow.option_key,
    });
  }

  return options.length > 0 ? options : fallback;
}

function buildGenericOptions({
  fallback,
  optionRows,
}: {
  fallback: readonly MatchOption[];
  optionRows: LearningNeedOptionValueRecord[];
}) {
  if (optionRows.length === 0) {
    return [...fallback];
  }

  return optionRows.map((optionRow) => ({
    description: optionRow.helper_text,
    label: optionRow.display_label,
    value: optionRow.option_key,
  }));
}

function buildPreviewLanguages() {
  return [...previewMatchFlowOptions.languageCode];
}

function buildPreviewSubjects() {
  return [...previewMatchFlowOptions.subjectSlug];
}
