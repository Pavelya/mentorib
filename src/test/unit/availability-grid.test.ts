import { describe, expect, it } from "vitest";

import {
  coalesceSlotsToAvailabilityRules,
  expandAvailabilityRulesToSlots,
} from "@/modules/tutors/availability-grid";
import type { SlotKey } from "@/components/ui/weekly-hour-grid";

describe("expandAvailabilityRulesToSlots", () => {
  it("round-trips whole-hour rules unchanged", () => {
    const slots = expandAvailabilityRulesToSlots([
      { dayOfWeek: 1, startLocalTime: "09:00", endLocalTime: "12:00" },
    ]);

    expect(slots).toEqual(new Set<SlotKey>(["1:9", "1:10", "1:11"]));
  });

  it("rounds sub-hour rules outward as documented (09:15-09:45 → 09:00)", () => {
    const slots = expandAvailabilityRulesToSlots([
      { dayOfWeek: 2, startLocalTime: "09:15", endLocalTime: "09:45" },
    ]);

    expect(slots).toEqual(new Set<SlotKey>(["2:9"]));
  });

  it("rounds sub-hour rules that cross hour boundaries outward", () => {
    const slots = expandAvailabilityRulesToSlots([
      { dayOfWeek: 3, startLocalTime: "08:30", endLocalTime: "10:15" },
    ]);

    expect(slots).toEqual(new Set<SlotKey>(["3:8", "3:9", "3:10"]));
  });

  it("accepts HH:MM:SS-formatted times", () => {
    const slots = expandAvailabilityRulesToSlots([
      { dayOfWeek: 0, startLocalTime: "06:00:00", endLocalTime: "08:00:00" },
    ]);

    expect(slots).toEqual(new Set<SlotKey>(["0:6", "0:7"]));
  });
});

describe("coalesceSlotsToAvailabilityRules", () => {
  it("collapses contiguous selected hours on the same day into one row", () => {
    const slots = new Set<SlotKey>(["1:9", "1:10", "1:11", "1:12"]);

    expect(coalesceSlotsToAvailabilityRules(slots)).toEqual([
      { dayOfWeek: 1, startLocalTime: "09:00", endLocalTime: "13:00" },
    ]);
  });

  it("splits non-contiguous slots into separate rows", () => {
    const slots = new Set<SlotKey>(["1:9", "1:10", "1:14", "1:15"]);

    expect(coalesceSlotsToAvailabilityRules(slots)).toEqual([
      { dayOfWeek: 1, startLocalTime: "09:00", endLocalTime: "11:00" },
      { dayOfWeek: 1, startLocalTime: "14:00", endLocalTime: "16:00" },
    ]);
  });

  it("sorts output by (dayOfWeek asc, startLocalTime asc)", () => {
    const slots = new Set<SlotKey>(["2:14", "0:8", "2:9", "0:9"]);

    expect(coalesceSlotsToAvailabilityRules(slots)).toEqual([
      { dayOfWeek: 0, startLocalTime: "08:00", endLocalTime: "10:00" },
      { dayOfWeek: 2, startLocalTime: "09:00", endLocalTime: "10:00" },
      { dayOfWeek: 2, startLocalTime: "14:00", endLocalTime: "15:00" },
    ]);
  });

  it("returns an empty array for an empty selection", () => {
    expect(coalesceSlotsToAvailabilityRules(new Set())).toEqual([]);
  });
});

describe("legacy sub-hour rule normalization round-trip", () => {
  it("rewrites a 09:15-09:45 legacy rule into a whole-hour 09:00-10:00 row on the next save", () => {
    const legacy = [
      { dayOfWeek: 1, startLocalTime: "09:15", endLocalTime: "09:45" },
    ];

    const coalesced = coalesceSlotsToAvailabilityRules(
      expandAvailabilityRulesToSlots(legacy),
    );

    expect(coalesced).toEqual([
      { dayOfWeek: 1, startLocalTime: "09:00", endLocalTime: "10:00" },
    ]);
  });
});

describe("availability-grid helpers — idempotency", () => {
  it("coalesceSlotsToAvailabilityRules(expandAvailabilityRulesToSlots(rules)) is idempotent for whole-hour input", () => {
    const rules = [
      { dayOfWeek: 0, startLocalTime: "06:00", endLocalTime: "08:00" },
      { dayOfWeek: 1, startLocalTime: "09:00", endLocalTime: "13:00" },
      { dayOfWeek: 1, startLocalTime: "14:00", endLocalTime: "16:00" },
      { dayOfWeek: 4, startLocalTime: "23:00", endLocalTime: "24:00" },
    ];

    const result = coalesceSlotsToAvailabilityRules(
      expandAvailabilityRulesToSlots(rules),
    );

    expect(result).toEqual(rules);
  });
});
