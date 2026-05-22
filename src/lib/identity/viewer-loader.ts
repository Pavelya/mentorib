import "server-only";

import { cache } from "react";

import { ensureAuthAccount } from "@/lib/auth/account-service";
import { resolveViewerIdentity, type ViewerIdentity } from "@/lib/identity/viewer";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const loadViewerIdentity = cache(
  async (): Promise<ViewerIdentity | null> => {
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

      const account = await ensureAuthAccount(user);
      return resolveViewerIdentity(account);
    } catch {
      return null;
    }
  },
);
