import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(__dirname, "../../..");

const earningsPageSource = readFileSync(
  path.join(projectRoot, "src/app/tutor/earnings/page.tsx"),
  "utf-8",
);

describe("tutor earnings page hides Stripe internals", () => {
  it("does not reference Stripe internal requirement namespaces", () => {
    expect(earningsPageSource).not.toMatch(/individual\./);
    expect(earningsPageSource).not.toMatch(/business_profile\./);
    expect(earningsPageSource).not.toMatch(/external_account/);
    expect(earningsPageSource).not.toMatch(/tos_acceptance/);
  });

  it("does not render any open-requirements list", () => {
    expect(earningsPageSource).not.toContain("collectOpenRequirements");
    expect(earningsPageSource).not.toContain("describeRequirement");
    expect(earningsPageSource).not.toContain("payoutRequirementsSummary");
  });

  it("does not expose environment variable names", () => {
    expect(earningsPageSource).not.toContain("STRIPE_SECRET_KEY");
  });

  it("does not render a Stripe-not-configured notice", () => {
    expect(earningsPageSource).not.toContain("Stripe is not configured");
  });
});
