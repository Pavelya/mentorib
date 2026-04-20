import { buildAbsoluteUrl, siteConfig } from "@/lib/seo/site";

export function buildOrganizationSchema(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    description,
    name: siteConfig.name,
    url: buildAbsoluteUrl("/").toString(),
  };
}
