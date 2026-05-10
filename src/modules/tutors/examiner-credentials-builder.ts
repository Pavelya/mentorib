import type {
  ReferenceSubject,
  ReferenceSubjectFocusArea,
} from "@/modules/reference/catalog";

export type ExaminerBadgeSubject = {
  id: string;
  displayName: string;
  slug: string;
};

export type ExaminerBadge = {
  subject?: ExaminerBadgeSubject;
  focusArea?: ExaminerBadgeSubject;
};

export type ExaminerCredentialRow = {
  credential_subject_focus_area_id: string | null;
  credential_subject_id: string | null;
  tutor_profile_id: string;
};

export function buildExaminerBadgesFromRows(
  rows: readonly ExaminerCredentialRow[],
  subjects: ReadonlyMap<string, ReferenceSubject>,
  focusAreas: ReadonlyMap<string, ReferenceSubjectFocusArea>,
): ExaminerBadge[] {
  const seen = new Set<string>();
  const badges: ExaminerBadge[] = [];

  for (const row of rows) {
    const subjectRow = row.credential_subject_id
      ? subjects.get(row.credential_subject_id)
      : undefined;
    const focusAreaRow = row.credential_subject_focus_area_id
      ? focusAreas.get(row.credential_subject_focus_area_id)
      : undefined;

    if (!subjectRow && !focusAreaRow) {
      continue;
    }

    const dedupeKey = `${subjectRow?.id ?? ""}:${focusAreaRow?.id ?? ""}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    const badge: ExaminerBadge = {};
    if (subjectRow) {
      badge.subject = {
        id: subjectRow.id,
        displayName: subjectRow.displayName,
        slug: subjectRow.slug,
      };
    }
    if (focusAreaRow) {
      badge.focusArea = {
        id: focusAreaRow.id,
        displayName: focusAreaRow.displayName,
        slug: focusAreaRow.slug,
      };
    }
    badges.push(badge);
  }

  return badges;
}
