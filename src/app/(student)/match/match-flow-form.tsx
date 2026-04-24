"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { NeedSummaryBar } from "@/components/continuity";
import {
  Button,
  ClockIcon,
  InlineNotice,
  MatchOptionVisual,
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
  getMatchFlowGuidanceCopy,
  getMatchFlowStepDescription,
  getMatchFlowTimezoneNoticeCopy,
  matchFlowStaticCopy,
  type MatchFlowStepId,
} from "@/modules/lessons/match-flow-copy";

import {
  submitMatchFlowAction,
  type MatchFlowActionState,
} from "./actions";
import styles from "./match-flow.module.css";

type MatchFlowFormProps = {
  canSubmit: boolean;
  initialLanguageCode: string;
  initialTimezone: string;
  optionsByField: MatchFlowOptionsByField;
};

type StepDefinition = {
  fields: readonly MatchFlowField[];
  id: MatchFlowStepId;
  label: string;
  question: string;
};

const SUBJECT_CARD_LIMIT = 10;

const steps = [
  {
    fields: ["needType"],
    id: "problem",
    label: matchFlowStaticCopy.problemLabel,
    question: matchFlowStaticCopy.problemQuestion,
  },
  {
    fields: ["subjectSlug"],
    id: "subject",
    label: matchFlowStaticCopy.subjectLabel,
    question: matchFlowStaticCopy.subjectQuestion,
  },
  {
    fields: ["languageCode"],
    id: "details",
    label: matchFlowStaticCopy.detailsLabel,
    question: matchFlowStaticCopy.detailsQuestion,
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
  initialLanguageCode,
  initialTimezone,
  optionsByField,
}: MatchFlowFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    submitMatchFlowAction,
    initialActionState,
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [values, setValues] = useState<MatchFlowFormValues>({
    ...emptyMatchFlowValues,
    languageCode: state.values.languageCode || initialLanguageCode,
    timezone: state.values.timezone || initialTimezone,
  });
  const [localErrors, setLocalErrors] = useState<MatchFlowFieldErrors>({});
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hasMountedRef = useRef(false);
  const currentStep = steps[currentStepIndex];
  const fieldErrors = { ...state.fieldErrors, ...localErrors };
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;
  const qualifiers = buildNeedQualifiers(values, optionsByField, currentStep.id);
  const timezoneLabel = getTimezoneLabel(values.timezone);
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

  useEffect(() => {
    if (!canSubmit) {
      return;
    }

    router.prefetch("/results");
  }, [canSubmit, router]);

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
              updateValue={updateValue}
              values={values}
            />
          </section>

          <aside className={styles.helperPanel} aria-label="Helpful context">
            <p className={styles.stepEyebrow}>Why we ask</p>
            <h3>{getGuidanceTitle(currentStep.id, values, optionsByField, timezoneLabel)}</h3>
            <p>{getGuidanceBody(currentStep.id, values, optionsByField, timezoneLabel)}</p>
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

        <FormPendingOverlay />
      </form>
    </section>
  );
}

type StepFieldsProps = {
  errors: MatchFlowFieldErrors;
  optionsByField: MatchFlowOptionsByField;
  step: StepDefinition;
  updateValue: (field: MatchFlowField, value: string) => void;
  values: MatchFlowFormValues;
};

