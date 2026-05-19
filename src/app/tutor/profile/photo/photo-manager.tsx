"use client";

import {
  useActionState,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";

import {
  Avatar,
  Button,
  InlineNotice,
  Section,
  StatusBadge,
} from "@/components/ui";
import type { TutorPublicMediaPublicationStatus } from "@/modules/tutors/constants";

import {
  initialTutorProfilePhotoActionState,
  type TutorProfilePhotoActionState,
} from "./action-types";
import {
  setTutorProfilePhotoPublicationAction,
  uploadTutorProfilePhotoAction,
  applyAccountAvatarAsTutorPhotoAction,
} from "./actions";
import styles from "./photo.module.css";

const ACCEPT_ATTRIBUTE = "image/jpeg,image/png,image/webp";
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_BYTES_DESCRIPTION = "5 MB";
const FILE_TYPE_DESCRIPTION = "JPEG, PNG, or WebP";

type PhotoState = {
  altText: string | null;
  publicationStatus: TutorPublicMediaPublicationStatus;
  publicUrl: string;
};

type ProfilePhotoManagerProps = {
  accountAvatarUrl: string | null;
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
  accountAvatarUrl,
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
        <PhotoUploadRow
          accountAvatarUrl={accountAvatarUrl}
          displayName={displayName}
          photo={photo}
        />
      </Section>

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

function PhotoUploadRow({
  accountAvatarUrl,
  displayName,
  photo,
}: ProfilePhotoManagerProps) {
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadTutorProfilePhotoAction,
    initialTutorProfilePhotoActionState,
  );
  const [applyAvatarState, applyAvatarAction, applyAvatarPending] = useActionState(
    applyAccountAvatarAsTutorPhotoAction,
    initialTutorProfilePhotoActionState,
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPending = uploadPending || applyAvatarPending;

  const previewUrl = photo?.publicUrl ?? accountAvatarUrl ?? undefined;
  const previewAlt = photo?.altText?.trim()
    ? photo.altText
    : `${displayName} profile photo`;

  const serverState =
    applyAvatarState.code === "ok" || applyAvatarState.message
      ? applyAvatarState
      : uploadState;
  const noticeMessage = clientError ?? serverState.message;
  const noticeTone: "actionNeeded" | "warning" | "success" = clientError
    ? "actionNeeded"
    : serverState.code === "ok"
      ? "success"
      : serverState.code === "validation_failed"
        ? "actionNeeded"
        : "warning";
  const successMessage =
    !clientError && serverState.code === "ok"
      ? serverState.successMessage
      : null;

  function handleUploadClick() {
    setClientError(null);
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    const validationError = validateClientPhoto(file);
    if (validationError) {
      setClientError(validationError);
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    startTransition(() => {
      uploadAction(formData);
    });
  }

  function handleUseAccountAvatar() {
    setClientError(null);
    const formData = new FormData();
    startTransition(() => {
      applyAvatarAction(formData);
    });
  }

  return (
    <div className={styles.uploadBlock}>
      <div className={styles.uploadRow}>
        <Avatar
          alt={previewAlt}
          className={styles.previewAvatar}
          name={displayName}
          size="lg"
          src={previewUrl}
        />
        <input
          accept={ACCEPT_ATTRIBUTE}
          aria-hidden="true"
          className={styles.srOnly}
          onChange={handleFileChange}
          ref={fileInputRef}
          tabIndex={-1}
          type="file"
        />
        <div className={styles.uploadActions}>
          <Button
            disabled={isPending}
            onClick={handleUploadClick}
            size="compact"
            type="button"
            variant="secondary"
          >
            {uploadPending
              ? "Uploading"
              : photo
                ? "Replace photo"
                : "Upload photo"}
          </Button>
          {!photo && accountAvatarUrl ? (
            <Button
              disabled={isPending}
              onClick={handleUseAccountAvatar}
              size="compact"
              type="button"
              variant="ghost"
            >
              {applyAvatarPending ? "Copying" : "Use my account avatar"}
            </Button>
          ) : null}
        </div>
      </div>
      <p className={styles.helperText}>
        {FILE_TYPE_DESCRIPTION} · up to {MAX_BYTES_DESCRIPTION}
        {!photo && accountAvatarUrl
          ? ' · or copy the avatar from your account settings with "Use my account avatar".'
          : ""}
      </p>
      {photo ? (
        <div className={styles.statusLine}>
          <StatusBadge tone={STATUS_TONES[photo.publicationStatus]}>
            {STATUS_LABELS[photo.publicationStatus]}
          </StatusBadge>
        </div>
      ) : null}
      {successMessage ? (
        <InlineNotice showToneLabel={false} tone="success">
          <p>{successMessage}</p>
        </InlineNotice>
      ) : null}
      {noticeMessage && !successMessage ? (
        <InlineNotice showToneLabel={false} tone={noticeTone}>
          <p>{noticeMessage}</p>
        </InlineNotice>
      ) : null}
    </div>
  );
}

function PublicationControls({ photo }: { photo: PhotoState }) {
  const [state, formAction, pending] = useActionState(
    setTutorProfilePhotoPublicationAction,
    initialTutorProfilePhotoActionState,
  );
  const isPublished = photo.publicationStatus === "published";
  const toggleAction: "publish" | "hide" = isPublished ? "hide" : "publish";
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
          <input name="action" type="hidden" value={toggleAction} />
          <Button
            aria-busy={pending}
            disabled={pending}
            type="submit"
            variant="primary"
          >
            {pending ? "Saving" : buttonLabel}
          </Button>
        </form>
        <form action={formAction}>
          <input name="action" type="hidden" value="remove" />
          <Button
            aria-busy={pending}
            disabled={pending}
            type="submit"
            variant="danger"
          >
            {pending ? "Saving" : "Remove photo"}
          </Button>
        </form>
      </div>
    </div>
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

function validateClientPhoto(file: File): string | null {
  if (
    !ALLOWED_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_MIME_TYPES)[number],
    )
  ) {
    return `Use a ${FILE_TYPE_DESCRIPTION} image for your profile photo.`;
  }
  if (file.size > MAX_BYTES) {
    return `Choose an image under ${MAX_BYTES_DESCRIPTION}.`;
  }
  return null;
}
