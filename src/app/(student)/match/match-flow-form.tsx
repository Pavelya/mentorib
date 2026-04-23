"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  ContextChipRow,
  NeedSummaryBar,
} from "@/components/continuity";
import {
  Button,
  InlineNotice,
  SelectField,
  Textarea,
  getButtonClassName,
} from "@/components/ui";
import { getTimezoneLabel } from "@/lib/datetime";
import {
  emptyMatchFlowValues,
  getMatchOptionLabel,
  matchFrequencyOptions,
  matchLanguageOptions,
  matchNeedTypeOptions,
  matchSubjectOptions,
  matchSupportStyleOptions,
  matchUrgencyOptions,
  type MatchFlowField,
  type MatchFlowFieldErrors,
  type MatchFlowFormValues,
  type MatchOption,
} from "@/modules/lessons/match-flow-options";

import {
  submitMatchFlowAction,
  type MatchFlowActionState,
} from "./actions";
import styles from "./match-flow.module.css";

type StepId = "details" | "problem" | "style" | "subject" | "urgency";

type MatchFlowFormProps = {
  canSubmit: boolean;
  initialTimezone: string;
};

type StepDefinition = {
  description: string;
  fields: readonly MatchFlowField[];
  id: StepId;
  label: string;
  question: string;
};

const steps = [
  {
    description: "Start with the pressure point, not a generic tutor category.",
    fields: ["needType"],
    id: "problem",
    label: "Problem",
    question: "What part of IB feels hard right now?",
  },
  {
    description: "This narrows the tutor set before style or availability enters.",
    fields: ["subjectSlug"],
    id: "subject",
    label: "Subject",
    question: "Which IB subject or component is involved?",
  },
  {
    description: "Matching treats an emergency IA review differently from a steady weekly plan.",
    fields: ["urgencyLevel", "sessionFrequencyIntent"],
    id: "urgency",
    label: "Timing",
    question: "How soon do you need useful progress?",
  },
  {
    description: "The best fit is partly about how help should feel in the lesson.",
    fields: ["supportStyle"],
    id: "style",
    label: "Style",
    question: "What kind of support would help most?",
  },
  {
    description: "Timezone and language keep the handoff realistic for booking.",
    fields: ["languageCode", "timezone"],
    id: "details",
    label: "Handoff",
    question: "What should tutors know before we show results?",
  },
] as const satisfies readonly StepDefinition[];

const initialActionState: MatchFlowActionState = {
  code: null,
  fieldErrors: {},
  message: null,
  values: emptyMatchFlowValues,
};

