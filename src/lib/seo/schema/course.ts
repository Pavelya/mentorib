import { buildCanonicalUrl } from "@/lib/seo/metadata/canonical";

type BuildCourseSchemaInput = {
  description: string;
  name: string;
  pathname: string;
  providerName: string;
  providerUrl: string;
};

export function buildCourseSchema({
  description,
  name,
  pathname,
  providerName,
  providerUrl,
}: BuildCourseSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    description,
    name,
    provider: {
      "@type": "Organization",
      name: providerName,
      url: providerUrl,
    },
    url: buildCanonicalUrl(pathname).toString(),
  };
}
