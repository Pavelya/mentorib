"use server";

import { normalizeTimezone } from "@/lib/datetime/timezone";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

type PersistDetectedTimezoneResult = {
  ok: boolean;
};

export async function persistDetectedTimezoneAction(
  candidateTimezone: string,
): Promise<PersistDetectedTimezoneResult> {
  const timezone = normalizeTimezone(candidateTimezone);

  if (!timezone) {
    return { ok: false };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return { ok: false };
    }

    if (!user) {
      return { ok: true };
    }

    const serviceRoleClient = createSupabaseServiceRoleClient();
    const { data: account, error: accountError } = await serviceRoleClient
      .from("app_users")
      .select("id, timezone")
      .eq("auth_user_id", user.id)
      .maybeSingle<{ id: string; timezone: string }>();

    if (accountError || !account || account.timezone === timezone) {
      return { ok: !accountError };
    }

    const { error: updateError } = await serviceRoleClient
      .from("app_users")
      .update({ timezone })
      .eq("id", account.id);

    return { ok: !updateError };
  } catch {
    return { ok: false };
  }
}
