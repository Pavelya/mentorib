import { buildCanonicalUrl } from "@/lib/seo/metadata/canonical";

type BuildServiceSchemaInput = {
  description: string;
  name: string;
  pathname: string;
  providerName: string;
  providerUrl: string;
  serviceType: string;
};

export function buildServiceSchema({
  description,
  name,
  pathname,
  providerName,
  providerUrl,
  serviceType,
}: BuildServiceSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    areaServed: "Worldwide (online)",
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "IB Diploma Programme student",
    },
    description,
    name,
    provider: {
      "@type": "Organization",
      name: providerName,
      url: providerUrl,
    },
    serviceType,
    url: buildCanonicalUrl(pathname).toString(),
  };
}