export function MatchFlowForm({ canSubmit, initialTimezone }: MatchFlowFormProps) {
  const [state, formAction] = useActionState(
    submitMatchFlowAction,
    initialActionState,
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [values, setValues] = useState<MatchFlowFormValues>({
    ...emptyMatchFlowValues,
    languageCode: state.values.languageCode,
    timezone: state.values.timezone || initialTimezone,
  });
  const [localErrors, setLocalErrors] = useState<MatchFlowFieldErrors>({});
  const currentStep = steps[currentStepIndex];
  const fieldErrors = { ...state.fieldErrors, ...localErrors };
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;
  const qualifiers = buildNeedQualifiers(values);
  const timezoneOptions = useMemo(
    () => buildTimezoneOptions(initialTimezone),
    [initialTimezone],
  );

  function updateValue(field: MatchFlowField, value: string) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    setLocalErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  function goForward() {
    const nextErrors = validateStep(currentStep, values);

    if (Object.keys(nextErrors).length > 0) {
      setLocalErrors(nextErrors);
      return;
    }

    setCurrentStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }

  function goBack() {
    setCurrentStepIndex((index) => Math.max(index - 1, 0));
  }

  return (
    <section className={styles.page} aria-labelledby="match-flow-title">
      <div className={styles.flowHeader}>
        <div className={styles.flowIntro}>
          <p className={styles.eyebrow}>Guided match</p>
          <h2 id="match-flow-title">Build the learning need first.</h2>
          <p>
            Mentor IB uses the need, urgency, support style, language, and timezone
            together before showing tutor fits.
          </p>
        </div>

        <div className={styles.progressCard} aria-label="Match flow progress">
          <div className={styles.progressTopline}>
            <span>Step {currentStepIndex + 1} of {steps.length}</span>
            <strong>{currentStep.label}</strong>
          </div>
          <div className={styles.progressTrack} aria-hidden="true">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <ol className={styles.stepList}>
            {steps.map((step, index) => (
              <li
                className={[
                  styles.stepItem,
                  index === currentStepIndex ? styles.activeStep : "",
                  index < currentStepIndex ? styles.completedStep : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={step.id}
              >
                {step.label}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {!canSubmit ? (
        <InlineNotice title="Matching setup required" tone="warning">
          <p>
            The flow is ready for review, but saving needs Supabase auth and
            service-role environment variables.
          </p>
        </InlineNotice>
      ) : null}

      {state.message ? (
        <InlineNotice title="Please review the highlighted step" tone="actionNeeded">
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}

      <NeedSummaryBar
        label="Need so far"
        mode="editable"
        need={getNeedTitle(values)}
        qualifiers={qualifiers}
        state={qualifiers.length > 0 ? "draft" : "truncated"}
        variant="stacked"
      />

      <form action={formAction} className={styles.form}>
        <HiddenMatchInputs values={values} />

        <div className={styles.questionGrid}>
          <section className={styles.questionPanel} aria-labelledby={`${currentStep.id}-title`}>
            <p className={styles.stepEyebrow}>{currentStep.label}</p>
            <h3 id={`${currentStep.id}-title`}>{currentStep.question}</h3>
            <p>{currentStep.description}</p>

            <StepFields
              errors={fieldErrors}
              step={currentStep}
              timezoneOptions={timezoneOptions}
              updateValue={updateValue}
              values={values}
            />
          </section>

          <aside className={styles.guidancePanel} aria-label="Matching guidance">
            <p className={styles.stepEyebrow}>What matching uses here</p>
            <h3>{getGuidanceTitle(currentStep.id)}</h3>
            <p>{getGuidanceBody(currentStep.id)}</p>
            <ContextChipRow
              items={[
                { label: "Need remains attached", tone: "info" },
                { label: "Fit before browsing", tone: "trust" },
                { label: "Booking context survives", tone: "positive" },
              ]}
              label="Continuity"
            />
          </aside>
        </div>

        <div className={styles.actionRow}>
          <Button
            disabled={currentStepIndex === 0}
            onClick={goBack}
            type="button"
            variant="secondary"
          >
            Back
          </Button>

          {currentStepIndex < steps.length - 1 ? (
            <Button onClick={goForward} type="button">
              Continue
            </Button>
          ) : (
            <SubmitButton canSubmit={canSubmit} />
          )}
        </div>
      </form>
    </section>
  );
}

type StepFieldsProps = {
  errors: MatchFlowFieldErrors;
  step: StepDefinition;
  timezoneOptions: readonly string[];
  updateValue: (field: MatchFlowField, value: string) => void;
  values: MatchFlowFormValues;
};

function StepFields({
  errors,
  step,
  timezoneOptions,
  updateValue,
  values,
}: StepFieldsProps) {
  switch (step.id) {
    case "problem":
      return (
        <OptionGroup
          error={errors.needType}
          field="needType"
          legend="Pressure point"
          options={matchNeedTypeOptions}
          updateValue={updateValue}
          value={values.needType}
        />
      );
    case "subject":
      return (
        <OptionGroup
          error={errors.subjectSlug}
          field="subjectSlug"
          legend="Subject or component"
          options={matchSubjectOptions}
          updateValue={updateValue}
          value={values.subjectSlug}
        />
      );
    case "urgency":
      return (
        <div className={styles.stackedGroups}>
          <OptionGroup
            error={errors.urgencyLevel}
            field="urgencyLevel"
            legend="Urgency"
            options={matchUrgencyOptions}
            updateValue={updateValue}
            value={values.urgencyLevel}
          />
          <OptionGroup
            error={errors.sessionFrequencyIntent}
            field="sessionFrequencyIntent"
            legend="Lesson rhythm"
            options={matchFrequencyOptions}
            updateValue={updateValue}
            value={values.sessionFrequencyIntent}
          />
        </div>
      );
    case "style":
      return (
        <OptionGroup
          error={errors.supportStyle}
          field="supportStyle"
          legend="Support style"
          options={matchSupportStyleOptions}
          updateValue={updateValue}
          value={values.supportStyle}
        />
      );
    case "details":
      return (
        <div className={styles.detailsGrid}>
          <OptionGroup
            error={errors.languageCode}
            field="languageCode"
            legend="Tutoring language"
            options={matchLanguageOptions}
            updateValue={updateValue}
            value={values.languageCode}
          />
          <SelectField
            error={errors.timezone}
            label="Timezone"
            value={values.timezone}
            onChange={(event) => updateValue("timezone", event.target.value)}
          >
            {timezoneOptions.map((timezone) => (
              <option key={timezone} value={timezone}>
                {getTimezoneLabel(timezone)}
              </option>
            ))}
          </SelectField>
          <Textarea
            description="Optional. Avoid private documents or sensitive details; the structured choices do the matching work."
            error={errors.freeTextNote}
            label="Anything else that affects fit?"
            maxLength={600}
            onChange={(event) => updateValue("freeTextNote", event.target.value)}
            value={values.freeTextNote}
            variant="longForm"
          />
        </div>
      );
  }
}

type OptionGroupProps = {
  error?: string;
  field: MatchFlowField;
  legend: string;
  options: readonly MatchOption[];
  updateValue: (field: MatchFlowField, value: string) => void;
  value: string;
};

function OptionGroup({
  error,
  field,
  legend,
  options,
  updateValue,
  value,
}: OptionGroupProps) {
  const groupName = `${field}-choice`;

  return (
    <fieldset className={styles.optionGroup} aria-invalid={error ? true : undefined}>
      <legend>{legend}</legend>
      <div className={styles.optionGrid}>
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <label
              className={[styles.optionCard, isSelected ? styles.selectedOption : ""]
                .filter(Boolean)
                .join(" ")}
              key={option.value}
            >
              <input
                checked={isSelected}
                name={groupName}
                onChange={() => updateValue(field, option.value)}
                type="radio"
                value={option.value}
              />
              <span className={styles.optionTitle}>{option.label}</span>
              <span className={styles.optionDescription}>{option.description}</span>
            </label>
          );
        })}
      </div>
      {error ? <p className={styles.fieldError}>{error}</p> : null}
    </fieldset>
  );
}

function HiddenMatchInputs({ values }: { values: MatchFlowFormValues }) {
  return (
    <>
      {(Object.keys(values) as MatchFlowField[]).map((field) => (
        <input key={field} name={field} type="hidden" value={values[field]} />
      ))}
    </>
  );
}

function SubmitButton({ canSubmit }: { canSubmit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className={getButtonClassName()}
      disabled={!canSubmit || pending}
      type="submit"
    >
      {pending ? "Starting match" : "See best fits"}
    </button>
  );
}

function validateStep(step: StepDefinition, values: MatchFlowFormValues) {
  const errors: MatchFlowFieldErrors = {};

  for (const field of step.fields) {
    if (!values[field]) {
      errors[field] = getMissingFieldMessage(field);
    }
  }

  return errors;
}

function getMissingFieldMessage(field: MatchFlowField) {
  switch (field) {
    case "languageCode":
      return "Choose a tutoring language.";
    case "needType":
      return "Choose the IB pressure point.";
    case "sessionFrequencyIntent":
      return "Choose the kind of lesson rhythm you want.";
    case "subjectSlug":
      return "Choose the subject or component.";
    case "supportStyle":
      return "Choose the support style that would help most.";
    case "timezone":
      return "Choose a valid timezone.";
    case "urgencyLevel":
      return "Choose when you need help.";
    default:
      return "Complete this field.";
  }
}

function getNeedTitle(values: MatchFlowFormValues) {
  if (!values.needType) {
    return "Tell us what kind of IB help you need.";
  }

  return getMatchOptionLabel("needType", values.needType);
}

function buildNeedQualifiers(values: MatchFlowFormValues) {
  const qualifiers = [];

  if (values.subjectSlug) {
    qualifiers.push({ label: getMatchOptionLabel("subjectSlug", values.subjectSlug) });
  }

  if (values.urgencyLevel) {
    qualifiers.push({ label: getMatchOptionLabel("urgencyLevel", values.urgencyLevel) });
  }

  if (values.supportStyle) {
    qualifiers.push({ label: getMatchOptionLabel("supportStyle", values.supportStyle) });
  }

  if (values.languageCode) {
    qualifiers.push({
      label: getMatchOptionLabel("languageCode", values.languageCode),
      priority: "support" as const,
    });
  }

  if (values.timezone) {
    qualifiers.push({ label: getTimezoneLabel(values.timezone), priority: "support" as const });
  }

  return qualifiers;
}

function buildTimezoneOptions(initialTimezone: string) {
  return Array.from(
    new Set([
      initialTimezone,
      "Europe/Warsaw",
      "Europe/London",
      "Asia/Dubai",
      "America/New_York",
      "UTC",
    ]),
  );
}

function getGuidanceTitle(stepId: StepId) {
  switch (stepId) {
    case "problem":
      return "Problem-led matching";
    case "subject":
      return "Subject fit";
    case "urgency":
      return "Availability viability";
    case "style":
      return "Lesson feel";
    case "details":
      return "Realistic handoff";
  }
}

function getGuidanceBody(stepId: StepId) {
  switch (stepId) {
    case "problem":
      return "A strong match starts with the IB task the student is actually facing, then uses subject fit to narrow the field.";
    case "subject":
      return "The subject or component keeps the system from treating every good tutor as equally relevant.";
    case "urgency":
      return "Timing helps separate tutors who are theoretically relevant from tutors who can help soon enough.";
    case "style":
      return "Support style shapes the fit rationale students see later, especially when several tutors cover the same subject.";
    case "details":
      return "Language and timezone make the next result screen ready for booking instead of just browsing.";
  }
}
