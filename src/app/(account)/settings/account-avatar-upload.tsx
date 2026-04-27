"use client";

import {
  useActionState,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";

import { Avatar, Button, InlineNotice } from "@/components/ui";
import {
  ACCOUNT_AVATAR_ACCEPT_ATTRIBUTE,
  ACCOUNT_AVATAR_ALLOWED_MIME_TYPES,
  ACCOUNT_AVATAR_FILE_TYPE_DESCRIPTION,
  ACCOUNT_AVATAR_MAX_BYTES,
  ACCOUNT_AVATAR_MAX_BYTES_DESCRIPTION,
  ACCOUNT_AVATAR_MIN_DIMENSION,
} from "@/modules/accounts/avatar";

import {
  updateAccountAvatarAction,
  type AccountAvatarActionState,
} from "./actions";
import styles from "../account-surfaces.module.css";

const emptyAccountAvatarActionState: AccountAvatarActionState = {
  avatarUrl: null,
  code: null,
  message: null,
};

type AccountAvatarUploadProps = {
  avatarName: string;
  initialAvatarUrl: string | null;
};

export function AccountAvatarUpload({
  avatarName,
  initialAvatarUrl,
}: AccountAvatarUploadProps) {
  const [serverState, formAction, isActionPending] = useActionState(
    updateAccountAvatarAction,
    {
      ...emptyAccountAvatarActionState,
      avatarUrl: initialAvatarUrl,
    },
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayedAvatarUrl =
    serverState.code === "success" ? serverState.avatarUrl : initialAvatarUrl;
  const hasAvatar = Boolean(displayedAvatarUrl);
  const noticeMessage = clientError ?? serverState.message;
  const noticeTone =
    clientError || (serverState.code && serverState.code !== "success")
      ? "actionNeeded"
      : "success";

  function dispatchFormData(formData: FormData) {
    startTransition(() => {
      formAction(formData);
    });
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setClientError(null);

    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const validationError = validateClientAvatarFile(file);

    if (validationError) {
      setClientError(validationError);
      return;
    }

    try {
      await ensureMinimumImageDimensions(file);
    } catch (dimensionError) {
      setClientError(
        dimensionError instanceof AvatarDimensionError
          ? dimensionError.message
          : "We couldn't read that image. Try a different file.",
      );
      return;
    }

    const formData = new FormData();
    formData.set("avatar", file);
    dispatchFormData(formData);
  }

  function handleRemoveClick() {
    setClientError(null);
    const formData = new FormData();
    formData.set("intent", "remove");
    dispatchFormData(formData);
  }

  function handleUploadClick() {
    setClientError(null);
    fileInputRef.current?.click();
  }

  return (
    <div className={styles.avatarUpload}>
      <div className={styles.avatarUploadRow}>
        <Avatar
          className={styles.profileAvatar}
          name={avatarName.trim() || "Account owner"}
          size="lg"
          src={displayedAvatarUrl ?? undefined}
        />
        <input
          accept={ACCOUNT_AVATAR_ACCEPT_ATTRIBUTE}
          aria-hidden="true"
          className={styles.srOnly}
          onChange={handleFileChange}
          ref={fileInputRef}
          tabIndex={-1}
          type="file"
        />
        <div className={styles.avatarUploadActions}>
          <Button
            disabled={isActionPending}
            onClick={handleUploadClick}
            size="compact"
            type="button"
            variant="secondary"
          >
            {isActionPending
              ? "Updating"
              : hasAvatar
                ? "Replace"
                : "Upload photo"}
          </Button>
          {hasAvatar ? (
            <Button
              disabled={isActionPending}
              onClick={handleRemoveClick}
              size="compact"
              type="button"
              variant="ghost"
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      <p className={styles.sectionNote}>
        {ACCOUNT_AVATAR_FILE_TYPE_DESCRIPTION} · up to{" "}
        {ACCOUNT_AVATAR_MAX_BYTES_DESCRIPTION} · at least{" "}
        {ACCOUNT_AVATAR_MIN_DIMENSION}×{ACCOUNT_AVATAR_MIN_DIMENSION} px
      </p>
      {noticeMessage ? (
        <InlineNotice showToneLabel={false} tone={noticeTone}>
          <p>{noticeMessage}</p>
        </InlineNotice>
      ) : null}
    </div>
  );
}

function validateClientAvatarFile(file: File): string | null {
  if (
    !ACCOUNT_AVATAR_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof ACCOUNT_AVATAR_ALLOWED_MIME_TYPES)[number],
    )
  ) {
    return `Use a ${ACCOUNT_AVATAR_FILE_TYPE_DESCRIPTION} image for your profile photo.`;
  }

  if (file.size > ACCOUNT_AVATAR_MAX_BYTES) {
    return `Choose an image under ${ACCOUNT_AVATAR_MAX_BYTES_DESCRIPTION}.`;
  }

  return null;
}

class AvatarDimensionError extends Error {}

function ensureMinimumImageDimensions(file: File) {
  return new Promise<void>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      if (
        image.naturalWidth < ACCOUNT_AVATAR_MIN_DIMENSION ||
        image.naturalHeight < ACCOUNT_AVATAR_MIN_DIMENSION
      ) {
        reject(
          new AvatarDimensionError(
            `Choose an image at least ${ACCOUNT_AVATAR_MIN_DIMENSION}×${ACCOUNT_AVATAR_MIN_DIMENSION} pixels.`,
          ),
        );
        return;
      }

      resolve();
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new AvatarDimensionError(
          "We couldn't read that image. Try a different file.",
        ),
      );
    };

    image.src = objectUrl;
  });
}
