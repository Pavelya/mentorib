import type { StaticPublicRouteDefinition } from "@/lib/seo/public-routes";

export function shouldIncludeStaticRouteInSitemap(
  route: StaticPublicRouteDefinition,
  isIndexable: boolean,
) {
  return route.routeClass === "A" && route.searchReady && isIndexable;
}
