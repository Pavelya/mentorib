"use client";

import { useActionState, useId, useMemo } from "react";
import { useFormStatus } from "react-dom";

import {
  Avatar,
  Button,
  InlineNotice,
  Section,
  StatusBadge,
  TextField,
} from "@/components/ui";
import type { TutorPublicMediaPublicationStatus } from "@/modules/tutors/constants";

import {
  initialTutorProfilePhotoActionState,
  setTutorProfilePhotoPublicationAction,
  updateTutorProfilePhotoAltAction,
  uploadTutorProfilePhotoAction,
  type TutorProfilePhotoActionState,
} from "./actions";
import styles from "./photo.module.css";

type PhotoState = {
  altText: string | null;
  publicationStatus: TutorPublicMediaPublicationStatus;
  publicUrl: string;
};

type ProfilePhotoManagerProps = {
  displayName: string;
  photo: PhotoState | null;
};

const STATUS_LABELS: Record<TutorPublicMediaPublicationStatus, string> = {
  uploaded: "Uploaded",
  pending_review: "In review",
  approved: "Approved",
  published: "Published",
  hidden: "Hidden",
};

const STATUS_TONES: Record<
  TutorPublicMediaPublicationStatus,
  "info" | "positive" | "warning"
> = {
  uploaded: "info",
  pending_review: "info",
  approved: "info",
  published: "positive",
  hidden: "warning",
};

export function ProfilePhotoManager({
  displayName,
  photo,
}: ProfilePhotoManagerProps) {
  return (
    <div className={styles.formStack}>
      <Section
        density="default"
        eyebrow="Preview"
        title="How your hero image looks"
        titleAs="h2"
      >
        <div className={styles.preview}>
          <Avatar
            alt={photo?.altText ?? `${displayName} profile photo`}
            name={displayName}
            size="lg"
            src={photo?.publicUrl}
          />
          <div className={styles.previewMeta}>
            <p className={styles.previewLabel}>{displayName}</p>
            <p className={styles.previewHelper}>
              {photo
                ? "Same crop and size used on your public profile hero."
                : "No photo uploaded yet. Initials will show as a placeholder."}
            </p>
            {photo ? (
              <StatusBadge tone={STATUS_TONES[photo.publicationStatus]}>
                {STATUS_LABELS[photo.publicationStatus]}
              </StatusBadge>
            ) : null}
          </div>
        </div>
      </Section>

      <Section
        density="default"
        eyebrow={photo ? "Replace" : "Upload"}
        title={photo ? "Upload a new photo" : "Upload a photo"}
        titleAs="h2"
      >
        <UploadPhotoForm currentAlt={photo?.altText ?? ""} />
      </Section>

      {photo ? (
        <Section
          density="default"
          eyebrow="Description"
          title="Photo description"
          titleAs="h2"
        >
          <UpdateAltForm currentAlt={photo.altText ?? ""} />
        </Section>
      ) : null}

      {photo ? (
        <Section
          density="default"
          eyebrow="Publish"
          title="Publication"
          titleAs="h2"
        >
          <PublicationControls photo={photo} />
        </Section>
      ) : null}
    </div>
  );
}

function UploadPhotoForm({ currentAlt }: { currentAlt: string }) {
  const [state, formAction] = useActionState(
    uploadTutorProfilePhotoAction,
    initialTutorProfilePhotoActionState,
  );
  return (
    <form action={formAction} className={styles.formStack}>
      <ActionStateNotices state={state} successTitle="Photo uploaded" />
      <FileField
        accept="image/jpeg,image/png,image/webp"
        description="JPEG, PNG, or WebP up to 5 MB."
        error={fieldError(state, "file")}
        label="Photo file"
        name="file"
        required
      />
      <TextField
        defaultValue={currentAlt}
        description="A short description that screen readers and assistive tech read aloud. Required before publishing."
        error={fieldError(state, "altText")}
        label="Photo description"
        maxLength={200}
        name="alt_text"
        placeholder="e.g. Smiling teacher in a classroom"
      />
      <div className={styles.actionRow}>
        <SubmitButton label="Upload photo" />
      </div>
    </form>
  );
}

function UpdateAltForm({ currentAlt }: { currentAlt: string }) {
  const [state, formAction] = useActionState(
    updateTutorProfilePhotoAltAction,
    initialTutorProfilePhotoActionState,
  );
  return (
    <form action={formAction} className={styles.formStack}>
      <ActionStateNotices state={state} successTitle="Description saved" />
      <TextField
        defaultValue={currentAlt}
        description="Update the description without uploading a new file."
        error={fieldError(state, "altText")}
        label="Photo description"
        maxLength={200}
        name="alt_text"
      />
      <div className={styles.actionRow}>
        <SubmitButton label="Save description" variant="secondary" />
      </div>
    </form>
  );
}

function PublicationControls({ photo }: { photo: PhotoState }) {
  const [state, formAction] = useActionState(
    setTutorProfilePhotoPublicationAction,
    initialTutorProfilePhotoActionState,
  );

  const isPublished = photo.publicationStatus === "published";
  const action: "publish" | "hide" = isPublished ? "hide" : "publish";
  const buttonLabel = isPublished ? "Hide photo" : "Publish photo";

  return (
    <div className={styles.formStack}>
      <p className={styles.helperText}>
        {isPublished
          ? "Your photo is live on your public profile."
          : "Your photo is uploaded but not visible to students yet."}
      </p>
      <ActionStateNotices state={state} successTitle="Publication updated" />
      <div className={styles.actionRow}>
        <form action={formAction}>
          <input name="action" type="hidden" value={action} />
          <SubmitButton label={buttonLabel} />
        </form>
        <form action={formAction}>
          <input name="action" type="hidden" value="remove" />
          <SubmitButton label="Remove photo" variant="danger" />
        </form>
      </div>
    </div>
  );
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
  state: TutorProfilePhotoActionState;
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

function FileField({
  accept,
  description,
  error,
  label,
  name,
  required,
}: {
  accept: string;
  description?: string;
  error?: string;
  label: string;
  name: string;
  required?: boolean;
}) {
  const id = useId();
  const describedBy = useMemo(
    () =>
      [
        description ? `${id}-description` : null,
        error ? `${id}-error` : null,
      ]
        .filter(Boolean)
        .join(" ") || undefined,
    [description, error, id],
  );
  return (
    <div className={styles.formStack}>
      <label htmlFor={id}>
        <strong>{label}</strong>
      </label>
      {description ? (
        <p className={styles.helperText} id={`${id}-description`}>
          {description}
        </p>
      ) : null}
      <input
        accept={accept}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        id={id}
        name={name}
        required={required}
        type="file"
      />
      {error ? (
        <p className={styles.helperText} id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function fieldError(
  state: TutorProfilePhotoActionState,
  key: string,
): string | undefined {
  const list = state.fieldErrors[key];
  return list && list.length > 0 ? list[0] : undefined;
}
