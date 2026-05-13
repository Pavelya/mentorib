"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { NeedSummaryBar } from "@/components/continuity";
import { TimezoneNotice } from "@/components/datetime";
import {
  Button,
  Chip,
  Flag,
  Icon,
  InlineNotice,
  OptionCardGroup,
  Panel,
  Section,
  TextField,
  Textarea,
  getButtonClassName,
} from "@/components/ui";
import { getTimezoneLabel } from "@/lib/datetime";
import {
  emptyTutorApplicationDraft,
  getAllowedSubjectCodesForFocusAreas,
  validateTutorApplicationDraft,
  type TutorApplicationDraftInput,
  type TutorApplicationDto,
  type TutorApplicationField,
  type TutorApplicationFieldErrors,
  type TutorApplicationOptionsDto,
} from "@/modules/tutors/application";

import { initialTutorApplicationActionState } from "./action-types";
import { submitTutorApplicationAction } from "./actions";
import styles from "./apply.module.css";

type ApplyFormProps = {
  application: TutorApplicationDto;
};

type StepId =
  | "identity"
  | "focus"
  | "subjects"
  | "languages"
  | "bio"
  | "rate"
  | "review";

type StepDefinition = {
  description: string;
  fields: readonly TutorApplicationField[];
  guidance: { body: string; title: string };
  id: StepId;
  label: string;
  question: string;
};

const steps: readonly StepDefinition[] = [
  {
    description: "How students see you on Mentor IB.",
    fields: ["displayName", "headline"],
    guidance: {
      body:
        "Your real name and a one-line headline. Students scan headlines fast.",
      title: "Why we ask",
    },
    id: "identity",
    label: "About you",
    question: "Let's start with the basics",
  },
  {
    description: "Pick the kinds of help you offer.",
    fields: ["focusAreaCodes"],
    guidance: {
      body:
        "Students ask for help with specific things — IA, EE, Paper prep, TOK, oral practice. Tick the ones you teach.",
      title: "Why we ask",
    },
    id: "focus",
    label: "Types of help",
    question: "What kinds of help do you offer?",
  },
  {
    description: "Choose the IB subjects you teach.",
    fields: ["subjectCodes"],
    guidance: {
      body:
        "Only IB subjects that match the kinds of help you picked are shown. Tick what you confidently teach.",
      title: "Why we ask",
    },
    id: "subjects",
    label: "Subjects",
    question: "Which IB subjects do you teach?",
  },
  {
    description: "Add the languages you can teach in.",
    fields: ["languageCodes"],
    guidance: {
      body:
        "Pick languages you're comfortable teaching in — not every language you speak.",
      title: "Why we ask",
    },
    id: "languages",
    label: "Languages",
    question: "Which languages do you teach in?",
  },
  {
    description: "A short bio for your public profile.",
    fields: ["bio"],
    guidance: {
      body:
        "Share your experience and approach in your own words. This appears on your public profile.",
      title: "Why we ask",
    },
    id: "bio",
    label: "Bio",
    question: "Tell students about yourself",
  },
  {
    description: "Your hourly rate. Timezone is detected automatically.",
    fields: ["hourlyRateMajor"],
    guidance: {
      body: "Hourly rate is what students see on your profile. You can change it any time.",
      title: "Why we ask",
    },
    id: "rate",
    label: "Rate",
    question: "Set your hourly rate",
  },
  {
    description:
      "A quick look at what you're sending. Mentor IB will review it next.",
    fields: [],
    guidance: {
      body:
        "Submitting moves your application into our review queue. You can keep editing until we respond.",
      title: "What happens next",
    },
    id: "review",
    label: "Review",
    question: "Ready to submit?",
  },
];

const FIELD_LABELS: Record<TutorApplicationField, string> = {
  displayName: "Display name",
  focusAreaCodes: "Types of help",
  headline: "Headline",
  hourlyRateMajor: "Hourly rate",
  languageCodes: "Languages",
  subjectCodes: "Subjects",
  bio: "Bio",
  timezone: "Timezone",
};

const HOURLY_RATE_PATTERN = /^[0-9]*(?:\.[0-9]{0,2})?$/;
const MAX_BIO_LENGTH = 600;

