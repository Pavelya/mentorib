import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { TutorProfileMinimumInput } from "@/modules/tutors/listing-readiness";

export async function loadTutorProfileMinimumGateInput(
  tutorProfileId: string,
): Promise<TutorProfileMinimumInput | null> {
  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("app_user_id, bio, headline, hourly_rate_minor")
    .eq("id", tutorProfileId)
    .maybeSingle<{
      app_user_id: string;
      bio: string | null;
      headline: string | null;
      hourly_rate_minor: number | null;
    }>();

  if (error) {
    throw new Error("Could not load tutor profile minimum gate input.");
  }

  if (!data) {
    return null;
  }

  const [scheduleResult, accountResult] = await Promise.all([
    supabase
      .from("schedule_policies")
      .select("timezone")
      .eq("tutor_profile_id", tutorProfileId)
      .maybeSingle<{ timezone: string | null }>(),
    supabase
      .from("app_users")
      .select("full_name")
      .eq("id", data.app_user_id)
      .maybeSingle<{ full_name: string | null }>(),
  ]);

  if (scheduleResult.error) {
    throw new Error("Could not load tutor schedule timezone.");
  }

  if (accountResult.error) {
    throw new Error("Could not load tutor account name.");
  }

  return {
    bio: data.bio,
    displayName: accountResult.data?.full_name ?? null,
    headline: data.headline,
    hourlyRateMinor: data.hourly_rate_minor,
    timezone: scheduleResult.data?.timezone ?? null,
  };
}
