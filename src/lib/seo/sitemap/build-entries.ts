import type { MetadataRoute } from "next";

import { staticPublicRoutes } from "@/lib/seo/public-routes";
import { shouldIncludeStaticRouteInSitemap } from "@/lib/seo/sitemap/include-route";
import { buildAbsoluteUrl } from "@/lib/seo/site";
import { listPublicTutorProfileSitemapEntries } from "@/modules/tutors/public-profile";

async function buildTutorProfileSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const profiles = await listPublicTutorProfileSitemapEntries();

  return profiles.map((profile) => ({
    changeFrequency: "weekly" as const,
    lastModified: new Date(profile.updatedAt),
    priority: 0.6,
    url: buildAbsoluteUrl(profile.pathname).toString(),
  }));
}

export async function buildSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = staticPublicRoutes
    .filter((route) =>
      shouldIncludeStaticRouteInSitemap(route, route.searchReady),
    )
    .map((route) => ({
      changeFrequency: "weekly" as const,
      lastModified: new Date(),
      priority: route.pathname === "/" ? 1 : 0.7,
      url: buildAbsoluteUrl(route.pathname).toString(),
    }));

  const tutorProfileEntries = await buildTutorProfileSitemapEntries();

  return [...staticEntries, ...tutorProfileEntries];
}
