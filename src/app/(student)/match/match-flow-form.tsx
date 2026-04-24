"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { NeedSummaryBar } from "@/components/continuity";
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
  getCompatibleSubjectOptions,
  getMatchOptionLabel,
  getNeedTypeOption,
  type MatchFlowField,
  type MatchFlowFieldErrors,
  type MatchFlowFormValues,
  type MatchFlowOptionsByField,
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
  optionsByField: MatchFlowOptionsByField;
};

type StepDefinition = {
  description: string;
  fields: readonly MatchFlowField[];
  id: StepId;
  label: string;
  question: string;
};

const SUBJECT_CARD_LIMIT = 10;

const steps = [
  {
    description: "Choose the closest option. You can refine it later.",
    fields: ["needType"],
    id: "problem",
    label: "Problem",
    question: "What do you need help with right now?",
  },
  {
    description: "Choose the subject or IB component involved.",
    fields: ["subjectSlug"],
    id: "subject",
    label: "Subject",
    question: "Which subject is this for?",
  },
  {
    description: "Tell us how soon you need support and how often.",
    fields: ["urgencyLevel", "sessionFrequencyIntent"],
    id: "urgency",
    label: "Timing",
    question: "When do you need help?",
  },
  {
    description: "Choose the kind of tutoring that would feel most useful.",
    fields: ["supportStyle"],
    id: "style",
    label: "Style",
    question: "What kind of support works best for you?",
  },
  {
    description: "Add the last details so we can show realistic tutor options.",
    fields: ["languageCode", "timezone"],
    id: "details",
    label: "Final details",
    question: "Final details before we show tutors",
  },
] as const satisfies readonly StepDefinition[];

const initialActionState: MatchFlowActionState = {
  code: null,
  fieldErrors: {},
  message: null,
  values: emptyMatchFlowValues,
};