export function TutorApplicationForm({ application }: ApplyFormProps) {
  const [state, formAction] = useActionState(
    submitTutorApplicationAction,
    initialTutorApplicationActionState,
  );
  const [values, setValues] = useState<TutorApplicationDraftInput>(() =>
    mergeInitialValues(application.profile.draft, state.values),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [localErrors, setLocalErrors] = useState<TutorApplicationFieldErrors>({});
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    titleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stepIndex]);

  const currentStep = steps[stepIndex];
  const fieldErrors = { ...state.fieldErrors, ...localErrors };
  const progressPercent = ((stepIndex + 1) / steps.length) * 100;
  const isReviewStep = currentStep.id === "review";
  const isLastStep = stepIndex === steps.length - 1;

  const qualifiers = useMemo(
    () => buildSummaryQualifiers(values, application.options),
    [values, application.options],
  );

  function updateValues(update: Partial<TutorApplicationDraftInput>) {
    setValues((current) => ({ ...current, ...update }));
    setLocalErrors((current) => {
      const next = { ...current };
      Object.keys(update).forEach((key) => {
        delete next[key as TutorApplicationField];
      });
      return next;
    });
  }

  function toggleStringValue(
    field: "focusAreaCodes" | "subjectCodes" | "languageCodes",
    value: string,
  ) {
    const current = values[field];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    if (field === "focusAreaCodes") {
      const allowed = getAllowedSubjectCodesForFocusAreas(
        next,
        application.options.focusAreas,
      );
      const filteredSubjects =
        allowed.size === 0
          ? values.subjectCodes
          : values.subjectCodes.filter((code) => allowed.has(code));
      updateValues({ focusAreaCodes: next, subjectCodes: filteredSubjects });
      return;
    }
    updateValues({ [field]: next } as Partial<TutorApplicationDraftInput>);
  }

  function goNext() {
    const stepErrors = validateStepFields(
      currentStep,
      values,
      application.options,
    );
    if (Object.keys(stepErrors).length > 0) {
      setLocalErrors(stepErrors);
      return;
    }
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }

  function goBack() {
    setStepIndex((index) => Math.max(index - 1, 0));
  }

  return (
    <section className={styles.formSection} aria-labelledby="apply-step-title">
      {state.message ? (
        <InlineNotice title="Please review the steps" tone="actionNeeded">
          <p>{state.message}</p>
          {Object.keys(state.fieldErrors).length > 0 ? (
            <ul className={styles.errorList}>
              {Object.entries(state.fieldErrors).map(([field, error]) => (
                <li key={field}>
                  <strong>{FIELD_LABELS[field as TutorApplicationField]}:</strong>{" "}
                  {error}
                </li>
              ))}
            </ul>
          ) : null}
        </InlineNotice>
      ) : null}

      <Panel aria-label="Application progress">
        <div className={styles.progressTopline}>
          <div className={styles.progressIntro}>
            <p className={styles.eyebrow}>{currentStep.label}</p>
            <h2 id="apply-step-title" ref={titleRef}>
              {currentStep.question}
            </h2>
          </div>
          <p className={styles.progressStepLabel}>
            Step {stepIndex + 1} of {steps.length}
          </p>
        </div>

        <p className={styles.progressDescription}>{currentStep.description}</p>

        <div className={styles.progressTrack} aria-hidden="true">
          <span style={{ width: `${progressPercent}%` }} />
        </div>

        <ol className={styles.stepList}>
          {steps.map((step, index) => (
            <li
              aria-current={index === stepIndex ? "step" : undefined}
              className={[
                styles.stepItem,
                index === stepIndex ? styles.activeStep : "",
                index < stepIndex ? styles.completedStep : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={step.id}
            >
              {step.label}
            </li>
          ))}
        </ol>
      </Panel>

      <NeedSummaryBar
        className={styles.summaryBar}
        label="Your application"
        mode="editable"
        need={buildApplicationTitle(values)}
        qualifiers={qualifiers}
        state="draft"
        stateLabel="In progress"
        variant="compact"
      />

      <form
        action={formAction}
        className={styles.form}
        onSubmit={(event) => {
          const submitter = (event.nativeEvent as SubmitEvent).submitter as
            | HTMLButtonElement
            | null;
          if (submitter?.value !== "submit") {
            return;
          }
          const allErrors = validateTutorApplicationDraft(
            values,
            application.options,
          );
          if (Object.keys(allErrors).length === 0) {
            return;
          }
          event.preventDefault();
          setLocalErrors(allErrors);
          const firstFailingStepIndex = steps.findIndex((step) =>
            step.fields.some((field) => allErrors[field]),
          );
          if (firstFailingStepIndex >= 0) {
            setStepIndex(firstFailingStepIndex);
          }
        }}
      >
        <HiddenDraftFields values={values} />

        <div className={styles.formGrid}>
          <Panel as="section" aria-labelledby="apply-step-title">
            {isReviewStep ? (
              <ReviewSection options={application.options} values={values} />
            ) : (
              <StepFields
                errors={fieldErrors}
                options={application.options}
                step={currentStep}
                toggleStringValue={toggleStringValue}
                updateValues={updateValues}
                values={values}
              />
            )}
          </Panel>

          <aside aria-label="Helpful context">
            <Panel
              description={currentStep.guidance.body}
              eyebrow={currentStep.guidance.title}
              title={getGuidanceTitle(currentStep, values)}
              titleAs="h3"
              tone="soft"
            />
          </aside>
        </div>

        <div className={styles.actionRow}>
          <SaveAndExitButton />
          <div className={styles.actionGroupRight}>
            {stepIndex > 0 ? (
              <Button onClick={goBack} type="button" variant="secondary">
                Back
              </Button>
            ) : null}
            {!isLastStep ? (
              <Button onClick={goNext} type="button">
                Continue
              </Button>
            ) : (
              <SubmitApplicationButton />
            )}
          </div>
        </div>
      </form>
    </section>
  );
}

function HiddenDraftFields({ values }: { values: TutorApplicationDraftInput }) {
  return (
    <>
      <input name="display_name" type="hidden" value={values.displayName} />
      <input name="headline" type="hidden" value={values.headline} />
      <input
        name="bio"
        type="hidden"
        value={values.bio}
      />
      <input
        name="hourly_rate_major"
        type="hidden"
        value={values.hourlyRateMajor}
      />
      <input name="timezone" type="hidden" value={values.timezone} />
      {values.focusAreaCodes.map((code) => (
        <input key={code} name="focus_area_codes" type="hidden" value={code} />
      ))}
      {values.subjectCodes.map((code) => (
        <input key={code} name="subject_codes" type="hidden" value={code} />
      ))}
      {values.languageCodes.map((code) => (
        <input key={code} name="language_codes" type="hidden" value={code} />
      ))}
    </>
  );
}

type StepFieldsProps = {
  errors: TutorApplicationFieldErrors;
  options: TutorApplicationOptionsDto;
  step: StepDefinition;
  toggleStringValue: (
    field: "focusAreaCodes" | "subjectCodes" | "languageCodes",
    value: string,
  ) => void;
  updateValues: (update: Partial<TutorApplicationDraftInput>) => void;
  values: TutorApplicationDraftInput;
};

function StepFields({
  errors,
  options,
  step,
  toggleStringValue,
  updateValues,
  values,
}: StepFieldsProps) {
  switch (step.id) {
    case "identity":
      return (
        <div className={styles.fieldStack}>
          <TextField
            error={errors.displayName}
            id="displayName"
            label="Display name"
            maxLength={80}
            name="display_name_visible"
            onChange={(event) =>
              updateValues({ displayName: event.target.value })
            }
            placeholder="e.g. Maya Chen"
            value={values.displayName}
          />
          <TextField
            description="One short line about your IB focus."
            error={errors.headline}
            id="headline"
            label="Headline"
            maxLength={120}
            name="headline_visible"
            onChange={(event) => updateValues({ headline: event.target.value })}
            placeholder="e.g. IB Biology HL Examiner & IA coach"
            value={values.headline}
          />
        </div>
      );
    case "focus":
      return (
        <OptionCardGroup
          error={errors.focusAreaCodes}
          legend="Tick every kind of help you offer."
          mode="multi"
          name="focusAreaCodes"
          onToggle={(value) => toggleStringValue("focusAreaCodes", value)}
          options={options.focusAreas}
          showDescriptions
          values={values.focusAreaCodes}
        />
      );
    case "subjects": {
      const allowed = getAllowedSubjectCodesForFocusAreas(
        values.focusAreaCodes,
        options.focusAreas,
      );
      const filteredSubjects =
        allowed.size === 0
          ? options.subjects
          : options.subjects.filter((subject) =>
              allowed.has(subject.subjectCode),
            );

      if (filteredSubjects.length === 0) {
        return (
          <InlineNotice title="Pick a kind of help first" tone="warning">
            <p>
              Go back to the previous step and tick at least one kind of help so
              we can show the IB subjects that fit.
            </p>
          </InlineNotice>
        );
      }

      return (
        <OptionCardGroup
          error={errors.subjectCodes}
          legend="Tick every IB subject you teach."
          mode="multi"
          name="subjectCodes"
          onToggle={(value) => toggleStringValue("subjectCodes", value)}
          options={filteredSubjects}
          values={values.subjectCodes}
        />
      );
    }
    case "languages":
      return (
        <OptionCardGroup
          error={errors.languageCodes}
          legend="Tick every language you teach in."
          mode="multi"
          name="languageCodes"
          onToggle={(value) => toggleStringValue("languageCodes", value)}
          options={options.languages}
          values={values.languageCodes}
        />
      );
    case "bio": {
      const bioLength = values.bio.length;
      return (
        <Textarea
          description="A short bio for your public profile. Share your background, experience, and how you teach."
          error={errors.bio}
          id="bio"
          label="Bio"
          labelMeta={`${bioLength} / ${MAX_BIO_LENGTH}`}
          maxLength={MAX_BIO_LENGTH}
          name="bio_visible"
          onChange={(event) =>
            updateValues({ bio: event.target.value.slice(0, MAX_BIO_LENGTH) })
          }
          rows={6}
          value={values.bio}
          variant="longForm"
        />
      );
    }
    case "rate":
      return (
        <div className={styles.fieldStack}>
          <TextField
            description="USD per hour. You can change it any time."
            error={errors.hourlyRateMajor}
            id="hourlyRateMajor"
            inputMode="decimal"
            label="Hourly rate (USD)"
            name="hourly_rate_major_visible"
            onChange={(event) => {
              const next = event.target.value;
              if (next === "" || HOURLY_RATE_PATTERN.test(next)) {
                updateValues({ hourlyRateMajor: next });
              }
            }}
            placeholder="60"
            value={values.hourlyRateMajor}
          />
          <TimezoneNotice
            body="Everyone sees their own local time on Mentor IB — your students see theirs, you see yours."
            timezone={values.timezone}
          />
        </div>
      );
    case "review":
    default:
      return null;
  }
}

function ReviewSection({
  options,
  values,
}: {
  options: TutorApplicationOptionsDto;
  values: TutorApplicationDraftInput;
}) {
  const subjectChips = values.subjectCodes
    .map((code) => options.subjects.find((subject) => subject.value === code))
    .filter((subject): subject is NonNullable<typeof subject> => Boolean(subject));
  const focusChips = values.focusAreaCodes
    .map((code) => options.focusAreas.find((focus) => focus.value === code))
    .filter((focus): focus is NonNullable<typeof focus> => Boolean(focus));
  const languageChips = values.languageCodes
    .map((code) => options.languages.find((language) => language.value === code))
    .filter((language): language is NonNullable<typeof language> => Boolean(language));

  return (
    <div className={styles.reviewStack}>
      <Section
        density="compact"
        eyebrow="Profile"
        title={values.displayName || "Your tutor profile"}
        titleAs="h3"
      >
        <p className={styles.reviewHeadline}>
          {values.headline || "—"}
        </p>
        <p className={styles.reviewBio}>
          {values.bio || "No bio yet."}
        </p>
      </Section>

      <Section
        density="compact"
        divider="top"
        eyebrow="What you teach"
        title="Types of help, subjects, and languages"
        titleAs="h3"
      >
        <dl className={styles.factGrid}>
          <FactRow label="Types of help">
            {focusChips.length === 0 ? (
              <span className={styles.factEmpty}>—</span>
            ) : (
              <div className={styles.chipRow}>
                {focusChips.map((focus) => (
                  <Chip key={focus.value} tone="info">
                    {focus.label}
                  </Chip>
                ))}
              </div>
            )}
          </FactRow>

          <FactRow label="Subjects">
            {subjectChips.length === 0 ? (
              <span className={styles.factEmpty}>—</span>
            ) : (
              <div className={styles.chipRow}>
                {subjectChips.map((subject) => (
                  <Chip key={subject.value}>
                    {subject.iconKey ? (
                      <span aria-hidden="true" className={styles.chipIcon}>
                        <Icon name={subject.iconKey} />
                      </span>
                    ) : null}
                    {subject.label}
                  </Chip>
                ))}
              </div>
            )}
          </FactRow>

          <FactRow label="Languages">
            {languageChips.length === 0 ? (
              <span className={styles.factEmpty}>—</span>
            ) : (
              <div className={styles.chipRow}>
                {languageChips.map((language) => (
                  <Chip key={language.value}>
                    {language.flagCode ? (
                      <span aria-hidden="true" className={styles.chipFlag}>
                        <Flag code={language.flagCode} />
                      </span>
                    ) : null}
                    {language.label}
                  </Chip>
                ))}
              </div>
            )}
          </FactRow>
        </dl>
      </Section>

      <Section
        density="compact"
        divider="top"
        eyebrow="Logistics"
        title="Rate and timezone"
        titleAs="h3"
      >
        <dl className={styles.factGrid}>
          <FactRow label="Hourly rate">
            <span className={styles.factStrong}>
              {values.hourlyRateMajor
                ? `$${values.hourlyRateMajor} / hr`
                : "—"}
            </span>
          </FactRow>
          <FactRow label="Timezone">
            <span>
              {values.timezone ? getTimezoneLabel(values.timezone) : "—"}
            </span>
          </FactRow>
        </dl>
      </Section>
    </div>
  );
}

function FactRow({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className={styles.factRow}>
      <dt className={styles.factLabel}>{label}</dt>
      <dd className={styles.factValue}>{children}</dd>
    </div>
  );
}

function SaveAndExitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      className={styles.saveExitButton}
      disabled={pending}
      name="intent"
      type="submit"
      value="save"
      variant="ghost"
    >
      Save and exit
    </Button>
  );
}

