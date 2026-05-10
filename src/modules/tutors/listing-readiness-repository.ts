import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { TutorProfileMinimumInput } from "@/modules/tutors/listing-readiness";

export async function loadTutorProfileMinimumGateInput(
  tutorProfileId: string,
): Promise<TutorProfileMinimumInput | null> {
  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("tutor_profiles")
    .select(
      "best_for_summary, display_name, headline, hourly_rate_minor, teaching_style_summary",
    )
    .eq("id", tutorProfileId)
    .maybeSingle<{
      best_for_summary: string | null;
      display_name: string | null;
      headline: string | null;
      hourly_rate_minor: number | null;
      teaching_style_summary: string | null;
    }>();

  if (error) {
    throw new Error("Could not load tutor profile minimum gate input.");
  }

  if (!data) {
    return null;
  }

  const { data: schedule, error: scheduleError } = await supabase
    .from("schedule_policies")
    .select("timezone")
    .eq("tutor_profile_id", tutorProfileId)
    .maybeSingle<{ timezone: string | null }>();

  if (scheduleError) {
    throw new Error("Could not load tutor schedule timezone.");
  }

  return {
    bestForSummary: data.best_for_summary,
    displayName: data.display_name,
    headline: data.headline,
    hourlyRateMinor: data.hourly_rate_minor,
    teachingStyleSummary: data.teaching_style_summary,
    timezone: schedule?.timezone ?? null,
  };
}
