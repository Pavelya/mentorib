type BuildOfferSchemaInput = {
  currencyCode: string;
  description: string;
  priceRangeLabel: string;
};

// Emits a minimal `Offer` JSON-LD node with a `priceRange` and `priceCurrency`.
// Visible content on the page must show the same range — see `P15-SEO-001`
// acceptance criteria.
export function buildOfferSchema({
  currencyCode,
  description,
  priceRangeLabel,
}: BuildOfferSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    description,
    priceCurrency: currencyCode,
    priceRange: priceRangeLabel,
  };
}
