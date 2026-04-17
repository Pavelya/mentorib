import type { Route } from "next";

import { routeFamilies, type RouteFamilyKey } from "@/lib/routing/route-families";

export function getFamilyHome(family: RouteFamilyKey): Route {
  return routeFamilies[family].defaultHref;
}

export function getSignInRedirect(): Route {
  return routeFamilies.auth.defaultHref;
}
