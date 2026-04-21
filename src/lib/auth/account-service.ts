import type { User } from "@supabase/supabase-js";

import {
  getAuthReturnPathFamily,
  type AuthReturnPathFamily,
} from "@/lib/auth/auth-boundary";
import { routeFamilies } from "@/lib/routing/route-families";
import { siteConfig } from "@/lib/seo/site";
import {
  hasRole,
  isRestrictedAccount,
  requiresRoleSelection,
  type AccountRoleSnapshot,
  type AccountStateSnapshot,
} from "@/modules/accounts/account-state";
import type {
  AccountStatus,
  OnboardingState,
  PrimaryRoleContext,
  Role,
  RoleStatus,
} from "@/modules/accounts/constants";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

const accountSelect =
  "id, auth_user_id, email, full_name, avatar_url, onboarding_state, account_status, primary_role_context";

type AppUserRecord = {
  account_status: AccountStatus;
  auth_user_id: string;
  avatar_url: string | null;
  email: string;
  full_name: string | null;
  id: string;
  onboarding_state: OnboardingState;
  primary_role_context: PrimaryRoleContext | null;
};

type UserRoleRecord = AccountRoleSnapshot;
export type SetupRoleSelection = Extract<Role, "student" | "tutor">;

export type ResolvedAuthAccount = AppUserRecord & {
  isNewAccount: boolean;
  roles: readonly UserRoleRecord[];
};

export async function ensureAuthAccount(user: User): Promise<ResolvedAuthAccount> {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const profile = normalizeProfileFromUser(user);

  const { data: existingAccount, error: existingAccountError } = await serviceRoleClient
    .from("app_users")
    .select(accountSelect)
    .eq("auth_user_id", user.id)
    .maybeSingle<AppUserRecord>();

  if (existingAccountError) {
    throw new Error("Could not resolve the signed-in account.");
  }

  let account = existingAccount;
  let isNewAccount = false;

  if (!account) {
    const { data: insertedAccount, error: insertError } = await serviceRoleClient
      .from("app_users")
      .insert({
        auth_user_id: user.id,
        avatar_url: profile.avatarUrl,
        email: profile.email,
        full_name: profile.fullName,
      })
      .select(accountSelect)
      .single<AppUserRecord>();

    if (insertError || !insertedAccount) {
      throw new Error("Could not create the signed-in account.");
    }

    account = insertedAccount;
    isNewAccount = true;
  } else {
    const accountUpdates = buildAccountUpdates(account, profile);

    if (Object.keys(accountUpdates).length > 0) {
      const { data: updatedAccount, error: updateError } = await serviceRoleClient
        .from("app_users")
        .update(accountUpdates)
        .eq("id", account.id)
        .select(accountSelect)
        .single<AppUserRecord>();

      if (updateError || !updatedAccount) {
        throw new Error("Could not refresh the signed-in account profile.");
      }

      account = updatedAccount;
    }
  }

  const { data: roles, error: rolesError } = await serviceRoleClient
    .from("user_roles")
    .select("role, role_status")
    .eq("app_user_id", account.id)
    .returns<UserRoleRecord[]>();

  if (rolesError) {
    throw new Error("Could not resolve the signed-in account roles.");
  }

  return {
    ...account,
    isNewAccount,
    roles: roles ?? [],
  };
}

export async function applySetupRoleSelection(
  account: Pick<ResolvedAuthAccount, "full_name" | "id">,
  selectedRole: SetupRoleSelection,
) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const roleStatus: RoleStatus = selectedRole === "student" ? "active" : "pending";
  const onboardingState: OnboardingState =
    selectedRole === "student" ? "student_setup" : "tutor_application_started";
  const displayName = normalizeOptionalText(account.full_name);

  const { error: roleError } = await serviceRoleClient.from("user_roles").upsert(
    {
      app_user_id: account.id,
      revoked_at: null,
      role: selectedRole,
      role_status: roleStatus,
    },
    { onConflict: "app_user_id,role" },
  );

  if (roleError) {
    throw new Error("Could not save the selected account role.");
  }

  if (selectedRole === "student") {
    const { error: profileError } = await serviceRoleClient
      .from("student_profiles")
      .upsert(
        {
          app_user_id: account.id,
          display_name: displayName,
        },
        { ignoreDuplicates: true, onConflict: "app_user_id" },
      );

    if (profileError) {
      throw new Error("Could not create the student profile.");
    }
  } else {
    const { error: profileError } = await serviceRoleClient
      .from("tutor_profiles")
      .upsert(
        {
          app_user_id: account.id,
          application_status: "in_progress",
          display_name: displayName,
        },
        { ignoreDuplicates: true, onConflict: "app_user_id" },
      );

    if (profileError) {
      throw new Error("Could not create the tutor profile.");
    }
  }

  const { error: accountError } = await serviceRoleClient
    .from("app_users")
    .update({
      onboarding_state: onboardingState,
      primary_role_context: selectedRole,
    })
    .eq("id", account.id);

  if (accountError) {
    throw new Error("Could not update the account setup state.");
  }
}

