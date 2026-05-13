import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { isValidTimezone, resolveTimezone } from "@/lib/datetime";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  loadActiveReferenceLanguages,
  loadActiveReferenceLearningNeedOptionValues,
  loadActiveReferenceSubjectFocusAreas,
  loadActiveReferenceSubjects,
  type ReferenceLanguage,
  type ReferenceLearningNeedOptionValue,
  type ReferenceSubject,
  type ReferenceSubjectFocusArea,
} from "@/modules/reference/catalog";
import {
  getReferenceLanguageFlagCode,
  getReferenceSubjectIconKey,
} from "@/modules/reference/visuals";
import { DEFAULT_PLATFORM_CURRENCY_CODE } from "@/modules/pricing/money";
import type { FlagCode, IconKey } from "@/components/ui";
import {
  type PayoutReadinessStatus,
  type TutorApplicationStatus,
  type TutorPublicListingStatus,
} from "@/modules/tutors/constants";

const MAX_DISPLAY_NAME_LENGTH = 80;
const MAX_HEADLINE_LENGTH = 120;
const MAX_BIO_LENGTH = 600;
const MAX_HOURLY_RATE_MINOR = 100_000_00;
const MIN_HOURLY_RATE_MINOR = 1;
const MAX_FOCUS_AREAS = 6;
const MAX_SUBJECTS = 8;
const MAX_LANGUAGES = 5;

export const TUTOR_APPLICATION_DRAFT_STATUSES: readonly TutorApplicationStatus[] = [
  "not_started",
  "in_progress",
  "changes_requested",
];

export const TUTOR_APPLICATION_PENDING_STATUSES: readonly TutorApplicationStatus[] = [
  "submitted",
  "under_review",
];

export type TutorApplicationDraftInput = {
  bio: string;
  displayName: string;
  focusAreaCodes: string[];
  headline: string;
  hourlyRateMajor: string;
  languageCodes: string[];
  subjectCodes: string[];
  timezone: string;
};

export const emptyTutorApplicationDraft: TutorApplicationDraftInput = {
  bio: "",
  displayName: "",
  focusAreaCodes: [],
  headline: "",
  hourlyRateMajor: "",
  languageCodes: [],
  subjectCodes: [],
  timezone: "",
};

export type TutorApplicationField =
  | "bio"
  | "displayName"
  | "focusAreaCodes"
  | "headline"
  | "hourlyRateMajor"
  | "languageCodes"
  | "subjectCodes"
  | "timezone";

export type TutorApplicationFieldErrors = Partial<
  Record<TutorApplicationField, string>
>;

export type TutorApplicationReadinessGate = {
  description: string;
  key:
    | "applicationApproved"
    | "profileMinimum"
    | "scheduleSet"
    | "meetingLink"
    | "payoutReady"
    | "noActiveHold";
  label: string;
  state: "complete" | "in_progress" | "blocked" | "under_review";
};

export type TutorApplicationFocusOption = {
  allowedSubjectCodes: readonly string[];
  description: string | null;
  focusAreaCode: string;
  focusAreaId: string;
  label: string;
  value: string;
};

export type TutorApplicationSubjectOption = {
  iconKey: IconKey | null;
  label: string;
  subjectCode: string;
  subjectId: string;
  value: string;
};

export type TutorApplicationLanguageOption = {
  flagCode: FlagCode | null;
  label: string;
  value: string;
};

export type TutorApplicationOptionsDto = {
  focusAreas: TutorApplicationFocusOption[];
  languages: TutorApplicationLanguageOption[];
  subjects: TutorApplicationSubjectOption[];
};

export type TutorApplicationCapabilityDto = {
  focusArea: { code: string; label: string } | null;
  id: string;
  subject: { code: string; iconKey: IconKey | null; label: string } | null;
};

export type TutorApplicationProfileDto = {
  capabilities: TutorApplicationCapabilityDto[];
  draft: TutorApplicationDraftInput;
  hasMeetingLink: boolean;
  hasScheduleRules: boolean;
  payoutReadinessStatus: PayoutReadinessStatus;
  publicListingStatus: TutorPublicListingStatus;
  publicSlug: string | null;
};

