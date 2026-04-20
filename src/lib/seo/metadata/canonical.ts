import { buildAbsoluteUrl } from "@/lib/seo/site";

export function normalizePathname(pathname: string) {
  if (!pathname.startsWith("/")) {
    return `/${pathname}`;
  }

  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function buildCanonicalUrl(pathname: string) {
  return buildAbsoluteUrl(normalizePathname(pathname));
}