export function buildPostSignInRedirect(
  account: Pick<
    ResolvedAuthAccount,
    "account_status" | "onboarding_state" | "primary_role_context" | "roles"
  >,
  requestedNextPath?: string | null,
) {
  const snapshot: AccountStateSnapshot = {
    account_status: account.account_status,
    onboarding_state: account.onboarding_state,
    primary_role_context: account.primary_role_context,
    roles: account.roles,
  };

  if (requiresRoleSelection(snapshot)) {
    return routeFamilies.setup.defaultHref;
  }

  if (isRestrictedAccount(snapshot)) {
    return routeFamilies.account.defaultHref;
  }

  if (requestedNextPath && canUsePostSignInRedirect(snapshot, requestedNextPath)) {
    return requestedNextPath;
  }

  if (hasRole(snapshot, "admin")) {
    return routeFamilies.internal.defaultHref;
  }

  if (hasRole(snapshot, "student")) {
    return routeFamilies.student.defaultHref;
  }

  if (hasRole(snapshot, "tutor")) {
    return routeFamilies.tutor.defaultHref;
  }

  if (hasRole(snapshot, "tutor", ["pending"])) {
    return "/tutor/apply";
  }

  if (account.primary_role_context === "tutor") {
    return "/tutor/apply";
  }

  return routeFamilies.account.defaultHref;
}

function canUsePostSignInRedirect(
  snapshot: AccountStateSnapshot,
  requestedNextPath: string,
) {
  const family = getReturnPathFamily(requestedNextPath);

  if (!family) {
    return false;
  }

  return canAccessReturnPathFamily(snapshot, family);
}

function canAccessReturnPathFamily(
  snapshot: AccountStateSnapshot,
  family: AuthReturnPathFamily,
) {
  switch (family) {
    case "account":
    case "public":
      return true;
    case "internal":
      return hasRole(snapshot, "admin");
    case "setup":
      return requiresRoleSelection(snapshot);
    case "student":
      return hasRole(snapshot, "student");
    case "tutor":
      return hasRole(snapshot, "tutor");
    case "tutor_application":
      return (
        hasRole(snapshot, "tutor", ["active", "pending"]) ||
        snapshot.primary_role_context === "tutor"
      );
  }
}

function getReturnPathFamily(requestedNextPath: string) {
  try {
    return getAuthReturnPathFamily(
      new URL(requestedNextPath, siteConfig.origin).pathname,
    );
  } catch {
    return null;
  }
}

export function buildSetupRoleRedirect(selectedRole: SetupRoleSelection) {
  return selectedRole === "student" ? routeFamilies.student.defaultHref : "/tutor/apply";
}

function normalizeProfileFromUser(user: User) {
  const fullName = getStringMetadata(user, "full_name") ?? getStringMetadata(user, "name");
  const avatarUrl =
    getStringMetadata(user, "avatar_url") ?? getStringMetadata(user, "picture");

  return {
    avatarUrl,
    email: user.email?.trim().toLowerCase() ?? "",
    fullName,
  };
}

function buildAccountUpdates(
  account: Pick<AppUserRecord, "avatar_url" | "email" | "full_name">,
  profile: ReturnType<typeof normalizeProfileFromUser>,
) {
  const updates: Partial<
    Pick<AppUserRecord, "avatar_url" | "email" | "full_name">
  > = {};

  if (account.email !== profile.email) {
    updates.email = profile.email;
  }

  if (!account.full_name && profile.fullName) {
    updates.full_name = profile.fullName;
  }

  if (!account.avatar_url && profile.avatarUrl) {
    updates.avatar_url = profile.avatarUrl;
  }

  return updates;
}

function getStringMetadata(user: User, key: string) {
  const value = user.user_metadata?.[key];

  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function normalizeOptionalText(value: string | null) {
  const trimmedValue = value?.trim();

  return trimmedValue && trimmedValue.length > 0 ? trimmedValue : null;
}