export function MatchFlowForm({
  canSubmit,
  initialTimezone,
  optionsByField,
}: MatchFlowFormProps) {
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
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hasMountedRef = useRef(false);
  const currentStep = steps[currentStepIndex];
  const fieldErrors = { ...state.fieldErrors, ...localErrors };
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;
  const qualifiers = buildNeedQualifiers(values, optionsByField);
  const timezoneOptions = useMemo(
    () => buildTimezoneOptions(initialTimezone),
    [initialTimezone],
  );
  const compatibleSubjectOptions = useMemo(
    () => getCompatibleSubjectOptions(values.needType, optionsByField),
    [optionsByField, values.needType],
  );
  const hasPreviousStep = currentStepIndex > 0;
  const nextStep = steps[currentStepIndex + 1];
  const currentQuestion = getCurrentStepQuestion(currentStep, values, optionsByField);
  const currentDescription = getCurrentStepDescription(
    currentStep,
    values,
    optionsByField,
    compatibleSubjectOptions,
  );

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    titleRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [currentStepIndex]);

  function updateValue(field: MatchFlowField, value: string) {
    setValues((currentValues) => ({
      ...currentValues,
      ...(field === "needType"
        ? {
            needType: value,
            subjectSlug: getNormalizedSubjectValue(
              value,
              currentValues.subjectSlug,
              optionsByField,
            ),
          }
        : { [field]: value }),
    }));
    setLocalErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      if (field === "needType") {
        delete nextErrors.subjectSlug;
      }
      return nextErrors;
    });
  }

  function goForward() {
    const nextErrors = validateStep(currentStep, values);

    if (Object.keys(nextErrors).length > 0) {
      setLocalErrors(nextErrors);
      revealFirstInvalidField(currentStep, nextErrors);
      return;
    }

    setCurrentStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }

  function goBack() {
    setCurrentStepIndex((index) => Math.max(index - 1, 0));
  }

  const currentStepErrorMessage = getCurrentStepErrorMessage(currentStep, fieldErrors);

  return (
    <section className={styles.page} aria-labelledby="match-flow-title">
      {!canSubmit ? (
        <InlineNotice title="Matching setup required" tone="warning">
          <p>
            You can review the flow, but saving answers is not available in this
            environment yet.
          </p>
        </InlineNotice>
      ) : null}

      {state.message ? (
        <InlineNotice title="Please review the highlighted step" tone="actionNeeded">
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}

      <div className={styles.progressCard} aria-label="Match flow progress">
        <div className={styles.progressTopline}>
          <div className={styles.progressIntro}>
            <p className={styles.eyebrow}>Quick match</p>
            <h1 id="match-flow-title" ref={titleRef}>
              {currentQuestion}
            </h1>
          </div>

          <p className={styles.progressStepLabel}>
            Step {currentStepIndex + 1} of {steps.length}
          </p>
        </div>

        <p className={styles.progressDescription}>{currentDescription}</p>

        <div className={styles.progressTrack} aria-hidden="true">
          <span style={{ width: `${progressPercent}%` }} />
        </div>

        <ol className={styles.stepList}>
          {steps.map((step, index) => (
            <li
              aria-current={index === currentStepIndex ? "step" : undefined}
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

      <NeedSummaryBar
        className={styles.summaryBar}
        label="Your request"
        mode="editable"
        need={getNeedTitle(values, optionsByField)}
        qualifiers={qualifiers}
        state="draft"
        stateLabel="In progress"
        variant="compact"
      />

      <form action={formAction} className={styles.form}>
        <HiddenMatchInputs values={values} />

        <div className={styles.formGrid}>
          <section className={styles.questionPanel} aria-labelledby="match-flow-title">
            {currentStepErrorMessage ? (
              <InlineNotice title="Complete this step" tone="actionNeeded">
                <p>{currentStepErrorMessage}</p>
              </InlineNotice>
            ) : null}

            <StepFields
              errors={fieldErrors}
              optionsByField={optionsByField}
              step={currentStep}
              timezoneOptions={timezoneOptions}
              updateValue={updateValue}
              values={values}
            />
          </section>

          <aside className={styles.helperPanel} aria-label="Helpful context">
            <p className={styles.stepEyebrow}>Why we ask</p>
            <h3>{getGuidanceTitle(currentStep.id, values, optionsByField)}</h3>
            <p>{getGuidanceBody(currentStep.id, values, optionsByField)}</p>
            <p className={styles.helperNote}>
              We keep the flow short and only show subject combinations that
              make sense for the help you picked.
            </p>
          </aside>
        </div>

        <div
          className={[
            styles.actionRow,
            hasPreviousStep ? "" : styles.singleAction,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {hasPreviousStep ? (
            <Button onClick={goBack} type="button" variant="secondary">
              Back
            </Button>
          ) : null}

          {currentStepIndex < steps.length - 1 ? (
            <Button onClick={goForward} type="button">
              {nextStep ? `Continue to ${nextStep.label.toLowerCase()}` : "Continue"}
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
  optionsByField: MatchFlowOptionsByField;
  step: StepDefinition;
  timezoneOptions: readonly string[];
  updateValue: (field: MatchFlowField, value: string) => void;
  values: MatchFlowFormValues;
};

function StepFields({
  errors,
  optionsByField,
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
          legend="Type of help"
          options={optionsByField.needType}
          updateValue={updateValue}
          value={values.needType}
        />
      );
    case "subject":
      return (
        <SubjectGroup
          error={errors.subjectSlug}
          needTypeValue={values.needType}
          optionsByField={optionsByField}
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
            legend="How soon?"
            options={optionsByField.urgencyLevel}
            updateValue={updateValue}
            value={values.urgencyLevel}
          />
          <OptionGroup
            error={errors.sessionFrequencyIntent}
            field="sessionFrequencyIntent"
            legend="How often?"
            options={optionsByField.sessionFrequencyIntent}
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
          options={optionsByField.supportStyle}
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
            options={optionsByField.languageCode}
            updateValue={updateValue}
            value={values.languageCode}
          />
          <div id={getFieldContainerId("timezone")}>
            <SelectField
              error={errors.timezone}
              id="timezone"
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
          </div>
          <div id={getFieldContainerId("freeTextNote")}>
            <Textarea
              description="Optional. Avoid private documents or sensitive details; the structured choices do the matching work."
              error={errors.freeTextNote}
              id="freeTextNote"
              label="Anything else that affects fit?"
              maxLength={600}
              onChange={(event) => updateValue("freeTextNote", event.target.value)}
              value={values.freeTextNote}
              variant="longForm"
            />
          </div>
        </div>
      );
  }
}

type SubjectGroupProps = {
  error?: string;
  needTypeValue: string;
  optionsByField: MatchFlowOptionsByField;
  updateValue: (field: MatchFlowField, value: string) => void;
  value: string;
};

function SubjectGroup({
  error,
  needTypeValue,
  optionsByField,
  updateValue,
  value,
}: SubjectGroupProps) {
  const compatibleSubjects = getCompatibleSubjectOptions(needTypeValue, optionsByField);
  const featuredSubjects = compatibleSubjects.slice(0, SUBJECT_CARD_LIMIT);
  const overflowSubjects = compatibleSubjects.slice(SUBJECT_CARD_LIMIT);
  const selectedNeedType = getNeedTypeOption(needTypeValue, optionsByField);

  if (compatibleSubjects.length === 0) {
    return (
      <InlineNotice title="Subject options unavailable" tone="warning">
        <p>
          This type of help does not have any active subject options yet. Go back
          and choose another option.
        </p>
      </InlineNotice>
    );
  }

  return (
    <div className={styles.subjectStack}>
      <OptionGroup
        error={error}
        field="subjectSlug"
        legend={getSubjectLegend(selectedNeedType?.focusAreaCode)}
        options={featuredSubjects}
        updateValue={updateValue}
        value={value}
      />

      {overflowSubjects.length > 0 ? (
        <div id={getFieldContainerId("subjectSlug-overflow")}>
          <SelectField
            id="subjectSlug-overflow"
            label="More IB subjects"
            value={overflowSubjects.some((subject) => subject.value === value) ? value : ""}
            onChange={(event) => updateValue("subjectSlug", event.target.value)}
          >
            <option value="">Choose another subject</option>
            {overflowSubjects.map((subject) => (
              <option key={subject.value} value={subject.value}>
                {subject.label}
              </option>
            ))}
          </SelectField>
        </div>
      ) : null}
    </div>
  );
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
    <fieldset
      aria-invalid={error ? true : undefined}
      className={styles.optionGroup}
      id={getFieldContainerId(field)}
    >
      <legend>
        <span className={styles.optionLegend}>{legend}</span>
      </legend>
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
              <span className={styles.optionText}>
                <span className={styles.optionTitle}>{option.label}</span>
                {option.description ? (
                  <span className={styles.optionDescription}>{option.description}</span>
                ) : null}
              </span>
              <span aria-hidden="true" className={styles.optionIndicator} />
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
      {pending ? "Starting match" : "See tutor matches"}
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

function getNeedTitle(
  values: MatchFlowFormValues,
  optionsByField: MatchFlowOptionsByField,
) {
  if (!values.needType) {
    return "Your IB request";
  }

  return getMatchOptionLabel("needType", values.needType, optionsByField);
}

function buildNeedQualifiers(
  values: MatchFlowFormValues,
  optionsByField: MatchFlowOptionsByField,
) {
  const qualifiers = [];

  if (values.subjectSlug) {
    qualifiers.push({
      label: getMatchOptionLabel("subjectSlug", values.subjectSlug, optionsByField),
    });
  }

  if (values.urgencyLevel) {
    qualifiers.push({
      label: getMatchOptionLabel("urgencyLevel", values.urgencyLevel, optionsByField),
    });
  }

  if (values.supportStyle) {
    qualifiers.push({
      label: getMatchOptionLabel("supportStyle", values.supportStyle, optionsByField),
    });
  }

  if (values.languageCode) {
    qualifiers.push({
      label: getMatchOptionLabel("languageCode", values.languageCode, optionsByField),
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

function getFieldContainerId(field: MatchFlowField | `${MatchFlowField}-overflow`) {
  return `${field}-field`;
}

function revealFirstInvalidField(
  step: StepDefinition,
  errors: MatchFlowFieldErrors,
) {
  const firstInvalidField = step.fields.find((field) => errors[field]);

  if (!firstInvalidField) {
    return;
  }

  const fieldContainer = document.getElementById(getFieldContainerId(firstInvalidField));

  if (!fieldContainer) {
    return;
  }

  fieldContainer.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  const focusTarget = fieldContainer.querySelector<HTMLElement>(
    "input:not([type='hidden']), select, textarea",
  );

  focusTarget?.focus();
}

function getCurrentStepErrorMessage(
  step: StepDefinition,
  errors: MatchFlowFieldErrors,
) {
  const currentStepErrors = step.fields.filter((field) => errors[field]);

  if (currentStepErrors.length === 0) {
    return null;
  }

  if (step.id === "urgency") {
    return "Choose both how soon you need help and how often you want lessons.";
  }

  if (currentStepErrors.length > 1) {
    return "Complete the required answers to continue.";
  }

  return errors[currentStepErrors[0]] ?? "Complete this step to continue.";
}

function getNormalizedSubjectValue(
  needTypeValue: string,
  subjectSlug: string,
  optionsByField: MatchFlowOptionsByField,
) {
  const compatibleSubjects = getCompatibleSubjectOptions(needTypeValue, optionsByField);
  const subjectStillFits = compatibleSubjects.some((subject) => subject.value === subjectSlug);

  if (subjectStillFits) {
    return subjectSlug;
  }

  return compatibleSubjects.length === 1 ? compatibleSubjects[0].value : "";
}

function getGuidanceTitle(
  stepId: StepId,
  values: MatchFlowFormValues,
  optionsByField: MatchFlowOptionsByField,
) {
  switch (stepId) {
    case "problem":
      return "Start with the real task";
    case "subject":
      return getNeedTypeOption(values.needType, optionsByField)?.focusAreaCode === "tok_essay"
        ? "TOK is the right subject here"
        : "Subject sharpens the fit";
    case "urgency":
      return "Timing changes the shortlist";
    case "style":
      return "Teaching style matters";
    case "details":
      return "Practical details save time";
  }
}

function getGuidanceBody(
  stepId: StepId,
  values: MatchFlowFormValues,
  optionsByField: MatchFlowOptionsByField,
) {
  const selectedNeedType = getNeedTypeOption(values.needType, optionsByField);

  switch (stepId) {
    case "problem":
      return "We start with the kind of help you need so the next step only shows subjects that fit that type of support.";
    case "subject":
      if (selectedNeedType?.focusAreaCode === "tok_essay") {
        return "TOK essay help should lead to TOK tutors, not a broad subject list.";
      }

      if (selectedNeedType?.focusAreaCode === "extended_essay") {
        return "For extended essay support, the subject still matters because the best tutor needs both EE experience and subject fluency.";
      }

      return "A strong subject match keeps the results relevant and avoids combinations that do not make sense in IB.";
    case "urgency":
      return "Urgent deadline support and steady weekly help usually surface different tutors.";
    case "style":
      return "Two tutors can cover the same subject but teach in very different ways.";
    case "details":
      return "Language and timezone help us show tutors you can realistically work with and book.";
  }
}

function getCurrentStepQuestion(
  step: StepDefinition,
  values: MatchFlowFormValues,
  optionsByField: MatchFlowOptionsByField,
) {
  if (step.id !== "subject") {
    return step.question;
  }

  const selectedNeedType = getNeedTypeOption(values.needType, optionsByField);

  switch (selectedNeedType?.focusAreaCode) {
    case "extended_essay":
      return "Which subject is your extended essay in?";
    case "ia_feedback":
      return "Which subject is the coursework for?";
    case "oral_practice":
      return "Which subject is the oral for?";
    case "tok_essay":
      return "This help is for TOK";
    default:
      return step.question;
  }
}

function getCurrentStepDescription(
  step: StepDefinition,
  values: MatchFlowFormValues,
  optionsByField: MatchFlowOptionsByField,
  compatibleSubjectOptions: readonly MatchOption[],
) {
  if (step.id !== "subject") {
    return step.description;
  }

  const selectedNeedType = getNeedTypeOption(values.needType, optionsByField);

  if (selectedNeedType?.focusAreaCode === "tok_essay") {
    return "TOK essay support maps to TOK only, so we keep the handoff clear.";
  }

  if (selectedNeedType?.focusAreaCode === "extended_essay") {
    return "Choose the subject area your EE belongs to so we can keep the shortlist relevant.";
  }

  if (compatibleSubjectOptions.length > SUBJECT_CARD_LIMIT) {
    return "We show the most common IB subjects first and keep the rest under More IB subjects.";
  }

  return step.description;
}

function getSubjectLegend(focusAreaCode?: string) {
  switch (focusAreaCode) {
    case "extended_essay":
      return "EE subject";
    case "ia_feedback":
      return "Coursework subject";
    case "oral_practice":
      return "Oral subject";
    default:
      return "Subject";
  }
}
