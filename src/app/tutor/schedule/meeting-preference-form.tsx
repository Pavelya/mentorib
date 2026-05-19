"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button, Chip, InlineNotice, TextField } from "@/components/ui";
import { detectMeetingProviderFromUrl } from "@/modules/tutors/meeting-provider-detect";
import type { ReferenceMeetingProvider } from "@/modules/reference/catalog";
import type { MeetingPreferenceFormValues } from "@/modules/tutors/tutor-schedule";

import {
  initialMeetingPreferenceState,
  type MeetingPreferenceActionState,
} from "./action-types";
import { updateMeetingPreferenceAction } from "./actions";
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
  const detected = detectMeetingProviderFromUrl(
    values.defaultMeetingUrl,
    providerOptions,
  );

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

      <input
        name="preferredProvider"
        type="hidden"
        value={detected?.providerKey ?? ""}
      />
      <input name="displayLabel" type="hidden" value="" />

      <div className={styles.meetingUrlField}>
        <TextField
          disabled={disabled}
          description="Paste the join link Mentor IB seeds into every lesson."
          error={
            state.fieldErrors.defaultMeetingUrl ??
            state.fieldErrors.preferredProvider
          }
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
        {detected ? (
          <Chip size="compact" tone="info">
            {detected.displayName}
          </Chip>
        ) : null}
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
