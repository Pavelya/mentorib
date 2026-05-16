import "server-only";

import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { normalizeTimezone } from "@/lib/datetime";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { createTutorListingStatusChangedNotification } from "@/modules/notifications/lifecycle";
import { syncPublicTutorRecord } from "@/modules/search/public-tutor-indexer";
import {
  loadActiveReferenceLanguages,
  loadActiveReferenceLearningNeedOptionValues,
  loadActiveReferenceSubjectFocusAreas,
  loadActiveReferenceSubjects,
} from "@/modules/reference/catalog";
import { DEFAULT_PLATFORM_CURRENCY_CODE } from "@/modules/pricing/money";
import {
  DEFAULT_TUTOR_APPLICATION_CURRENCY,
  buildApplicationOptions,
  buildReadinessGates,
  parseHourlyRateMajor,
  validateTutorApplicationDraft,
  type TutorApplicationDraftInput,
  type TutorApplicationFieldErrors,
  type TutorApplicationOptionsDto,
  type TutorApplicationReadinessGate,
} from "@/modules/tutors/application";
import {
  syncTutorLanguageCapabilities,
  syncTutorSubjectCapabilities,
} from "@/modules/tutors/application-service";
import {
  type PayoutReadinessStatus,
  type TutorApplicationStatus,
  type TutorPublicListingStatus,
} from "@/modules/tutors/constants";
import { evaluateTutorProfileMinimum } from "@/modules/tutors/listing-readiness";

export type TutorListingPublicationAction = "publish" | "self_pause" | "resume";

export class TutorProfileEditorError extends Error {
  code: string;
  fieldErrors: TutorApplicationFieldErrors;
  // Gate keys still blocking a publish/resume attempt. Populated on `conflict`
  // results so the calling Server Action can highlight the missing items in
  // the readiness checklist without a second round-trip.
  missingGateKeys: TutorApplicationReadinessGate["key"][];

  constructor(
    code: string,
    message: string,
    options: {
      fieldErrors?: TutorApplicationFieldErrors;
      missingGateKeys?: TutorApplicationReadinessGate["key"][];
    } = {},
  ) {
    super(message);
    this.code = code;
    this.fieldErrors = options.fieldErrors ?? {};
    this.missingGateKeys = options.missingGateKeys ?? [];
  }
}

export type TutorListingPublicationResult = {
  autoPaused: boolean;
  publicListingStatus: TutorPublicListingStatus;
};

type TutorProfileRecord = {
  app_user_id: string;
  application_status: TutorApplicationStatus;
  bio: string | null;
  currency_code: string;
  headline: string | null;
  hourly_rate_minor: number | null;
  id: string;
  payout_readiness_status: PayoutReadinessStatus;
  public_listing_status: TutorPublicListingStatus;
  public_slug: string | null;
  self_paused_at: string | null;
};

