import type { MetadataRoute } from "next";

import { getSitemapUrl, isPreviewDeployment, siteConfig } from "@/lib/seo/site";

const PRIVATE_ROUTE_DISALLOWS = [
  "/auth/",
  "/billing",
  "/book/",
  "/compare",
  "/internal/",
  "/lessons",
  "/match",
  "/messages",
  "/notifications",
  "/privacy",
  "/results",
  "/settings",
  "/setup/",
  "/tutor/",
] as const;

export default function robots(): MetadataRoute.Robots {
  if (isPreviewDeployment()) {
    return {
      host: siteConfig.origin.toString(),
      rules: {
        disallow: "/",
        userAgent: "*",
      },
      sitemap: getSitemapUrl().toString(),
    };
  }

  return {
    host: siteConfig.origin.toString(),
    rules: [
      {
        allow: "/",
        disallow: [...PRIVATE_ROUTE_DISALLOWS],
        userAgent: "*",
      },
    ],
    sitemap: getSitemapUrl().toString(),
  };
}
