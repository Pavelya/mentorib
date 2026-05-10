import { describe, expect, it } from "vitest";

import {
  aggregateTutorPriceRange,
  emptyTutorPriceRange,
  type TutorProfilePriceRow,
} from "@/modules/tutors/price-range";

const baseRow: Omit<
  TutorProfilePriceRow,
  "id" | "trial_price_minor" | "hourly_rate_minor" | "currency_code"
> = {
  application_status: "approved",
  public_listing_status: "listed",
};

function row(
  id: string,
  trial: number | null,
  hourly: number | null,
  currency: string | null = "USD",
): TutorProfilePriceRow {
  return {
    ...baseRow,
    id,
    trial_price_minor: trial,
    hourly_rate_minor: hourly,
    currency_code: currency,
  };
}

describe("aggregateTutorPriceRange", () => {
  it("returns empty range for no rows", () => {
    expect(aggregateTutorPriceRange([])).toEqual(emptyTutorPriceRange());
  });

  it("aggregates min and max trial and hourly across rows", () => {
    const result = aggregateTutorPriceRange([
      row("a", 4400, 6000),
      row("b", 5800, 7500),
      row("c", 5000, 8000),
    ]);
    expect(result.trialMinMinor).toBe(4400);
    expect(result.trialMaxMinor).toBe(5800);
    expect(result.hourlyMinMinor).toBe(6000);
    expect(result.hourlyMaxMinor).toBe(8000);
    expect(result.currencyCode).toBe("USD");
    expect(result.tutorCount).toBe(3);
  });

  it("ignores null pricing values without dropping the tutor count", () => {
    const result = aggregateTutorPriceRange([
      row("a", null, 6000),
      row("b", 4400, null),
      row("c", null, null),
    ]);
    expect(result.trialMinMinor).toBe(4400);
    expect(result.trialMaxMinor).toBe(4400);
    expect(result.hourlyMinMinor).toBe(6000);
    expect(result.hourlyMaxMinor).toBe(6000);
    expect(result.tutorCount).toBe(3);
  });

  it("normalizes invalid currency codes back to the platform default", () => {
    expect(
      aggregateTutorPriceRange([row("a", 4000, 6000, null)]).currencyCode,
    ).toBe("USD");
    expect(
      aggregateTutorPriceRange([row("a", 4000, 6000, "")]).currencyCode,
    ).toBe("USD");
  });

  it("is deterministic for the same inputs", () => {
    const rows = [row("a", 4400, 6000), row("b", 5800, 7500)];
    expect(aggregateTutorPriceRange(rows)).toEqual(
      aggregateTutorPriceRange(rows),
    );
  });
});