export async function updateTutorProfile(
  account: Pick<ResolvedAuthAccount, "id">,
  values: TutorApplicationDraftInput,
): Promise<TutorListingPublicationResult> {
  const options = await loadEditorOptions();
  const supabase = createSupabaseServiceRoleClient();
  const profile = await loadEditorProfile(account.id);

  if (!profile) {
    throw new TutorProfileEditorError(
      "tutor_profile_missing",
      "Your tutor profile is not available yet.",
    );
  }

  if (profile.application_status !== "approved") {
    throw new TutorProfileEditorError(
      "application_not_approved",
      "Your application must be approved before editing the profile.",
    );
  }

  const fieldErrors = validateTutorApplicationDraft(values, options);
  if (Object.keys(fieldErrors).length > 0) {
    throw new TutorProfileEditorError(
      "invalid_profile",
      "Please complete the highlighted fields before saving.",
      { fieldErrors },
    );
  }

  const fullName = nullIfBlank(values.fullName);
  const headline = nullIfBlank(values.headline);
  const bio = nullIfBlank(values.bio);
  const hourlyRateMinor = parseHourlyRateMajor(values.hourlyRateMajor);
  const normalizedTimezone = normalizeTimezone(values.timezone);
  const currencyCode =
    profile.currency_code?.trim().toUpperCase() ||
    DEFAULT_TUTOR_APPLICATION_CURRENCY ||
    DEFAULT_PLATFORM_CURRENCY_CODE;

  const { error: accountError } = await supabase
    .from("app_users")
    .update({ full_name: fullName })
    .eq("id", account.id);

  if (accountError) {
    throw new TutorProfileEditorError(
      "account_full_name_update_failed",
      "We couldn't save your name yet. Please try again in a moment.",
    );
  }

  const { error: profileError } = await supabase
    .from("tutor_profiles")
    .update({
      bio,
      currency_code: currencyCode,
      headline,
      hourly_rate_minor: hourlyRateMinor,
    })
    .eq("id", profile.id);

  if (profileError) {
    throw new TutorProfileEditorError(
      "tutor_profile_update_failed",
      "We couldn't save your profile yet. Please try again in a moment.",
    );
  }

  if (normalizedTimezone) {
    const { error: scheduleError } = await supabase
      .from("schedule_policies")
      .upsert(
        {
          timezone: normalizedTimezone,
          tutor_profile_id: profile.id,
        },
        { onConflict: "tutor_profile_id" },
      );

    if (scheduleError) {
      throw new TutorProfileEditorError(
        "schedule_policy_save_failed",
        "We couldn't save your timezone yet. Please try again in a moment.",
      );
    }
  }

  await syncTutorSubjectCapabilities({
    options,
    tutorProfileId: profile.id,
    values,
  });

  await syncTutorLanguageCapabilities({
    languageCodes: values.languageCodes,
    options,
    tutorProfileId: profile.id,
  });

  // Auto-flip listed → not_listed when a content gate (profile minimum,
  // schedule, meeting link) now fails after the edit. Admin-owned
  // `paused`/`delisted` is never auto-entered (per J-INT-005).
  if (profile.public_listing_status !== "listed") {
    return {
      autoPaused: false,
      publicListingStatus: profile.public_listing_status,
    };
  }

  const gates = await evaluateGatesForTutor({
    bio,
    fullName,
    headline,
    hourlyRateMinor,
    payoutReadinessStatus: profile.payout_readiness_status,
    publicListingStatus: profile.public_listing_status,
    timezone: normalizedTimezone ?? null,
    tutorProfileId: profile.id,
  });

  const missingGateKeys = gates
    .filter((gate) => gate.state !== "complete")
    .map((gate) => gate.key);

  if (missingGateKeys.length === 0) {
    // Profile edits while still listed need a fresh record so subjects,
    // languages, headline, pricing, etc. stay in sync with the index.
    await syncPublicTutorRecord(profile.id);
    return {
      autoPaused: false,
      publicListingStatus: "listed",
    };
  }

  const { error: flipError } = await supabase
    .from("tutor_profiles")
    .update({ public_listing_status: "not_listed" })
    .eq("id", profile.id);

  if (flipError) {
    throw new TutorProfileEditorError(
      "listing_auto_flip_failed",
      "We couldn't update your listing status after saving. Refresh and try again.",
    );
  }

  await createTutorListingStatusChangedNotification({
    appUserId: profile.app_user_id,
    missingGateKeys,
    publicListingStatus: "not_listed",
    reason: "gate_regression",
    tutorProfileId: profile.id,
  });

  await syncPublicTutorRecord(profile.id);

  return {
    autoPaused: true,
    publicListingStatus: "not_listed",
  };
}

export async function setTutorListingPublication(
  account: Pick<ResolvedAuthAccount, "id">,
  action: TutorListingPublicationAction,
): Promise<TutorListingPublicationResult> {
  const supabase = createSupabaseServiceRoleClient();
  const profile = await loadEditorProfile(account.id);

  if (!profile) {
    throw new TutorProfileEditorError(
      "tutor_profile_missing",
      "Your tutor profile is not available yet.",
    );
  }

  if (profile.application_status !== "approved") {
    throw new TutorProfileEditorError(
      "application_not_approved",
      "Your application must be approved before managing your public listing.",
    );
  }

  if (
    profile.public_listing_status === "paused" ||
    profile.public_listing_status === "delisted"
  ) {
    throw new TutorProfileEditorError(
      "admin_hold",
      profile.public_listing_status === "paused"
        ? "Mentor IB has paused your public profile. You cannot change publication while a hold is active."
        : "Mentor IB has removed your profile from public discovery. You cannot change publication while a hold is active.",
    );
  }

  if (action === "self_pause") {
    if (profile.public_listing_status !== "listed") {
      throw new TutorProfileEditorError(
        "not_listed",
        "Your profile is already unlisted.",
      );
    }

    const { error } = await supabase
      .from("tutor_profiles")
      .update({
        public_listing_status: "not_listed",
        self_paused_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      throw new TutorProfileEditorError(
        "listing_publication_failed",
        "We couldn't pause your listing right now. Please try again in a moment.",
      );
    }

    await createTutorListingStatusChangedNotification({
      appUserId: profile.app_user_id,
      publicListingStatus: "not_listed",
      reason: "self",
      tutorProfileId: profile.id,
    });

    await syncPublicTutorRecord(profile.id);

    return { autoPaused: false, publicListingStatus: "not_listed" };
  }

  // publish or resume — both require all gates to pass.
  if (profile.public_listing_status === "listed") {
    throw new TutorProfileEditorError(
      "already_listed",
      "Your profile is already listed.",
    );
  }

  const gates = await evaluateGatesForTutor({
    bio: profile.bio,
    fullName: null,
    headline: profile.headline,
    hourlyRateMinor: profile.hourly_rate_minor,
    payoutReadinessStatus: profile.payout_readiness_status,
    publicListingStatus: profile.public_listing_status,
    timezone: null,
    tutorProfileId: profile.id,
  });

  const missingGateKeys = gates
    .filter((gate) => gate.state !== "complete")
    .map((gate) => gate.key);

  if (missingGateKeys.length > 0) {
    throw new TutorProfileEditorError(
      "conflict",
      "Finish the remaining readiness steps before going live.",
      { missingGateKeys },
    );
  }

  const { error } = await supabase
    .from("tutor_profiles")
    .update({
      public_listing_status: "listed",
      self_paused_at: null,
    })
    .eq("id", profile.id);

  if (error) {
    throw new TutorProfileEditorError(
      "listing_publication_failed",
      "We couldn't publish your listing right now. Please try again in a moment.",
    );
  }

  await createTutorListingStatusChangedNotification({
    appUserId: profile.app_user_id,
    publicListingStatus: "listed",
    reason: "self",
    tutorProfileId: profile.id,
  });

  await syncPublicTutorRecord(profile.id);

  return { autoPaused: false, publicListingStatus: "listed" };
}

async function loadEditorProfile(
  appUserId: string,
): Promise<TutorProfileRecord | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select(
      "app_user_id, application_status, bio, currency_code, headline, hourly_rate_minor, id, payout_readiness_status, public_listing_status, public_slug, self_paused_at",
    )
    .eq("app_user_id", appUserId)
    .maybeSingle<TutorProfileRecord>();

  if (error) {
    throw new Error("Could not load the tutor profile for the editor.");
  }

  return data ?? null;
}

