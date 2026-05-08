import { describe, expect, it } from "vitest";

import {
  DEFAULT_TIMEZONE,
  isValidTimezone,
  normalizeTimezone,
  resolveTimezone,
} from "@/lib/datetime/timezone";

describe("normalizeTimezone", () => {
  it("returns null for empty / oversized / unknown candidates", () => {
    expect(normalizeTimezone(null)).toBeNull();
    expect(normalizeTimezone(undefined)).toBeNull();
    expect(normalizeTimezone("")).toBeNull();
    expect(normalizeTimezone("   ")).toBeNull();
    expect(normalizeTimezone("Not/A_Real_Zone")).toBeNull();
    expect(normalizeTimezone("X".repeat(200))).toBeNull();
  });

  it("returns the IANA-canonical zone for valid input", () => {
    expect(normalizeTimezone("UTC")).toBe("UTC");
    expect(normalizeTimezone("Europe/London")).toBe("Europe/London");
    expect(normalizeTimezone("  America/New_York  ")).toBe("America/New_York");
  });
});

describe("resolveTimezone", () => {
  it("falls back to the default timezone for invalid input", () => {
    expect(resolveTimezone(null)).toBe(DEFAULT_TIMEZONE);
    expect(resolveTimezone("Not/A_Real_Zone")).toBe(DEFAULT_TIMEZONE);
  });

  it("returns the normalized zone for valid input", () => {
    expect(resolveTimezone("Europe/Paris")).toBe("Europe/Paris");
  });
});

describe("isValidTimezone", () => {
  it("reflects normalizeTimezone's accept/reject behavior", () => {
    expect(isValidTimezone("UTC")).toBe(true);
    expect(isValidTimezone("Europe/Berlin")).toBe(true);
    expect(isValidTimezone("Not/A_Real_Zone")).toBe(false);
    expect(isValidTimezone(null)).toBe(false);
  });
});
