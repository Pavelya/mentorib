import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { isValidTimezone, resolveTimezone } from "@/lib/datetime";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  loadActiveReferenceMeetingProviders,
  type ReferenceMeetingProvider,
} from "@/modules/reference/catalog";
import {
  type AvailabilityRuleVisibilityStatus,
  type TutorApplicationStatus,
} from "@/modules/tutors/constants";

const MIN_NOTICE_MINUTES = 0;
const MAX_NOTICE_MINUTES = 14 * 24 * 60;
const MAX_BUFFER_MINUTES = 240;
const MAX_DAILY_CAPACITY = 24;
const MAX_WEEKLY_CAPACITY = 80;
const MAX_DISPLAY_LABEL_LENGTH = 80;

const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

const TIME_OF_DAY_PATTERN = /^(\d{2}):(\d{2})(?::\d{2})?$/;

type TutorProfileRecord = {
  application_status: TutorApplicationStatus;
  display_name: string | null;
  id: string;
};

type SchedulePolicyRecord = {
  buffer_after_minutes: number;
  buffer_before_minutes: number;
  daily_capacity: number | null;
  is_accepting_new_students: boolean;
  minimum_notice_minutes: number;
  timezone: string;
  weekly_capacity: number | null;
};

type AvailabilityRuleRecord = {
  day_of_week: number;
  end_local_time: string;
  id: string;
  start_local_time: string;
  visibility_status: AvailabilityRuleVisibilityStatus;
};

type MeetingPreferenceRecord = {
  default_meeting_url: string | null;
  display_label: string | null;
  is_active: boolean;
  preferred_provider: string | null;
};

export type TutorScheduleAvailabilityRuleDto = {
  dayLabel: string;
  dayOfWeek: number;
  endLocalTime: string;
  id: string;
  startLocalTime: string;
  visibilityStatus: AvailabilityRuleVisibilityStatus;
};

export type TutorSchedulePolicyDto = {
  bufferAfterMinutes: number;
  bufferBeforeMinutes: number;
  dailyCapacity: number | null;
  isAcceptingNewStudents: boolean;
  minimumNoticeMinutes: number;
  timezone: string;
  weeklyCapacity: number | null;
};

export type TutorMeetingPreferenceDto = {
  defaultMeetingUrl: string | null;
  displayLabel: string | null;
  isActive: boolean;
  preferredProvider: string | null;
};

export type TutorScheduleProfileDto = {
  applicationStatus: TutorApplicationStatus;
  displayName: string;
};

export type TutorScheduleDto = {
  availabilityRules: TutorScheduleAvailabilityRuleDto[];
  meetingPreference: TutorMeetingPreferenceDto;
  meetingProviderOptions: ReferenceMeetingProvider[];
  policy: TutorSchedulePolicyDto;
  profile: TutorScheduleProfileDto;
  state: "ready" | "no_profile";
};

export async function getTutorSchedule(
  account: Pick<ResolvedAuthAccount, "id" | "timezone">,
): Promise<TutorScheduleDto> {
  const tutorProfile = await loadTutorProfile(account.id);
  const meetingProviderOptions = await loadActiveReferenceMeetingProviders();

  if (!tutorProfile) {
    return buildEmptySchedule(account.timezone, meetingProviderOptions);
  }

  const [policy, rules, preference] = await Promise.all([
    loadOrInitSchedulePolicy(tutorProfile.id, account.timezone),
    loadAvailabilityRules(tutorProfile.id),
    loadMeetingPreference(tutorProfile.id),
  ]);

  return {
    availabilityRules: rules.map(mapAvailabilityRuleRecord),
    meetingPreference: mapMeetingPreferenceRecord(preference),
    meetingProviderOptions,
    policy: mapSchedulePolicyRecord(policy),
    profile: {
      applicationStatus: tutorProfile.application_status,
      displayName: tutorProfile.display_name?.trim() || "Mentor IB tutor",
    },
    state: "ready",
  };
}

export type SchedulePolicyFormValues = {
  bufferAfterMinutes: string;
  bufferBeforeMinutes: string;
  dailyCapacity: string;
  isAcceptingNewStudents: string;
  minimumNoticeMinutes: string;
  timezone: string;
  weeklyCapacity: string;
};