function SubmitApplicationButton() {
  const { pending } = useFormStatus();
  return (
    <span className={styles.submitWrap}>
      <button
        aria-busy={pending}
        className={getButtonClassName()}
        disabled={pending}
        name="intent"
        type="submit"
        value="submit"
      >
        {pending ? "Submitting" : "Submit application"}
      </button>
    </span>
  );
}

function validateStepFields(
  step: StepDefinition,
  values: TutorApplicationDraftInput,
  options: TutorApplicationOptionsDto,
): TutorApplicationFieldErrors {
  if (step.fields.length === 0) {
    return {};
  }
  const allErrors = validateTutorApplicationDraft(values, options);
  const stepErrors: TutorApplicationFieldErrors = {};
  for (const field of step.fields) {
    const error = allErrors[field];
    if (error) {
      stepErrors[field] = error;
    }
  }
  return stepErrors;
}

function mergeInitialValues(
  draft: TutorApplicationDraftInput,
  fromAction: TutorApplicationDraftInput,
): TutorApplicationDraftInput {
  const hasActionValues =
    fromAction !== emptyTutorApplicationDraft &&
    (fromAction.displayName ||
      fromAction.headline ||
      fromAction.focusAreaCodes.length > 0 ||
      fromAction.subjectCodes.length > 0);
  return hasActionValues ? fromAction : draft;
}

