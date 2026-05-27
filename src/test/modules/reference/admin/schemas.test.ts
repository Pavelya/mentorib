import { describe, expect, it } from "vitest";

import { validateReferenceChanges } from "@/modules/reference/admin/schemas";

describe("validateReferenceChanges", () => {
  it("rejects every common code-owned identifier key", () => {
    const cases = [
      { changes: { slug: "x" } },
      { changes: { subject_code: "x" } },
      { changes: { focus_area_code: "x" } },
      { changes: { language_code: "x" } },
      { changes: { provider_key: "x" } },
      { changes: { id: "x" } },
      { changes: { created_at: "now" } },
    ];

    for (const { changes } of cases) {
      const result = validateReferenceChanges("subjects", changes);
      expect(result.ok, JSON.stringify(changes)).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("unrecognized_keys");
      }
    }
  });

  it("accepts every allowlisted field individually for subjects", () => {
    const cases: Array<Record<string, unknown>> = [
      { display_name: "Mathematics" },
      { display_description: "Numbers and symbols" },
      { sort_order: 10 },
      { is_active: true },
    ];
    for (const changes of cases) {
      const result = validateReferenceChanges("subjects", changes);
      expect(result.ok, JSON.stringify(changes)).toBe(true);
    }
  });

  it("strips display_description down to null when blank", () => {
    const result = validateReferenceChanges("subjects", {
      display_description: "   ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.display_description).toBeNull();
    }
  });

  it("rejects display_description over the length cap", () => {
    const result = validateReferenceChanges("subjects", {
      display_description: "x".repeat(2001),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("invalid_value");
      expect(result.field).toBe("display_description");
    }
  });

  it("rejects sort_order outside the allowed range", () => {
    const result = validateReferenceChanges("subjects", {
      sort_order: -1,
    });
    expect(result.ok).toBe(false);
  });

  it("does not allow display_description on a family that does not store it", () => {
    const result = validateReferenceChanges("focus-areas", {
      display_description: "should not be allowed",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("unrecognized_keys");
    }
  });
});
