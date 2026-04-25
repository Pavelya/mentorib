import { createHash } from "crypto";

import { resolveTimezone } from "@/lib/datetime";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { hasRole, isRestrictedAccount } from "@/modules/accounts/account-state";
import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import {
  getCompatibleSubjectOptions,
  getNeedTypeOption,
  getSubjectOption,
  isKnownMatchOption,
  type MatchFlowFieldErrors,
  type MatchFlowFormValues,
  type MatchFlowOptionsByField,
} from "@/modules/lessons/match-flow-options";
import { loadDiscoveryOptions } from "@/modules/reference/discovery";

const MATCH_RANKING_VERSION = "mvp-ranking-v1";
const MATCHING_PROJECTION_VERSION = "mvp-reference-projection-v1";
const DEFAULT_URGENCY_LEVEL = "flexible";

type StudentProfileRecord = {
  id: string;
};

type LearningNeedIdentity = {
  id: string;
};

type SubmitLearningNeedResult = {
  learningNeedId: string;
  matchRunId: string;
};

type LearningNeedPayload = {
  free_text_note: string | null;
  language_code: string;
  need_status: "active";
  need_type: string;
  session_frequency_intent: string | null;
  student_profile_id: string;
  subject_focus_area_id: string;
  subject_id: string;
  submitted_at: string;
  support_style: string | null;
  timezone: string;
  urgency_level: string;
};

type LearningNeedUpdatePayload = Omit<LearningNeedPayload, "student_profile_id">;

export class MatchFlowCommandError extends Error {
  code: string;
  fieldErrors: MatchFlowFieldErrors;

