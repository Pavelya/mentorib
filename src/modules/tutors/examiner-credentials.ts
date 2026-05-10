import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  loadReferenceSubjectFocusAreasByIds,
  loadReferenceSubjectsByIds,
  type ReferenceSubject,
  type ReferenceSubjectFocusArea,
} from "@/modules/reference/catalog";
import { EXAMINER_TUTOR_CREDENTIAL_TYPE } from "@/modules/tutors/constants";
import {
  buildExaminerBadgesFromRows,
  type ExaminerBadge,
  type ExaminerCredentialRow,
} from "@/modules/tutors/examiner-credentials-builder";

export type {
  ExaminerBadge,
  ExaminerBadgeSubject,
  ExaminerCredentialRow,
} from "@/modules/tutors/examiner-credentials-builder";

type AcceptingTutorRow = {
  tutor_profile_id: string;
  is_accepting_new_students: boolean;
};

export async function countExaminersForSubject(
  subjectId: string,
): Promise<number> {
  const tutorIds = await loadEligibleExaminerTutorIds({ subjectId });
  return tutorIds.size;
}

export async function countExaminersForSubjectFocusArea(
  focusAreaId: string,
): Promise<number> {
  const tutorIds = await loadEligibleExaminerTutorIds({ focusAreaId });
  return tutorIds.size;
}

export async function loadExaminerBadgesForTutor(
  tutorProfileId: string,
): Promise<ExaminerBadge[]> {
  if (!tutorProfileId) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_credentials")
    .select(
      "tutor_profile_id, credential_subject_id, credential_subject_focus_area_id",
    )
    .eq("tutor_profile_id", tutorProfileId)
    .eq("credential_type", EXAMINER_TUTOR_CREDENTIAL_TYPE)
    .eq("review_status", "approved")
    .returns<ExaminerCredentialRow[]>();

  if (error) {
    throw new Error("Could not load examiner credentials for tutor.");
  }

  const rows = data ?? [];

  const subjectIds = uniqueStrings(
    rows
      .map((row) => row.credential_subject_id)
      .filter((value): value is string => Boolean(value)),
  );
  const focusAreaIds = uniqueStrings(
    rows
      .map((row) => row.credential_subject_focus_area_id)
      .filter((value): value is string => Boolean(value)),
  );

  const [subjects, focusAreas] = await Promise.all([
    loadSubjectsById(subjectIds),
    loadFocusAreasById(focusAreaIds),
  ]);

  return buildExaminerBadgesFromRows(rows, subjects, focusAreas);
}

async function loadEligibleExaminerTutorIds(
  scope: { subjectId: string } | { focusAreaId: string },
): Promise<Set<string>> {
  const supabase = createSupabaseServiceRoleClient();
  let query = supabase
    .from("tutor_credentials")
    .select("tutor_profile_id")
    .eq("credential_type", EXAMINER_TUTOR_CREDENTIAL_TYPE)
    .eq("review_status", "approved");

  if ("subjectId" in scope) {
    query = query.eq("credential_subject_id", scope.subjectId);
  } else {
    query = query.eq("credential_subject_focus_area_id", scope.focusAreaId);
  }

  const { data, error } = await query.returns<{ tutor_profile_id: string }[]>();
  if (error) {
    throw new Error("Could not load examiner credentials for scope.");
  }

  const candidateIds = uniqueStrings(
    (data ?? []).map((row) => row.tutor_profile_id),
  );
  if (candidateIds.length === 0) {
    return new Set<string>();
  }

  const [listedTutorIds, acceptingTutorIds] = await Promise.all([
    filterListedApprovedTutors(candidateIds),
    filterAcceptingTutors(candidateIds),
  ]);

  return new Set(
    candidateIds.filter(
      (id) => listedTutorIds.has(id) && acceptingTutorIds.has(id),
    ),
  );
}

async function filterListedApprovedTutors(
  tutorProfileIds: readonly string[],
): Promise<Set<string>> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("id")
    .in("id", tutorProfileIds)
    .eq("application_status", "approved")
    .eq("public_listing_status", "listed")
    .returns<{ id: string }[]>();

  if (error) {
    throw new Error("Could not load tutor profile listing state for examiner scope.");
  }

  return new Set((data ?? []).map((row) => row.id));
}

async function filterAcceptingTutors(
  tutorProfileIds: readonly string[],
): Promise<Set<string>> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("schedule_policies")
    .select("tutor_profile_id, is_accepting_new_students")
    .in("tutor_profile_id", tutorProfileIds)
    .returns<AcceptingTutorRow[]>();

  if (error) {
    throw new Error("Could not load schedule policies for examiner scope.");
  }

  return new Set(
    (data ?? [])
      .filter((row) => row.is_accepting_new_students)
      .map((row) => row.tutor_profile_id),
  );
}

async function loadSubjectsById(
  subjectIds: readonly string[],
): Promise<Map<string, ReferenceSubject>> {
  if (subjectIds.length === 0) {
    return new Map();
  }
  const subjects = await loadReferenceSubjectsByIds(subjectIds);
  return new Map(subjects.map((subject) => [subject.id, subject]));
}

async function loadFocusAreasById(
  focusAreaIds: readonly string[],
): Promise<Map<string, ReferenceSubjectFocusArea>> {
  if (focusAreaIds.length === 0) {
    return new Map();
  }
  const focusAreas = await loadReferenceSubjectFocusAreasByIds(focusAreaIds);
  return new Map(focusAreas.map((focusArea) => [focusArea.id, focusArea]));
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}
