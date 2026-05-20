"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  Button,
  Chip,
  ConfirmDialog,
  InlineNotice,
  Switch,
} from "@/components/ui";
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
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);

  const pendingIsAccepting = values.isAcceptingNewStudents === "true";

  function handleToggle(next: boolean) {
    if (!next) {
      setPauseDialogOpen(true);
      return;
    }
    setValues((current) => ({
      ...current,
      isAcceptingNewStudents: "true",
    }));
  }

  function confirmPause() {
    setValues((current) => ({
      ...current,
      isAcceptingNewStudents: "false",
    }));
    setPauseDialogOpen(false);
  }

  function cancelPause() {
    setPauseDialogOpen(false);
  }

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

      <div
        className={[
          styles.acceptingRow,
          pendingIsAccepting ? "" : styles.acceptingRowPaused,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Switch
          checked={pendingIsAccepting}
          disabled={disabled}
          label={
            <span className={styles.acceptingLabel}>
              Accepting new students
              {pendingIsAccepting ? null : (
                <Chip size="compact" tone="warning">
                  Paused
                </Chip>
              )}
            </span>
          }
          onCheckedChange={handleToggle}
        />
        {pendingIsAccepting ? null : (
          <p className={styles.acceptingHint}>
            No new bookings will be accepted while this is off. Save the form
            to apply.
          </p>
        )}
      </div>

      <ConfirmDialog
        cancelLabel="Keep accepting"
        confirmLabel="Pause new bookings"
        confirmVariant="danger"
        description={
          <p>
            Students won&apos;t be able to book lessons with you until you
            turn this back on. Your existing bookings are not affected.
          </p>
        }
        onCancel={cancelPause}
        onConfirm={confirmPause}
        open={pauseDialogOpen}
        title="Pause new student bookings?"
      />

      <input
        name="minimumNoticeMinutes"
        type="hidden"
        value={values.minimumNoticeMinutes}
      />
      <input
        name="dailyCapacity"
        type="hidden"
        value={values.dailyCapacity}
      />
      <input
        name="bufferBeforeMinutes"
        type="hidden"
        value={values.bufferBeforeMinutes}
      />
      <input
        name="bufferAfterMinutes"
        type="hidden"
        value={values.bufferAfterMinutes}
      />
      <input
        name="weeklyCapacity"
        type="hidden"
        value={values.weeklyCapacity}
      />

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
