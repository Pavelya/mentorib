import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { LearningNeedOptionGroup } from "@/modules/lessons/constants";

type SubjectRow = {
  display_description: string | null;
  display_name: string;
  id: string;
  slug: string;
  sort_order: number;
  subject_code: string;
};

type SubjectFocusAreaRow = {
  display_name: string;
  focus_area_code: string;
  id: string;
  slug: string;
  sort_order: number;
};

type LanguageRow = {
  display_name: string;
  language_code: string;
  sort_order: number;
};

type LearningNeedOptionValueRow = {
  allowed_subject_codes: string[];
  display_label: string;
  helper_text: string | null;
  option_group: LearningNeedOptionGroup;
  option_key: string;
  sort_order: number;
  subject_focus_area_code: string | null;
};

export type ReferenceSubject = {
  displayDescription: string | null;
  displayName: string;
  id: string;
  slug: string;
  sortOrder: number;
  subjectCode: string;
};

export type ReferenceSubjectFocusArea = {
  displayName: string;
  focusAreaCode: string;
  id: string;
  slug: string;
  sortOrder: number;
};

export type ReferenceLanguage = {
  displayName: string;
  languageCode: string;
  sortOrder: number;
};

export type ReferenceLearningNeedOptionValue = {
  allowedSubjectCodes: string[];
  displayLabel: string;
  helperText: string | null;
  optionGroup: LearningNeedOptionGroup;
  optionKey: string;
  sortOrder: number;
  subjectFocusAreaCode: string | null;
};

export async function loadActiveReferenceSubjects(): Promise<ReferenceSubject[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("id, subject_code, slug, display_name, display_description, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<SubjectRow[]>();

  if (error) {
    throw new Error("Could not load active subjects.");
  }

  return (data ?? []).map(mapSubjectRow);
}

export async function loadReferenceSubjectById(subjectId: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("id, subject_code, slug, display_name, display_description, sort_order")
    .eq("id", subjectId)
    .maybeSingle<SubjectRow>();

  if (error) {
    throw new Error("Could not load subject.");
  }

  return data ? mapSubjectRow(data) : null;
}

export async function loadReferenceSubjectsByIds(
  subjectIds: readonly string[],
): Promise<ReferenceSubject[]> {
  const uniqueIds = getUniqueValues(subjectIds);

  if (uniqueIds.length === 0) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("id, subject_code, slug, display_name, display_description, sort_order")
    .in("id", uniqueIds)
    .returns<SubjectRow[]>();

  if (error) {
    throw new Error("Could not load subjects.");
  }

  return (data ?? []).map(mapSubjectRow);
}

export async function loadActiveReferenceSubjectFocusAreas(): Promise<
  ReferenceSubjectFocusArea[]
> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("subject_focus_areas")
    .select("id, focus_area_code, slug, display_name, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<SubjectFocusAreaRow[]>();

  if (error) {
    throw new Error("Could not load active subject focus areas.");
  }

  return (data ?? []).map(mapSubjectFocusAreaRow);
}

export async function loadReferenceSubjectFocusAreaById(focusAreaId: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("subject_focus_areas")
    .select("id, focus_area_code, slug, display_name, sort_order")
    .eq("id", focusAreaId)
    .maybeSingle<SubjectFocusAreaRow>();

  if (error) {
    throw new Error("Could not load subject focus area.");
  }

  return data ? mapSubjectFocusAreaRow(data) : null;
}

export async function loadReferenceSubjectFocusAreasByIds(
  focusAreaIds: readonly string[],
): Promise<ReferenceSubjectFocusArea[]> {
  const uniqueIds = getUniqueValues(focusAreaIds);

  if (uniqueIds.length === 0) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("subject_focus_areas")
    .select("id, focus_area_code, slug, display_name, sort_order")
    .in("id", uniqueIds)
    .returns<SubjectFocusAreaRow[]>();

  if (error) {
    throw new Error("Could not load subject focus areas.");
  }

  return (data ?? []).map(mapSubjectFocusAreaRow);
}

export async function loadActiveReferenceLanguages(): Promise<ReferenceLanguage[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("languages")
    .select("language_code, display_name, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<LanguageRow[]>();

  if (error) {
    throw new Error("Could not load active languages.");
  }

  return (data ?? []).map(mapLanguageRow);
}

export async function loadReferenceLanguageByCode(languageCode: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("languages")
    .select("language_code, display_name, sort_order")
    .eq("language_code", languageCode)
    .maybeSingle<LanguageRow>();

  if (error) {
    throw new Error("Could not load language.");
  }

  return data ? mapLanguageRow(data) : null;
}

export async function loadReferenceLanguagesByCodes(
  languageCodes: readonly string[],
): Promise<ReferenceLanguage[]> {
  const uniqueCodes = getUniqueValues(languageCodes);

  if (uniqueCodes.length === 0) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("languages")
    .select("language_code, display_name, sort_order")
    .in("language_code", uniqueCodes)
    .returns<LanguageRow[]>();

  if (error) {
    throw new Error("Could not load languages.");
  }

  return (data ?? []).map(mapLanguageRow);
}

export async function loadActiveReferenceLearningNeedOptionValues(): Promise<
  ReferenceLearningNeedOptionValue[]
> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("learning_need_option_values")
    .select(
      "option_group, option_key, display_label, helper_text, subject_focus_area_code, allowed_subject_codes, sort_order",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<LearningNeedOptionValueRow[]>();

  if (error) {
    throw new Error("Could not load active learning-need options.");
  }

  return (data ?? []).map(mapLearningNeedOptionValueRow);
}

function mapSubjectRow(row: SubjectRow): ReferenceSubject {
  return {
    displayDescription: row.display_description,
    displayName: row.display_name,
    id: row.id,
    slug: row.slug,
    sortOrder: row.sort_order,
    subjectCode: row.subject_code,
  };
}

function mapSubjectFocusAreaRow(
  row: SubjectFocusAreaRow,
): ReferenceSubjectFocusArea {
  return {
    displayName: row.display_name,
    focusAreaCode: row.focus_area_code,
    id: row.id,
    slug: row.slug,
    sortOrder: row.sort_order,
  };
}

function mapLanguageRow(row: LanguageRow): ReferenceLanguage {
  return {
    displayName: row.display_name,
    languageCode: row.language_code,
    sortOrder: row.sort_order,
  };
}

function mapLearningNeedOptionValueRow(
  row: LearningNeedOptionValueRow,
): ReferenceLearningNeedOptionValue {
  return {
    allowedSubjectCodes: [...row.allowed_subject_codes],
    displayLabel: row.display_label,
    helperText: row.helper_text,
    optionGroup: row.option_group,
    optionKey: row.option_key,
    sortOrder: row.sort_order,
    subjectFocusAreaCode: row.subject_focus_area_code,
  };
}

function getUniqueValues(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
