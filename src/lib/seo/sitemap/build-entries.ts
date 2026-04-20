import type { MetadataRoute } from "next";

import { staticPublicRoutes } from "@/lib/seo/public-routes";
import { createPendingPublicIndexability } from "@/lib/seo/quality/public-indexability";
import { shouldIncludeStaticRouteInSitemap } from "@/lib/seo/sitemap/include-route";
import { buildAbsoluteUrl } from "@/lib/seo/site";

async function buildTutorProfileSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const qualityGate = createPendingPublicIndexability(
    "Tutor profile sitemap inclusion begins after approved public profile data is connected.",
  );

  if (!qualityGate.isSitemapEligible) {
    return [];
  }

  return [];
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
