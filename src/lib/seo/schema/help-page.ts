import { buildCanonicalUrl } from "@/lib/seo/metadata/canonical";

type BuildHelpPageSchemaInput = {
  description: string;
  pathname: string;
  title: string;
};

export function buildHelpPageSchema({
  title,
  description,
  pathname,
}: BuildHelpPageSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "HelpPage",
    description,
    name: title,
    url: buildCanonicalUrl(pathname).toString(),
  };
}
