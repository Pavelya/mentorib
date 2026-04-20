import type { StaticPublicRouteDefinition } from "@/lib/seo/public-routes";

export function shouldIncludeStaticRouteInSitemap(
  route: StaticPublicRouteDefinition,
  isIndexable: boolean,
) {
  return route.searchReady && isIndexable;
}
