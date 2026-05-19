"use client";

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

import {
  Button,
  Card,
  FileField,
  InlineNotice,
  Menu,
  MenuItem,
  OverflowMenuTrigger,
  SelectField,
  Section,
  StatusBadge,
  TextField,
} from "@/components/ui";
import type {
  TutorCredentialReviewStatus,
  TutorCredentialType,
} from "@/modules/tutors/constants";
import {
  tutorCredentialTypes,
  FALLBACK_TUTOR_CREDENTIAL_TYPE,
} from "@/modules/tutors/constants";
import type { TutorCredentialEditorRow } from "@/modules/tutors/media-credentials";

import {
  initialTutorCredentialActionState,
  type TutorCredentialActionState,
} from "./action-types";
import {
  deleteTutorCredentialAction,
  replaceTutorCredentialFileAction,
  setTutorCredentialPublicDisplayAction,
  updateTutorCredentialMetadataAction,
  uploadTutorCredentialAction,
} from "./actions";
import styles from "./credentials.module.css";

type ReferenceOption = { id: string; label: string };

type CredentialsManagerProps = {
  credentials: TutorCredentialEditorRow[];
  focusAreas: ReferenceOption[];
  subjects: ReferenceOption[];
};

const CREDENTIAL_TYPE_LABELS: Record<TutorCredentialType, string> = {
  examiner: "IB examiner",
  teaching_qualification: "Teaching qualification",
  degree: "Degree",
  professional_certification: "Professional certification",
  language_certification: "Language certification",
};

const REVIEW_STATUS_LABELS: Record<TutorCredentialReviewStatus, string> = {
  uploaded: "Uploaded",
  pending_review: "In review",
  approved: "Approved",
  rejected: "Update needed",
  expired: "Expired",
};

const REVIEW_STATUS_TONES: Record<
  TutorCredentialReviewStatus,
  "info" | "positive" | "warning" | "destructive"
> = {
  uploaded: "info",
  pending_review: "info",
  approved: "positive",
  rejected: "warning",
  expired: "destructive",
};

