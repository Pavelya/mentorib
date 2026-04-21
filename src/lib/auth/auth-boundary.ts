import type { Provider } from "@supabase/supabase-js";

import { siteConfig } from "@/lib/seo/site";

export const authRoutes = {
  callback: "/auth/callback",
  signIn: "/auth/sign-in",
  verify: "/auth/verify",
} as const satisfies Record<string, `/${string}`>;

export const authVerifyStatuses = [
  "callback_error",
  "error",
  "expired",
  "sent",
] as const;

export type AuthVerifyStatus = (typeof authVerifyStatuses)[number];

export const authProviders = {
  google: {
    id: "google",
    label: "Google",
    queryParams: {
      prompt: "select_account",
    },
  },
} as const satisfies Record<
  string,
  {
    id: Provider;
    label: string;
    queryParams: Record<string, string>;
  }
>;

export const authEmailBranding = {
  senderEmail: "auth@mentorib.com",
  senderName: siteConfig.name,
  smtpHost: "smtp.resend.com",
  smtpPort: 465,
  templates: [
    {
      id: "magic_link",
      subject: `Sign in to ${siteConfig.name}`,
    },
    {
      id: "confirm_signup",
      subject: `Confirm your ${siteConfig.name} account`,
    },
    {
      id: "change_email_address",
      subject: `Confirm your ${siteConfig.name} email change`,
    },
  ],
} as const;

type AuthReturnPathMatcher =
  | {
      family: AuthReturnPathFamily;
      kind: "exact";
      path: `/${string}`;
    }
  | {
      family: AuthReturnPathFamily;
      kind: "prefix";
      prefix: `/${string}/`;
    };

export type AuthReturnPathFamily =
  | "account"
  | "internal"
  | "public"
  | "setup"
  | "student"
  | "tutor"
  | "tutor_application";

export const authReturnPathPolicy = [
  { family: "public", kind: "exact", path: "/" },
  { family: "public", kind: "exact", path: "/become-a-tutor" },
  { family: "account", kind: "exact", path: "/billing" },
  { family: "student", kind: "exact", path: "/compare" },
  { family: "public", kind: "exact", path: "/how-it-works" },
  { family: "internal", kind: "exact", path: "/internal" },
  { family: "internal", kind: "exact", path: "/internal/moderation" },
  { family: "internal", kind: "exact", path: "/internal/reference-data" },
  { family: "internal", kind: "exact", path: "/internal/tutor-reviews" },
  { family: "student", kind: "exact", path: "/lessons" },
  { family: "student", kind: "exact", path: "/match" },
  { family: "student", kind: "exact", path: "/messages" },
  { family: "account", kind: "exact", path: "/notifications" },
  { family: "account", kind: "exact", path: "/privacy" },
  { family: "student", kind: "exact", path: "/results" },
  { family: "account", kind: "exact", path: "/settings" },
  { family: "setup", kind: "exact", path: "/setup/role" },
  { family: "public", kind: "exact", path: "/support" },
  { family: "public", kind: "exact", path: "/trust-and-safety" },
  { family: "tutor_application", kind: "exact", path: "/tutor/apply" },
  { family: "tutor", kind: "exact", path: "/tutor/earnings" },
  { family: "tutor", kind: "exact", path: "/tutor/lessons" },
  { family: "tutor", kind: "exact", path: "/tutor/messages" },
  { family: "tutor", kind: "exact", path: "/tutor/overview" },
  { family: "tutor", kind: "exact", path: "/tutor/schedule" },
  { family: "student", kind: "prefix", prefix: "/book/" },
  { family: "internal", kind: "prefix", prefix: "/internal/users/" },
  { family: "public", kind: "prefix", prefix: "/tutors/" },
] as const satisfies readonly AuthReturnPathMatcher[];

const localAuthHostnames = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isApprovedAuthReturnPath(pathname: string) {
  return getAuthReturnPathFamily(pathname) !== null;
}

export function getAuthReturnPathFamily(
  pathname: string,
): AuthReturnPathFamily | null {
  const normalizedPathname = normalizePathname(pathname);
  const matcher = authReturnPathPolicy.find((candidate) => {
    if (candidate.kind === "exact") {
      return normalizedPathname === candidate.path;
    }

    return normalizedPathname.startsWith(candidate.prefix);
  });

  return matcher?.family ?? null;
}

export function getSafeAuthCallbackOrigin(candidate: string | null | undefined) {
  if (!candidate) {
    return siteConfig.origin.origin;
  }

  try {
    const origin = new URL(candidate).origin;

    if (isApprovedAuthCallbackOrigin(origin)) {
      return origin;
    }
  } catch {
    return siteConfig.origin.origin;
  }

  return siteConfig.origin.origin;
}

export function isApprovedAuthCallbackOrigin(candidate: string) {
  let candidateUrl: URL;

  try {
    candidateUrl = new URL(candidate);
  } catch {
    return false;
  }

  if (
    candidateUrl.origin === siteConfig.origin.origin ||
    candidateUrl.origin === siteConfig.productionOrigin.origin ||
    candidateUrl.origin === siteConfig.developmentOrigin.origin
  ) {
    return true;
  }

  const vercelDeploymentHost = getNormalizedHostname(process.env.VERCEL_URL);

  if (
    vercelDeploymentHost &&
    candidateUrl.protocol === "https:" &&
    candidateUrl.hostname === vercelDeploymentHost
  ) {
    return true;
  }

  return (
    process.env.NODE_ENV !== "production" &&
    candidateUrl.protocol === "http:" &&
    localAuthHostnames.has(candidateUrl.hostname)
  );
}

function normalizePathname(pathname: string) {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function getNormalizedHostname(candidate: string | null | undefined) {
  if (!candidate) {
    return null;
  }

  try {
    return new URL(normalizeOrigin(candidate)).hostname;
  } catch {
    return null;
  }
}

function normalizeOrigin(origin: string) {
  const withProtocol = origin.startsWith("http://") || origin.startsWith("https://")
    ? origin
    : `https://${origin}`;

  return withProtocol.endsWith("/") ? withProtocol.slice(0, -1) : withProtocol;
}