export type TutorApplicationDto = {
  applicationStatus: TutorApplicationStatus;
  options: TutorApplicationOptionsDto;
  profile: TutorApplicationProfileDto;
  readinessGates: TutorApplicationReadinessGate[];
  reviewNote: string | null;
  state: "ready" | "no_profile";
  submittedAt: string | null;
};

type TutorProfileRecord = {
  application_status: TutorApplicationStatus;
  bio: string | null;
  display_name: string | null;
  headline: string | null;
  hourly_rate_minor: number | null;
  id: string;
  payout_readiness_status: PayoutReadinessStatus;
  public_listing_status: TutorPublicListingStatus;
  public_slug: string | null;
  updated_at: string;
};

type SubjectCapabilityRecord = {
  id: string;
  subject_focus_area_id: string;
  subject_id: string;
};

type LanguageCapabilityRecord = {
  language_code: string;
};

type SchedulePolicyRecord = {
  timezone: string | null;
};

type MeetingPreferenceRecord = {
  default_meeting_url: string | null;
  is_active: boolean;
};

export async function getTutorApplication(
  account: Pick<ResolvedAuthAccount, "id" | "timezone">,
): Promise<TutorApplicationDto> {
  const [subjects, focusAreas, languages, needOptionRows] = await Promise.all([
    loadActiveReferenceSubjects(),
    loadActiveReferenceSubjectFocusAreas(),
    loadActiveReferenceLanguages(),
    loadActiveReferenceLearningNeedOptionValues(),
  ]);
  const options = buildApplicationOptions({
    focusAreas,
    languages,
    needOptionRows,
    subjects,
  });

  const tutorProfile = await loadTutorProfile(account.id);

  if (!tutorProfile) {
    return {
      applicationStatus: "not_started",
      options,
      profile: {
        capabilities: [],
        draft: {
          ...emptyTutorApplicationDraft,
          timezone: resolveTimezone(account.timezone),
        },
        hasMeetingLink: false,
        hasScheduleRules: false,
        payoutReadinessStatus: "not_started",
        publicListingStatus: "not_listed",
        publicSlug: null,
      },
      readinessGates: buildReadinessGates({
        applicationStatus: "not_started",
        hasMeetingLink: false,
        hasScheduleRules: false,
        payoutReadinessStatus: "not_started",
        profileMinimumComplete: false,
        publicListingStatus: "not_listed",
      }),
      reviewNote: null,
      state: "no_profile",
      submittedAt: null,
    };
  }

  const [capabilityRows, languageRows, schedulePolicy, scheduleRuleCount, meetingPreference] =
    await Promise.all([
      loadSubjectCapabilities(tutorProfile.id),
      loadLanguageCapabilities(tutorProfile.id),
      loadSchedulePolicy(tutorProfile.id),
      loadActiveAvailabilityRuleCount(tutorProfile.id),
      loadMeetingPreference(tutorProfile.id),
    ]);

  const capabilities = mapCapabilityRecords({
    capabilityRows,
    focusAreas,
    subjects,
  });
  const languageCodes = languageRows.map((row) => row.language_code);
  const timezone =
    schedulePolicy?.timezone?.trim() || resolveTimezone(account.timezone);

  const draftFocusAreaCodes = deriveDraftFocusAreaCodes({
    capabilities,
    options,
  });

  const draft: TutorApplicationDraftInput = {
    bio: tutorProfile.bio ?? "",
    displayName: tutorProfile.display_name ?? "",
    focusAreaCodes: draftFocusAreaCodes,
    headline: tutorProfile.headline ?? "",
    hourlyRateMajor: formatHourlyRateMajor(tutorProfile.hourly_rate_minor),
    languageCodes,
    subjectCodes: uniqueValues(
      capabilities.map((capability) => capability.subject?.code).filter(isNonEmptyString),
    ),
    timezone,
  };

  const profileMinimumComplete = evaluateProfileMinimumComplete({
    bio: draft.bio,
    capabilityCount: capabilities.length,
    displayName: draft.displayName,
    headline: draft.headline,
    hourlyRateMinor: tutorProfile.hourly_rate_minor,
    timezone: schedulePolicy?.timezone ?? null,
  });

  const hasScheduleRules = scheduleRuleCount > 0;
  const hasMeetingLink =
    Boolean(meetingPreference?.default_meeting_url?.trim()) &&
    Boolean(meetingPreference?.is_active);

  return {
    applicationStatus: tutorProfile.application_status,
    options,
    profile: {
      capabilities,
      draft,
      hasMeetingLink,
      hasScheduleRules,
      payoutReadinessStatus: tutorProfile.payout_readiness_status,
      publicListingStatus: tutorProfile.public_listing_status,
      publicSlug: tutorProfile.public_slug,
    },
    readinessGates: buildReadinessGates({
      applicationStatus: tutorProfile.application_status,
      hasMeetingLink,
      hasScheduleRules,
      payoutReadinessStatus: tutorProfile.payout_readiness_status,
      profileMinimumComplete,
      publicListingStatus: tutorProfile.public_listing_status,
    }),
    reviewNote: null,
    state: "ready",
    submittedAt: deriveSubmittedAt(tutorProfile),
  };
}

