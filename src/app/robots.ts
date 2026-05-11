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
  // The authenticated account snapshot is `/privacy` exactly. Use the `$`
  // end-of-URL terminator so the public `/privacy-policy` legal surface is
  // not also blocked by a prefix match.
  "/privacy$",
  "/results",
  "/saved",
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
