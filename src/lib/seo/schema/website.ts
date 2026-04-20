import { buildAbsoluteUrl, siteConfig } from "@/lib/seo/site";

export function buildWebSiteSchema(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    description,
    name: siteConfig.name,
    url: buildAbsoluteUrl("/").toString(),
  };
}
