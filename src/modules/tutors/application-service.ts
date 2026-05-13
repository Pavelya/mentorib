import "server-only";

import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { normalizeTimezone } from "@/lib/datetime";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  loadActiveReferenceLanguages,
  loadActiveReferenceLearningNeedOptionValues,
  loadActiveReferenceSubjectFocusAreas,
  loadActiveReferenceSubjects,
} from "@/modules/reference/catalog";
import {
  getReferenceLanguageFlagCode,
  getReferenceSubjectIconKey,
} from "@/modules/reference/visuals";
import { DEFAULT_PLATFORM_CURRENCY_CODE } from "@/modules/pricing/money";
import {
  DEFAULT_TUTOR_APPLICATION_CURRENCY,
  TUTOR_APPLICATION_DRAFT_STATUSES,
  buildResolvedCapabilityPairs,
  parseHourlyRateMajor,
  validateTutorApplicationDraft,
  type TutorApplicationDraftInput,
  type TutorApplicationFieldErrors,
  type TutorApplicationOptionsDto,
} from "@/modules/tutors/application";
import { type TutorApplicationStatus } from "@/modules/tutors/constants";

export class TutorApplicationCommandError extends Error {
  code: string;
  fieldErrors: TutorApplicationFieldErrors;

  constructor(
    code: string,
    message: string,
    fieldErrors: TutorApplicationFieldErrors = {},
  ) {
    super(message);
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

type TutorProfileRecord = {
  application_status: TutorApplicationStatus;
  currency_code: string;
  id: string;
};

export async function saveTutorApplicationDraft(
  account: Pick<ResolvedAuthAccount, "id">,
  values: TutorApplicationDraftInput,
): Promise<void> {
  const options = await loadApplicationOptions();
  await persistTutorApplicationDraft({
    account,
    options,
    submit: false,
    values,
  });
}

export async function submitTutorApplication(
  account: Pick<ResolvedAuthAccount, "id">,
  values: TutorApplicationDraftInput,
): Promise<void> {
  const options = await loadApplicationOptions();
  await persistTutorApplicationDraft({
    account,
    options,
    submit: true,
    values,
  });
}

export async function withdrawTutorApplication(
  account: Pick<ResolvedAuthAccount, "id">,
): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const profile = await loadTutorProfile(account.id);

  if (!profile) {
    throw new TutorApplicationCommandError(
      "tutor_profile_missing",
      "Your tutor profile has not been created yet.",
    );
  }

  if (
    profile.application_status !== "submitted" &&
    profile.application_status !== "under_review" &&
    profile.application_status !== "in_progress" &&
    profile.application_status !== "changes_requested"
  ) {
    throw new TutorApplicationCommandError(
      "withdraw_not_allowed",
      "This application can no longer be withdrawn.",
    );
  }

  const { error } = await supabase
    .from("tutor_profiles")
    .update({ application_status: "withdrawn" })
    .eq("id", profile.id);

  if (error) {
    throw new TutorApplicationCommandError(
      "withdraw_failed",
      "We couldn't withdraw your application right now. Please try again in a moment.",
    );
  }
}

async function loadApplicationOptions(): Promise<TutorApplicationOptionsDto> {
  const [subjects, focusAreas, languages, needOptionRows] = await Promise.all([
    loadActiveReferenceSubjects(),
    loadActiveReferenceSubjectFocusAreas(),
    loadActiveReferenceLanguages(),
    loadActiveReferenceLearningNeedOptionValues(),
  ]);

  const focusAreaIdsByCode = new Map(
    focusAreas.map((focusArea) => [focusArea.focusAreaCode, focusArea.id]),
  );
  const focusAreaLabelsByCode = new Map(
    focusAreas.map((focusArea) => [focusArea.focusAreaCode, focusArea.displayName]),
  );

  const focusAreaSeen = new Set<string>();
  const focusAreaOptions: TutorApplicationOptionsDto["focusAreas"] = [];
  for (const optionRow of needOptionRows) {
    if (optionRow.optionGroup !== "need_type") {
      continue;
    }
    const focusAreaCode = optionRow.subjectFocusAreaCode;
    if (!focusAreaCode || focusAreaSeen.has(focusAreaCode)) {
      continue;
    }
    const focusAreaId = focusAreaIdsByCode.get(focusAreaCode);
    if (!focusAreaId) {
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
    languages: languages.map((language) => ({
      flagCode: getReferenceLanguageFlagCode(language.languageCode),
      label: language.displayName,
      value: language.languageCode,
    })),
    subjects: subjects.map((subject) => ({
      iconKey: getReferenceSubjectIconKey(subject.subjectCode),
      label: subject.displayName,
      subjectCode: subject.subjectCode,
      subjectId: subject.id,
      value: subject.subjectCode,
    })),
  };
}

async function persistTutorApplicationDraft(input: {
  account: Pick<ResolvedAuthAccount, "id">;
  options: TutorApplicationOptionsDto;
  submit: boolean;
  values: TutorApplicationDraftInput;
}): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const profile = await loadTutorProfile(input.account.id);

  if (!profile) {
    throw new TutorApplicationCommandError(
      "tutor_profile_missing",
      "Create your tutor profile before saving the application.",
    );
  }

  if (!isApplicationOpenForEdits(profile.application_status, input.submit)) {
    throw new TutorApplicationCommandError(
      "application_locked",
      input.submit
        ? "This application can no longer be submitted."
        : "This application can no longer be edited.",
    );
  }

  if (input.submit) {
    const fieldErrors = validateTutorApplicationDraft(input.values, input.options);
    if (Object.keys(fieldErrors).length > 0) {
      throw new TutorApplicationCommandError(
        "invalid_application",
        "Please complete the highlighted fields before submitting.",
        fieldErrors,
      );
    }
  } else {
    const fieldErrors = validateDraftSoftConstraints(input.values);
    if (Object.keys(fieldErrors).length > 0) {
      throw new TutorApplicationCommandError(
        "invalid_application_draft",
        "Please review the highlighted fields before saving.",
        fieldErrors,
      );
    }
  }

  const displayName = nullIfBlank(input.values.displayName);
  const headline = nullIfBlank(input.values.headline);
  const bio = nullIfBlank(input.values.bio);
  const hourlyRateMinor = parseHourlyRateMajor(input.values.hourlyRateMajor);
  const normalizedTimezone = normalizeTimezone(input.values.timezone);
  const currencyCode =
    profile.currency_code?.trim().toUpperCase() ||
    DEFAULT_TUTOR_APPLICATION_CURRENCY ||
    DEFAULT_PLATFORM_CURRENCY_CODE;

  const nextApplicationStatus: TutorApplicationStatus = input.submit
    ? "submitted"
    : profile.application_status === "not_started" ||
        profile.application_status === "withdrawn"
      ? "in_progress"
      : profile.application_status;

  const { error: profileError } = await supabase
    .from("tutor_profiles")
    .update({
      application_status: nextApplicationStatus,
      bio,
      currency_code: currencyCode,
      display_name: displayName,
      headline,
      hourly_rate_minor: hourlyRateMinor,
    })
    .eq("id", profile.id);

  if (profileError) {
    throw new TutorApplicationCommandError(
      "tutor_profile_update_failed",
      "We couldn't save your application yet. Please try again in a moment.",
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
      throw new TutorApplicationCommandError(
        "schedule_policy_save_failed",
        "We couldn't save your timezone yet. Please try again in a moment.",
      );
    }
  }

  await syncSubjectCapabilities({
    options: input.options,
    tutorProfileId: profile.id,
    values: input.values,
  });

  await syncLanguageCapabilities({
    languageCodes: input.values.languageCodes,
    options: input.options,
    tutorProfileId: profile.id,
  });
}

function validateDraftSoftConstraints(
  values: TutorApplicationDraftInput,
): TutorApplicationFieldErrors {
  const errors: TutorApplicationFieldErrors = {};

  const hourlyRate = values.hourlyRateMajor.trim();

  if (hourlyRate) {
    const parsed = parseHourlyRateMajor(hourlyRate);
    if (parsed === null) {
      errors.hourlyRateMajor = "Enter a positive hourly rate.";
    }
  }

  if (values.timezone.trim() && !normalizeTimezone(values.timezone)) {
    errors.timezone = "We couldn't detect a valid timezone.";
  }

  return errors;
}

function isApplicationOpenForEdits(
  status: TutorApplicationStatus,
  submitting: boolean,
): boolean {
  if (submitting) {
    return TUTOR_APPLICATION_DRAFT_STATUSES.includes(status);
  }

  return (
    TUTOR_APPLICATION_DRAFT_STATUSES.includes(status) ||
    status === "withdrawn"
  );
}

async function syncSubjectCapabilities(input: {
  options: TutorApplicationOptionsDto;
  tutorProfileId: string;
  values: TutorApplicationDraftInput;
}) {
  const supabase = createSupabaseServiceRoleClient();
  const desiredPairs = buildResolvedCapabilityPairs(input.values, input.options);

  const desired = new Map<string, { focusAreaId: string; subjectId: string }>();
  desiredPairs.forEach((pair) => {
    desired.set(`${pair.subjectId}::${pair.focusAreaId}`, pair);
  });

  const { data: existing, error: existingError } = await supabase
    .from("tutor_subject_capabilities")
    .select("id, subject_id, subject_focus_area_id")
    .eq("tutor_profile_id", input.tutorProfileId)
    .returns<
      Array<{ id: string; subject_id: string; subject_focus_area_id: string }>
    >();

  if (existingError) {
    throw new TutorApplicationCommandError(
      "subject_capabilities_load_failed",
      "We couldn't save your teaching subjects. Please try again in a moment.",
    );
  }

  const existingByKey = new Map(
    (existing ?? []).map((row) => [
      `${row.subject_id}::${row.subject_focus_area_id}`,
      row.id,
    ]),
  );

  const toRemoveIds: string[] = [];
  for (const [key, id] of existingByKey) {
    if (!desired.has(key)) {
      toRemoveIds.push(id);
    }
  }

  const desiredEntries = Array.from(desired.entries());
  const toInsert = desiredEntries
    .filter(([key]) => !existingByKey.has(key))
    .map(([, value], index) => ({
      display_priority: index,
      subject_focus_area_id: value.focusAreaId,
      subject_id: value.subjectId,
      tutor_profile_id: input.tutorProfileId,
    }));

  if (toRemoveIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("tutor_subject_capabilities")
      .delete()
      .in("id", toRemoveIds);

    if (deleteError) {
      throw new TutorApplicationCommandError(
        "subject_capabilities_delete_failed",
        "We couldn't save your teaching subjects. Please try again in a moment.",
      );
    }
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("tutor_subject_capabilities")
      .insert(toInsert);

    if (insertError) {
      throw new TutorApplicationCommandError(
        "subject_capabilities_insert_failed",
        "We couldn't save your teaching subjects. Please try again in a moment.",
      );
    }
  }
}

async function syncLanguageCapabilities(input: {
  languageCodes: string[];
  options: TutorApplicationOptionsDto;
  tutorProfileId: string;
}) {
  const supabase = createSupabaseServiceRoleClient();
  const validLanguageCodes = new Set(
    input.options.languages.map((option) => option.value),
  );
  const desired = Array.from(
    new Set(
      input.languageCodes.filter((code) => validLanguageCodes.has(code)),
    ),
  );

  const { data: existing, error: existingError } = await supabase
    .from("tutor_language_capabilities")
    .select("language_code")
    .eq("tutor_profile_id", input.tutorProfileId)
    .returns<Array<{ language_code: string }>>();

  if (existingError) {
    throw new TutorApplicationCommandError(
      "language_capabilities_load_failed",
      "We couldn't save your languages. Please try again in a moment.",
    );
  }

  const existingCodes = new Set((existing ?? []).map((row) => row.language_code));
  const toAdd = desired.filter((code) => !existingCodes.has(code));
  const toRemove = Array.from(existingCodes).filter(
    (code) => !desired.includes(code),
  );

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("tutor_language_capabilities")
      .delete()
      .eq("tutor_profile_id", input.tutorProfileId)
      .in("language_code", toRemove);

    if (deleteError) {
      throw new TutorApplicationCommandError(
        "language_capabilities_delete_failed",
        "We couldn't save your languages. Please try again in a moment.",
      );
    }
  }

  if (toAdd.length > 0) {
    const rows = toAdd.map((languageCode, index) => ({
      display_priority: index,
      language_code: languageCode,
      tutor_profile_id: input.tutorProfileId,
    }));
    const { error: insertError } = await supabase
      .from("tutor_language_capabilities")
      .insert(rows);

    if (insertError) {
      throw new TutorApplicationCommandError(
        "language_capabilities_insert_failed",
        "We couldn't save your languages. Please try again in a moment.",
      );
    }
  }
}

async function loadTutorProfile(
  appUserId: string,
): Promise<TutorProfileRecord | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("application_status, currency_code, id")
    .eq("app_user_id", appUserId)
    .maybeSingle<TutorProfileRecord>();

  if (error) {
    throw new Error("Could not load the tutor application profile.");
  }

  return data ?? null;
}

function nullIfBlank(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
