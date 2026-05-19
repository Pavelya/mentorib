import type { Route } from "next";
import { redirect } from "next/navigation";

import { TimezoneNotice } from "@/components/datetime";
import { InlineNotice, Panel } from "@/components/ui";
import {
  buildPostSignInRedirect,
  ensureAuthAccount,
} from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { getTimezoneLabel } from "@/lib/datetime";
import { getCurrentUserTimezone } from "@/lib/datetime/server";
import { routeFamilies } from "@/lib/routing/route-families";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  hasRole,
  isRestrictedAccount,
  requiresRoleSelection,
} from "@/modules/accounts/account-state";
import { getTutorSchedule } from "@/modules/tutors/tutor-schedule";

import { AvailabilityRulesEditor } from "./availability-rules-editor";
import { MeetingPreferenceForm } from "./meeting-preference-form";
import { SchedulePolicyForm } from "./schedule-policy-form";
import styles from "./schedule.module.css";

const SCHEDULE_PATH = "/tutor/schedule" as const;

export default async function TutorSchedulePage() {
  const timezone = await getCurrentUserTimezone();

  if (!isSupabaseAuthConfigured()) {
    return (
      <article className={styles.page}>
        <TimezoneNotice timezone={timezone} />
        <InlineNotice title="Tutor schedule preview" tone="info">
          <p>
            Live schedule editing connects once Supabase auth is configured.
            Sign in to manage availability and your default meeting link.
          </p>
        </InlineNotice>
      </article>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(SCHEDULE_PATH) as Route);
  }

  let account: Awaited<ReturnType<typeof ensureAuthAccount>> | null = null;

  try {
    account = await ensureAuthAccount(user);
  } catch {
    account = null;
  }

  if (!account) {
    return (
      <article className={styles.page}>
        <InlineNotice title="Tutor schedule unavailable" tone="warning">
          <p>
            We could not load your account context. Refresh the page or sign in
            again to continue.
          </p>
        </InlineNotice>
      </article>
    );
  }

  if (requiresRoleSelection(account)) {
    redirect(routeFamilies.setup.defaultHref);
  }

  if (isRestrictedAccount(account)) {
    return (
      <article className={styles.page}>
        <InlineNotice title="Account access limited" tone="warning">
          <p>This account cannot manage tutor schedule settings right now.</p>
        </InlineNotice>
      </article>
    );
  }

  if (!hasRole(account, "tutor")) {
    redirect(buildPostSignInRedirect(account, SCHEDULE_PATH) as Route);
  }

  const schedule = await getTutorSchedule(account);
  const policyTimezoneLabel = getTimezoneLabel(timezone);

  return (
    <article className={styles.page}>
      <TimezoneNotice timezone={timezone} />

      <header className={styles.intro}>
        <h1 className={styles.title}>Schedule</h1>
        <p className={styles.description}>
          Manage when students can request lessons and how they join.
        </p>
      </header>

      {schedule.state === "no_profile" ? (
        <InlineNotice title="Tutor profile not set up" tone="warning">
          <p>
            Your tutor profile has not been created yet. Finish the application
            flow before saving schedule settings.
          </p>
        </InlineNotice>
      ) : null}

      <Panel title="Weekly availability" tone="raised">
        <p className={styles.zoneNotice}>
          Showing your local time ({policyTimezoneLabel}).
        </p>
        <AvailabilityRulesEditor
          disabled={schedule.state === "no_profile"}
          rules={schedule.availabilityRules}
          timezoneLabel={policyTimezoneLabel}
        />
      </Panel>

      <Panel title="Default meeting link" tone="raised">
        <MeetingPreferenceForm
          disabled={schedule.state === "no_profile"}
          initialValues={{
            defaultMeetingUrl: schedule.meetingPreference.defaultMeetingUrl ?? "",
            displayLabel: schedule.meetingPreference.displayLabel ?? "",
            preferredProvider:
              schedule.meetingPreference.preferredProvider ?? "",
          }}
          providerOptions={schedule.meetingProviderOptions}
        />
      </Panel>

      <Panel title="Booking policy" tone="raised">
        <SchedulePolicyForm
          disabled={schedule.state === "no_profile"}
          initialValues={{
            bufferAfterMinutes: String(schedule.policy.bufferAfterMinutes),
            bufferBeforeMinutes: String(schedule.policy.bufferBeforeMinutes),
            dailyCapacity:
              schedule.policy.dailyCapacity != null
                ? String(schedule.policy.dailyCapacity)
                : "",
            isAcceptingNewStudents: schedule.policy.isAcceptingNewStudents
              ? "true"
              : "false",
            minimumNoticeMinutes: String(schedule.policy.minimumNoticeMinutes),
            timezone,
            weeklyCapacity:
              schedule.policy.weeklyCapacity != null
                ? String(schedule.policy.weeklyCapacity)
                : "",
          }}
        />
      </Panel>
    </article>
  );
}