export function validateTutorApplicationDraft(
  values: TutorApplicationDraftInput,
  options: TutorApplicationOptionsDto,
): TutorApplicationFieldErrors {
  const errors: TutorApplicationFieldErrors = {};

  const displayName = values.displayName.trim();
  const headline = values.headline.trim();
  const bio = values.bio.trim();
  const hourlyRate = values.hourlyRateMajor.trim();
  const timezone = values.timezone.trim();

  if (!displayName) {
    errors.displayName = "Add the name students will see.";
  } else if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    errors.displayName = `Keep your display name under ${MAX_DISPLAY_NAME_LENGTH} characters.`;
  }

  if (!headline) {
    errors.headline = "Add a one-line headline.";
  } else if (headline.length > MAX_HEADLINE_LENGTH) {
    errors.headline = `Keep your headline under ${MAX_HEADLINE_LENGTH} characters.`;
  }

  if (!bio) {
    errors.bio = "Write a short bio so students can see who you are.";
  } else if (bio.length > MAX_BIO_LENGTH) {
    errors.bio = `Keep your bio under ${MAX_BIO_LENGTH} characters.`;
  }

  const parsedRate = parseHourlyRateMajor(hourlyRate);
  if (parsedRate === null) {
    errors.hourlyRateMajor = "Enter a positive hourly rate.";
  } else if (parsedRate < MIN_HOURLY_RATE_MINOR) {
    errors.hourlyRateMajor = "Hourly rate must be greater than zero.";
  } else if (parsedRate > MAX_HOURLY_RATE_MINOR) {
    errors.hourlyRateMajor = "Hourly rate looks too high — double-check the value.";
  }

  if (!isValidTimezone(timezone)) {
    errors.timezone = "We couldn't detect a valid timezone.";
  }

  const validFocusAreaValues = new Set(
    options.focusAreas.map((option) => option.value),
  );
  const dedupedFocusAreas = uniqueValues(
    values.focusAreaCodes.filter((value) => validFocusAreaValues.has(value)),
  );

  if (dedupedFocusAreas.length === 0) {
    errors.focusAreaCodes = "Pick at least one type of help you offer.";
  } else if (dedupedFocusAreas.length > MAX_FOCUS_AREAS) {
    errors.focusAreaCodes = `Choose up to ${MAX_FOCUS_AREAS} types of help.`;
  }

  const validSubjectCodes = new Set(
    options.subjects.map((option) => option.subjectCode),
  );
  const dedupedSubjects = uniqueValues(
    values.subjectCodes.filter((code) => validSubjectCodes.has(code)),
  );
  const allowedSubjectsForSelectedFocus = getAllowedSubjectCodesForFocusAreas(
    dedupedFocusAreas,
    options.focusAreas,
  );
  const subjectsInAllowedSet = dedupedSubjects.filter(
    (code) =>
      allowedSubjectsForSelectedFocus.size === 0 ||
      allowedSubjectsForSelectedFocus.has(code),
  );

  if (subjectsInAllowedSet.length === 0) {
    errors.subjectCodes = "Pick the IB subjects you teach for these workstreams.";
  } else if (subjectsInAllowedSet.length > MAX_SUBJECTS) {
    errors.subjectCodes = `Choose up to ${MAX_SUBJECTS} subjects.`;
  }

  const validLanguageCodes = new Set(
    options.languages.map((option) => option.value),
  );
  const dedupedLanguages = uniqueValues(
    values.languageCodes.filter((code) => validLanguageCodes.has(code)),
  );

  if (dedupedLanguages.length === 0) {
    errors.languageCodes = "Add at least one language you can teach in.";
  } else if (dedupedLanguages.length > MAX_LANGUAGES) {
    errors.languageCodes = `Choose up to ${MAX_LANGUAGES} languages.`;
  }

  return errors;
}

