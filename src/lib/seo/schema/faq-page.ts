type FaqEntry = {
  answer: string;
  question: string;
};

// Emit `FAQPage` JSON-LD only when the page renders a real, visible FAQ block
// — see `docs/architecture/structured-data-map-v1.md` and `P15-SEO-001`
// acceptance criteria.
export function buildFaqPageSchema(entries: readonly FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
      name: entry.question,
    })),
  };
}
