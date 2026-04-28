"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  Button,
  InlineNotice,
  SelectField,
  StatusBadge,
  Textarea,
} from "@/components/ui";
import type { LessonIssueType } from "@/modules/lessons/constants";

import {
  cancelLessonAction,
  reportLessonIssueAction,
  rescheduleLessonAction,
  type CancelLessonActionState,
  type ReportIssueActionState,
  type RescheduleLessonActionState,
} from "./actions";
import styles from "./lesson-detail.module.css";

export const STUDENT_ISSUE_TYPE_OPTIONS: ReadonlyArray<{
  label: string;
  value: LessonIssueType;
}> = [
  { label: "Tutor did not attend", value: "tutor_absent" },
  { label: "Wrong or missing meeting link", value: "wrong_meeting_link" },
  { label: "Major technical problem", value: "technical_failure" },
  { label: "Lesson delivered only partially", value: "partial_delivery" },
];

export const TUTOR_ISSUE_TYPE_OPTIONS: ReadonlyArray<{
  label: string;
  value: LessonIssueType;
}> = [
  { label: "Student did not attend", value: "student_absent" },
  { label: "Wrong or missing meeting link", value: "wrong_meeting_link" },
  { label: "Major technical problem", value: "technical_failure" },
  { label: "Lesson delivered only partially", value: "partial_delivery" },
];

type CancelFormProps = {
  cancelOperationKey: string;
  lessonId: string;
  outcomeLabel: string;
  outcomeReason: string;
  outcomeTone: "positive" | "info" | "warning";
};

const initialCancelState: CancelLessonActionState = {
  code: null,
  message: null,
  outcome: null,
  values: { lessonId: "", operationKey: "" },
};

export function CancelLessonForm({
  cancelOperationKey,
  lessonId,
  outcomeLabel,
  outcomeReason,
  outcomeTone,
}: CancelFormProps) {
  const [state, formAction] = useActionState(cancelLessonAction, initialCancelState);
  const succeeded = state.code === "cancelled" && state.outcome !== null;
  const messageTone: "success" | "actionNeeded" = succeeded
    ? "success"
    : "actionNeeded";
  const messageTitle = succeeded
    ? "Lesson cancelled"
    : "We couldn't cancel this lesson";

  return (
    <form action={formAction} className={styles.actionForm}>
      <input name="lessonId" type="hidden" value={lessonId} />
      <input name="operationKey" type="hidden" value={cancelOperationKey} />

      <div className={styles.policyHeader}>
        <StatusBadge tone={outcomeTone}>{outcomeLabel}</StatusBadge>
      </div>
      <p className={styles.bodyText}>{outcomeReason}</p>
      <p className={styles.bodyText}>
        Need to move the lesson? Cancel here and request a new time from the tutor —
        the same cancellation policy applies to the original lesson.
      </p>

      {state.message ? (
        <InlineNotice title={messageTitle} tone={messageTone}>
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}

      {!succeeded ? (
        <CancelSubmitButton outcomeLabel={outcomeLabel} />
      ) : null}
    </form>
  );
}

function CancelSubmitButton({ outcomeLabel }: { outcomeLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="secondary">
      {pending ? "Cancelling lesson..." : `Cancel lesson · ${outcomeLabel}`}
    </Button>
  );
}

type RescheduleFormProps = {
  lessonId: string;
  outcomeLabel: string;
  rebookHref: string;
  rescheduleOperationKey: string;
};

const initialRescheduleState: RescheduleLessonActionState = {
  code: null,
  message: null,
  values: { lessonId: "", operationKey: "", rebookHref: "" },
};

export function RescheduleLessonForm({
  lessonId,
  outcomeLabel,
  rebookHref,
  rescheduleOperationKey,
}: RescheduleFormProps) {
  const [state, formAction] = useActionState(
    rescheduleLessonAction,
    initialRescheduleState,
  );

  return (
    <form action={formAction} className={styles.actionForm}>
      <input name="lessonId" type="hidden" value={lessonId} />
      <input name="operationKey" type="hidden" value={rescheduleOperationKey} />
      <input name="rebookHref" type="hidden" value={rebookHref} />

      <p className={styles.bodyText}>
        Reschedule cancels this lesson under the same policy outcome
        (<strong>{outcomeLabel}</strong>) and sends you to a new booking flow with the
        same tutor when possible.
      </p>

      {state.message ? (
        <InlineNotice title="We couldn't reschedule" tone="actionNeeded">
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}

      <RescheduleSubmitButton outcomeLabel={outcomeLabel} />
    </form>
  );
}

function RescheduleSubmitButton({ outcomeLabel }: { outcomeLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="secondary">
      {pending
        ? "Reschedule in progress..."
        : `Reschedule lesson · ${outcomeLabel}`}
    </Button>
  );
}

type ReportIssueFormProps = {
  allowedIssueTypes: ReadonlyArray<{ label: string; value: LessonIssueType }>;
  lessonId: string;
};

const initialReportState: ReportIssueActionState = {
  code: null,
  fieldErrors: {},
  message: null,
  values: { issueType: "", lessonId: "", summary: "" },
};

export function ReportIssueForm({ allowedIssueTypes, lessonId }: ReportIssueFormProps) {
  const [state, formAction] = useActionState(
    reportLessonIssueAction,
    initialReportState,
  );
  const succeeded = state.code === "submitted";

  return (
    <form action={formAction} className={styles.actionForm}>
      <input name="lessonId" type="hidden" value={lessonId} />

      {state.message ? (
        <InlineNotice
          title={succeeded ? "Issue report received" : "Please review the report"}
          tone={succeeded ? "success" : "actionNeeded"}
        >
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}

      <SelectField
        defaultValue={state.values.issueType}
        description="Pick the structured reason that best matches what happened. Do not flag a lesson issue through chat."
        error={state.fieldErrors.issueType}
        label="What happened?"
        name="issueType"
      >
        <option value="">Select an issue type</option>
        {allowedIssueTypes.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>

      <Textarea
        defaultValue={state.values.summary}
        description="Optional. Add details our team should know — keep it factual and avoid private information."
        error={state.fieldErrors.summary}
        label="Add context"
        labelMeta="Optional"
        maxLength={600}
        name="summary"
        placeholder="What went wrong? When did it happen?"
        rows={4}
      />

      <ReportSubmitButton />
    </form>
  );
}

function ReportSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="secondary">
      {pending ? "Submitting report..." : "Submit issue report"}
    </Button>
  );
}
