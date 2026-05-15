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
  saveLessonRecapDraftAction,
  shareLessonRecapAction,
  submitLessonRecapAction,
  type CancelLessonActionState,
  type ReportIssueActionState,
  type RequestDecisionActionState,
  type SaveLessonRecapDraftActionState,
  type ShareLessonRecapActionState,
  type SubmitLessonRecapActionState,
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

const RECAP_FIELD_MAX_LENGTH = 2000;
const RECAP_CONFIDENCE_MAX_LENGTH = 500;

type LessonRecapDraftFormProps = {
  defaults: {
    coverageSummary: string;
    goalSummary: string;
    nextStepsSummary: string;
    studentConfidenceSignal: string;
  };
  isEditable: boolean;
  lessonId: string;
};

const initialRecapDraftState: SaveLessonRecapDraftActionState = {
  code: null,
  message: null,
  values: {
    coverageSummary: "",
    goalSummary: "",
    lessonId: "",
    nextStepsSummary: "",
    studentConfidenceSignal: "",
  },
};

export function LessonRecapDraftForm({
  defaults,
  isEditable,
  lessonId,
}: LessonRecapDraftFormProps) {
  const [state, formAction] = useActionState(
    saveLessonRecapDraftAction,
    initialRecapDraftState,
  );
  const succeeded = state.code === "saved";
  const liveValues = state.values.lessonId === lessonId ? state.values : null;

  const initialValues = liveValues ?? {
    coverageSummary: defaults.coverageSummary,
    goalSummary: defaults.goalSummary,
    lessonId,
    nextStepsSummary: defaults.nextStepsSummary,
    studentConfidenceSignal: defaults.studentConfidenceSignal,
  };

  return (
    <form action={formAction} className={styles.actionForm}>
      <input name="lessonId" type="hidden" value={lessonId} />

      {state.message ? (
        <InlineNotice
          title={succeeded ? "Recap draft saved" : "We couldn't save the draft"}
          tone={succeeded ? "success" : "actionNeeded"}
        >
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}

      <Textarea
        defaultValue={initialValues.goalSummary}
        description="Optional. What was the lesson aiming to achieve?"
        disabled={!isEditable}
        label="Lesson goal"
        labelMeta="Optional"
        maxLength={RECAP_FIELD_MAX_LENGTH}
        name="goalSummary"
        placeholder="What you set out to do together."
        rows={3}
      />

      <Textarea
        defaultValue={initialValues.coverageSummary}
        description="Optional. What was actually covered in this lesson?"
        disabled={!isEditable}
        label="What we covered"
        labelMeta="Optional"
        maxLength={RECAP_FIELD_MAX_LENGTH}
        name="coverageSummary"
        placeholder="Topics, materials, exercises, or examples the student worked through."
        rows={4}
      />

      <Textarea
        defaultValue={initialValues.studentConfidenceSignal}
        description="Optional. Short signal about confidence or understanding (no private medical or family detail)."
        disabled={!isEditable}
        label="Confidence and understanding"
        labelMeta="Optional"
        maxLength={RECAP_CONFIDENCE_MAX_LENGTH}
        name="studentConfidenceSignal"
        placeholder="Where the student felt strong and where they wobbled."
        rows={3}
      />

      <Textarea
        defaultValue={initialValues.nextStepsSummary}
        description="Optional. Action items or recommended focus before the next lesson."
        disabled={!isEditable}
        label="Next steps"
        labelMeta="Optional"
        maxLength={RECAP_FIELD_MAX_LENGTH}
        name="nextStepsSummary"
        placeholder="Suggested practice, reading, or focus for the next session."
        rows={3}
      />

      {isEditable ? <RecapSaveButton /> : null}
    </form>
  );
}

function RecapSaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="secondary">
      {pending ? "Saving draft..." : "Save draft"}
    </Button>
  );
}

type SubmitLessonRecapFormProps = {
  lessonId: string;
};

const initialRecapSubmitState: SubmitLessonRecapActionState = {
  code: null,
  message: null,
  values: { lessonId: "" },
};

export function SubmitLessonRecapForm({ lessonId }: SubmitLessonRecapFormProps) {
  const [state, formAction] = useActionState(
    submitLessonRecapAction,
    initialRecapSubmitState,
  );
  const succeeded = state.code === "submitted";

  return (
    <form action={formAction} className={styles.actionForm}>
      <input name="lessonId" type="hidden" value={lessonId} />

      {state.message ? (
        <InlineNotice
          title={succeeded ? "Recap submitted" : "We couldn't submit the recap"}
          tone={succeeded ? "success" : "actionNeeded"}
        >
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}

      <SubmitRecapButton />
    </form>
  );
}

function SubmitRecapButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="secondary">
      {pending ? "Submitting recap..." : "Submit recap"}
    </Button>
  );
}

type ShareLessonRecapFormProps = {
  lessonId: string;
};

const initialRecapShareState: ShareLessonRecapActionState = {
  code: null,
  message: null,
  values: { lessonId: "" },
};

export function ShareLessonRecapForm({ lessonId }: ShareLessonRecapFormProps) {
  const [state, formAction] = useActionState(
    shareLessonRecapAction,
    initialRecapShareState,
  );
  const succeeded = state.code === "shared";

  return (
    <form action={formAction} className={styles.actionForm}>
      <input name="lessonId" type="hidden" value={lessonId} />

      {state.message ? (
        <InlineNotice
          title={succeeded ? "Recap shared" : "We couldn't share the recap"}
          tone={succeeded ? "success" : "actionNeeded"}
        >
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}

      <ShareRecapButton />
    </form>
  );
}

function ShareRecapButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="primary">
      {pending ? "Sharing recap..." : "Share recap with student"}
    </Button>
  );
}
