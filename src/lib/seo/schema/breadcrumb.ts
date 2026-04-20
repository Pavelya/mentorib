import { buildAbsoluteUrl } from "@/lib/seo/site";

type BreadcrumbItem = {
  name: string;
  pathname: string;
};

export function buildBreadcrumbListSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      item: buildAbsoluteUrl(item.pathname).toString(),
      name: item.name,
      position: index + 1,
    })),
  };
}
