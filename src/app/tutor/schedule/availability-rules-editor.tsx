"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  Button,
  InlineNotice,
  WeeklyHourGrid,
  type SlotKey,
} from "@/components/ui";
import { expandAvailabilityRulesToSlots } from "@/modules/tutors/availability-grid";
import {
  getDayOfWeekLabel,
  type TutorScheduleAvailabilityRuleDto,
} from "@/modules/tutors/tutor-schedule";

import {
  initialReplaceAvailabilityRulesState,
  type ReplaceAvailabilityRulesActionState,
} from "./action-types";
import { replaceAvailabilityRulesAction } from "./actions";
import styles from "./schedule.module.css";

const DAY_LABELS = [0, 1, 2, 3, 4, 5, 6].map(getDayOfWeekLabel);

type AvailabilityRulesEditorProps = {
  disabled: boolean;
  rules: readonly TutorScheduleAvailabilityRuleDto[];
};

export function AvailabilityRulesEditor({
  disabled,
  rules,
}: AvailabilityRulesEditorProps) {
  const [rawState, formAction] = useActionState(
    replaceAvailabilityRulesAction,
    initialReplaceAvailabilityRulesState,
  );
  const state = normalizeState(rawState);

  const savedSet = useMemo(
    () =>
      expandAvailabilityRulesToSlots(
        rules.map((rule) => ({
          dayOfWeek: rule.dayOfWeek,
          startLocalTime: rule.startLocalTime,
          endLocalTime: rule.endLocalTime,
        })),
      ),
    [rules],
  );
  const savedSignature = useMemo(() => signature(savedSet), [savedSet]);

  const [pendingSlots, setPendingSlots] = useState<Set<SlotKey>>(
    () => new Set(savedSet),
  );
  const [appliedSignature, setAppliedSignature] = useState(savedSignature);

  if (appliedSignature !== savedSignature) {
    setAppliedSignature(savedSignature);
    setPendingSlots(new Set(savedSet));
  }

  const isDirty = !areSetsEqual(pendingSlots, savedSet);
  const serializedSlots = JSON.stringify(Array.from(pendingSlots));

  return (
    <div className={styles.fieldsetGrid}>
      {state.message ? (
        <InlineNotice
          title={
            state.code === "success" ? "Availability saved" : "Couldn't save"
          }
          tone={state.code === "success" ? "success" : "actionNeeded"}
        >
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}

      <WeeklyHourGrid
        aria-label="Weekly availability"
        dayLabels={DAY_LABELS}
        disabled={disabled}
        onChange={setPendingSlots}
        value={pendingSlots}
      />

      <form action={formAction} className={styles.formActions}>
        <input name="slots" type="hidden" value={serializedSlots} />
        <Button
          disabled={disabled || !isDirty}
          onClick={() => setPendingSlots(new Set(savedSet))}
          size="compact"
          type="button"
          variant="secondary"
        >
          Discard changes
        </Button>
        <SaveButton disabled={disabled || !isDirty} />
      </form>
    </div>
  );
}

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled || pending} size="compact" type="submit">
      {pending ? "Saving" : "Save availability"}
    </Button>
  );
}

function areSetsEqual(
  left: ReadonlySet<SlotKey>,
  right: ReadonlySet<SlotKey>,
): boolean {
  if (left.size !== right.size) return false;
  for (const key of left) {
    if (!right.has(key)) return false;
  }
  return true;
}

function signature(slots: ReadonlySet<SlotKey>): string {
  return Array.from(slots).sort().join(",");
}

function normalizeState(
  state: ReplaceAvailabilityRulesActionState | undefined,
): ReplaceAvailabilityRulesActionState {
  return {
    code: state?.code ?? null,
    message: state?.message ?? null,
  };
}
