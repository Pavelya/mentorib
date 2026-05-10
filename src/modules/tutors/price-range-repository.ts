import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  aggregateTutorPriceRange,
  emptyTutorPriceRange,
  type TutorPriceRange,
  type TutorProfilePriceRow,
} from "@/modules/tutors/price-range";

export type { TutorPriceRange, TutorProfilePriceRow } from "@/modules/tutors/price-range";

export type TutorPriceRangeScope =
  | { subjectId: string }
  | { focusAreaId: string }
  | { subjectId: string; focusAreaId: string };

type CapabilityRow = {
  tutor_profile_id: string;
};

type SchedulePolicyRow = {
  tutor_profile_id: string;
  is_accepting_new_students: boolean;
};

// Repository helper consumed by SEO subject/service/combo pages and search
// summaries to render "trial-price range" and "hourly-rate range" hero asides.
// Scope: listed, application-approved, accepting tutors mapped to the supplied
// subject and/or focus area via `tutor_subject_capabilities`.
export async function getTutorPriceRangeForScope(
  scope: TutorPriceRangeScope,
): Promise<TutorPriceRange> {
  const supabase = createSupabaseServiceRoleClient();

  const matchingTutorIds = await loadMatchingTutorIds(scope);

  if (matchingTutorIds.length === 0) {
    return emptyTutorPriceRange();
  }

  const acceptingTutorIds = await filterAcceptingTutors(matchingTutorIds);

  if (acceptingTutorIds.length === 0) {
    return emptyTutorPriceRange();
  }

  const { data: profiles, error } = await supabase
    .from("tutor_profiles")
    .select(
      "id, trial_price_minor, hourly_rate_minor, currency_code, application_status, public_listing_status",
    )
    .in("id", acceptingTutorIds)
    .eq("application_status", "approved")
    .eq("public_listing_status", "listed")
    .returns<TutorProfilePriceRow[]>();

  if (error) {
    throw new Error("Could not load tutor pricing for price range scope.");
  }

  return aggregateTutorPriceRange(profiles ?? []);
}

async function loadMatchingTutorIds(
  scope: TutorPriceRangeScope,
): Promise<string[]> {
  const supabase = createSupabaseServiceRoleClient();
  let query = supabase
    .from("tutor_subject_capabilities")
    .select("tutor_profile_id");

  if ("subjectId" in scope && scope.subjectId) {
    query = query.eq("subject_id", scope.subjectId);
  }
  if ("focusAreaId" in scope && scope.focusAreaId) {
    query = query.eq("subject_focus_area_id", scope.focusAreaId);
  }

  const { data, error } = await query.returns<CapabilityRow[]>();

  if (error) {
    throw new Error("Could not load capabilities for price range scope.");
  }

  return uniqueStrings((data ?? []).map((row) => row.tutor_profile_id));
}

async function filterAcceptingTutors(
  tutorProfileIds: string[],
): Promise<string[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("schedule_policies")
    .select("tutor_profile_id, is_accepting_new_students")
    .in("tutor_profile_id", tutorProfileIds)
    .returns<SchedulePolicyRow[]>();

  if (error) {
    throw new Error("Could not load schedule policies for price range scope.");
  }

  return (data ?? [])
    .filter((row) => row.is_accepting_new_students)
    .map((row) => row.tutor_profile_id);
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}