  constructor(
    code: string,
    message: string,
    fieldErrors: MatchFlowFieldErrors = {},
  ) {
    super(message);
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export async function submitLearningNeedForMatching(
  account: ResolvedAuthAccount,
  values: MatchFlowFormValues,
): Promise<SubmitLearningNeedResult> {
  if (isRestrictedAccount(account)) {
    throw new MatchFlowCommandError(
      "account_restricted",
      "This account cannot submit a learning need right now.",
    );
  }

  if (!hasRole(account, "student")) {
    throw new MatchFlowCommandError(
      "student_role_required",
      "Switch to a student account before starting a match.",
    );
  }

  const optionsByField = await loadDiscoveryOptions();
  const needType = getNeedTypeOption(values.needType, optionsByField);
  const subjectOption = getSubjectOption(values.subjectSlug, optionsByField);

  if (!needType || !subjectOption) {
    throw new MatchFlowCommandError(
      "invalid_match_options",
      "Please complete the required steps to see your matches.",
      {
        ...(needType ? {} : { needType: "Choose what you need help with." }),
        ...(subjectOption ? {} : { subjectSlug: "Choose the subject." }),
      },
    );
  }

  const fieldErrors = validateReferenceBackedOptions(values, optionsByField);

  if (!isCompatibleSubjectChoice(values.needType, values.subjectSlug, optionsByField)) {
    fieldErrors.subjectSlug =
      "Choose a subject that fits the type of help you picked.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new MatchFlowCommandError(
      "invalid_match_details",
      "Please complete the required steps to see your matches.",
      fieldErrors,
    );
  }

  const serviceRoleClient = createSupabaseServiceRoleClient();
  const studentProfile = await resolveStudentProfile(account);
  const focusAreaId = needType.focusAreaId;
  const subjectId = subjectOption.subjectId;

  if (!focusAreaId) {
    throw new MatchFlowCommandError(
      "focus_area_not_configured",
      "This type of help is not configured for matching yet. Choose another one or try again later.",
      { needType: "Choose an available type of help." },
    );
  }

  if (!subjectId) {
    throw new MatchFlowCommandError(
      "subject_not_configured",
      "This subject is not configured for matching yet. Choose another subject or try again later.",
      { subjectSlug: "Choose an available subject." },
    );
  }

  const submittedAt = new Date().toISOString();
  const timezone = resolveTimezone(values.timezone || account.timezone);
  const urgencyLevel = resolveUrgencyLevel(values.urgencyLevel, optionsByField);
  const freeTextNote = normalizeOptionalText(values.freeTextNote, 600);
  const sessionFrequencyIntent = normalizeOptionalText(values.sessionFrequencyIntent, 80);
  const supportStyle = normalizeOptionalText(values.supportStyle, 80);
  const payload: LearningNeedPayload = {
    free_text_note: freeTextNote,
    language_code: values.languageCode,
    need_status: "active" as const,
    need_type: needType.value,
    session_frequency_intent: sessionFrequencyIntent,
    student_profile_id: studentProfile.id,
    subject_focus_area_id: focusAreaId,
    subject_id: subjectId,
    submitted_at: submittedAt,
    support_style: supportStyle,
    timezone,
    urgency_level: urgencyLevel,
  };
  const { data: existingNeed, error: existingNeedError } = await serviceRoleClient
    .from("learning_needs")
    .select("id")
    .eq("student_profile_id", studentProfile.id)
    .in("need_status", ["draft", "active"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<LearningNeedIdentity>();

  if (existingNeedError) {
    throw new MatchFlowCommandError(
      "learning_need_lookup_failed",
      "We could not prepare your match yet. Please try again.",
    );
  }

  const learningNeedId = existingNeed
    ? await updateLearningNeed(existingNeed.id, {
        free_text_note: payload.free_text_note,
        language_code: payload.language_code,
        need_status: payload.need_status,
        need_type: payload.need_type,
        session_frequency_intent: payload.session_frequency_intent,
        subject_focus_area_id: payload.subject_focus_area_id,
        subject_id: payload.subject_id,
        submitted_at: payload.submitted_at,
        support_style: payload.support_style,
        timezone: payload.timezone,
        urgency_level: payload.urgency_level,
      })
    : await createLearningNeed(payload);

  const needSignature = buildNeedSignature({
    languageCode: values.languageCode,
    needType: needType.value,
    sessionFrequencyIntent,
    subjectCode: subjectOption.subjectCode,
    subjectFocusAreaCode: needType.focusAreaCode,
    supportStyle,
    timezone,
    urgencyLevel,
  });

  const { data: matchRun, error: matchRunError } = await serviceRoleClient
    .from("match_runs")
    .insert({
      learning_need_id: learningNeedId,
      matching_projection_version: MATCHING_PROJECTION_VERSION,
      need_signature: needSignature,
      ranking_version: MATCH_RANKING_VERSION,
      run_status: "queued",
    })
    .select("id")
    .single<{ id: string }>();

  if (matchRunError || !matchRun) {
    throw new MatchFlowCommandError(
      "match_run_failed",
      "Your need was saved, but we could not start matching yet. Please try again.",
    );
  }

  return {
    learningNeedId,
    matchRunId: matchRun.id,
  };
}

async function resolveStudentProfile(account: ResolvedAuthAccount) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data: existingProfile, error: existingProfileError } = await serviceRoleClient
    .from("student_profiles")
    .select("id")
    .eq("app_user_id", account.id)
    .maybeSingle<StudentProfileRecord>();

  if (existingProfileError) {
    throw new MatchFlowCommandError(
      "student_profile_lookup_failed",
      "We could not resolve your student profile. Please try again.",
    );
  }

  if (existingProfile) {
    return existingProfile;
  }

  const { data: insertedProfile, error: insertProfileError } = await serviceRoleClient
    .from("student_profiles")
    .insert({
      app_user_id: account.id,
      display_name: normalizeOptionalText(account.full_name, 120),
    })
    .select("id")
    .single<StudentProfileRecord>();

  if (insertProfileError || !insertedProfile) {
    throw new MatchFlowCommandError(
      "student_profile_create_failed",
      "We could not prepare your student profile. Please try again.",
    );
  }

  return insertedProfile;
}

async function createLearningNeed(payload: LearningNeedPayload) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data: insertedNeed, error: insertError } = await serviceRoleClient
    .from("learning_needs")
    .insert(payload)
    .select("id")
    .single<LearningNeedIdentity>();

  if (insertError || !insertedNeed) {
    throw new MatchFlowCommandError(
      "learning_need_create_failed",
      "We could not save your learning need. Please try again.",
    );
  }

  return insertedNeed.id;
}

