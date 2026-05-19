"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button, InlineNotice, Switch, TextField } from "@/components/ui";
import type { SchedulePolicyFormValues } from "@/modules/tutors/tutor-schedule";

import {
  initialSchedulePolicyState,
  type SchedulePolicyActionState,
} from "./action-types";
import { updateSchedulePolicyAction } from "./actions";
import styles from "./schedule.module.css";

type SchedulePolicyFormProps = {
  disabled: boolean;
  initialValues: SchedulePolicyFormValues;
};

export function SchedulePolicyForm({
  disabled,
  initialValues,
}: SchedulePolicyFormProps) {
  const [rawState, formAction] = useActionState(updateSchedulePolicyAction, {
    ...initialSchedulePolicyState,
    values: initialValues,
  });
  const state = normalizeState(rawState, initialValues);
  const formStateKey = [
    state.code ?? "idle",
    state.values.isAcceptingNewStudents,
    state.values.minimumNoticeMinutes,
  ].join(":");
  const hasAdvancedError =
    Boolean(state.fieldErrors.minimumNoticeMinutes) ||
    Boolean(state.fieldErrors.bufferBeforeMinutes) ||
    Boolean(state.fieldErrors.bufferAfterMinutes) ||
    Boolean(state.fieldErrors.dailyCapacity) ||
    Boolean(state.fieldErrors.weeklyCapacity);

  return (
    <SchedulePolicyFormBody
      key={formStateKey}
      action={formAction}
      disabled={disabled}
      openAdvanced={hasAdvancedError}
      state={state}
    />
  );
}

function SchedulePolicyFormBody({
  action,
  disabled,
  openAdvanced,
  state,
}: {
  action: (formData: FormData) => void;
  disabled: boolean;
  openAdvanced: boolean;
  state: SchedulePolicyActionState;
}) {
  const [values, setValues] = useState(state.values);

  return (
    <form action={action} className={styles.form}>
      {state.message ? (
        <InlineNotice
          title={
            state.code === "success" ? "Schedule saved" : "Please review the form"
          }
          tone={state.code === "success" ? "success" : "actionNeeded"}
        >
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}

      <input name="timezone" type="hidden" value={values.timezone} />
      <input
        name="isAcceptingNewStudents"
        type="hidden"
        value={values.isAcceptingNewStudents}
      />

      <Switch
        checked={values.isAcceptingNewStudents === "true"}
        disabled={disabled}
        label="Accepting new students"
        onCheckedChange={(next) =>
          setValues((current) => ({
            ...current,
            isAcceptingNewStudents: next ? "true" : "false",
          }))
        }
      />

      <details className={styles.advanced} open={openAdvanced}>
        <summary className={styles.advancedSummary}>
          <span className={styles.advancedTitle}>Advanced booking rules</span>
          <span className={styles.advancedHint}>
            8-hour notice, no caps by default.
          </span>
        </summary>

        <div className={styles.advancedFields}>
          <div className={styles.fieldGrid}>
            <TextField
              disabled={disabled}
              error={state.fieldErrors.minimumNoticeMinutes}
              inputMode="numeric"
              label="Minimum notice (minutes)"
              min={0}
              name="minimumNoticeMinutes"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  minimumNoticeMinutes: event.target.value,
                }))
              }
              required
              type="number"
              value={values.minimumNoticeMinutes}
            />
            <TextField
              disabled={disabled}
              error={state.fieldErrors.dailyCapacity}
              inputMode="numeric"
              label="Daily lesson capacity"
              min={1}
              name="dailyCapacity"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  dailyCapacity: event.target.value,
                }))
              }
              type="number"
              value={values.dailyCapacity}
            />
          </div>

          <div className={styles.fieldGrid}>
            <TextField
              disabled={disabled}
              error={state.fieldErrors.bufferBeforeMinutes}
              inputMode="numeric"
              label="Buffer before (minutes)"
              min={0}
              name="bufferBeforeMinutes"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  bufferBeforeMinutes: event.target.value,
                }))
              }
              required
              type="number"
              value={values.bufferBeforeMinutes}
            />
            <TextField
              disabled={disabled}
              error={state.fieldErrors.bufferAfterMinutes}
              inputMode="numeric"
              label="Buffer after (minutes)"
              min={0}
              name="bufferAfterMinutes"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  bufferAfterMinutes: event.target.value,
                }))
              }
              required
              type="number"
              value={values.bufferAfterMinutes}
            />
          </div>

          <div className={styles.fieldGrid}>
            <TextField
              disabled={disabled}
              error={state.fieldErrors.weeklyCapacity}
              inputMode="numeric"
              label="Weekly lesson capacity"
              min={1}
              name="weeklyCapacity"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  weeklyCapacity: event.target.value,
                }))
              }
              type="number"
              value={values.weeklyCapacity}
            />
          </div>
        </div>
      </details>

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
      {pending ? "Saving" : "Save schedule"}
    </Button>
  );
}

function normalizeState(
  state: SchedulePolicyActionState | undefined,
  fallback: SchedulePolicyFormValues,
): SchedulePolicyActionState {
  return {
    code: state?.code ?? null,
    fieldErrors: state?.fieldErrors ?? {},
    message: state?.message ?? null,
    values: state?.values ?? fallback,
  };
}