export const emptySchedulePolicyFormValues: SchedulePolicyFormValues = {
  bufferAfterMinutes: "",
  bufferBeforeMinutes: "",
  dailyCapacity: "",
  isAcceptingNewStudents: "true",
  minimumNoticeMinutes: "",
  timezone: "",
  weeklyCapacity: "",
};

export type SchedulePolicyFieldErrors = Partial<
  Record<keyof SchedulePolicyFormValues, string>
>;

export class SchedulePolicyCommandError extends Error {
  code: string;
  fieldErrors: SchedulePolicyFieldErrors;

  constructor(
    code: string,
    message: string,
    fieldErrors: SchedulePolicyFieldErrors = {},
  ) {
    super(message);
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export async function updateSchedulePolicy(
  account: Pick<ResolvedAuthAccount, "id">,
  values: SchedulePolicyFormValues,
) {
  const tutorProfile = await loadTutorProfile(account.id);

  if (!tutorProfile) {
    throw new SchedulePolicyCommandError(
      "tutor_profile_missing",
      "Create your tutor profile before saving schedule settings.",
    );
  }

  const fieldErrors = validateSchedulePolicyValues(values);

  if (Object.keys(fieldErrors).length > 0) {
    throw new SchedulePolicyCommandError(
      "invalid_schedule_policy",
      "Please review the highlighted fields before saving your schedule.",
      fieldErrors,
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("schedule_policies").upsert(
    {
      tutor_profile_id: tutorProfile.id,
      timezone: values.timezone.trim(),
      minimum_notice_minutes: Number.parseInt(values.minimumNoticeMinutes, 10),
      buffer_before_minutes: Number.parseInt(values.bufferBeforeMinutes, 10),
      buffer_after_minutes: Number.parseInt(values.bufferAfterMinutes, 10),
      daily_capacity: parseOptionalIntOrNull(values.dailyCapacity),
      weekly_capacity: parseOptionalIntOrNull(values.weeklyCapacity),
      is_accepting_new_students: values.isAcceptingNewStudents === "true",
    },
    { onConflict: "tutor_profile_id" },
  );

  if (error) {
    throw new SchedulePolicyCommandError(
      "schedule_policy_update_failed",
      "We couldn't save your schedule settings yet. Please try again in a moment.",
    );
  }
}

export type AvailabilityRuleFormValues = {
  dayOfWeek: string;
  endLocalTime: string;
  startLocalTime: string;
};

export type AvailabilityRuleFieldErrors = Partial<
  Record<keyof AvailabilityRuleFormValues, string>
>;

export class AvailabilityRuleCommandError extends Error {
  code: string;
  fieldErrors: AvailabilityRuleFieldErrors;

  constructor(
    code: string,
    message: string,
    fieldErrors: AvailabilityRuleFieldErrors = {},
  ) {
    super(message);
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export async function addAvailabilityRule(
  account: Pick<ResolvedAuthAccount, "id">,
  values: AvailabilityRuleFormValues,
) {
  const tutorProfile = await loadTutorProfile(account.id);

  if (!tutorProfile) {
    throw new AvailabilityRuleCommandError(
      "tutor_profile_missing",
      "Create your tutor profile before adding availability windows.",
    );
  }

  const fieldErrors = validateAvailabilityRuleValues(values);

  if (Object.keys(fieldErrors).length > 0) {
    throw new AvailabilityRuleCommandError(
      "invalid_availability_rule",
      "Please review the highlighted fields before adding this window.",
      fieldErrors,
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("availability_rules").insert({
    tutor_profile_id: tutorProfile.id,
    day_of_week: Number.parseInt(values.dayOfWeek, 10),
    start_local_time: normalizeTimeOfDay(values.startLocalTime),
    end_local_time: normalizeTimeOfDay(values.endLocalTime),
    visibility_status: "active",
  });

  if (error) {
    if (error.code === "23505") {
      throw new AvailabilityRuleCommandError(
        "availability_rule_duplicate",
        "An identical availability window already exists for that day.",
      );
    }

    throw new AvailabilityRuleCommandError(
      "availability_rule_create_failed",
      "We couldn't add that availability window yet. Please try again in a moment.",
    );
  }
}

export async function removeAvailabilityRule(
  account: Pick<ResolvedAuthAccount, "id">,
  ruleId: string,
) {
  const tutorProfile = await loadTutorProfile(account.id);

  if (!tutorProfile) {
    return;
  }

  const supabase = createSupabaseServiceRoleClient();

  await supabase
    .from("availability_rules")
    .delete()
    .eq("id", ruleId)
    .eq("tutor_profile_id", tutorProfile.id);
}

export type MeetingPreferenceFormValues = {
  defaultMeetingUrl: string;
  displayLabel: string;
  preferredProvider: string;
};

export const emptyMeetingPreferenceFormValues: MeetingPreferenceFormValues = {
  defaultMeetingUrl: "",
  displayLabel: "",
  preferredProvider: "",
};

export type MeetingPreferenceFieldErrors = Partial<
  Record<keyof MeetingPreferenceFormValues, string>
>;

export class MeetingPreferenceCommandError extends Error {
  code: string;
  fieldErrors: MeetingPreferenceFieldErrors;

  constructor(
    code: string,
    message: string,
    fieldErrors: MeetingPreferenceFieldErrors = {},
  ) {
    super(message);
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export async function updateMeetingPreference(
  account: Pick<ResolvedAuthAccount, "id">,
  values: MeetingPreferenceFormValues,
) {
  const tutorProfile = await loadTutorProfile(account.id);

  if (!tutorProfile) {
    throw new MeetingPreferenceCommandError(
      "tutor_profile_missing",
      "Create your tutor profile before saving meeting settings.",
    );
  }

  const providerOptions = await loadActiveReferenceMeetingProviders();
  const fieldErrors = validateMeetingPreferenceValues(values, providerOptions);

  if (Object.keys(fieldErrors).length > 0) {
    throw new MeetingPreferenceCommandError(
      "invalid_meeting_preference",
      "Please review the highlighted fields before saving your meeting settings.",
      fieldErrors,
    );
  }

  const provider = values.preferredProvider.trim() || null;
  const url = values.defaultMeetingUrl.trim() || null;
  const label = values.displayLabel.trim() || null;
  const supabase = createSupabaseServiceRoleClient();

  const { error } = await supabase.from("tutor_meeting_preferences").upsert(
    {
      tutor_profile_id: tutorProfile.id,
      preferred_provider: provider,
      default_meeting_url: url,
      display_label: label,
      is_active: true,
    },
    { onConflict: "tutor_profile_id" },
  );

  if (error) {
    throw new MeetingPreferenceCommandError(
      "meeting_preference_update_failed",
      "We couldn't save your meeting settings yet. Please try again in a moment.",
    );
  }
}

async function loadTutorProfile(
  appUserId: string,
): Promise<TutorProfileRecord | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("application_status, display_name, id")
    .eq("app_user_id", appUserId)
    .maybeSingle<TutorProfileRecord>();

  if (error) {
    throw new Error("Could not load the tutor profile.");
  }

  return data ?? null;
}

async function loadOrInitSchedulePolicy(
  tutorProfileId: string,
  accountTimezone: string,
): Promise<SchedulePolicyRecord> {
  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("schedule_policies")
    .select(
      "buffer_after_minutes, buffer_before_minutes, daily_capacity, is_accepting_new_students, minimum_notice_minutes, timezone, weekly_capacity",
    )
    .eq("tutor_profile_id", tutorProfileId)
    .maybeSingle<SchedulePolicyRecord>();

  if (error) {
    throw new Error("Could not load the schedule policy.");
  }

  if (data) {
    return data;
  }

  const fallbackTimezone = resolveTimezone(accountTimezone);

  return {
    buffer_after_minutes: 0,
    buffer_before_minutes: 0,
    daily_capacity: null,
    is_accepting_new_students: true,
    minimum_notice_minutes: 480,
    timezone: fallbackTimezone,
    weekly_capacity: null,
  };
}

async function loadAvailabilityRules(
  tutorProfileId: string,
): Promise<AvailabilityRuleRecord[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("availability_rules")
    .select("day_of_week, end_local_time, id, start_local_time, visibility_status")
    .eq("tutor_profile_id", tutorProfileId)
    .order("day_of_week", { ascending: true })
    .order("start_local_time", { ascending: true })
    .returns<AvailabilityRuleRecord[]>();

  if (error) {
    throw new Error("Could not load tutor availability rules.");
  }

  return data ?? [];
}

async function loadMeetingPreference(
  tutorProfileId: string,
): Promise<MeetingPreferenceRecord | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_meeting_preferences")
    .select("default_meeting_url, display_label, is_active, preferred_provider")
    .eq("tutor_profile_id", tutorProfileId)
    .maybeSingle<MeetingPreferenceRecord>();

  if (error) {
    throw new Error("Could not load the tutor meeting preference.");
  }

  return data ?? null;
}

function buildEmptySchedule(
  accountTimezone: string,
  meetingProviderOptions: ReferenceMeetingProvider[],
): TutorScheduleDto {
  return {
    availabilityRules: [],
    meetingPreference: {
      defaultMeetingUrl: null,
      displayLabel: null,
      isActive: true,
      preferredProvider: null,
    },
    meetingProviderOptions,
    policy: {
      bufferAfterMinutes: 0,
      bufferBeforeMinutes: 0,
      dailyCapacity: null,
      isAcceptingNewStudents: true,
      minimumNoticeMinutes: 480,
      timezone: resolveTimezone(accountTimezone),
      weeklyCapacity: null,
    },
    profile: {
      applicationStatus: "not_started",
      displayName: "Mentor IB tutor",
    },
    state: "no_profile",
  };
}

function mapSchedulePolicyRecord(
  record: SchedulePolicyRecord,
): TutorSchedulePolicyDto {
  return {
    bufferAfterMinutes: record.buffer_after_minutes,
    bufferBeforeMinutes: record.buffer_before_minutes,
    dailyCapacity: record.daily_capacity,
    isAcceptingNewStudents: record.is_accepting_new_students,
    minimumNoticeMinutes: record.minimum_notice_minutes,
    timezone: record.timezone,
    weeklyCapacity: record.weekly_capacity,
  };
}

function mapAvailabilityRuleRecord(
  record: AvailabilityRuleRecord,
): TutorScheduleAvailabilityRuleDto {
  return {
    dayLabel: getDayOfWeekLabel(record.day_of_week),
    dayOfWeek: record.day_of_week,
    endLocalTime: trimSeconds(record.end_local_time),
    id: record.id,
    startLocalTime: trimSeconds(record.start_local_time),
    visibilityStatus: record.visibility_status,
  };
}

function mapMeetingPreferenceRecord(
  record: MeetingPreferenceRecord | null,
): TutorMeetingPreferenceDto {
  return {
    defaultMeetingUrl: record?.default_meeting_url ?? null,
    displayLabel: record?.display_label ?? null,
    isActive: record?.is_active ?? true,
    preferredProvider: record?.preferred_provider ?? null,
  };
}

function validateSchedulePolicyValues(
  values: SchedulePolicyFormValues,
): SchedulePolicyFieldErrors {
  const errors: SchedulePolicyFieldErrors = {};

  if (!values.timezone.trim()) {
    errors.timezone = "Choose the timezone you schedule lessons in.";
  } else if (!isValidTimezone(values.timezone.trim())) {
    errors.timezone = "Choose a valid IANA timezone.";
  }

  errors.minimumNoticeMinutes = checkRangedInt(
    values.minimumNoticeMinutes,
    MIN_NOTICE_MINUTES,
    MAX_NOTICE_MINUTES,
    "Enter a notice window between 0 and 14 days, in minutes.",
  );
  errors.bufferBeforeMinutes = checkRangedInt(
    values.bufferBeforeMinutes,
    0,
    MAX_BUFFER_MINUTES,
    "Enter a buffer between 0 and 240 minutes.",
  );
  errors.bufferAfterMinutes = checkRangedInt(
    values.bufferAfterMinutes,
    0,
    MAX_BUFFER_MINUTES,
    "Enter a buffer between 0 and 240 minutes.",
  );

  if (values.dailyCapacity.trim()) {
    errors.dailyCapacity = checkRangedInt(
      values.dailyCapacity,
      1,
      MAX_DAILY_CAPACITY,
      "Daily capacity must be between 1 and 24 lessons.",
    );
  }

  if (values.weeklyCapacity.trim()) {
    errors.weeklyCapacity = checkRangedInt(
      values.weeklyCapacity,
      1,
      MAX_WEEKLY_CAPACITY,
      "Weekly capacity must be between 1 and 80 lessons.",
    );
  }

  if (
    !errors.dailyCapacity &&
    !errors.weeklyCapacity &&
    values.dailyCapacity.trim() &&
    values.weeklyCapacity.trim()
  ) {
    const daily = Number.parseInt(values.dailyCapacity, 10);
    const weekly = Number.parseInt(values.weeklyCapacity, 10);

    if (weekly < daily) {
      errors.weeklyCapacity =
        "Weekly capacity must be greater than or equal to daily capacity.";
    }
  }

  for (const key of Object.keys(errors) as (keyof SchedulePolicyFieldErrors)[]) {
    if (!errors[key]) {
      delete errors[key];
    }
  }

  return errors;
}

function validateAvailabilityRuleValues(
  values: AvailabilityRuleFormValues,
): AvailabilityRuleFieldErrors {
  const errors: AvailabilityRuleFieldErrors = {};

  const dayOfWeek = Number.parseInt(values.dayOfWeek, 10);

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    errors.dayOfWeek = "Choose a day of the week.";
  }

  if (!values.startLocalTime || !TIME_OF_DAY_PATTERN.test(values.startLocalTime)) {
    errors.startLocalTime = "Choose a start time.";
  }

  if (!values.endLocalTime || !TIME_OF_DAY_PATTERN.test(values.endLocalTime)) {
    errors.endLocalTime = "Choose an end time.";
  }

  if (
    !errors.startLocalTime &&
    !errors.endLocalTime &&
    compareTimeStrings(values.startLocalTime, values.endLocalTime) >= 0
  ) {
    errors.endLocalTime = "End time must be after the start time.";
  }

  return errors;
}

function validateMeetingPreferenceValues(
  values: MeetingPreferenceFormValues,
  providerOptions: readonly ReferenceMeetingProvider[],
): MeetingPreferenceFieldErrors {
  const errors: MeetingPreferenceFieldErrors = {};
  const provider = values.preferredProvider.trim();
  const url = values.defaultMeetingUrl.trim();

  if (provider && !providerOptions.some((option) => option.providerKey === provider)) {
    errors.preferredProvider = "Choose a meeting provider from the list.";
  }

  if (provider && !url) {
    errors.defaultMeetingUrl = "Add the meeting link your students should join.";
  }

  if (url && !provider) {
    errors.preferredProvider = "Choose the meeting provider for this link.";
  }

  if (url && !/^https:\/\/.+/.test(url)) {
    errors.defaultMeetingUrl = "Use a secure https:// meeting URL.";
  }

  if (values.displayLabel.length > MAX_DISPLAY_LABEL_LENGTH) {
    errors.displayLabel = "Use a shorter display label.";
  }

  return errors;
}

function checkRangedInt(
  raw: string,
  min: number,
  max: number,
  message: string,
): string | undefined {
  const value = Number.parseInt(raw, 10);

  if (!Number.isInteger(value) || value < min || value > max) {
    return message;
  }

  return undefined;
}

function parseOptionalIntOrNull(raw: string): number | null {
  const trimmed = raw.trim();

  if (!trimmed) {
    return null;
  }

  const value = Number.parseInt(trimmed, 10);

  return Number.isInteger(value) ? value : null;
}

function normalizeTimeOfDay(value: string): string {
  const match = value.match(TIME_OF_DAY_PATTERN);

  if (!match) {
    return value;
  }

  return `${match[1]}:${match[2]}:00`;
}

function trimSeconds(value: string): string {
  const match = value.match(TIME_OF_DAY_PATTERN);

  if (!match) {
    return value;
  }

  return `${match[1]}:${match[2]}`;
}

function compareTimeStrings(left: string, right: string): number {
  return normalizeTimeOfDay(left).localeCompare(normalizeTimeOfDay(right));
}

export function getDayOfWeekLabel(dayOfWeek: number): string {
  return DAY_OF_WEEK_LABELS[dayOfWeek] ?? "Day";
}
