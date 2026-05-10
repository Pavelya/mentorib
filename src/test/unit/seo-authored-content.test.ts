import { describe, expect, it } from "vitest";

import {
  getAuthoredComboCopy,
  getAuthoredServiceCopy,
  getAuthoredSubjectCopy,
  listAuthoredComboPairs,
  listAuthoredServiceSlugs,
  listAuthoredSubjectSlugs,
  type SeoFiveQuestionAnswer,
} from "@/modules/marketing/seo-landing/authored-content";

const REQUIRED_LABELS: SeoFiveQuestionAnswer["label"][] = [
  "What this is",
  "Who it's for",
  "When it matters",
  "Who fits",
  "What's next",
];

describe("seo authored content registry", () => {
  it("registers a subject entry for biology", () => {
    const slug = "biology";
    expect(listAuthoredSubjectSlugs()).toContain(slug);
    const copy = getAuthoredSubjectCopy(slug);
    expect(copy).not.toBeNull();
    expect(copy?.kind).toBe("subject");
  });

  it("registers a service entry for tok-essay", () => {
    const slug = "tok-essay";
    expect(listAuthoredServiceSlugs()).toContain(slug);
    expect(getAuthoredServiceCopy(slug)?.kind).toBe("service");
  });

  it("registers a combo entry for english-a × tok-essay", () => {
    const pairs = listAuthoredComboPairs();
    expect(pairs).toContainEqual({
      needSlug: "tok-essay",
      subjectSlug: "english-a",
    });
    const combo = getAuthoredComboCopy("english-a", "tok-essay");
    expect(combo?.kind).toBe("combo");
    expect(combo?.rationale.pillars.length).toBeGreaterThanOrEqual(3);
  });

  it("returns null for unknown slugs", () => {
    expect(getAuthoredSubjectCopy("does-not-exist")).toBeNull();
    expect(getAuthoredServiceCopy("does-not-exist")).toBeNull();
    expect(getAuthoredComboCopy("english-a", "does-not-exist")).toBeNull();
  });

  it("authored copy answers all five `what / who / when / fit / next` labels", () => {
    const allEntries = [
      ...listAuthoredSubjectSlugs().map((slug) => getAuthoredSubjectCopy(slug)),
      ...listAuthoredServiceSlugs().map((slug) => getAuthoredServiceCopy(slug)),
      ...listAuthoredComboPairs().map((pair) =>
        getAuthoredComboCopy(pair.subjectSlug, pair.needSlug),
      ),
    ].filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    for (const entry of allEntries) {
      const labels = entry.fiveAnswers.map((answer) => answer.label);
      for (const required of REQUIRED_LABELS) {
        expect(labels).toContain(required);
      }
    }
  });

  it("authored copy produces unique meta descriptions per page", () => {
    const descriptions = [
      ...listAuthoredSubjectSlugs().map((slug) => getAuthoredSubjectCopy(slug)),
      ...listAuthoredServiceSlugs().map((slug) => getAuthoredServiceCopy(slug)),
      ...listAuthoredComboPairs().map((pair) =>
        getAuthoredComboCopy(pair.subjectSlug, pair.needSlug),
      ),
    ]
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .map((entry) => entry.metaDescription);

    expect(new Set(descriptions).size).toBe(descriptions.length);
  });
});
