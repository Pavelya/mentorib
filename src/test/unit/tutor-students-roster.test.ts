import { describe, expect, it } from "vitest";

import {
  aggregateLessonsByStudent,
  applyRosterFilter,
  deriveRelationshipState,
  type LessonRosterRecord,
  type TutorStudentsRosterItemDto,
} from "@/modules/lessons/tutor-students";

const NOW = Date.UTC(2026, 4, 10, 12, 0, 0);
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isoDaysFromNow(offsetDays: number): string {
  return new Date(NOW + offsetDays * ONE_DAY_MS).toISOString();
}

function makeLesson(overrides: Partial<LessonRosterRecord>): LessonRosterRecord {
  return {
    focus_snapshot: {},
    id: overrides.id ?? "lesson-id",
    lesson_status: overrides.lesson_status ?? "completed",
    request_expires_at: overrides.request_expires_at ?? isoDaysFromNow(0),
    scheduled_end_at: overrides.scheduled_end_at ?? isoDaysFromNow(-1),
    scheduled_start_at: overrides.scheduled_start_at ?? isoDaysFromNow(-1),
    student_profile_id: overrides.student_profile_id ?? "student-1",
    subject_snapshot: overrides.subject_snapshot ?? {
      id: "subject-bio",
      label: "Biology HL",
    },
    ...overrides,
  };
}

function makeItem(
  overrides: Partial<TutorStudentsRosterItemDto>,
): TutorStudentsRosterItemDto {
  return {
    appUserId: "user-1",
    avatarUrl: null,
    completedLessonCount: 0,
    displayName: "Lena Nowak",
    lastLessonAt: null,
    pendingRequestCount: 0,
    relationshipState: "active",
    studentProfileId: "student-1",
    subjects: [{ id: "subject-bio", label: "Biology HL" }],
    timezone: "UTC",
    upcomingLessonAt: null,
    ...overrides,
  };
}

describe("aggregateLessonsByStudent", () => {
  it("groups lessons by student and aggregates counts", () => {
    const lessons: LessonRosterRecord[] = [
      makeLesson({
        id: "l1",
        lesson_status: "completed",
        scheduled_start_at: isoDaysFromNow(-2),
        student_profile_id: "student-1",
        subject_snapshot: { id: "subject-bio", label: "Biology HL" },
      }),
      makeLesson({
        id: "l2",
        lesson_status: "reviewed",
        scheduled_start_at: isoDaysFromNow(-30),
        student_profile_id: "student-1",
        subject_snapshot: { id: "subject-bio", label: "Biology HL" },
      }),
      makeLesson({
        id: "l3",
        lesson_status: "pending",
        scheduled_start_at: isoDaysFromNow(2),
        student_profile_id: "student-1",
      }),
      makeLesson({
        id: "l4",
        lesson_status: "accepted",
        scheduled_start_at: isoDaysFromNow(5),
        student_profile_id: "student-2",
        subject_snapshot: { id: "subject-history", label: "History HL" },
      }),
    ];

    const result = aggregateLessonsByStudent(lessons, NOW);
    const studentOne = result.get("student-1");
    const studentTwo = result.get("student-2");

    expect(studentOne?.completedLessonCount).toBe(2);
    expect(studentOne?.pendingRequestCount).toBe(1);
    expect(studentOne?.lastLessonAt).toBe(isoDaysFromNow(-2));
    expect(studentOne?.upcomingLessonAt).toBeNull();
    expect(Array.from(studentOne?.subjects.keys() ?? [])).toEqual(["subject-bio"]);

    expect(studentTwo?.completedLessonCount).toBe(0);
    expect(studentTwo?.pendingRequestCount).toBe(0);
    expect(studentTwo?.upcomingLessonAt).toBe(isoDaysFromNow(5));
  });

  it("collects distinct subjects across lessons", () => {
    const lessons: LessonRosterRecord[] = [
      makeLesson({
        id: "l1",
        lesson_status: "completed",
        subject_snapshot: { id: "subject-bio", label: "Biology HL" },
      }),
      makeLesson({
        id: "l2",
        lesson_status: "completed",
        subject_snapshot: { id: "subject-bio", label: "Biology HL" },
      }),
      makeLesson({
        id: "l3",
        lesson_status: "completed",
        subject_snapshot: { id: "subject-history", label: "History HL" },
      }),
    ];

    const result = aggregateLessonsByStudent(lessons, NOW);
    const aggregate = result.get("student-1");

    expect(Array.from(aggregate?.subjects.keys() ?? [])).toEqual([
      "subject-bio",
      "subject-history",
    ]);
  });

  it("ignores invalid subject snapshots", () => {
    const lessons: LessonRosterRecord[] = [
      makeLesson({
        id: "l1",
        lesson_status: "completed",
        subject_snapshot: null,
      }),
      makeLesson({
        id: "l2",
        lesson_status: "completed",
        subject_snapshot: { id: "", label: "Biology HL" },
      }),
    ];

    const result = aggregateLessonsByStudent(lessons, NOW);
    const aggregate = result.get("student-1");

    expect(aggregate?.subjects.size ?? 0).toBe(0);
  });
});

