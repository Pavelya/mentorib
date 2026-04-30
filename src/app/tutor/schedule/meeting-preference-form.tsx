"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button, InlineNotice, SelectField, TextField } from "@/components/ui";
import type { ReferenceMeetingProvider } from "@/modules/reference/catalog";
import type { MeetingPreferenceFormValues } from "@/modules/tutors/tutor-schedule";

import {
  initialMeetingPreferenceState,
  updateMeetingPreferenceAction,
  type MeetingPreferenceActionState,
} from "./actions";
import styles from "./schedule.module.css";

type MeetingPreferenceFormProps = {
  disabled: boolean;
  initialValues: MeetingPreferenceFormValues;
  providerOptions: readonly ReferenceMeetingProvider[];
};

export function MeetingPreferenceForm({
  disabled,
  initialValues,
  providerOptions,
}: MeetingPreferenceFormProps) {
  const [rawState, formAction] = useActionState(updateMeetingPreferenceAction, {
    ...initialMeetingPreferenceState,
    values: initialValues,
  });
  const state = normalizeState(rawState, initialValues);
  const formStateKey = [
    state.code ?? "idle",
    state.values.preferredProvider,
    state.values.defaultMeetingUrl,
  ].join(":");

  return (
    <MeetingPreferenceFormBody
      key={formStateKey}
      action={formAction}
      disabled={disabled}
      providerOptions={providerOptions}
      state={state}
    />
  );
}

function MeetingPreferenceFormBody({
  action,
  disabled,
  providerOptions,
  state,
}: {
  action: (formData: FormData) => void;
  disabled: boolean;
  providerOptions: readonly ReferenceMeetingProvider[];
  state: MeetingPreferenceActionState;
}) {
  const [values, setValues] = useState(state.values);

  return (
    <form action={action} className={styles.form}>
      {state.message ? (
        <InlineNotice
          title={
            state.code === "success"
              ? "Meeting settings saved"
              : "Please review the form"
          }
          tone={state.code === "success" ? "success" : "actionNeeded"}
        >
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}

      <p className={styles.helperText}>
        Choose your default meeting provider and a secure https:// link. Mentor
        IB seeds each booked lesson with this access; meeting links stay
        private to lesson participants.
      </p>

      <div className={styles.fieldGrid}>
        <SelectField
          disabled={disabled}
          error={state.fieldErrors.preferredProvider}
          label="Meeting provider"
          name="preferredProvider"
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              preferredProvider: event.target.value,
            }))
          }
          value={values.preferredProvider}
        >
          <option value="">No default</option>
          {providerOptions.map((option) => (
            <option key={option.providerKey} value={option.providerKey}>
              {option.displayName}
            </option>
          ))}
        </SelectField>

        <TextField
          disabled={disabled}
          description="Use a secure https:// meeting URL."
          error={state.fieldErrors.defaultMeetingUrl}
          label="Default meeting URL"
          name="defaultMeetingUrl"
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              defaultMeetingUrl: event.target.value,
            }))
          }
          placeholder="https://"
          type="url"
          value={values.defaultMeetingUrl}
        />
      </div>

      <div className={styles.fieldRow}>
        <TextField
          disabled={disabled}
          description="Optional friendly label shown to lesson participants."
          error={state.fieldErrors.displayLabel}
          label="Display label"
          maxLength={80}
          name="displayLabel"
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              displayLabel: event.target.value,
            }))
          }
          value={values.displayLabel}
        />
      </div>

      <div className={styles.formActions}>
        <SaveButton disabled={disabled} />
      </div>
    </form>
  );
}

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled || pending} type="submit">
      {pending ? "Saving" : "Save meeting settings"}
    </Button>
  );
}

function normalizeState(
  state: MeetingPreferenceActionState | undefined,
  fallback: MeetingPreferenceFormValues,
): MeetingPreferenceActionState {
  return {
    code: state?.code ?? null,
    fieldErrors: state?.fieldErrors ?? {},
    message: state?.message ?? null,
    values: state?.values ?? fallback,
  };
}
