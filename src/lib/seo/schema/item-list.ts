import { buildAbsoluteUrl } from "@/lib/seo/site";

type ItemListEntry = {
  name: string;
  pathname: string;
};

// Use only when the page visibly renders the same list, in the same order, as
// crawlable links — see `docs/architecture/structured-data-map-v1.md`.
export function buildItemListSchema(entries: readonly ItemListEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      name: entry.name,
      position: index + 1,
      url: buildAbsoluteUrl(entry.pathname).toString(),
    })),
  };
}
