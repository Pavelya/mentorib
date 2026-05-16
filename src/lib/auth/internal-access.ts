import { notFound } from "next/navigation";

import {
  ensureAuthAccount,
  type ResolvedAuthAccount,
} from "@/lib/auth/account-service";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasRole } from "@/modules/accounts/account-state";

// Resolves the signed-in account when an active `admin` row exists in
// `user_roles`. Anything else — anonymous, signed-in non-admin, signed-in
// admin with a revoked or pending row — collapses to `notFound()` per the
// internal boundary error contract (admin-and-moderation-architecture-v1 §6).
export async function requireInternalAdminAccount(): Promise<ResolvedAuthAccount> {
  if (!isSupabaseAuthConfigured()) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    notFound();
  }

  let account: ResolvedAuthAccount | null = null;
  try {
    account = await ensureAuthAccount(user);
  } catch {
    account = null;
  }

  if (!account || !hasRole(account, "admin")) {
    notFound();
  }

  return account;
}
