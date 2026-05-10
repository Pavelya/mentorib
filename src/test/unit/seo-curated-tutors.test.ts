import { describe, expect, it } from "vitest";

import {
  rankSeoCuratedTutors,
  selectSeoCuratedTutorsForDisplay,
  SEO_CURATED_LIST_MAX_VISIBLE,
  type SeoCuratedTutorScoreInput,
} from "@/modules/marketing/seo-landing/curated-tutors";

const baseInput: Omit<SeoCuratedTutorScoreInput, "tutorProfileId"> = {
  bestDisplayPriority: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  hasExaminerCredentialForScope: false,
  matchingCapabilityCount: 1,
  publicListingUpdatedAt: "2026-04-01T00:00:00.000Z",
};

function input(
  id: string,
  overrides: Partial<SeoCuratedTutorScoreInput> = {},
): SeoCuratedTutorScoreInput {
  return { ...baseInput, tutorProfileId: id, ...overrides };
}

describe("rankSeoCuratedTutors", () => {
  it("places examiners ahead of non-examiners", () => {
    const result = rankSeoCuratedTutors([
      input("a", { hasExaminerCredentialForScope: false }),
      input("b", { hasExaminerCredentialForScope: true }),
    ]);
    expect(result.map((entry) => entry.tutorProfileId)).toEqual(["b", "a"]);
  });

  it("uses display_priority within the examiner tier", () => {
    const result = rankSeoCuratedTutors([
      input("a", { bestDisplayPriority: 5, hasExaminerCredentialForScope: true }),
      input("b", { bestDisplayPriority: 1, hasExaminerCredentialForScope: true }),
    ]);
    expect(result.map((entry) => entry.tutorProfileId)).toEqual(["b", "a"]);
  });

  it("breaks ties by capability count, recency, and id", () => {
    const result = rankSeoCuratedTutors([
      input("a", { matchingCapabilityCount: 1 }),
      input("b", { matchingCapabilityCount: 3 }),
      input("c", { matchingCapabilityCount: 2 }),
    ]);
    expect(result.map((entry) => entry.tutorProfileId)).toEqual(["b", "c", "a"]);
  });

  it("is deterministic for the same inputs", () => {
    const list = [
      input("a", {
        bestDisplayPriority: 1,
        hasExaminerCredentialForScope: true,
      }),
      input("b", {
        bestDisplayPriority: 2,
        hasExaminerCredentialForScope: true,
      }),
      input("c", {
        bestDisplayPriority: 3,
        hasExaminerCredentialForScope: false,
      }),
    ];

    expect(rankSeoCuratedTutors(list)).toEqual(rankSeoCuratedTutors(list));
  });

  it("limits the visible list to the configured max", () => {
    const list = Array.from({ length: 6 }, (_, index) =>
      input(`tutor-${index}`, { matchingCapabilityCount: 6 - index }),
    );
    const visible = selectSeoCuratedTutorsForDisplay(list);
    expect(visible).toHaveLength(SEO_CURATED_LIST_MAX_VISIBLE);
  });

  it("uses public listing recency when capability count is equal", () => {
    const result = rankSeoCuratedTutors([
      input("older", {
        publicListingUpdatedAt: "2026-01-01T00:00:00.000Z",
      }),
      input("newer", {
        publicListingUpdatedAt: "2026-04-01T00:00:00.000Z",
      }),
    ]);
    expect(result[0].tutorProfileId).toBe("newer");
  });
});
