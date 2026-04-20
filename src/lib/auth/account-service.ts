import type { User } from "@supabase/supabase-js";

import { routeFamilies } from "@/lib/routing/route-families";
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
} from "@/modules/accounts/constants";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

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

export type ResolvedAuthAccount = AppUserRecord & {
  isNewAccount: boolean;
  roles: readonly UserRoleRecord[];
};

export async function ensureAuthAccount(user: User): Promise<ResolvedAuthAccount> {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const profile = normalizeProfileFromUser(user);

  const { data: existingAccount, error: existingAccountError } = await serviceRoleClient
    .from("app_users")
    .select(
      "id, auth_user_id, email, full_name, avatar_url, onboarding_state, account_status, primary_role_context",
    )
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
      .select(
        "id, auth_user_id, email, full_name, avatar_url, onboarding_state, account_status, primary_role_context",
      )
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
        .select(
          "id, auth_user_id, email, full_name, avatar_url, onboarding_state, account_status, primary_role_context",
        )
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

  if (requestedNextPath) {
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
