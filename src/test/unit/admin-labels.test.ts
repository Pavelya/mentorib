import { describe, expect, it } from "vitest";

import { ADMIN_ACTION_KEYS } from "@/modules/admin/actions";
import {
  ACCOUNT_STATUS_LABELS,
  adminActionLabel,
  APPLICATION_STATUS_LABELS,
  CASE_STATUS_LABELS,
  FINANCE_INTERVENTION_KIND_LABELS,
  PAYOUT_READINESS_LABELS,
} from "@/modules/admin/labels";

describe("admin labels — view-model copy map", () => {
  it("never returns the raw enum value as its own label", () => {
    const maps = [
      ACCOUNT_STATUS_LABELS,
      APPLICATION_STATUS_LABELS,
      CASE_STATUS_LABELS,
      FINANCE_INTERVENTION_KIND_LABELS,
      PAYOUT_READINESS_LABELS,
    ];
    for (const map of maps) {
      for (const [value, label] of Object.entries(map)) {
        expect(label).not.toBe(value);
        expect(label.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("maps every allowlisted admin action key to a human verb phrase", () => {
    for (const key of ADMIN_ACTION_KEYS) {
      const label = adminActionLabel(key);
      expect(label).not.toBe(key);
      expect(label).not.toMatch(/[._]/);
      expect(label.charAt(0)).toBe(label.charAt(0).toUpperCase());
    }
  });

  it("humanizes an unknown / legacy action key instead of leaking the token", () => {
    expect(adminActionLabel("legacy.something_old")).toBe(
      "Legacy something old",
    );
    expect(adminActionLabel("")).toBe("Admin action");
  });
});