export function CredentialsManager({
  credentials,
  focusAreas,
  subjects,
}: CredentialsManagerProps) {
  return (
    <div className={styles.formStack}>
      <Section density="default" title="Add" titleAs="h2">
        <UploadCredentialForm focusAreas={focusAreas} subjects={subjects} />
      </Section>

      <Section
        density="default"
        eyebrow="On file"
        title="Existing credentials"
        titleAs="h2"
      >
        {credentials.length === 0 ? (
          <p className={styles.itemMeta}>
            You haven&apos;t uploaded any credentials yet.
          </p>
        ) : (
          <ul className={styles.list}>
            {credentials.map((credential) => (
              <li key={credential.id}>
                <Card>
                  <CredentialRow
                    credential={credential}
                    focusAreas={focusAreas}
                    subjects={subjects}
                  />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function UploadCredentialForm({
  focusAreas,
  subjects,
}: {
  focusAreas: ReferenceOption[];
  subjects: ReferenceOption[];
}) {
  const [state, formAction] = useActionState(
    uploadTutorCredentialAction,
    initialTutorCredentialActionState,
  );

  return (
    <form action={formAction} className={styles.formStack}>
      <ActionStateNotices state={state} successTitle="Credential uploaded" />
      <SelectField
        defaultValue={FALLBACK_TUTOR_CREDENTIAL_TYPE}
        error={fieldError(state, "credentialType")}
        label="Credential type"
        name="credential_type"
        required
      >
        {tutorCredentialTypes.map((credentialType) => (
          <option key={credentialType} value={credentialType}>
            {CREDENTIAL_TYPE_LABELS[credentialType]}
          </option>
        ))}
      </SelectField>
      <TextField
        description="Shown to reviewers and used when building public trust proof."
        error={fieldError(state, "title")}
        label="Title"
        name="title"
        required
      />
      <TextField
        description="Optional. The school, board, or organisation that issued it."
        error={fieldError(state, "issuingBody")}
        label="Issuing body"
        name="issuing_body"
      />
      <SelectField
        description="Optional. Helps us tag the credential to the right subject."
        error={fieldError(state, "credentialSubjectId")}
        label="Subject"
        name="credential_subject_id"
      >
        <option value="">No specific subject</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.label}
          </option>
        ))}
      </SelectField>
      <SelectField
        description="Optional. The focus area this credential supports."
        error={fieldError(state, "credentialSubjectFocusAreaId")}
        label="Focus area"
        name="credential_subject_focus_area_id"
      >
        <option value="">No specific focus area</option>
        {focusAreas.map((focusArea) => (
          <option key={focusArea.id} value={focusArea.id}>
            {focusArea.label}
          </option>
        ))}
      </SelectField>
      <FileField
        accept="application/pdf,image/jpeg,image/png"
        description="PDF, JPEG, or PNG up to 15 MB."
        error={fieldError(state, "file")}
        label="Credential file"
        name="file"
        required
      />
      <div className={styles.actionRow}>
        <SubmitButton label="Upload credential" />
      </div>
    </form>
  );
}

type RowMode = "view" | "edit" | "replace";

function CredentialRow({
  credential,
  focusAreas,
  subjects,
}: {
  credential: TutorCredentialEditorRow;
  focusAreas: ReferenceOption[];
  subjects: ReferenceOption[];
}) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const toggleFormRef = useRef<HTMLFormElement | null>(null);
  const deleteFormRef = useRef<HTMLFormElement | null>(null);
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<RowMode>("view");

  const subjectLabel = credential.credentialSubjectId
    ? subjects.find((s) => s.id === credential.credentialSubjectId)?.label
    : null;
  const focusAreaLabel = credential.credentialSubjectFocusAreaId
    ? focusAreas.find(
        (f) => f.id === credential.credentialSubjectFocusAreaId,
      )?.label
    : null;

  return (
    <div className={styles.itemBody}>
      <div className={styles.itemHeader}>
        <div>
          <p className={styles.itemTitle}>{credential.title}</p>
          <p className={styles.itemMeta}>
            {CREDENTIAL_TYPE_LABELS[credential.credentialType]}
            {credential.issuingBody ? ` · ${credential.issuingBody}` : ""}
            {subjectLabel ? ` · ${subjectLabel}` : ""}
            {focusAreaLabel ? ` · ${focusAreaLabel}` : ""}
          </p>
        </div>
        <div className={styles.rowActions}>
          <StatusBadge tone={REVIEW_STATUS_TONES[credential.reviewStatus]}>
            {REVIEW_STATUS_LABELS[credential.reviewStatus]}
          </StatusBadge>
          <OverflowMenuTrigger
            aria-controls={menuId}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`Actions for ${credential.title}`}
            onClick={() => setMenuOpen((open) => !open)}
            ref={triggerRef}
          />
          <Menu
            anchorRef={triggerRef}
            contentId={menuId}
            onOpenChange={setMenuOpen}
            open={menuOpen}
          >
            <MenuItem onSelect={() => setMode("replace")}>
              Replace file
            </MenuItem>
            <MenuItem onSelect={() => setMode("edit")}>
              Edit details
            </MenuItem>
            <MenuItem
              onSelect={() => toggleFormRef.current?.requestSubmit()}
            >
              {credential.publicDisplayPreference
                ? "Hide from public proof"
                : "Mark for public proof"}
            </MenuItem>
            <MenuItem
              onSelect={() => deleteFormRef.current?.requestSubmit()}
              tone="destructive"
            >
              Delete credential
            </MenuItem>
          </Menu>
        </div>
      </div>

      <p className={styles.itemMeta}>
        {credential.publicDisplayPreference
          ? "Marked to appear in your public trust proof once approved."
          : "Hidden from your public trust proof."}
      </p>

      <PublicDisplayToggleForm
        credential={credential}
        formRef={toggleFormRef}
      />
      <DeleteCredentialForm credential={credential} formRef={deleteFormRef} />

      {mode === "edit" ? (
        <EditCredentialForm
          credential={credential}
          focusAreas={focusAreas}
          subjects={subjects}
          onClose={() => setMode("view")}
        />
      ) : null}
      {mode === "replace" ? (
        <ReplaceCredentialForm
          credentialId={credential.id}
          onClose={() => setMode("view")}
        />
      ) : null}
    </div>
  );
}

function PublicDisplayToggleForm({
  credential,
  formRef,
}: {
  credential: TutorCredentialEditorRow;
  formRef: React.RefObject<HTMLFormElement | null>;
}) {
  const [state, formAction] = useActionState(
    setTutorCredentialPublicDisplayAction,
    initialTutorCredentialActionState,
  );
  const next = !credential.publicDisplayPreference;
  return (
    <form action={formAction} ref={formRef}>
      <input name="credential_id" type="hidden" value={credential.id} />
      <input
        name="public_display_preference"
        type="hidden"
        value={String(next)}
      />
      <ActionStateNotices state={state} successTitle="Preference saved" />
    </form>
  );
}

function DeleteCredentialForm({
  credential,
  formRef,
}: {
  credential: TutorCredentialEditorRow;
  formRef: React.RefObject<HTMLFormElement | null>;
}) {
  const [state, formAction] = useActionState(
    deleteTutorCredentialAction,
    initialTutorCredentialActionState,
  );
  return (
    <form action={formAction} ref={formRef}>
      <input name="credential_id" type="hidden" value={credential.id} />
      <ActionStateNotices state={state} successTitle="Credential deleted" />
    </form>
  );
}

function EditCredentialForm({
  credential,
  focusAreas,
  subjects,
  onClose,
}: {
  credential: TutorCredentialEditorRow;
  focusAreas: ReferenceOption[];
  subjects: ReferenceOption[];
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(
    updateTutorCredentialMetadataAction,
    initialTutorCredentialActionState,
  );
  useCloseOnSuccess(state, onClose);
  return (
    <form action={formAction} className={styles.formStack}>
      <input name="credential_id" type="hidden" value={credential.id} />
      <ActionStateNotices state={state} successTitle="Credential details saved" />
      <SelectField
        defaultValue={credential.credentialType}
        error={fieldError(state, "credentialType")}
        label="Credential type"
        name="credential_type"
        required
      >
        {tutorCredentialTypes.map((credentialType) => (
          <option key={credentialType} value={credentialType}>
            {CREDENTIAL_TYPE_LABELS[credentialType]}
          </option>
        ))}
      </SelectField>
      <TextField
        defaultValue={credential.title}
        error={fieldError(state, "title")}
        label="Title"
        name="title"
        required
      />
      <TextField
        defaultValue={credential.issuingBody ?? ""}
        error={fieldError(state, "issuingBody")}
        label="Issuing body"
        name="issuing_body"
      />
      <SelectField
        defaultValue={credential.credentialSubjectId ?? ""}
        error={fieldError(state, "credentialSubjectId")}
        label="Subject"
        name="credential_subject_id"
      >
        <option value="">No specific subject</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.label}
          </option>
        ))}
      </SelectField>
      <SelectField
        defaultValue={credential.credentialSubjectFocusAreaId ?? ""}
        error={fieldError(state, "credentialSubjectFocusAreaId")}
        label="Focus area"
        name="credential_subject_focus_area_id"
      >
        <option value="">No specific focus area</option>
        {focusAreas.map((focusArea) => (
          <option key={focusArea.id} value={focusArea.id}>
            {focusArea.label}
          </option>
        ))}
      </SelectField>
      <div className={styles.actionRow}>
        <SubmitButton label="Save changes" />
        <Button onClick={onClose} type="button" variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ReplaceCredentialForm({
  credentialId,
  onClose,
}: {
  credentialId: string;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(
    replaceTutorCredentialFileAction,
    initialTutorCredentialActionState,
  );
  useCloseOnSuccess(state, onClose);
  return (
    <form action={formAction} className={styles.formStack}>
      <input name="credential_id" type="hidden" value={credentialId} />
      <ActionStateNotices state={state} successTitle="Credential file replaced" />
      <FileField
        accept="application/pdf,image/jpeg,image/png"
        description="Replace the existing file. Approved credentials return to review when the file changes."
        error={fieldError(state, "file")}
        label="New credential file"
        name="file"
        required
      />
      <div className={styles.actionRow}>
        <SubmitButton label="Replace file" />
        <Button onClick={onClose} type="button" variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  );
}

function useCloseOnSuccess(
  state: TutorCredentialActionState,
  onClose: () => void,
) {
  useEffect(() => {
    if (state.successMessage) {
      onClose();
    }
    // We want to react when the success message transitions, not on every
    // render. The onClose callback closure captures the latest setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.successMessage]);
}

function SubmitButton({
  label,
  variant = "primary",
}: {
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <Button aria-busy={pending} disabled={pending} type="submit" variant={variant}>
      {pending ? "Saving" : label}
    </Button>
  );
}

function ActionStateNotices({
  state,
  successTitle,
}: {
  state: TutorCredentialActionState;
  successTitle: string;
}) {
  return (
    <>
      {state.successMessage ? (
        <InlineNotice title={successTitle} tone="success">
          <p>{state.successMessage}</p>
        </InlineNotice>
      ) : null}
      {state.message ? (
        <InlineNotice
          title={
            state.code === "validation_failed"
              ? "Please review the fields"
              : "Couldn't complete that action"
          }
          tone={state.code === "validation_failed" ? "actionNeeded" : "warning"}
        >
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}
    </>
  );
}

function fieldError(
  state: TutorCredentialActionState,
  key: string,
): string | undefined {
  const list = state.fieldErrors[key];
  return list && list.length > 0 ? list[0] : undefined;
}