export function buildResolvedCapabilityPairs(
  values: TutorApplicationDraftInput,
  options: TutorApplicationOptionsDto,
): Array<{ focusAreaId: string; subjectId: string }> {
  const focusAreasByValue = new Map(
    options.focusAreas.map((focusArea) => [focusArea.value, focusArea]),
  );
  const subjectsByCode = new Map(
    options.subjects.map((subject) => [subject.subjectCode, subject]),
  );

  const seen = new Set<string>();
  const pairs: Array<{ focusAreaId: string; subjectId: string }> = [];

  for (const focusAreaValue of values.focusAreaCodes) {
    const focusArea = focusAreasByValue.get(focusAreaValue);
    if (!focusArea) {
      continue;
    }
    const allowed = new Set(focusArea.allowedSubjectCodes);
    for (const subjectCode of values.subjectCodes) {
      if (allowed.size > 0 && !allowed.has(subjectCode)) {
        continue;
      }
      const subject = subjectsByCode.get(subjectCode);
      if (!subject) {
        continue;
      }
      const key = `${focusArea.focusAreaId}::${subject.subjectId}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      pairs.push({
        focusAreaId: focusArea.focusAreaId,
        subjectId: subject.subjectId,
      });
    }
  }

  return pairs;
}

export function getAllowedSubjectCodesForFocusAreas(
  focusAreaValues: readonly string[],
  focusAreas: readonly TutorApplicationFocusOption[],
): Set<string> {
  const allowed = new Set<string>();
  for (const value of focusAreaValues) {
    const focusArea = focusAreas.find((option) => option.value === value);
    if (!focusArea) {
      continue;
    }
    for (const code of focusArea.allowedSubjectCodes) {
      allowed.add(code);
    }
  }
  return allowed;
}

export function parseHourlyRateMajor(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^-?\d+(?:\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }

  const major = Number.parseFloat(trimmed);

  if (!Number.isFinite(major) || major <= 0) {
    return null;
  }

  return Math.round(major * 100);
}

export function formatHourlyRateMajor(minor: number | null | undefined): string {
  if (typeof minor !== "number" || !Number.isFinite(minor) || minor <= 0) {
    return "";
  }

  const major = minor / 100;

  return Number.isInteger(major) ? major.toString() : major.toFixed(2);
}

export const DEFAULT_TUTOR_APPLICATION_CURRENCY = DEFAULT_PLATFORM_CURRENCY_CODE;

function evaluateProfileMinimumComplete(input: {
  bio: string;
  capabilityCount: number;
  displayName: string;
  headline: string;
  hourlyRateMinor: number | null;
  timezone: string | null;
}): boolean {
  return (
    Boolean(input.displayName.trim()) &&
    Boolean(input.headline.trim()) &&
    Boolean(input.bio.trim()) &&
    Boolean(input.timezone?.trim()) &&
    typeof input.hourlyRateMinor === "number" &&
    input.hourlyRateMinor > 0 &&
    input.capabilityCount > 0
  );
}

function buildApplicationOptions(input: {
  focusAreas: ReferenceSubjectFocusArea[];
  languages: ReferenceLanguage[];
  needOptionRows: ReferenceLearningNeedOptionValue[];
  subjects: ReferenceSubject[];
}): TutorApplicationOptionsDto {
  const focusAreaIdsByCode = new Map(
    input.focusAreas.map((focusArea) => [focusArea.focusAreaCode, focusArea.id]),
  );
  const focusAreaLabelsByCode = new Map(
    input.focusAreas.map((focusArea) => [
      focusArea.focusAreaCode,
      focusArea.displayName,
    ]),
  );

  const focusAreaSeen = new Set<string>();
  const focusAreaOptions: TutorApplicationFocusOption[] = [];

  for (const optionRow of input.needOptionRows) {
    if (optionRow.optionGroup !== "need_type") {
      continue;
    }
    const focusAreaCode = optionRow.subjectFocusAreaCode;
    if (!focusAreaCode) {
      continue;
    }
    const focusAreaId = focusAreaIdsByCode.get(focusAreaCode);
    if (!focusAreaId) {
      continue;
    }
    if (focusAreaSeen.has(focusAreaCode)) {
      continue;
    }
    focusAreaSeen.add(focusAreaCode);
    focusAreaOptions.push({
      allowedSubjectCodes: optionRow.allowedSubjectCodes,
      description: optionRow.helperText,
      focusAreaCode,
      focusAreaId,
      label: focusAreaLabelsByCode.get(focusAreaCode) ?? optionRow.displayLabel,
      value: focusAreaCode,
    });
  }

  return {
    focusAreas: focusAreaOptions,
    languages: input.languages.map((language) => ({
      flagCode: getReferenceLanguageFlagCode(language.languageCode),
      label: language.displayName,
      value: language.languageCode,
    })),
    subjects: input.subjects.map((subject) => ({
      iconKey: getReferenceSubjectIconKey(subject.subjectCode),
      label: subject.displayName,
      subjectCode: subject.subjectCode,
      subjectId: subject.id,
      value: subject.subjectCode,
    })),
  };
}

function mapCapabilityRecords(input: {
  capabilityRows: SubjectCapabilityRecord[];
  focusAreas: ReferenceSubjectFocusArea[];
  subjects: ReferenceSubject[];
}): TutorApplicationCapabilityDto[] {
  const subjectsById = new Map(input.subjects.map((subject) => [subject.id, subject]));
  const focusAreasById = new Map(
    input.focusAreas.map((focusArea) => [focusArea.id, focusArea]),
  );

  return input.capabilityRows.map((row) => {
    const subject = subjectsById.get(row.subject_id) ?? null;
    const focusArea = focusAreasById.get(row.subject_focus_area_id) ?? null;

    return {
      focusArea: focusArea
        ? { code: focusArea.focusAreaCode, label: focusArea.displayName }
        : null,
      id: row.id,
      subject: subject
        ? {
            code: subject.subjectCode,
            iconKey: getReferenceSubjectIconKey(subject.subjectCode),
            label: subject.displayName,
          }
        : null,
    };
  });
}

function deriveDraftFocusAreaCodes(input: {
  capabilities: TutorApplicationCapabilityDto[];
  options: TutorApplicationOptionsDto;
}): string[] {
  const focusAreaValuesByCode = new Set(
    input.options.focusAreas.map((option) => option.value),
  );
  return uniqueValues(
    input.capabilities
      .map((capability) => capability.focusArea?.code ?? null)
      .filter(isNonEmptyString)
      .filter((code) => focusAreaValuesByCode.has(code)),
  );
}

function buildReadinessGates(input: {
  applicationStatus: TutorApplicationStatus;
  hasMeetingLink: boolean;
  hasScheduleRules: boolean;
  payoutReadinessStatus: PayoutReadinessStatus;
  profileMinimumComplete: boolean;
  publicListingStatus: TutorPublicListingStatus;
}): TutorApplicationReadinessGate[] {
  const approvalState: TutorApplicationReadinessGate["state"] =
    input.applicationStatus === "approved"
      ? "complete"
      : input.applicationStatus === "submitted" ||
          input.applicationStatus === "under_review"
        ? "under_review"
        : input.applicationStatus === "rejected"
          ? "blocked"
          : "in_progress";

  const profileMinimumState: TutorApplicationReadinessGate["state"] =
    input.profileMinimumComplete ? "complete" : "in_progress";

  const scheduleState: TutorApplicationReadinessGate["state"] = input.hasScheduleRules
    ? "complete"
    : "in_progress";

  const meetingState: TutorApplicationReadinessGate["state"] = input.hasMeetingLink
    ? "complete"
    : "in_progress";

  const payoutState: TutorApplicationReadinessGate["state"] =
    input.payoutReadinessStatus === "enabled"
      ? "complete"
      : input.payoutReadinessStatus === "restricted"
        ? "blocked"
        : "in_progress";

  const holdState: TutorApplicationReadinessGate["state"] =
    input.publicListingStatus === "paused" || input.publicListingStatus === "delisted"
      ? "blocked"
      : "complete";

  return [
    {
      description: "Application approved by Mentor IB review.",
      key: "applicationApproved",
      label: "Application approved",
      state: approvalState,
    },
    {
      description:
        "Display name, headline, teaching description, rate, timezone, and at least one subject focus are complete.",
      key: "profileMinimum",
      label: "Profile minimum complete",
      state: profileMinimumState,
    },
    {
      description: "Weekly availability is set so students can request bookable slots.",
      key: "scheduleSet",
      label: "Schedule set",
      state: scheduleState,
    },
    {
      description: "A default meeting link is configured for lessons.",
      key: "meetingLink",
      label: "Meeting link configured",
      state: meetingState,
    },
    {
      description:
        "Stripe Connect Express onboarding is complete and payouts are enabled.",
      key: "payoutReady",
      label: "Payouts ready",
      state: payoutState,
    },
    {
      description: "No active suspension or admin-initiated hold.",
      key: "noActiveHold",
      label: "No active hold",
      state: holdState,
    },
  ];
}

function deriveSubmittedAt(profile: TutorProfileRecord): string | null {
  if (
    profile.application_status === "submitted" ||
    profile.application_status === "under_review"
  ) {
    return profile.updated_at;
  }

  return null;
}

function uniqueValues<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function loadTutorProfile(
  appUserId: string,
): Promise<TutorProfileRecord | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select(
      "application_status, bio, display_name, headline, hourly_rate_minor, id, payout_readiness_status, public_listing_status, public_slug, updated_at",
    )
    .eq("app_user_id", appUserId)
    .maybeSingle<TutorProfileRecord>();

  if (error) {
    throw new Error("Could not load the tutor application profile.");
  }

  return data ?? null;
}

async function loadSubjectCapabilities(
  tutorProfileId: string,
): Promise<SubjectCapabilityRecord[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_subject_capabilities")
    .select("id, subject_focus_area_id, subject_id")
    .eq("tutor_profile_id", tutorProfileId)
    .order("display_priority", { ascending: true })
    .returns<SubjectCapabilityRecord[]>();

  if (error) {
    throw new Error("Could not load tutor subject capabilities.");
  }

  return data ?? [];
}

async function loadLanguageCapabilities(
  tutorProfileId: string,
): Promise<LanguageCapabilityRecord[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_language_capabilities")
    .select("language_code")
    .eq("tutor_profile_id", tutorProfileId)
    .order("display_priority", { ascending: true })
    .returns<LanguageCapabilityRecord[]>();

  if (error) {
    throw new Error("Could not load tutor language capabilities.");
  }

  return data ?? [];
}

async function loadSchedulePolicy(
  tutorProfileId: string,
): Promise<SchedulePolicyRecord | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("schedule_policies")
    .select("timezone")
    .eq("tutor_profile_id", tutorProfileId)
    .maybeSingle<SchedulePolicyRecord>();

  if (error) {
    throw new Error("Could not load tutor schedule timezone.");
  }

  return data ?? null;
}

async function loadActiveAvailabilityRuleCount(
  tutorProfileId: string,
): Promise<number> {
  const supabase = createSupabaseServiceRoleClient();
  const { count, error } = await supabase
    .from("availability_rules")
    .select("id", { count: "exact", head: true })
    .eq("tutor_profile_id", tutorProfileId)
    .eq("visibility_status", "active");

  if (error) {
    throw new Error("Could not load tutor availability rule count.");
  }

  return count ?? 0;
}

async function loadMeetingPreference(
  tutorProfileId: string,
): Promise<MeetingPreferenceRecord | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_meeting_preferences")
    .select("default_meeting_url, is_active")
    .eq("tutor_profile_id", tutorProfileId)
    .maybeSingle<MeetingPreferenceRecord>();

  if (error) {
    throw new Error("Could not load tutor meeting preference.");
  }

  return data ?? null;
}
