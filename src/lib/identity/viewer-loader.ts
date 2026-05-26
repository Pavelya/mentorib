import "server-only";

import type { Route } from "next";
import { cache } from "react";

import { ensureAuthAccount, type ResolvedAuthAccount } from "@/lib/auth/account-service";
import { resolveViewerIdentity, type ViewerIdentity } from "@/lib/identity/viewer";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasRole } from "@/modules/accounts/account-state";

const loadResolvedAuthAccount = cache(async (): Promise<ResolvedAuthAccount | null> => {
  if (!isSupabaseAuthConfigured()) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email?.trim()) {
      return null;
    }

    return await ensureAuthAccount(user);
  } catch {
    return null;
  }
});

export const loadViewerIdentity = cache(
  async (): Promise<ViewerIdentity | null> => {
    const account = await loadResolvedAuthAccount();
    if (!account) {
      return null;
    }
    return resolveViewerIdentity(account);
  },
);

export type PublicWorkspaceShortcut = {
  href: Route;
  label: string;
};

export const loadPublicWorkspaceShortcut = cache(
  async (): Promise<PublicWorkspaceShortcut | null> => {
    const account = await loadResolvedAuthAccount();
    if (!account) {
      return null;
    }

    const snapshot = {
      account_status: account.account_status,
      onboarding_state: account.onboarding_state,
      primary_role_context: account.primary_role_context,
      roles: account.roles,
    };

    if (hasRole(snapshot, "student")) {
      return { href: "/results" as Route, label: "Go to my matches" };
    }
    if (hasRole(snapshot, "tutor")) {
      return { href: "/tutor/overview" as Route, label: "Go to tutor workspace" };
    }
    return null;
  },
);
