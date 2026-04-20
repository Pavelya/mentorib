const LOCAL_SITE_ORIGIN = "http://localhost:3000";
const PRODUCTION_SITE_ORIGIN = "https://mentorib.com";

const RAW_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL;

function normalizeOrigin(origin: string) {
  const withProtocol = origin.startsWith("http://") || origin.startsWith("https://")
    ? origin
    : `https://${origin}`;

  return withProtocol.endsWith("/") ? withProtocol.slice(0, -1) : withProtocol;
}

function resolveConfiguredSiteOrigin() {
  if (!RAW_SITE_ORIGIN) {
    return new URL(PRODUCTION_SITE_ORIGIN);
  }

  try {
    return new URL(normalizeOrigin(RAW_SITE_ORIGIN));
  } catch {
    return new URL(PRODUCTION_SITE_ORIGIN);
  }
}

export const siteConfig = {
  defaultDescription:
    "Mentor IB is a match-first IB tutoring product for students, parents, and tutors.",
  defaultOgImagePath: "/opengraph-image",
  developmentOrigin: new URL(LOCAL_SITE_ORIGIN),
  locale: "en_US",
  name: "Mentor IB",
  origin: resolveConfiguredSiteOrigin(),
  productionOrigin: new URL(PRODUCTION_SITE_ORIGIN),
} as const;

export function isPreviewDeployment() {
  return process.env.VERCEL_ENV === "preview";
}

export function isProductionBuild() {
  return process.env.NODE_ENV === "production";
}

export function canAllowIndexing() {
  return isProductionBuild() && !isPreviewDeployment();
}

export function buildAbsoluteUrl(pathname: string) {
  return new URL(pathname, siteConfig.origin);
}

export function getSitemapUrl() {
  return buildAbsoluteUrl("/sitemap.xml");
}
