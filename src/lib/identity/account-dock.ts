import "server-only";

import { cache } from "react";

import { ensureAuthAccount } from "@/lib/auth/account-service";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AccountDockFamily = "student" | "tutor" | null;

export const loadAccountDockFamily = cache(
  async (): Promise<AccountDockFamily> => {
    if (!isSupabaseAuthConfigured()) return null;
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user?.email?.trim()) return null;

      const account = await ensureAuthAccount(user);
      const hasActive = (role: "student" | "tutor") =>
        account.roles.some((entry) => entry.role === role && entry.role_status === "active");

      if (hasActive("student")) return "student";
      if (hasActive("tutor")) return "tutor";
      return null;
    } catch {
      return null;
    }
  },
);
