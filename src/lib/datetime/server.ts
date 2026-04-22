import { cookies } from "next/headers";

import {
  DEFAULT_TIMEZONE,
  TIMEZONE_COOKIE_NAME,
  normalizeTimezone,
  resolveTimezone,
} from "@/lib/datetime/timezone";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUserTimezone() {
  const cookieStore = await cookies();
  const cookieTimezone = normalizeTimezone(cookieStore.get(TIMEZONE_COOKIE_NAME)?.value);

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return resolveTimezone(cookieTimezone);
    }

    const { data: account } = await supabase
      .from("app_users")
      .select("timezone")
      .eq("auth_user_id", user.id)
      .maybeSingle<{ timezone: string }>();

    return resolveTimezone(account?.timezone ?? cookieTimezone);
  } catch {
    return cookieTimezone ?? DEFAULT_TIMEZONE;
  }
}
