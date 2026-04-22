import type { Metadata } from "next";

import type { StaticPublicRouteDefinition } from "@/lib/seo/public-routes";
import { buildCanonicalUrl } from "@/lib/seo/metadata/canonical";
import {
  buildOpenGraphMetadata,
  buildTwitterMetadata,
} from "@/lib/seo/metadata/open-graph";
import {
  createApprovedPublicIndexability,
  createPendingPublicIndexability,
} from "@/lib/seo/quality/public-indexability";
import { canAllowIndexing } from "@/lib/seo/site";

type OpenGraphType = "article" | "profile" | "website";

type BuildRouteMetadataInput = {
  description: string;
  isIndexable: boolean;
  pathname: string;
  title: string;
  type: OpenGraphType;
};

function buildRouteRobots(isIndexable: boolean): NonNullable<Metadata["robots"]> {
  const allowIndexing = canAllowIndexing() && isIndexable;

  if (!allowIndexing) {
    return {
      follow: false,
      googleBot: {
        follow: false,
        index: false,
        "max-image-preview": "none",
        "max-snippet": 0,
        "max-video-preview": 0,
      },
      index: false,
    };
  }

  return {
    follow: true,
    googleBot: {
      follow: true,
      index: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    index: true,
  };
}

export function buildRouteMetadata({
  title,
  description,
  pathname,
  type,
  isIndexable,
}: BuildRouteMetadataInput): Metadata {
  const canonical = buildCanonicalUrl(pathname);

  return {
    alternates: {
      canonical,
    },
    description,
    openGraph: buildOpenGraphMetadata({
      description,
      pathname,
      title,
      type,
    }),
    robots: buildRouteRobots(isIndexable),
    title,
    twitter: buildTwitterMetadata(title, description),
  };
}

export function buildStaticPublicRouteMetadata(
  route: StaticPublicRouteDefinition,
): Metadata {
  const qualityGate = route.searchReady && route.routeClass === "A"
    ? createApprovedPublicIndexability()
    : createPendingPublicIndexability(
        route.searchReadyBlocker ??
          "Public route is not approved for indexation in its current route class or content state.",
      );

  return buildRouteMetadata({
    description: route.description,
    isIndexable: qualityGate.isIndexable,
    pathname: route.pathname,
    title: route.title,
    type: route.openGraphType,
  });
}
