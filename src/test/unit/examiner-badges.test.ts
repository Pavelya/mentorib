import { describe, expect, it } from "vitest";

import type {
  ReferenceSubject,
  ReferenceSubjectFocusArea,
} from "@/modules/reference/catalog";
import {
  buildExaminerBadgesFromRows,
  type ExaminerCredentialRow,
} from "@/modules/tutors/examiner-credentials-builder";

const biologyHl: ReferenceSubject = {
  displayDescription: null,
  displayName: "Biology HL",
  id: "subj-bio",
  slug: "biology-hl",
  sortOrder: 40,
  subjectCode: "biology_hl",
};

const englishALangLit: ReferenceSubject = {
  displayDescription: null,
  displayName: "English A Language and Literature",
  id: "subj-eng",
  slug: "english-a-lang-and-lit",
  sortOrder: 10,
  subjectCode: "english_a_lang_lit",
};

const tokEssay: ReferenceSubjectFocusArea = {
  displayName: "TOK essay help",
  focusAreaCode: "tok_essay_help",
  id: "focus-tok",
  slug: "tok-essay-help",
  sortOrder: 30,
};

const subjectsById = new Map([
  [biologyHl.id, biologyHl],
  [englishALangLit.id, englishALangLit],
]);
const focusAreasById = new Map([[tokEssay.id, tokEssay]]);

function row(
  subjectId: string | null,
  focusAreaId: string | null,
): ExaminerCredentialRow {
  return {
    credential_subject_focus_area_id: focusAreaId,
    credential_subject_id: subjectId,
    tutor_profile_id: "tutor-1",
  };
}

describe("buildExaminerBadgesFromRows", () => {
  it("returns an empty list when no rows are provided", () => {
    expect(
      buildExaminerBadgesFromRows([], subjectsById, focusAreasById),
    ).toEqual([]);
  });

  it("emits a subject-only badge when only credential_subject_id is set", () => {
    const badges = buildExaminerBadgesFromRows(
      [row(biologyHl.id, null)],
      subjectsById,
      focusAreasById,
    );
    expect(badges).toEqual([
      {
        subject: {
          id: biologyHl.id,
          displayName: biologyHl.displayName,
          slug: biologyHl.slug,
        },
      },
    ]);
  });

  it("emits a focus-area-only badge when only credential_subject_focus_area_id is set", () => {
    const badges = buildExaminerBadgesFromRows(
      [row(null, tokEssay.id)],
      subjectsById,
      focusAreasById,
    );
    expect(badges).toEqual([
      {
        focusArea: {
          id: tokEssay.id,
          displayName: tokEssay.displayName,
          slug: tokEssay.slug,
        },
      },
    ]);
  });

  it("emits a combined badge when both subject and focus area are set", () => {
    const badges = buildExaminerBadgesFromRows(
      [row(englishALangLit.id, tokEssay.id)],
      subjectsById,
      focusAreasById,
    );
    expect(badges).toHaveLength(1);
    expect(badges[0]?.subject?.slug).toBe("english-a-lang-and-lit");
    expect(badges[0]?.focusArea?.slug).toBe("tok-essay-help");
  });

  it("skips rows whose referenced subject and focus area are missing", () => {
    const badges = buildExaminerBadgesFromRows(
      [row("missing-subject", null), row(null, "missing-focus")],
      subjectsById,
      focusAreasById,
    );
    expect(badges).toEqual([]);
  });

  it("dedupes badges that resolve to the same subject + focus area pairing", () => {
    const badges = buildExaminerBadgesFromRows(
      [
        row(biologyHl.id, null),
        row(biologyHl.id, null),
        row(englishALangLit.id, tokEssay.id),
      ],
      subjectsById,
      focusAreasById,
    );
    expect(badges).toHaveLength(2);
  });
});
