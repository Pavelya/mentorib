"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { TimezoneNotice } from "@/components/datetime";
import {
  Button,
  InlineNotice,
  OptionCardGroup,
  Section,
  TextField,
  Textarea,
} from "@/components/ui";
import {
  emptyTutorApplicationDraft,
  getAllowedSubjectCodesForFocusAreas,
  validateTutorApplicationDraft,
  type TutorApplicationDraftInput,
  type TutorApplicationField,
  type TutorApplicationFieldErrors,
  type TutorApplicationOptionsDto,
} from "@/modules/tutors/application";

import { initialTutorProfileUpdateActionState } from "./action-types";
import { updateTutorProfileAction } from "./actions";
import styles from "./profile.module.css";

const HOURLY_RATE_PATTERN = /^[0-9]*(?:\.[0-9]{0,2})?$/;
const MAX_BIO_LENGTH = 600;

const FIELD_LABELS: Record<TutorApplicationField, string> = {
  fullName: "Full name",
  focusAreaCodes: "Types of help",
  headline: "Headline",
  hourlyRateMajor: "Hourly rate",
  languageCodes: "Languages",
  subjectCodes: "Subjects",
  bio: "Bio",
  timezone: "Timezone",
};

type ProfileFormProps = {
  draft: TutorApplicationDraftInput;
  options: TutorApplicationOptionsDto;
};

export function TutorProfileEditorForm({ draft, options }: ProfileFormProps) {
  const [state, formAction] = useActionState(
    updateTutorProfileAction,
    initialTutorProfileUpdateActionState,
  );
  const [values, setValues] = useState<TutorApplicationDraftInput>(() =>
    mergeInitialValues(draft, state.values),
  );
  const [localErrors, setLocalErrors] = useState<TutorApplicationFieldErrors>(
    {},
  );

  const fieldErrors = { ...state.fieldErrors, ...localErrors };
  const filteredSubjects = useMemo(() => {
    const allowed = getAllowedSubjectCodesForFocusAreas(
      values.focusAreaCodes,
      options.focusAreas,
    );
    return allowed.size === 0
      ? options.subjects
      : options.subjects.filter((subject) => allowed.has(subject.subjectCode));
  }, [options.focusAreas, options.subjects, values.focusAreaCodes]);

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
        options.focusAreas,
      );
      const filtered =
        allowed.size === 0
          ? values.subjectCodes
          : values.subjectCodes.filter((code) => allowed.has(code));
      updateValues({ focusAreaCodes: next, subjectCodes: filtered });
      return;
    }
    updateValues({ [field]: next } as Partial<TutorApplicationDraftInput>);
  }

  return (
    <form
      action={formAction}
      className={styles.formStack}
      onSubmit={(event) => {
        const allErrors = validateTutorApplicationDraft(values, options);
        if (Object.keys(allErrors).length === 0) {
          return;
        }
        event.preventDefault();
        setLocalErrors(allErrors);
      }}
    >
      {state.successMessage ? (
        <InlineNotice title="Profile saved" tone="success">
          <p>{state.successMessage}</p>
        </InlineNotice>
      ) : null}
      {state.message ? (
        <InlineNotice title="Please review the fields" tone="actionNeeded">
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

      <HiddenDraftFields values={values} />

      <Section
        density="default"
        eyebrow="Identity"
        title="About you"
        titleAs="h2"
      >
        <div className={styles.fieldStack}>
          <TextField
            error={fieldErrors.fullName}
            id="fullName"
            label="Full name"
            maxLength={80}
            name="full_name_visible"
            onChange={(event) => updateValues({ fullName: event.target.value })}
            placeholder="e.g. Maya Chen"
            value={values.fullName}
          />
          <TextField
            description="One short line about your IB focus."
            error={fieldErrors.headline}
            id="headline"
            label="Headline"
            maxLength={120}
            name="headline_visible"
            onChange={(event) => updateValues({ headline: event.target.value })}
            placeholder="e.g. IB Biology HL Examiner & IA coach"
            value={values.headline}
          />
        </div>
      </Section>

      <Section
        density="default"
        divider="top"
        eyebrow="What you teach"
        title="Types of help, subjects, and languages"
        titleAs="h2"
      >
        <div className={styles.fieldStack}>
          <OptionCardGroup
            error={fieldErrors.focusAreaCodes}
            legend="Tick every kind of help you offer."
            mode="multi"
            name="focusAreaCodes"
            onToggle={(value) => toggleStringValue("focusAreaCodes", value)}
            options={options.focusAreas}
            showDescriptions
            values={values.focusAreaCodes}
          />
          {filteredSubjects.length === 0 ? (
            <InlineNotice title="Pick a kind of help first" tone="warning">
              <p>
                Tick at least one kind of help above so we can show the IB
                subjects that fit.
              </p>
            </InlineNotice>
          ) : (
            <OptionCardGroup
              error={fieldErrors.subjectCodes}
              legend="Tick every IB subject you teach."
              mode="multi"
              name="subjectCodes"
              onToggle={(value) => toggleStringValue("subjectCodes", value)}
              options={filteredSubjects}
              values={values.subjectCodes}
            />
          )}
          <OptionCardGroup
            error={fieldErrors.languageCodes}
            legend="Tick every language you teach in."
            mode="multi"
            name="languageCodes"
            onToggle={(value) => toggleStringValue("languageCodes", value)}
            options={options.languages}
            values={values.languageCodes}
          />
        </div>
      </Section>

      <Section
        density="default"
        divider="top"
        eyebrow="Bio"
        title="Your public bio"
        titleAs="h2"
      >
        <Textarea
          description="A short bio for your public profile. Share your background, experience, and how you teach."
          error={fieldErrors.bio}
          id="bio"
          label="Bio"
          labelMeta={`${values.bio.length} / ${MAX_BIO_LENGTH}`}
          maxLength={MAX_BIO_LENGTH}
          name="bio_visible"
          onChange={(event) =>
            updateValues({ bio: event.target.value.slice(0, MAX_BIO_LENGTH) })
          }
          rows={6}
          value={values.bio}
          variant="longForm"
        />
      </Section>

      <Section
        density="default"
        divider="top"
        eyebrow="Logistics"
        title="Rate and timezone"
        titleAs="h2"
      >
        <div className={styles.fieldStack}>
          <TextField
            description="USD per hour. You can change it any time."
            error={fieldErrors.hourlyRateMajor}
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
      </Section>

      <div className={styles.actionRow}>
        <SaveProfileButton />
      </div>
    </form>
  );
}

function HiddenDraftFields({ values }: { values: TutorApplicationDraftInput }) {
  return (
    <>
      <input name="full_name" type="hidden" value={values.fullName} />
      <input name="headline" type="hidden" value={values.headline} />
      <input name="bio" type="hidden" value={values.bio} />
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

function SaveProfileButton() {
  const { pending } = useFormStatus();
  return (
    <Button aria-busy={pending} disabled={pending} type="submit">
      {pending ? "Saving" : "Save profile"}
    </Button>
  );
}

function mergeInitialValues(
  draft: TutorApplicationDraftInput,
  fromAction: TutorApplicationDraftInput,
): TutorApplicationDraftInput {
  const hasActionValues =
    fromAction !== emptyTutorApplicationDraft &&
    (fromAction.fullName ||
      fromAction.headline ||
      fromAction.bio ||
      fromAction.focusAreaCodes.length > 0 ||
      fromAction.subjectCodes.length > 0 ||
      fromAction.languageCodes.length > 0);
  return hasActionValues ? fromAction : draft;
}
