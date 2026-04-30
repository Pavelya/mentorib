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
  acceptRequestAction,
  cancelTutorLessonAction,
  declineRequestAction,
  reportTutorLessonIssueAction,
  type CancelLessonActionState,
  type ReportIssueActionState,
  type RequestDecisionActionState,
} from "./actions";
import styles from "./lesson-detail.module.css";

export const TUTOR_ISSUE_TYPE_OPTIONS: ReadonlyArray<{
  label: string;
  value: LessonIssueType;
}> = [
  { label: "Student did not attend", value: "student_absent" },
  { label: "Wrong or missing meeting link", value: "wrong_meeting_link" },
  { label: "Major technical problem", value: "technical_failure" },
  { label: "Lesson delivered only partially", value: "partial_delivery" },
];

const initialDecisionState: RequestDecisionActionState = {
  code: null,
  decision: null,
  message: null,
  values: { lessonId: "", operationKey: "" },
};

type DecisionFormProps = {
  acceptOperationKey: string;
  declineOperationKey: string;
  lessonId: string;
};

export function RequestDecisionForms({
  acceptOperationKey,
  declineOperationKey,
  lessonId,
}: DecisionFormProps) {
  const [acceptState, acceptAction] = useActionState(
    acceptRequestAction,
    initialDecisionState,
  );
  const [declineState, declineAction] = useActionState(
    declineRequestAction,
    initialDecisionState,
  );

  const completedState =
    acceptState.decision !== null
      ? acceptState
      : declineState.decision !== null
      ? declineState
      : null;
  const errorState =
    acceptState.message && acceptState.decision === null
      ? acceptState
      : declineState.message && declineState.decision === null
      ? declineState
      : null;

  if (completedState) {
    return (
      <InlineNotice
        title={
          completedState.decision === "accepted"
            ? "Lesson confirmed"
            : "Request declined"
        }
        tone="success"
      >
        <p>{completedState.message}</p>
      </InlineNotice>
    );
  }

  return (
    <div className={styles.actionForm}>
      {errorState ? (
        <InlineNotice title="We couldn't update this request" tone="actionNeeded">
          <p>{errorState.message}</p>
        </InlineNotice>
      ) : null}

      <div className={styles.actionRow}>
        <form action={acceptAction}>
          <input name="lessonId" type="hidden" value={lessonId} />
          <input name="operationKey" type="hidden" value={acceptOperationKey} />
          <AcceptSubmitButton />
        </form>

        <form action={declineAction}>
          <input name="lessonId" type="hidden" value={lessonId} />
          <input name="operationKey" type="hidden" value={declineOperationKey} />
          <DeclineSubmitButton />
        </form>
      </div>
    </div>
  );
}

function AcceptSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="primary">
      {pending ? "Confirming lesson..." : "Accept request"}
    </Button>
  );
}

function DeclineSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="secondary">
      {pending ? "Declining request..." : "Decline request"}
    </Button>
  );
}

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
  const [state, formAction] = useActionState(
    cancelTutorLessonAction,
    initialCancelState,
  );
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
    reportTutorLessonIssueAction,
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
