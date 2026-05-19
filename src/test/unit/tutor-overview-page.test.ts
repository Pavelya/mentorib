import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(__dirname, "../../..");

const overviewPageSource = readFileSync(
  path.join(projectRoot, "src/app/tutor/overview/page.tsx"),
  "utf-8",
);

const overviewPresentationSource = readFileSync(
  path.join(projectRoot, "src/app/tutor/overview/overview-presentation.ts"),
  "utf-8",
);

describe("tutor overview readiness IA split", () => {
  it("no longer mounts the readiness ContextChipRow", () => {
    expect(overviewPageSource).not.toContain("ContextChipRow");
  });

  it("no longer builds readiness chips", () => {
    expect(overviewPageSource).not.toContain("buildReadinessChips");
    expect(overviewPresentationSource).not.toContain("buildReadinessChips");
  });

  it("links the readiness CTA to /tutor/profile, not /tutor/earnings", () => {
    expect(overviewPageSource).toContain('"/tutor/profile"');
    expect(overviewPageSource).not.toMatch(
      /InlineNotice[\s\S]{0,400}\/tutor\/earnings/,
    );
  });
});
