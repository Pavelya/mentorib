import { headers } from "next/headers";

import { siteConfig } from "@/lib/seo/site";

export async function getRequestOrigin() {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (forwardedHost) {
    const protocol =
      requestHeaders.get("x-forwarded-proto") ??
      (forwardedHost.includes("localhost") ? "http" : "https");

    return `${protocol}://${forwardedHost}`;
  }

  return requestHeaders.get("origin") ?? siteConfig.origin.origin;
}
