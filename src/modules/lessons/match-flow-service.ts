import { createHash } from "crypto";

import { resolveTimezone } from "@/lib/datetime";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { hasRole, isRestrictedAccount } from "@/modules/accounts/account-state";
import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import {
  getNeedTypeOption,
  getSubjectOption,
  isKnownMatchOption,
  type MatchFlowFieldErrors,
  type MatchFlowFormValues,
} from "@/modules/lessons/match-flow-options";

const MATCH_RANKING_VERSION = "mvp-ranking-v1";
const MATCHING_PROJECTION_VERSION = "mvp-reference-projection-v1";

type StudentProfileRecord = {
  id: string;
};

type ReferenceSubjectRecord = {
  display_name: string;
  id: string;
  slug: string;
  subject_code: string;
};

type ReferenceFocusAreaRecord = {
  display_name: string;
  focus_area_code: string;
  id: string;
  slug: string;
};

type ReferenceLanguageRecord = {
  display_name: string;
  language_code: string;
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

  const needType = getNeedTypeOption(values.needType);
  const subjectOption = getSubjectOption(values.subjectSlug);

  if (!needType || !subjectOption) {
    throw new MatchFlowCommandError(
      "invalid_match_options",
      "Please complete the required steps to see your matches.",
      {
        ...(needType ? {} : { needType: "Choose the IB pressure point." }),
        ...(subjectOption ? {} : { subjectSlug: "Choose the subject or component." }),
      },
    );
  }

  const fieldErrors: MatchFlowFieldErrors = {};

  if (!isKnownMatchOption("urgencyLevel", values.urgencyLevel)) {
    fieldErrors.urgencyLevel = "Choose when you need help.";
  }

  if (!isKnownMatchOption("sessionFrequencyIntent", values.sessionFrequencyIntent)) {
    fieldErrors.sessionFrequencyIntent = "Choose the kind of lesson rhythm you want.";
  }

  if (!isKnownMatchOption("supportStyle", values.supportStyle)) {
    fieldErrors.supportStyle = "Choose the support style that would help most.";
  }

  if (!values.timezone) {
    fieldErrors.timezone = "Choose a valid timezone.";
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
  const [subject, focusArea, language] = await Promise.all([
    resolveSubject(subjectOption),
    resolveFocusArea(needType),
    resolveLanguage(values.languageCode),
  ]);
  const submittedAt = new Date().toISOString();
  const timezone = resolveTimezone(values.timezone || account.timezone);
  const freeTextNote = normalizeOptionalText(values.freeTextNote, 600);
  const sessionFrequencyIntent = normalizeOptionalText(values.sessionFrequencyIntent, 80);
  const supportStyle = normalizeOptionalText(values.supportStyle, 80);
  const payload: LearningNeedPayload = {
    free_text_note: freeTextNote,
    language_code: language.language_code,
    need_status: "active" as const,
    need_type: needType.value,
    session_frequency_intent: sessionFrequencyIntent,
    student_profile_id: studentProfile.id,
    subject_focus_area_id: focusArea.id,
    subject_id: subject.id,
    submitted_at: submittedAt,
    support_style: supportStyle,
    timezone,
    urgency_level: values.urgencyLevel,
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
    languageCode: language.language_code,
    needType: needType.value,
    sessionFrequencyIntent,
    subjectFocusAreaId: focusArea.id,
    subjectId: subject.id,
    supportStyle,
    timezone,
    urgencyLevel: values.urgencyLevel,
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

async function resolveSubject(subjectOption: NonNullable<ReturnType<typeof getSubjectOption>>) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data: subjects, error } = await serviceRoleClient
    .from("subjects")
    .select("id, display_name, slug, subject_code")
    .eq("is_active", true)
    .returns<ReferenceSubjectRecord[]>();

  if (error) {
    throw new MatchFlowCommandError(
      "reference_subjects_failed",
      "Subject options are unavailable right now. Please try again.",
    );
  }

  const subject = subjects?.find((candidate) => {
    return (
      subjectOption.subjectSlugs.some((slug) => slug === candidate.slug) ||
      subjectOption.subjectCodes.some((code) => code === candidate.subject_code)
    );
  });

  if (!subject) {
    throw new MatchFlowCommandError(
      "subject_not_configured",
      "This subject is not available in matching yet. Choose another subject or try again later.",
      { subjectSlug: "Choose an available subject." },
    );
  }

  return subject;
}

async function resolveFocusArea(needType: NonNullable<ReturnType<typeof getNeedTypeOption>>) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data: focusAreas, error } = await serviceRoleClient
    .from("subject_focus_areas")
    .select("id, display_name, slug, focus_area_code")
    .eq("is_active", true)
    .returns<ReferenceFocusAreaRecord[]>();

  if (error) {
    throw new MatchFlowCommandError(
      "reference_focus_areas_failed",
      "Focus options are unavailable right now. Please try again.",
    );
  }

  const focusArea = focusAreas?.find((candidate) => {
    return (
      needType.focusAreaSlugs.some((slug) => slug === candidate.slug) ||
      needType.focusAreaCodes.some((code) => code === candidate.focus_area_code)
    );
  });

  if (!focusArea) {
    throw new MatchFlowCommandError(
      "focus_area_not_configured",
      "This pressure point is not available in matching yet. Choose another one or try again later.",
      { needType: "Choose an available pressure point." },
    );
  }

  return focusArea;
}

async function resolveLanguage(languageCode: string) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data: language, error } = await serviceRoleClient
    .from("languages")
    .select("language_code, display_name")
    .eq("language_code", languageCode)
    .eq("is_active", true)
    .maybeSingle<ReferenceLanguageRecord>();

  if (error || !language) {
    throw new MatchFlowCommandError(
      "language_not_configured",
      "This language is not available in matching yet. Choose another language or try again later.",
      { languageCode: "Choose an available language." },
    );
  }

  return language;
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
