import "server-only";

import { logEvent } from "@/lib/observability/logger";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  buildPublicTutorSearchRecord,
  type PublicTutorSearchRecord,
} from "@/modules/search/public-tutor-record";
import { getAlgoliaAdminClient } from "@/modules/search/algolia-server";
import {
  getAlgoliaTutorsIndexNameOrThrow,
  hasAlgoliaAdminApiKey,
  isAlgoliaPublicSearchConfigured,
} from "@/lib/algolia/env";
import {
  getPublicTutorProfileBySlug,
  listPublicTutorProfileSitemapEntries,
} from "@/modules/tutors/public-profile";

// Returns true when the surrounding code should skip Algolia calls because
// public search isn't configured (typical in dev/test). Mutations stay
// silent in that case so profile lifecycle isn't blocked, but the lookup is
// logged so it's visible in observability.
function isPublicSearchAdminConfigured(): boolean {
  return isAlgoliaPublicSearchConfigured() && hasAlgoliaAdminApiKey();
}

type TutorEligibilityRow = {
  application_status: string;
  profile_visibility_status: string;
  public_listing_status: string;
  public_slug: string | null;
};

async function loadEligibilityById(
  tutorProfileId: string,
): Promise<TutorEligibilityRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select(
      "application_status, profile_visibility_status, public_listing_status, public_slug",
    )
    .eq("id", tutorProfileId)
    .maybeSingle<TutorEligibilityRow>();

  if (error) {
    throw new Error("Could not load tutor profile for search indexing.");
  }

  return data ?? null;
}

function isEligibleForSearchIndex(row: TutorEligibilityRow | null): boolean {
  if (!row) {
    return false;
  }
  return (
    row.application_status === "approved" &&
    row.profile_visibility_status === "public_visible" &&
    row.public_listing_status === "listed" &&
    Boolean(row.public_slug)
  );
}

// Idempotent: pushes the latest record when the tutor is currently eligible,
// or removes it when they are not. Safe to call from any lifecycle
// transition; the caller does not have to know which way the state moved.
export async function syncPublicTutorRecord(
  tutorProfileId: string,
): Promise<void> {
  if (!isPublicSearchAdminConfigured()) {
    logEvent("search", "info", "public_tutor_index_skip_unconfigured", {
      tutor_profile_id: tutorProfileId,
    });
    return;
  }

  try {
    const eligibility = await loadEligibilityById(tutorProfileId);
    if (!isEligibleForSearchIndex(eligibility) || !eligibility?.public_slug) {
      await removePublicTutorRecord(tutorProfileId);
      return;
    }
    await upsertPublicTutorRecord(tutorProfileId);
  } catch (error) {
    // The task spec is explicit: Algolia failures must never roll back
    // the underlying profile transition. Log and move on.
    logEvent("search", "error", "public_tutor_index_sync_failed", {
      tutor_profile_id: tutorProfileId,
      error_message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function upsertPublicTutorRecord(
  tutorProfileId: string,
): Promise<void> {
  if (!isPublicSearchAdminConfigured()) {
    return;
  }

  const eligibility = await loadEligibilityById(tutorProfileId);
  if (!eligibility?.public_slug || !isEligibleForSearchIndex(eligibility)) {
    return;
  }

  const profile = await getPublicTutorProfileBySlug(eligibility.public_slug);
  if (!profile) {
    return;
  }

  const record = buildPublicTutorSearchRecord({ profile });
  const indexName = getAlgoliaTutorsIndexNameOrThrow();
  const client = getAlgoliaAdminClient();

  await client.saveObject({ indexName, body: record });

  logEvent("search", "info", "public_tutor_index_upserted", {
    tutor_profile_id: tutorProfileId,
    slug: record.slug,
  });
}

export async function removePublicTutorRecord(
  tutorProfileId: string,
): Promise<void> {
  if (!isPublicSearchAdminConfigured()) {
    return;
  }

  const indexName = getAlgoliaTutorsIndexNameOrThrow();
  const client = getAlgoliaAdminClient();

  await client.deleteObject({ indexName, objectID: tutorProfileId });

  logEvent("search", "info", "public_tutor_index_removed", {
    tutor_profile_id: tutorProfileId,
  });
}

// Builds the full set of currently-eligible records. Used by the one-shot
// rebuild script.
export async function listEligiblePublicTutorRecords(): Promise<
  PublicTutorSearchRecord[]
> {
  const entries = await listPublicTutorProfileSitemapEntries();
  const records: PublicTutorSearchRecord[] = [];
  for (const entry of entries) {
    const slug = entry.pathname.replace(/^\/tutors\//, "");
    const profile = await getPublicTutorProfileBySlug(slug);
    if (!profile) {
      continue;
    }
    records.push(buildPublicTutorSearchRecord({ profile }));
  }
  return records;
}
