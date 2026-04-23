"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import {
  applySetupRoleSelection,
  buildSetupRoleRedirect,
  ensureAuthAccount,
  resolvePostSignInRedirect,
  type SetupRoleSelection,
} from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { routeFamilies } from "@/lib/routing/route-families";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requiresRoleSelection } from "@/modules/accounts/account-state";

export type RoleSelectionActionState = {
  error: string | null;
  selectedRole: SetupRoleSelection | null;
};

export async function selectSetupRoleAction(
  _previousState: RoleSelectionActionState,
  formData: FormData,
): Promise<RoleSelectionActionState> {
  const selectedRole = getSelectedRole(formData);

  if (!selectedRole) {
    return {
      error: "Choose learner or tutor to continue.",
      selectedRole: null,
    };
  }

  if (!isSupabaseAuthConfigured()) {
    return {
      error: "Role setup is unavailable until the Supabase auth environment is configured.",
      selectedRole,
    };
  }

  let redirectPath: string;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email?.trim()) {
      redirectPath = buildAuthSignInPath(routeFamilies.setup.defaultHref);
    } else {
      const account = await ensureAuthAccount(user);

      if (requiresRoleSelection(account)) {
        await applySetupRoleSelection(account, selectedRole);
        redirectPath = await resolvePostSignInRedirect(
          account,
          null,
          buildSetupRoleRedirect(selectedRole),
        );
      } else {
        redirectPath = await resolvePostSignInRedirect(account);
      }
    }
  } catch {
    return {
      error: "We couldn't save your role yet. Please try again in a moment.",
      selectedRole,
    };
  }

  redirect(redirectPath as Route);
}

function getSelectedRole(formData: FormData): SetupRoleSelection | null {
  const role = formData.get("role");

  if (role === "student" || role === "tutor") {
    return role;
  }

  return null;
}