function buildApplicationTitle(values: TutorApplicationDraftInput): string {
  if (values.displayName.trim()) {
    return values.displayName.trim();
  }
  if (values.headline.trim()) {
    return values.headline.trim();
  }
  return "Your tutor application";
}

function buildSummaryQualifiers(
  values: TutorApplicationDraftInput,
  options: TutorApplicationOptionsDto,
) {
  const qualifiers: Array<{ label: string; priority?: "default" | "support" }> = [];

  for (const code of values.focusAreaCodes.slice(0, 3)) {
    const focus = options.focusAreas.find((option) => option.value === code);
    if (focus) {
      qualifiers.push({ label: focus.label });
    }
  }

  if (values.focusAreaCodes.length > 3) {
    qualifiers.push({
      label: `+${values.focusAreaCodes.length - 3} more`,
      priority: "support",
    });
  }

  for (const code of values.subjectCodes.slice(0, 3)) {
    const subject = options.subjects.find((option) => option.value === code);
    if (subject) {
      qualifiers.push({ label: subject.label, priority: "support" });
    }
  }

  if (values.timezone) {
    qualifiers.push({
      label: `Timezone: ${getTimezoneLabel(values.timezone)}`,
      priority: "support",
    });
  }

  return qualifiers;
}

function getGuidanceTitle(
  step: StepDefinition,
  values: TutorApplicationDraftInput,
): string {
  if (step.id === "focus" && values.focusAreaCodes.length > 0) {
    return `${values.focusAreaCodes.length} picked`;
  }
  if (step.id === "subjects" && values.subjectCodes.length > 0) {
    return `${values.subjectCodes.length} picked`;
  }
  if (step.id === "languages" && values.languageCodes.length > 0) {
    return `${values.languageCodes.length} picked`;
  }
  return "Why we ask";
}
