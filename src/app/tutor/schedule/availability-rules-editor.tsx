"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button, Card, InlineNotice, SelectField, TextField } from "@/components/ui";
import {
  getDayOfWeekLabel,
  type TutorScheduleAvailabilityRuleDto,
} from "@/modules/tutors/tutor-schedule";

import {
  initialAvailabilityRuleState,
  type AvailabilityRuleActionState,
} from "./action-types";
import {
  addAvailabilityRuleAction,
  removeAvailabilityRuleAction,
} from "./actions";
import styles from "./schedule.module.css";

const DAY_OPTIONS = [0, 1, 2, 3, 4, 5, 6] as const;

type AvailabilityRulesEditorProps = {
  disabled: boolean;
  rules: readonly TutorScheduleAvailabilityRuleDto[];
  timezoneLabel: string;
};

export function AvailabilityRulesEditor({
  disabled,
  rules,
  timezoneLabel,
}: AvailabilityRulesEditorProps) {
  return (
    <div className={styles.fieldsetGrid}>
      <p className={styles.helperText}>
        Recurring weekly windows expressed in {timezoneLabel}.
      </p>

      {rules.length === 0 ? (
        <p className={styles.ruleEmpty}>
          No recurring availability windows yet. Add one below to start receiving
          lesson requests.
        </p>
      ) : (
        <div className={styles.ruleList}>
          {rules.map((rule) => (
            <Card className={styles.ruleItem} key={rule.id}>
              <div className={styles.ruleHeader}>
                <p className={styles.ruleDay}>
                  {getDayOfWeekLabel(rule.dayOfWeek)}
                </p>
                <p className={styles.ruleRange}>
                  {rule.startLocalTime} – {rule.endLocalTime}
                </p>
              </div>
              <form
                action={removeAvailabilityRuleAction}
                className={styles.removeForm}
              >
                <input name="ruleId" type="hidden" value={rule.id} />
                <RemoveButton disabled={disabled} />
              </form>
            </Card>
          ))}
        </div>
      )}

      <AddRuleForm disabled={disabled} />
    </div>
  );
}

function AddRuleForm({ disabled }: { disabled: boolean }) {
  const [rawState, formAction] = useActionState(
    addAvailabilityRuleAction,
    initialAvailabilityRuleState,
  );
  const state = normalizeState(rawState);
  const formStateKey = [
    state.code ?? "idle",
    state.values.dayOfWeek,
    state.values.startLocalTime,
    state.values.endLocalTime,
  ].join(":");

  return (
    <AddRuleFormBody
      key={formStateKey}
      action={formAction}
      disabled={disabled}
      state={state}
    />
  );
}

function AddRuleFormBody({
  action,
  disabled,
  state,
}: {
  action: (formData: FormData) => void;
  disabled: boolean;
  state: AvailabilityRuleActionState;
}) {
  const [values, setValues] = useState(state.values);

  return (
    <Card>
      <form action={action} className={styles.addRuleForm}>
        {state.message ? (
          <InlineNotice
            title={
              state.code === "success" ? "Window added" : "Please review the form"
            }
            tone={state.code === "success" ? "success" : "actionNeeded"}
          >
            <p>{state.message}</p>
          </InlineNotice>
        ) : null}

        <div className={styles.addRuleFields}>
          <SelectField
            disabled={disabled}
            error={state.fieldErrors.dayOfWeek}
            label="Day"
            name="dayOfWeek"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                dayOfWeek: event.target.value,
              }))
            }
            required
            value={values.dayOfWeek}
          >
            <option value="">Select day</option>
            {DAY_OPTIONS.map((day) => (
              <option key={day} value={day}>
                {getDayOfWeekLabel(day)}
              </option>
            ))}
          </SelectField>

          <TextField
            disabled={disabled}
            error={state.fieldErrors.startLocalTime}
            label="Start"
            name="startLocalTime"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                startLocalTime: event.target.value,
              }))
            }
            required
            type="time"
            value={values.startLocalTime}
          />

          <TextField
            disabled={disabled}
            error={state.fieldErrors.endLocalTime}
            label="End"
            name="endLocalTime"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                endLocalTime: event.target.value,
              }))
            }
            required
            type="time"
            value={values.endLocalTime}
          />
        </div>

        <div className={styles.formActions}>
          <AddButton disabled={disabled} />
        </div>
      </form>
    </Card>
  );
}

function AddButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled || pending} size="compact" type="submit">
      {pending ? "Adding" : "Add window"}
    </Button>
  );
}

function RemoveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      disabled={disabled || pending}
      size="compact"
      type="submit"
      variant="ghost"
    >
      {pending ? "Removing" : "Remove"}
    </Button>
  );
}

function normalizeState(
  state: AvailabilityRuleActionState | undefined,
): AvailabilityRuleActionState {
  return {
    code: state?.code ?? null,
    fieldErrors: state?.fieldErrors ?? {},
    message: state?.message ?? null,
    values: state?.values ?? initialAvailabilityRuleState.values,
  };
}