async function loadEditorOptions(): Promise<TutorApplicationOptionsDto> {
  const [subjects, focusAreas, languages, needOptionRows] = await Promise.all([
    loadActiveReferenceSubjects(),
    loadActiveReferenceSubjectFocusAreas(),
    loadActiveReferenceLanguages(),
    loadActiveReferenceLearningNeedOptionValues(),
  ]);

  return buildApplicationOptions({
    focusAreas,
    languages,
    needOptionRows,
    subjects,
  });
}

async function evaluateGatesForTutor(input: {
  bio: string | null;
  fullName: string | null;
  headline: string | null;
  hourlyRateMinor: number | null;
  payoutReadinessStatus: PayoutReadinessStatus;
  publicListingStatus: TutorPublicListingStatus;
  timezone: string | null;
  tutorProfileId: string;
}): Promise<TutorApplicationReadinessGate[]> {
  const supabase = createSupabaseServiceRoleClient();

  const [schedulePolicyRes, scheduleRuleCountRes, meetingPrefRes, accountRes, capabilityRes] =
    await Promise.all([
      supabase
        .from("schedule_policies")
        .select("timezone")
        .eq("tutor_profile_id", input.tutorProfileId)
        .maybeSingle<{ timezone: string | null }>(),
      supabase
        .from("availability_rules")
        .select("id", { count: "exact", head: true })
        .eq("tutor_profile_id", input.tutorProfileId)
        .eq("visibility_status", "active"),
      supabase
        .from("tutor_meeting_preferences")
        .select("default_meeting_url, is_active")
        .eq("tutor_profile_id", input.tutorProfileId)
        .maybeSingle<{ default_meeting_url: string | null; is_active: boolean }>(),
      input.fullName === null
        ? supabase
            .from("tutor_profiles")
            .select("app_user_id")
            .eq("id", input.tutorProfileId)
            .maybeSingle<{ app_user_id: string }>()
        : Promise.resolve({ data: null, error: null } as const),
      supabase
        .from("tutor_subject_capabilities")
        .select("id", { count: "exact", head: true })
        .eq("tutor_profile_id", input.tutorProfileId),
    ]);

  const timezone =
    input.timezone ?? schedulePolicyRes.data?.timezone?.trim() ?? null;

  let fullName = input.fullName;
  if (fullName === null && accountRes.data?.app_user_id) {
    const { data: userRow } = await supabase
      .from("app_users")
      .select("full_name")
      .eq("id", accountRes.data.app_user_id)
      .maybeSingle<{ full_name: string | null }>();
    fullName = userRow?.full_name ?? null;
  }

  const capabilityCount = capabilityRes.count ?? 0;

  const profileMinimum = evaluateTutorProfileMinimum({
    bio: input.bio,
    displayName: fullName,
    headline: input.headline,
    hourlyRateMinor: input.hourlyRateMinor,
    timezone,
  });

  const hasScheduleRules = (scheduleRuleCountRes.count ?? 0) > 0;
  const hasMeetingLink =
    Boolean(meetingPrefRes.data?.default_meeting_url?.trim()) &&
    Boolean(meetingPrefRes.data?.is_active);

  return buildReadinessGates({
    applicationStatus: "approved",
    hasMeetingLink,
    hasScheduleRules,
    payoutReadinessStatus: input.payoutReadinessStatus,
    profileMinimumComplete: profileMinimum.passes && capabilityCount > 0,
    publicListingStatus: input.publicListingStatus,
  });
}

function nullIfBlank(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
