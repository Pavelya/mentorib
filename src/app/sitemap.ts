import type { MetadataRoute } from "next";

import { buildSitemapEntries } from "@/lib/seo/sitemap/build-entries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemapEntries();
}
