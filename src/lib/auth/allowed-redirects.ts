import { siteConfig } from "@/lib/seo/site";

const ALLOWED_TOP_LEVEL_SEGMENTS = new Set([
  "",
  "become-a-tutor",
  "billing",
  "book",
  "compare",
  "how-it-works",
  "internal",
  "lessons",
  "match",
  "messages",
  "notifications",
  "privacy",
  "results",
  "settings",
  "setup",
  "support",
  "trust-and-safety",
  "tutor",
  "tutors",
]);

export type AuthVerifyStatus = "error" | "expired" | "sent";

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
    const topLevelSegment = resolvedUrl.pathname.split("/").filter(Boolean)[0] ?? "";

    if (
      resolvedUrl.pathname.startsWith("/auth/") ||
      !ALLOWED_TOP_LEVEL_SEGMENTS.has(topLevelSegment)
    ) {
      return null;
    }

    return `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;
  } catch {
    return null;
  }
}

export function buildAuthCallbackPath(nextPath?: string | null) {
  return buildPathWithOptionalNext("/auth/callback", nextPath);
}

export function buildAuthSignInPath(nextPath?: string | null) {
  return buildPathWithOptionalNext("/auth/sign-in", nextPath);
}

export function buildAuthVerifyPath(
  status: AuthVerifyStatus = "sent",
  nextPath?: string | null,
) {
  const url = new URL("/auth/verify", siteConfig.origin);
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

function buildPathWithOptionalNext(pathname: string, nextPath?: string | null) {
  const url = new URL(pathname, siteConfig.origin);
  const safeNextPath = getSafeRedirectPath(nextPath);

  if (safeNextPath) {
    url.searchParams.set("next", safeNextPath);
  }

  return `${url.pathname}${url.search}`;
}
