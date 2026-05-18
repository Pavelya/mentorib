"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureAuthAccount } from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AvailabilityRuleCommandError,
  MeetingPreferenceCommandError,
  SchedulePolicyCommandError,
  addAvailabilityRule,
  removeAvailabilityRule,
  updateMeetingPreference,
  updateSchedulePolicy,
  type AvailabilityRuleFormValues,
  type MeetingPreferenceFormValues,
  type SchedulePolicyFormValues,
} from "@/modules/tutors/tutor-schedule";

import {
  emptyAvailabilityRuleValues,
  type AvailabilityRuleActionState,
  type MeetingPreferenceActionState,
  type SchedulePolicyActionState,
} from "./action-types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SCHEDULE_PATH = "/tutor/schedule";

export async function updateSchedulePolicyAction(
  _previous: SchedulePolicyActionState,
  formData: FormData,
): Promise<SchedulePolicyActionState> {
  const values = readSchedulePolicyValues(formData);

  if (!isSupabaseAuthConfigured()) {
    return {
      code: "auth_unconfigured",
      fieldErrors: {},
      message:
        "Schedule editing is not available until Supabase auth is configured.",
      values,
    };
  }

  let redirectPath: Route | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email?.trim()) {
      redirectPath = buildAuthSignInPath(SCHEDULE_PATH) as Route;
    } else {
      const account = await ensureAuthAccount(user);
      await updateSchedulePolicy(account, values);
    }
  } catch (error) {
    if (error instanceof SchedulePolicyCommandError) {
      return {
        code: error.code,
        fieldErrors: error.fieldErrors,
        message: error.message,
        values,
      };
    }

    return {
      code: "schedule_policy_update_failed",
      fieldErrors: {},
      message:
        "We couldn't save your schedule settings yet. Please try again in a moment.",
      values,
    };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  revalidatePath(SCHEDULE_PATH);

  return {
    code: "success",
    fieldErrors: {},
    message: "Your schedule settings have been saved.",
    values,
  };
}

export async function addAvailabilityRuleAction(
  _previous: AvailabilityRuleActionState,
  formData: FormData,
): Promise<AvailabilityRuleActionState> {
  const values = readAvailabilityRuleValues(formData);

  if (!isSupabaseAuthConfigured()) {
    return {
      code: "auth_unconfigured",
      fieldErrors: {},
      message:
        "Schedule editing is not available until Supabase auth is configured.",
      values,
    };
  }

  let redirectPath: Route | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email?.trim()) {
      redirectPath = buildAuthSignInPath(SCHEDULE_PATH) as Route;
    } else {
      const account = await ensureAuthAccount(user);
      await addAvailabilityRule(account, values);
    }
  } catch (error) {
    if (error instanceof AvailabilityRuleCommandError) {
      return {
        code: error.code,
        fieldErrors: error.fieldErrors,
        message: error.message,
        values,
      };
    }

    return {
      code: "availability_rule_create_failed",
      fieldErrors: {},
      message:
        "We couldn't add that availability window yet. Please try again in a moment.",
      values,
    };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  revalidatePath(SCHEDULE_PATH);

  return {
    code: "success",
    fieldErrors: {},
    message: "Availability window added.",
    values: emptyAvailabilityRuleValues,
  };
}

export async function removeAvailabilityRuleAction(formData: FormData) {
  const ruleId = readFormString(formData, "ruleId");

  if (!ruleId || !UUID_PATTERN.test(ruleId)) {
    return;
  }

  if (!isSupabaseAuthConfigured()) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    return;
  }

  try {
    const account = await ensureAuthAccount(user);
    await removeAvailabilityRule(account, ruleId);
  } catch {
    return;
  }

  revalidatePath(SCHEDULE_PATH);
}

export async function updateMeetingPreferenceAction(
  _previous: MeetingPreferenceActionState,
  formData: FormData,
): Promise<MeetingPreferenceActionState> {
  const values = readMeetingPreferenceValues(formData);

  if (!isSupabaseAuthConfigured()) {
    return {
      code: "auth_unconfigured",
      fieldErrors: {},
      message:
        "Schedule editing is not available until Supabase auth is configured.",
      values,
    };
  }

  let redirectPath: Route | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email?.trim()) {
      redirectPath = buildAuthSignInPath(SCHEDULE_PATH) as Route;
    } else {
      const account = await ensureAuthAccount(user);
      await updateMeetingPreference(account, values);
    }
  } catch (error) {
    if (error instanceof MeetingPreferenceCommandError) {
      return {
        code: error.code,
        fieldErrors: error.fieldErrors,
        message: error.message,
        values,
      };
    }

    return {
      code: "meeting_preference_update_failed",
      fieldErrors: {},
      message:
        "We couldn't save your meeting settings yet. Please try again in a moment.",
      values,
    };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  revalidatePath(SCHEDULE_PATH);

  return {
    code: "success",
    fieldErrors: {},
    message: "Your default meeting settings have been saved.",
    values,
  };
}

function readSchedulePolicyValues(formData: FormData): SchedulePolicyFormValues {
  return {
    bufferAfterMinutes: readFormString(formData, "bufferAfterMinutes"),
    bufferBeforeMinutes: readFormString(formData, "bufferBeforeMinutes"),
    dailyCapacity: readFormString(formData, "dailyCapacity"),
    isAcceptingNewStudents: readFormString(formData, "isAcceptingNewStudents") || "false",
    minimumNoticeMinutes: readFormString(formData, "minimumNoticeMinutes"),
    timezone: readFormString(formData, "timezone"),
    weeklyCapacity: readFormString(formData, "weeklyCapacity"),
  };
}

function readAvailabilityRuleValues(
  formData: FormData,
): AvailabilityRuleFormValues {
  return {
    dayOfWeek: readFormString(formData, "dayOfWeek"),
    endLocalTime: readFormString(formData, "endLocalTime"),
    startLocalTime: readFormString(formData, "startLocalTime"),
  };
}

function readMeetingPreferenceValues(
  formData: FormData,
): MeetingPreferenceFormValues {
  return {
    defaultMeetingUrl: readFormString(formData, "defaultMeetingUrl"),
    displayLabel: readFormString(formData, "displayLabel"),
    preferredProvider: readFormString(formData, "preferredProvider"),
  };
}

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}
