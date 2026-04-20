import { buildCanonicalUrl } from "@/lib/seo/metadata/canonical";

type BuildWebPageSchemaInput = {
  description: string;
  pathname: string;
  title: string;
};

export function buildWebPageSchema({
  title,
  description,
  pathname,
}: BuildWebPageSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    description,
    name: title,
    url: buildCanonicalUrl(pathname).toString(),
  };
}