async function updateLearningNeed(
  learningNeedId: string,
  payload: LearningNeedUpdatePayload,
) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data: updatedNeed, error: updateError } = await serviceRoleClient
    .from("learning_needs")
    .update(payload)
    .eq("id", learningNeedId)
    .select("id")
    .single<LearningNeedIdentity>();

  if (updateError || !updatedNeed) {
    throw new MatchFlowCommandError(
      "learning_need_update_failed",
      "We could not update your learning need. Please try again.",
    );
  }

  return updatedNeed.id;
}

function buildNeedSignature(payload: Record<string, string | null>) {
  const stablePayload = Object.keys(payload)
    .sort()
    .reduce<Record<string, string | null>>((accumulator, key) => {
      accumulator[key] = payload[key];
      return accumulator;
    }, {});

  return createHash("sha256").update(JSON.stringify(stablePayload)).digest("hex");
}

function normalizeOptionalText(value: string | null | undefined, maxLength: number) {
  const normalized = value?.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, maxLength);
}

function validateReferenceBackedOptions(
  values: MatchFlowFormValues,
  optionsByField: MatchFlowOptionsByField,
) {
  const fieldErrors: MatchFlowFieldErrors = {};

  if (!isKnownMatchOption("needType", values.needType, optionsByField)) {
    fieldErrors.needType = "Choose what you need help with.";
  }

  if (!isKnownMatchOption("subjectSlug", values.subjectSlug, optionsByField)) {
    fieldErrors.subjectSlug = "Choose the subject.";
  }

  if (
    values.urgencyLevel &&
    !isKnownMatchOption("urgencyLevel", values.urgencyLevel, optionsByField)
  ) {
    fieldErrors.urgencyLevel = "Choose when you need help.";
  }

  if (
    values.sessionFrequencyIntent &&
    !isKnownMatchOption(
      "sessionFrequencyIntent",
      values.sessionFrequencyIntent,
      optionsByField,
    )
  ) {
    fieldErrors.sessionFrequencyIntent = "Choose how often you want help.";
  }

  if (
    values.supportStyle &&
    !isKnownMatchOption("supportStyle", values.supportStyle, optionsByField)
  ) {
    fieldErrors.supportStyle = "Choose the support style that would help most.";
  }

  if (!isKnownMatchOption("languageCode", values.languageCode, optionsByField)) {
    fieldErrors.languageCode = "Choose a tutoring language.";
  }

  if (!values.timezone) {
    fieldErrors.timezone = "Choose a valid timezone.";
  }

  return fieldErrors;
}

function isCompatibleSubjectChoice(
  needTypeValue: string,
  subjectSlug: string,
  optionsByField: MatchFlowOptionsByField,
) {
  return getCompatibleSubjectOptions(needTypeValue, optionsByField).some(
    (subject) => subject.value === subjectSlug,
  );
}

function resolveUrgencyLevel(
  urgencyLevel: string,
  optionsByField: MatchFlowOptionsByField,
) {
  if (isKnownMatchOption("urgencyLevel", urgencyLevel, optionsByField)) {
    return urgencyLevel;
  }

  if (isKnownMatchOption("urgencyLevel", DEFAULT_URGENCY_LEVEL, optionsByField)) {
    return DEFAULT_URGENCY_LEVEL;
  }

  return optionsByField.urgencyLevel[optionsByField.urgencyLevel.length - 1]?.value ?? "flexible";
}
