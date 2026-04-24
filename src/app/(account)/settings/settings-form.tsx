"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  Avatar,
  Button,
  InlineNotice,
  MatchOptionVisual,
  StatusBadge,
  TextField,
} from "@/components/ui";
import {
  emptyAccountProfileFormValues,
  type AccountProfileFormValues,
} from "@/modules/accounts/profile-settings";
import type { MatchLanguageOption } from "@/modules/lessons/match-flow-options";

import { updateAccountProfileAction, type AccountProfileActionState } from "./actions";
import styles from "../account-surfaces.module.css";

type SettingsProfileFormProps = {
  avatarUrl?: string;
  initialFullName: string;
  initialPreferredLanguageCode: string;
  languageOptions: readonly MatchLanguageOption[];
  roleBadges: readonly {
    label: string;
    tone: React.ComponentProps<typeof StatusBadge>["tone"];
  }[];
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
  languageOptions,
  roleBadges,
  serverState,
  timezone,
}: {
  action: (formData: FormData) => void;
  avatarUrl?: string;
  languageOptions: readonly MatchLanguageOption[];
  roleBadges: SettingsProfileFormProps["roleBadges"];
  serverState: AccountProfileActionState;
  timezone: string;
}) {
  const [values, setValues] = useState(serverState.values);
  const displayName = values.fullName.trim() || "Account owner";

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

      <div className={styles.identityRow}>
        <Avatar
          className={styles.profileAvatar}
          name={displayName}
          size="lg"
          src={avatarUrl}
        />
        <div className={styles.identityCopy}>
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
          <p className={styles.muted}>
            Update the name Mentor IB uses for your account and match preferences.
          </p>
        </div>
      </div>

      <div className={styles.profileFieldGrid}>
        <TextField
          autoComplete="name"
          error={serverState.fieldErrors.fullName}
          label="Full name"
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

        <LanguageField
          error={serverState.fieldErrors.preferredLanguageCode}
          options={languageOptions}
          value={values.preferredLanguageCode}
          onChange={(preferredLanguageCode) =>
            setValues((currentValues) => ({
              ...currentValues,
              preferredLanguageCode,
            }))
          }
        />
      </div>

      <div className={styles.settingsList}>
        <div className={styles.settingRow}>
          <div className={styles.settingCopy}>
            <p className={styles.settingLabel}>Timezone</p>
            <p className={styles.settingValue}>{timezone}</p>
          </div>
          <p className={styles.settingMeta}>Automatic</p>
        </div>
      </div>

      <div className={styles.formActions}>
        <SaveButton />
      </div>
    </form>
  );
}

function LanguageField({
  error,
  options,
  value,
  onChange,
}: {
  error?: string;
  options: readonly MatchLanguageOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset
      aria-invalid={error ? true : undefined}
      className={styles.languageFieldset}
    >
      <legend className={styles.languageLegend}>Preferred lesson language</legend>
      <div className={styles.languageOptionGrid} role="radiogroup">
        {options.map((option) => {
          const inputId = `preferredLanguageCode-${option.value}`;
          const isSelected = value === option.value;

          return (
            <div className={styles.languageChoice} key={option.value}>
              <input
                checked={isSelected}
                className={styles.languageInput}
                id={inputId}
                name="preferredLanguageCode"
                onChange={() => onChange(option.value)}
                type="radio"
                value={option.value}
              />
              <label
                className={[
                  styles.languageCard,
                  styles.compactLanguageCard,
                  isSelected ? styles.selectedLanguageCard : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                htmlFor={inputId}
              >
                <span className={styles.languageCardMain}>
                  {option.flagCode ? (
                    <span className={styles.languageVisual}>
                      <MatchOptionVisual flagCode={option.flagCode} />
                    </span>
                  ) : null}
                  <span className={styles.languageText}>
                    <span className={styles.languageTitle}>{option.label}</span>
                  </span>
                </span>
                <span aria-hidden="true" className={styles.languageIndicator} />
              </label>
            </div>
          );
        })}
      </div>
      {error ? <p className={styles.fieldError}>{error}</p> : null}
    </fieldset>
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
