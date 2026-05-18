"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button, InlineNotice, SelectField, TextField } from "@/components/ui";
import type { SchedulePolicyFormValues } from "@/modules/tutors/tutor-schedule";

import {
  initialSchedulePolicyState,
  type SchedulePolicyActionState,
} from "./action-types";
import { updateSchedulePolicyAction } from "./actions";
import styles from "./schedule.module.css";

const COMMON_TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Warsaw",
  "Europe/Madrid",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "America/Halifax",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Pacific/Auckland",
] as const;

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
    state.values.timezone,
    state.values.minimumNoticeMinutes,
  ].join(":");

  return (
    <SchedulePolicyFormBody
      key={formStateKey}
      action={formAction}
      disabled={disabled}
      state={state}
    />
  );
}

function SchedulePolicyFormBody({
  action,
  disabled,
  state,
}: {
  action: (formData: FormData) => void;
  disabled: boolean;
  state: SchedulePolicyActionState;
}) {
  const [values, setValues] = useState(state.values);
  const timezoneOptions = buildTimezoneOptions(values.timezone);

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

      <div className={styles.fieldRow}>
        <SelectField
          disabled={disabled}
          error={state.fieldErrors.timezone}
          label="Booking timezone"
          name="timezone"
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              timezone: event.target.value,
            }))
          }
          value={values.timezone}
        >
          {timezoneOptions.map((option) => (
            <option key={option} value={option}>
              {option.replaceAll("_", " ")}
            </option>
          ))}
        </SelectField>
      </div>

      <div className={styles.fieldGrid}>
        <TextField
          disabled={disabled}
          description="Minimum lead time before a lesson can start (in minutes)."
          error={state.fieldErrors.minimumNoticeMinutes}
          inputMode="numeric"
          label="Minimum notice"
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
          description="Daily lesson cap (leave blank for no cap)."
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
          description="Buffer reserved before each lesson (in minutes)."
          error={state.fieldErrors.bufferBeforeMinutes}
          inputMode="numeric"
          label="Buffer before"
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
          description="Buffer reserved after each lesson (in minutes)."
          error={state.fieldErrors.bufferAfterMinutes}
          inputMode="numeric"
          label="Buffer after"
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
          description="Weekly lesson cap (leave blank for no cap)."
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
        <div className={styles.toggleRow}>
          <label className={styles.toggleLabel}>
            <input
              checked={values.isAcceptingNewStudents === "true"}
              disabled={disabled}
              name="isAcceptingNewStudents"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  isAcceptingNewStudents: event.target.checked ? "true" : "false",
                }))
              }
              type="checkbox"
              value="true"
            />
            Accepting new students
          </label>
        </div>
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
      {pending ? "Saving" : "Save schedule"}
    </Button>
  );
}

function buildTimezoneOptions(currentValue: string) {
  const options = new Set<string>(COMMON_TIMEZONES);

  if (currentValue) {
    options.add(currentValue);
  }

  return Array.from(options).sort((left, right) => left.localeCompare(right));
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
