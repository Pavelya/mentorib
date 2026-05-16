"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button, InlineNotice } from "@/components/ui";
import type { TutorPublicListingStatus } from "@/modules/tutors/constants";

import { initialTutorProfilePublicationActionState } from "./action-types";
import { setTutorListingPublicationAction } from "./actions";
import styles from "./profile.module.css";

type PublicationFormProps = {
  // True when at least one readiness gate is currently failing. Disables
  // publish/resume so the tutor sees the checklist instead of hitting a
  // server-side `conflict`.
  canPublish: boolean;
  publicListingStatus: TutorPublicListingStatus;
  selfPausedAt: string | null;
};

export function TutorListingPublicationForm({
  canPublish,
  publicListingStatus,
  selfPausedAt,
}: PublicationFormProps) {
  const [state, formAction] = useActionState(
    setTutorListingPublicationAction,
    initialTutorProfilePublicationActionState,
  );

  const isSelfPaused =
    publicListingStatus === "not_listed" && selfPausedAt !== null;
  const intent: "publish" | "self_pause" | "resume" =
    publicListingStatus === "listed"
      ? "self_pause"
      : isSelfPaused
        ? "resume"
        : "publish";

  const buttonLabel =
    intent === "self_pause"
      ? "Pause public listing"
      : intent === "resume"
        ? "Resume public listing"
        : "Publish public listing";

  return (
    <form action={formAction} className={styles.formStack}>
      <input name="action" type="hidden" value={intent} />
      {state.successMessage ? (
        <InlineNotice title="Listing updated" tone="success">
          <p>{state.successMessage}</p>
        </InlineNotice>
      ) : null}
      {state.message ? (
        <InlineNotice
          title={
            state.code === "conflict"
              ? "Finish the remaining steps"
              : "Could not update listing"
          }
          tone={state.code === "conflict" ? "actionNeeded" : "warning"}
        >
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}
      <div className={styles.actionRow}>
        <PublicationSubmitButton
          disabled={intent !== "self_pause" && !canPublish}
          label={buttonLabel}
        />
      </div>
    </form>
  );
}

function PublicationSubmitButton({
  disabled,
  label,
}: {
  disabled: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      aria-busy={pending}
      disabled={pending || disabled}
      type="submit"
      variant="primary"
    >
      {pending ? "Updating" : label}
    </Button>
  );
}
