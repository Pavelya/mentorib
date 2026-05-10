import { describe, expect, it } from "vitest";

import {
  buildTutorPriceRangeLabel,
  formatHourlyRate,
  formatPriceRange,
  formatTrialPrice,
} from "@/modules/pricing/tutor-pricing";

describe("formatTrialPrice", () => {
  it("returns null when no trial price is set", () => {
    expect(formatTrialPrice({ trialPriceMinor: null })).toBeNull();
    expect(formatTrialPrice({})).toBeNull();
  });

  it("formats whole-unit trial prices without trailing zeros", () => {
    expect(
      formatTrialPrice({ trialPriceMinor: 4400, currencyCode: "USD" }),
    ).toBe("$44");
  });

  it("formats sub-unit trial prices with two decimals", () => {
    expect(
      formatTrialPrice({ trialPriceMinor: 4499, currencyCode: "USD" }),
    ).toBe("$44.99");
  });

  it("falls back to the platform default currency when missing or invalid", () => {
    expect(
      formatTrialPrice({ trialPriceMinor: 5000, currencyCode: null }),
    ).toBe("$50");
    expect(
      formatTrialPrice({ trialPriceMinor: 5000, currencyCode: "" }),
    ).toBe("$50");
  });
});

describe("formatHourlyRate", () => {
  it("returns null when no hourly rate is set", () => {
    expect(formatHourlyRate({ hourlyRateMinor: null })).toBeNull();
  });

  it("formats hourly rates", () => {
    expect(
      formatHourlyRate({ hourlyRateMinor: 6000, currencyCode: "USD" }),
    ).toBe("$60");
  });
});

describe("formatPriceRange", () => {
  it("returns null when min or max is missing or invalid", () => {
    expect(
      formatPriceRange({ minMinor: null, maxMinor: 5000, currencyCode: "USD" }),
    ).toBeNull();
    expect(
      formatPriceRange({ minMinor: 5000, maxMinor: null, currencyCode: "USD" }),
    ).toBeNull();
    expect(
      formatPriceRange({ minMinor: 6000, maxMinor: 5000, currencyCode: "USD" }),
    ).toBeNull();
  });

  it("collapses identical min and max to a single label", () => {
    expect(
      formatPriceRange({ minMinor: 5000, maxMinor: 5000, currencyCode: "USD" }),
    ).toBe("$50");
  });

  it("formats a deterministic en-dash range", () => {
    expect(
      formatPriceRange({ minMinor: 4400, maxMinor: 5800, currencyCode: "USD" }),
    ).toBe("$44–$58");
  });
});

describe("buildTutorPriceRangeLabel", () => {
  it("returns null when neither price is present", () => {
    expect(buildTutorPriceRangeLabel({})).toBeNull();
  });

  it("returns the trial label when only trial price is set", () => {
    expect(
      buildTutorPriceRangeLabel({ trialPriceMinor: 4400, currencyCode: "USD" }),
    ).toBe("$44");
  });

  it("returns the hourly label when only hourly rate is set", () => {
    expect(
      buildTutorPriceRangeLabel({ hourlyRateMinor: 6000, currencyCode: "USD" }),
    ).toBe("$60");
  });

  it("returns a two-point range when both prices differ", () => {
    expect(
      buildTutorPriceRangeLabel({
        trialPriceMinor: 4400,
        hourlyRateMinor: 6000,
        currencyCode: "USD",
      }),
    ).toBe("$44–$60");
  });

  it("collapses to a single label when prices match", () => {
    expect(
      buildTutorPriceRangeLabel({
        trialPriceMinor: 5000,
        hourlyRateMinor: 5000,
        currencyCode: "USD",
      }),
    ).toBe("$50");
  });
});
