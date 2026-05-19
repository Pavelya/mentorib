"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  Button,
  InlineNotice,
  StatusBadge,
  TextField,
} from "@/components/ui";
import type { TutorIntroVideoPublicationStatus } from "@/modules/tutors/constants";

import {
  initialTutorIntroVideoActionState,
  type TutorIntroVideoActionState,
} from "./action-types";
import {
  clearTutorIntroVideoAction,
  setTutorIntroVideoAction,
  setTutorIntroVideoPublicationAction,
} from "./actions";
import styles from "./video.module.css";

type EmbedReference = {
  canonicalEmbedUrl: string;
  canonicalWatchUrl: string;
  providerKey: string;
};

type IntroVideoManagerProps = {
  embed: EmbedReference | null;
  publicationStatus: TutorIntroVideoPublicationStatus;
};

const STATUS_LABELS: Record<TutorIntroVideoPublicationStatus, string> = {
  hidden: "Hidden",
  published: "Published",
};

const STATUS_TONES: Record<
  TutorIntroVideoPublicationStatus,
  "info" | "positive"
> = {
  hidden: "info",
  published: "positive",
};

export function IntroVideoManager({
  embed,
  publicationStatus,
}: IntroVideoManagerProps) {
  return (
    <div className={styles.formStack}>
      <div className={styles.statusLine}>
        <StatusBadge tone={STATUS_TONES[publicationStatus]}>
          {STATUS_LABELS[publicationStatus]}
        </StatusBadge>
      </div>

      <SetVideoForm currentUrl={embed?.canonicalWatchUrl ?? ""} />

      {embed ? (
        <div className={styles.embed}>
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={styles.embedFrame}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            src={embed.canonicalEmbedUrl}
            title="Tutor intro video preview"
          />
          <p className={styles.embedMeta}>
            Provider: {embed.providerKey}
          </p>
          <a
            className={styles.embedLink}
            href={embed.canonicalWatchUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open on {embed.providerKey} ↗
          </a>
        </div>
      ) : null}

      {embed ? (
        <PublicationControls publicationStatus={publicationStatus} />
      ) : null}

      {embed ? <ClearVideoForm /> : null}
    </div>
  );
}

function SetVideoForm({ currentUrl }: { currentUrl: string }) {
  const [state, formAction] = useActionState(
    setTutorIntroVideoAction,
    initialTutorIntroVideoActionState,
  );
  return (
    <form action={formAction} className={styles.formStack}>
      <ActionStateNotices state={state} successTitle="Video link saved" />
      <TextField
        defaultValue={currentUrl}
        description="Paste the full YouTube, Vimeo, or Loom URL — not embed code."
        error={fieldError(state, "providerUrl")}
        inputMode="url"
        label="Video URL"
        name="provider_url"
        placeholder="https://"
        required
        type="url"
      />
      <div className={styles.actionRow}>
        <SubmitButton label="Save video link" />
      </div>
    </form>
  );
}

function PublicationControls({
  publicationStatus,
}: {
  publicationStatus: TutorIntroVideoPublicationStatus;
}) {
  const [state, formAction] = useActionState(
    setTutorIntroVideoPublicationAction,
    initialTutorIntroVideoActionState,
  );
  const isPublished = publicationStatus === "published";
  const action: "publish" | "hide" = isPublished ? "hide" : "publish";
  const buttonLabel = isPublished ? "Hide intro video" : "Publish intro video";

  return (
    <div className={styles.formStack}>
      <p className={styles.helperText}>
        {isPublished
          ? "Your intro video is live on your public profile."
          : "Your intro video is saved but not visible to students yet."}
      </p>
      <ActionStateNotices state={state} successTitle="Publication updated" />
      <form action={formAction} className={styles.actionRow}>
        <input name="action" type="hidden" value={action} />
        <SubmitButton label={buttonLabel} />
      </form>
    </div>
  );
}

function ClearVideoForm() {
  const [state, formAction] = useActionState(
    clearTutorIntroVideoAction,
    initialTutorIntroVideoActionState,
  );
  return (
    <form action={formAction} className={styles.formStack}>
      <p className={styles.helperText}>
        Remove the video link entirely. We&apos;ll also hide it from your public
        profile.
      </p>
      <ActionStateNotices state={state} successTitle="Video link removed" />
      <div className={styles.actionRow}>
        <SubmitButton label="Remove video link" variant="danger" />
      </div>
    </form>
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
  state: TutorIntroVideoActionState;
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
              ? "Please review the video link"
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
  state: TutorIntroVideoActionState,
  key: string,
): string | undefined {
  const list = state.fieldErrors[key];
  return list && list.length > 0 ? list[0] : undefined;
}
