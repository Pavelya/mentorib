import type { MetadataRoute } from "next";

import { staticPublicRoutes } from "@/lib/seo/public-routes";
import { shouldIncludeStaticRouteInSitemap } from "@/lib/seo/sitemap/include-route";
import { buildAbsoluteUrl } from "@/lib/seo/site";
import {
  listPublishedComboSeoPairs,
  listPublishedServiceSeoSlugs,
  listPublishedSubjectSeoSlugs,
} from "@/modules/marketing/seo-landing/page-data";
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

async function buildSeoLandingSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const [subjectSlugs, serviceSlugs, comboPairs] = await Promise.all([
    listPublishedSubjectSeoSlugs(),
    listPublishedServiceSeoSlugs(),
    listPublishedComboSeoPairs(),
  ]);

  const lastModified = new Date();

  const subjectEntries = subjectSlugs.map((slug) => ({
    changeFrequency: "weekly" as const,
    lastModified,
    priority: 0.65,
    url: buildAbsoluteUrl(`/subjects/${slug}`).toString(),
  }));
  const serviceEntries = serviceSlugs.map((slug) => ({
    changeFrequency: "weekly" as const,
    lastModified,
    priority: 0.65,
    url: buildAbsoluteUrl(`/services/${slug}`).toString(),
  }));
  const comboEntries = comboPairs.map((pair) => ({
    changeFrequency: "weekly" as const,
    lastModified,
    priority: 0.6,
    url: buildAbsoluteUrl(
      `/subjects/${pair.subjectSlug}/${pair.needSlug}`,
    ).toString(),
  }));

  return [...subjectEntries, ...serviceEntries, ...comboEntries];
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

  const [tutorProfileEntries, seoLandingEntries] = await Promise.all([
    buildTutorProfileSitemapEntries(),
    buildSeoLandingSitemapEntries(),
  ]);

  const tutorSearchEntry = {
    changeFrequency: "daily" as const,
    lastModified: new Date(),
    priority: 0.75,
    url: buildAbsoluteUrl("/tutors").toString(),
  };

  return [
    ...staticEntries,
    tutorSearchEntry,
    ...tutorProfileEntries,
    ...seoLandingEntries,
  ];
}
