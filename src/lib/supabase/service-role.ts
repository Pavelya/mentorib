import { createClient } from "@supabase/supabase-js";

import type { MentorIbDatabase } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv, getSupabaseServiceRoleKey } from "@/lib/supabase/env";

let serviceRoleClient: ReturnType<typeof createClient<MentorIbDatabase>> | undefined;

export function createSupabaseServiceRoleClient() {
  if (serviceRoleClient) {
    return serviceRoleClient;
  }

  const { url } = getSupabasePublicEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  serviceRoleClient = createClient<MentorIbDatabase>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serviceRoleClient;
}