function StepFields({
  errors,
  optionsByField,
  step,
  updateValue,
  values,
}: StepFieldsProps) {
  switch (step.id) {
    case "problem":
      return (
        <OptionGroup
          error={errors.needType}
          field="needType"
          legend={matchFlowStaticCopy.helpLegend}
          options={optionsByField.needType}
          showDescriptions
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
    case "details":
      return (
        <div className={styles.detailsGrid}>
          <OptionGroup
            error={errors.languageCode}
            field="languageCode"
            legend="Lesson language"
            options={optionsByField.languageCode}
            showDescriptions={false}
            updateValue={updateValue}
            value={values.languageCode}
          />
          <div id={getFieldContainerId("timezone")}>
            <div className={styles.timezoneCard}>
              <div aria-hidden="true" className={styles.timezoneIcon}>
                <ClockIcon />
              </div>
              <div className={styles.timezoneCopy}>
                <p className={styles.timezoneTitle}>
                  {getMatchFlowTimezoneNoticeCopy(getTimezoneLabel(values.timezone)).title}
                </p>
                <p className={styles.timezoneBody}>
                  {getMatchFlowTimezoneNoticeCopy(getTimezoneLabel(values.timezone)).body}
                </p>
              </div>
            </div>
          </div>
          <div id={getFieldContainerId("freeTextNote")}>
            <Textarea
              description={matchFlowStaticCopy.freeTextDescription}
              error={errors.freeTextNote}
              id="freeTextNote"
              label={matchFlowStaticCopy.freeTextLabel}
              labelMeta="Optional"
              maxLength={600}
              onChange={(event) => updateValue("freeTextNote", event.target.value)}
              rows={4}
              value={values.freeTextNote}
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
  const usesOverflowSelect = overflowSubjects.length > 1;
  const cardSubjects = usesOverflowSelect ? featuredSubjects : compatibleSubjects;
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
        options={cardSubjects}
        showDescriptions={false}
        updateValue={updateValue}
        value={value}
      />

      {usesOverflowSelect ? (
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
  showDescriptions?: boolean;
  updateValue: (field: MatchFlowField, value: string) => void;
  value: string;
};

function OptionGroup({
  error,
  field,
  legend,
  options,
  showDescriptions = false,
  updateValue,
  value,
}: OptionGroupProps) {
  const groupName = `${field}-choice`;
  const groupLabelId = `${field}-legend`;

  return (
    <div
      aria-invalid={error ? true : undefined}
      aria-labelledby={groupLabelId}
      className={styles.optionGroup}
      id={getFieldContainerId(field)}
      role="radiogroup"
    >
      <p className={styles.optionLegend} id={groupLabelId}>
        {legend}
      </p>
      <div className={styles.optionGrid}>
        {options.map((option) => {
          const isSelected = value === option.value;
          const inputId = `${groupName}-${option.value}`;

          return (
            <div className={styles.optionChoice} key={option.value}>
              <input
                checked={isSelected}
                className={styles.optionInput}
                id={inputId}
                name={groupName}
                onChange={() => updateValue(field, option.value)}
                type="radio"
                value={option.value}
              />
              <label
                className={[
                  styles.optionCard,
                  !showDescriptions ? styles.compactOptionCard : "",
                  isSelected ? styles.selectedOption : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                htmlFor={inputId}
              >
                <span className={styles.optionMain}>
                  {option.iconKey || option.flagCode ? (
                    <span
                      className={[
                        styles.optionVisual,
                        option.flagCode ? styles.flagVisual : styles.iconVisual,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <MatchOptionVisual flagCode={option.flagCode} iconKey={option.iconKey} />
                    </span>
                  ) : null}
                  <span className={styles.optionText}>
                    <span className={styles.optionTitle}>{option.label}</span>
                    {showDescriptions && option.description ? (
                      <span className={styles.optionDescription}>{option.description}</span>
                    ) : null}
                  </span>
                </span>
                <span aria-hidden="true" className={styles.optionIndicator} />
              </label>
            </div>
          );
        })}
      </div>
      {error ? <p className={styles.fieldError}>{error}</p> : null}
    </div>
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
      {pending ? "Opening results" : "See tutor matches"}
    </button>
  );
}

function FormPendingOverlay() {
  const { pending } = useFormStatus();

  if (!pending) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={styles.pendingOverlay}
      role="status"
    >
      <div className={styles.pendingCard}>
        <p className={styles.pendingEyebrow}>Opening results</p>
        <h2 className={styles.pendingTitle}>We&apos;re getting your tutor matches ready.</h2>
        <p className={styles.pendingDescription}>
          You&apos;ll land on the results screen as soon as your request is saved.
        </p>
        <div aria-hidden="true" className={styles.pendingPreview}>
          <span className={[styles.pendingBar, styles.pendingBarStrong].join(" ")} />
          <span className={styles.pendingBar} />
          <span className={[styles.pendingBar, styles.pendingBarShort].join(" ")} />
        </div>
      </div>
    </div>
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
    case "subjectSlug":
      return "Choose the subject or component.";
    case "timezone":
      return "Choose a valid timezone.";
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
  currentStepId: MatchFlowStepId,
) {
  const qualifiers = [];

  if (values.subjectSlug) {
    qualifiers.push({
      label: getMatchOptionLabel("subjectSlug", values.subjectSlug, optionsByField),
    });
  }

  if (values.languageCode && currentStepId === "details") {
    qualifiers.push({
      label: getMatchOptionLabel("languageCode", values.languageCode, optionsByField),
      priority: "support" as const,
    });
  }

  if (values.timezone && currentStepId === "details") {
    qualifiers.push({
      label: `Times shown in ${getTimezoneLabel(values.timezone)}`,
      priority: "support" as const,
    });
  }

  return qualifiers;
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
  stepId: MatchFlowStepId,
  values: MatchFlowFormValues,
  optionsByField: MatchFlowOptionsByField,
  timezoneLabel: string,
) {
  return getMatchFlowGuidanceCopy(stepId, {
    focusAreaCode: getNeedTypeOption(values.needType, optionsByField)?.focusAreaCode,
    needTypeLabel: getMatchOptionLabel("needType", values.needType, optionsByField),
    timezoneLabel,
  }).title;
}

function getGuidanceBody(
  stepId: MatchFlowStepId,
  values: MatchFlowFormValues,
  optionsByField: MatchFlowOptionsByField,
  timezoneLabel: string,
) {
  return getMatchFlowGuidanceCopy(stepId, {
    focusAreaCode: getNeedTypeOption(values.needType, optionsByField)?.focusAreaCode,
    needTypeLabel: getMatchOptionLabel("needType", values.needType, optionsByField),
    timezoneLabel,
  }).body;
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
  const selectedNeedType = getNeedTypeOption(values.needType, optionsByField);
  return getMatchFlowStepDescription(step.id, {
    focusAreaCode: selectedNeedType?.focusAreaCode,
    subjectCount: compatibleSubjectOptions.length,
  });
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
