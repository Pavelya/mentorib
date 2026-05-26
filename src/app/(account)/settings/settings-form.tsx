"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  Button,
  InlineNotice,
  OptionCardGroup,
  Section,
  StatusBadge,
  TextField,
} from "@/components/ui";
import { getTimezoneLabel } from "@/lib/datetime/timezone";
import {
  emptyAccountProfileFormValues,
  type AccountProfileFormValues,
} from "@/modules/accounts/profile-settings";
import type { AccountRoleBadge } from "@/modules/accounts/role-badges";
import type { MatchLanguageOption } from "@/modules/lessons/match-flow-options";

import { AccountAvatarUpload } from "./account-avatar-upload";
import { updateAccountProfileAction, type AccountProfileActionState } from "./actions";
import styles from "../account-surfaces.module.css";

type SettingsProfileFormProps = {
  avatarUrl?: string;
  email: string;
  hasStudentRole: boolean;
  hasTutorRole: boolean;
  initialFullName: string;
  initialPreferredLanguageCode: string;
  languageOptions: readonly MatchLanguageOption[];
  roleBadges: readonly AccountRoleBadge[];
  timezone: string;
};

const emptyAccountProfileActionState: AccountProfileActionState = {
  code: null,
  fieldErrors: {},
  message: null,
  values: emptyAccountProfileFormValues,
};

export function SettingsProfileForm({
  avatarUrl,
  email,
  hasStudentRole,
  hasTutorRole,
  initialFullName,
  initialPreferredLanguageCode,
  languageOptions,
  roleBadges,
  timezone,
}: SettingsProfileFormProps) {
  const [rawState, formAction] = useActionState(updateAccountProfileAction, {
    ...emptyAccountProfileActionState,
    values: {
      fullName: initialFullName,
      preferredLanguageCode: initialPreferredLanguageCode,
    },
  });
  const state = normalizeActionState(rawState, {
    fullName: initialFullName,
    preferredLanguageCode: initialPreferredLanguageCode,
  });
  const formStateKey = [
    state.code ?? "idle",
    state.values.fullName,
    state.values.preferredLanguageCode,
  ].join(":");

  return (
    <SettingsProfileFormBody
      key={formStateKey}
      action={formAction}
      avatarUrl={avatarUrl}
      email={email}
      hasStudentRole={hasStudentRole}
      hasTutorRole={hasTutorRole}
      languageOptions={languageOptions}
      roleBadges={roleBadges}
      serverState={state}
      timezone={timezone}
    />
  );
}

function SettingsProfileFormBody({
  action,
  avatarUrl,
  email,
  hasStudentRole,
  hasTutorRole,
  languageOptions,
  roleBadges,
  serverState,
  timezone,
}: {
  action: (formData: FormData) => void;
  avatarUrl?: string;
  email: string;
  hasStudentRole: boolean;
  hasTutorRole: boolean;
  languageOptions: readonly MatchLanguageOption[];
  roleBadges: SettingsProfileFormProps["roleBadges"];
  serverState: AccountProfileActionState;
  timezone: string;
}) {
  const [values, setValues] = useState(serverState.values);
  const displayName = values.fullName.trim() || "Account owner";
  const lessonLanguageDescription = resolveLessonLanguageDescription({
    hasStudentRole,
    hasTutorRole,
  });
  const timezoneLabel = getTimezoneLabel(timezone);

  return (
    <form action={action} className={styles.profileForm}>
      {serverState.message ? (
        <InlineNotice
          title={serverState.code === "success" ? "Profile saved" : "Please review the form"}
          tone={serverState.code === "success" ? "success" : "actionNeeded"}
        >
          <p>{serverState.message}</p>
        </InlineNotice>
      ) : null}

      <div className={styles.identityHeadingRow}>
        <h2 className={styles.detailValue}>{displayName}</h2>
        {roleBadges.length > 0 ? (
          <div className={styles.identityBadges}>
            {roleBadges.map((badge) => (
              <StatusBadge key={badge.label} tone={badge.tone}>
                {badge.label}
              </StatusBadge>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.profileSectionList}>
        <Section divider="bottom" eyebrow="Profile photo">
          <AccountAvatarUpload
            avatarName={displayName}
            initialAvatarUrl={avatarUrl ?? null}
          />
        </Section>

        <Section divider="bottom" eyebrow="Full name">
          <TextField
            autoComplete="name"
            error={serverState.fieldErrors.fullName}
            label={<span className={styles.srOnly}>Full name</span>}
            maxLength={120}
            name="fullName"
            onChange={(event) =>
              setValues((currentValues) => ({
                ...currentValues,
                fullName: event.target.value,
              }))
            }
            placeholder="Enter your full name"
            required
            value={values.fullName}
          />
        </Section>

        <Section divider="bottom" eyebrow="Email">
          <p className={styles.settingValue}>{email}</p>
          <p className={styles.sectionNote}>
            Sign in email cannot be changed here. Contact Support to update it.
          </p>
        </Section>

        <Section
          description={lessonLanguageDescription}
          divider="bottom"
          eyebrow="Lesson language"
        >
          <OptionCardGroup
            error={serverState.fieldErrors.preferredLanguageCode}
            hideLegend
            legend="Lesson language"
            name="preferredLanguageCode"
            onChange={(preferredLanguageCode) =>
              setValues((currentValues) => ({
                ...currentValues,
                preferredLanguageCode,
              }))
            }
            options={languageOptions}
            value={values.preferredLanguageCode}
          />
        </Section>

        <Section divider="bottom" eyebrow="Timezone">
          <p className={styles.settingValue}>{timezoneLabel}</p>
          <p className={styles.sectionNote}>
            Mentor IB detects your timezone at sign-in. Travelling? Booking and lessons
            always display in this zone until detection picks up a new one.
          </p>
        </Section>
      </div>

      <div className={styles.formActions}>
        <SaveButton />
      </div>
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit">
      {pending ? "Saving changes" : "Save changes"}
    </Button>
  );
}

function resolveLessonLanguageDescription({
  hasStudentRole,
  hasTutorRole,
}: {
  hasStudentRole: boolean;
  hasTutorRole: boolean;
}) {
  if (hasStudentRole && hasTutorRole) {
    return "We use this for matching as a student and for Mentor IB communication as a tutor.";
  }

  if (hasTutorRole) {
    return "We use this for your own communication with Mentor IB and as a default when you message students.";
  }

  return "We use this to filter tutors by lesson language during matching.";
}

function normalizeActionState(
  state: AccountProfileActionState | undefined,
  fallbackValues: AccountProfileFormValues,
): AccountProfileActionState {
  return {
    code: state?.code ?? null,
    fieldErrors: state?.fieldErrors ?? {},
    message: state?.message ?? null,
    values: state?.values ?? fallbackValues,
  };
}
