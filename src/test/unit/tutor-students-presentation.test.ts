import { describe, expect, it } from "vitest";

import {
  buildRosterFilter,
  buildStudentsHref,
  getRelationshipBadgeLabel,
  getRelationshipBadgeTone,
  getRelationshipDescriptor,
  parseRelationshipFilter,
  parseSearchTerm,
  parseSubjectFilter,
  RELATIONSHIP_FILTER_VALUES,
} from "@/app/tutor/students/students-presentation";

describe("parseRelationshipFilter", () => {
  it("returns the matched value when valid", () => {
    expect(parseRelationshipFilter("active")).toBe("active");
    expect(parseRelationshipFilter("inactive")).toBe("inactive");
    expect(parseRelationshipFilter("all")).toBe("all");
  });

  it("returns 'all' for unknown values", () => {
    expect(parseRelationshipFilter(undefined)).toBe("all");
    expect(parseRelationshipFilter("")).toBe("all");
    expect(parseRelationshipFilter("paused")).toBe("all");
  });

  it("uses the first value when given an array", () => {
    expect(parseRelationshipFilter(["inactive", "active"])).toBe("inactive");
  });

  it("exposes all options including 'all'", () => {
    expect(RELATIONSHIP_FILTER_VALUES).toEqual(["all", "active", "inactive"]);
  });
});

describe("parseSearchTerm", () => {
  it("trims whitespace and caps length", () => {
    expect(parseSearchTerm("  Lena  ")).toBe("Lena");
    expect(parseSearchTerm("a".repeat(200))).toHaveLength(80);
  });

  it("returns an empty string for non-string input", () => {
    expect(parseSearchTerm(undefined)).toBe("");
    expect(parseSearchTerm([])).toBe("");
  });
});

describe("parseSubjectFilter", () => {
  it("returns the value when present in the available list", () => {
    expect(parseSubjectFilter("subject-bio", ["subject-bio"])).toBe(
      "subject-bio",
    );
  });

  it("returns an empty string when the value is not allowed", () => {
    expect(parseSubjectFilter("subject-math", ["subject-bio"])).toBe("");
    expect(parseSubjectFilter(undefined, ["subject-bio"])).toBe("");
  });
});

describe("buildRosterFilter", () => {
  it("omits keys that are at their default", () => {
    expect(
      buildRosterFilter({ relationship: "all", search: "", subjectId: "" }),
    ).toEqual({});
  });

  it("includes only the non-default keys", () => {
    expect(
      buildRosterFilter({
        relationship: "active",
        search: "Lena",
        subjectId: "subject-bio",
      }),
    ).toEqual({
      relationshipState: "active",
      search: "Lena",
      subjectId: "subject-bio",
    });
  });
});

describe("buildStudentsHref", () => {
  it("returns the base path when no filters are active", () => {
    expect(buildStudentsHref({})).toBe("/tutor/students");
    expect(
      buildStudentsHref({ relationship: "all", search: "", subjectId: "" }),
    ).toBe("/tutor/students");
  });

  it("encodes active filters as query parameters", () => {
    expect(
      buildStudentsHref({
        relationship: "active",
        search: "Lena",
        subjectId: "subject-bio",
      }),
    ).toBe(
      "/tutor/students?relationship=active&q=Lena&subject=subject-bio",
    );
  });
});

describe("relationship display helpers", () => {
  it("returns the active descriptor", () => {
    expect(getRelationshipDescriptor("active")).toMatch(/active/i);
    expect(getRelationshipBadgeLabel("active")).toBe("Active");
    expect(getRelationshipBadgeTone("active")).toBe("positive");
  });

  it("returns the inactive descriptor", () => {
    expect(getRelationshipDescriptor("inactive")).toMatch(/inactive/i);
    expect(getRelationshipBadgeLabel("inactive")).toBe("Inactive");
    expect(getRelationshipBadgeTone("inactive")).toBe("info");
  });
});