describe("deriveRelationshipState", () => {
  it("returns active when an upcoming lesson exists", () => {
    expect(
      deriveRelationshipState(
        { lastLessonAt: null, upcomingLessonAt: isoDaysFromNow(3) },
        NOW,
      ),
    ).toBe("active");
  });

  it("returns active when the last lesson is within the recent window", () => {
    expect(
      deriveRelationshipState(
        { lastLessonAt: isoDaysFromNow(-30), upcomingLessonAt: null },
        NOW,
      ),
    ).toBe("active");
  });

  it("returns inactive when the last lesson is older than the recent window", () => {
    expect(
      deriveRelationshipState(
        { lastLessonAt: isoDaysFromNow(-120), upcomingLessonAt: null },
        NOW,
      ),
    ).toBe("inactive");
  });

  it("returns inactive when no lesson activity exists", () => {
    expect(
      deriveRelationshipState(
        { lastLessonAt: null, upcomingLessonAt: null },
        NOW,
      ),
    ).toBe("inactive");
  });
});

describe("applyRosterFilter", () => {
  const items: TutorStudentsRosterItemDto[] = [
    makeItem({
      displayName: "Lena Nowak",
      relationshipState: "active",
      studentProfileId: "student-1",
      subjects: [{ id: "subject-bio", label: "Biology HL" }],
    }),
    makeItem({
      displayName: "Arjun Patel",
      relationshipState: "inactive",
      studentProfileId: "student-2",
      subjects: [{ id: "subject-history", label: "History HL" }],
    }),
    makeItem({
      displayName: "Maya Chen",
      relationshipState: "active",
      studentProfileId: "student-3",
      subjects: [
        { id: "subject-bio", label: "Biology HL" },
        { id: "subject-history", label: "History HL" },
      ],
    }),
  ];

  it("filters by case-insensitive name search", () => {
    const result = applyRosterFilter(items, { search: "lena" });
    expect(result.map((item) => item.studentProfileId)).toEqual(["student-1"]);
  });

  it("filters by relationship state", () => {
    const result = applyRosterFilter(items, { relationshipState: "inactive" });
    expect(result.map((item) => item.studentProfileId)).toEqual(["student-2"]);
  });

  it("filters by subject relationship", () => {
    const result = applyRosterFilter(items, { subjectId: "subject-history" });
    expect(result.map((item) => item.studentProfileId)).toEqual([
      "student-2",
      "student-3",
    ]);
  });

  it("combines filters", () => {
    const result = applyRosterFilter(items, {
      relationshipState: "active",
      subjectId: "subject-bio",
      search: "maya",
    });
    expect(result.map((item) => item.studentProfileId)).toEqual(["student-3"]);
  });

  it("returns the full set when no filters are provided", () => {
    expect(applyRosterFilter(items, {}).length).toBe(items.length);
  });
});
