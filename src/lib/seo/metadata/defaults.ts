import type { Metadata } from "next";

import { buildOpenGraphMetadata, buildTwitterMetadata } from "@/lib/seo/metadata/open-graph";
import { canAllowIndexing, siteConfig } from "@/lib/seo/site";

function buildPreviewRobots() {
  if (canAllowIndexing()) {
    return undefined;
  }

  return {
    follow: false,
    googleBot: {
      follow: false,
      index: false,
      "max-image-preview": "none" as const,
      "max-snippet": 0,
      "max-video-preview": 0,
    },
    index: false,
  } satisfies NonNullable<Metadata["robots"]>;
}

export function buildRootMetadata(): Metadata {
  return {
    applicationName: siteConfig.name,
    description: siteConfig.defaultDescription,
    metadataBase: siteConfig.origin,
    openGraph: buildOpenGraphMetadata({
      description: siteConfig.defaultDescription,
      pathname: "/",
      title: siteConfig.name,
      type: "website",
    }),
    robots: buildPreviewRobots(),
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`,
    },
    twitter: buildTwitterMetadata(siteConfig.name, siteConfig.defaultDescription),
  };
}

export function buildPublicLayoutMetadata(): Metadata {
  return {
    description:
      "Public discovery, trust, and tutor acquisition routes for the Mentor IB ecosystem.",
    openGraph: {
      images: buildOpenGraphMetadata({
        description: siteConfig.defaultDescription,
        pathname: "/",
        title: siteConfig.name,
        type: "website",
      }).images,
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      images: buildTwitterMetadata(siteConfig.name, siteConfig.defaultDescription).images,
    },
  };
}

export function buildNonIndexableSectionMetadata(
  title: string,
  description: string,
): Metadata {
  return {
    description,
    robots: {
      follow: false,
      googleBot: {
        follow: false,
        index: false,
        "max-image-preview": "none",
        "max-snippet": 0,
        "max-video-preview": 0,
      },
      index: false,
    },
    title: {
      default: title,
      template: `%s | ${siteConfig.name}`,
    },
  };
}
