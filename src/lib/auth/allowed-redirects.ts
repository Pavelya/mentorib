import { siteConfig } from "@/lib/seo/site";
import {
  authRoutes,
  type AuthVerifyStatus,
  getSafeAuthCallbackOrigin,
  isApprovedAuthReturnPath,
} from "@/lib/auth/auth-boundary";
import { normalizeTimezone } from "@/lib/datetime";

export type { AuthVerifyStatus } from "@/lib/auth/auth-boundary";

export function getSafeRedirectPath(candidate: string | null | undefined) {
  if (!candidate) {
    return null;
  }

  const trimmedCandidate = candidate.trim();

  if (!trimmedCandidate.startsWith("/") || trimmedCandidate.startsWith("//")) {
    return null;
  }

  try {
    const resolvedUrl = new URL(trimmedCandidate, siteConfig.origin);

    if (
      resolvedUrl.pathname.startsWith("/auth/") ||
      !isApprovedAuthReturnPath(resolvedUrl.pathname)
    ) {
      return null;
    }

    return `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;
  } catch {
    return null;
  }
}

export function buildAuthCallbackPath(nextPath?: string | null) {
  return buildPathWithOptionalNext(authRoutes.callback, nextPath);
}

export function buildAuthCallbackUrl(
  originCandidate: string | null | undefined,
  nextPath?: string | null,
  timezone?: string | null,
) {
  return new URL(
    buildPathWithOptionalNext(authRoutes.callback, nextPath, timezone),
    getSafeAuthCallbackOrigin(originCandidate),
  ).toString();
}

export function buildAuthSignInPath(nextPath?: string | null) {
  return buildPathWithOptionalNext(authRoutes.signIn, nextPath);
}

export function buildAuthVerifyPath(
  status: AuthVerifyStatus = "sent",
  nextPath?: string | null,
) {
  const url = new URL(authRoutes.verify, siteConfig.origin);
  url.searchParams.set("status", status);

  const safeNextPath = getSafeRedirectPath(nextPath);

  if (safeNextPath) {
    url.searchParams.set("next", safeNextPath);
  }

  return `${url.pathname}${url.search}`;
}

export function isExpiredAuthError(errorMessage: string | null | undefined) {
  if (!errorMessage) {
    return false;
  }

  return /expired|otp_expired|invalid or has expired/i.test(errorMessage);
}

export function getAuthVerifyStatusForCallbackError(
  errorMessage: string | null | undefined,
  defaultStatus: Exclude<AuthVerifyStatus, "expired" | "sent"> = "error",
): Exclude<AuthVerifyStatus, "sent"> {
  return isExpiredAuthError(errorMessage) ? "expired" : defaultStatus;
}

function buildPathWithOptionalNext(
  pathname: string,
  nextPath?: string | null,
  timezone?: string | null,
) {
  const url = new URL(pathname, siteConfig.origin);
  const safeNextPath = getSafeRedirectPath(nextPath);
  const normalizedTimezone = normalizeTimezone(timezone);

  if (safeNextPath) {
    url.searchParams.set("next", safeNextPath);
  }

  if (normalizedTimezone) {
    url.searchParams.set("timezone", normalizedTimezone);
  }

  return `${url.pathname}${url.search}`;
}
