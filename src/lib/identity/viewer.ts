import type { Route } from "next";

import type { ResolvedAuthAccount } from "@/lib/auth/account-service";

export type ViewerIdentity = {
  avatarUrl: string | null;
  displayName: string;
  settingsHref: Route;
};

type ViewerSource = Pick<ResolvedAuthAccount, "avatar_url" | "email" | "full_name">;

const SETTINGS_HREF = "/settings" as Route;

export function resolveViewerIdentity(account: ViewerSource): ViewerIdentity {
  return {
    avatarUrl: account.avatar_url,
    displayName: resolveDisplayName(account),
    settingsHref: SETTINGS_HREF,
  };
}

function resolveDisplayName(account: ViewerSource) {
  const fullName = account.full_name?.trim();
  if (fullName) {
    return fullName;
  }

  const email = account.email?.trim();
  if (email) {
    const localPart = email.split("@")[0] ?? "";
    if (localPart) {
      return localPart;
    }
  }

  return "?";
}
