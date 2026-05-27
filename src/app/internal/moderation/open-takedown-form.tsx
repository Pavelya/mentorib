"use client";

import { useActionState } from "react";

import {
  Button,
  InlineNotice,
  Panel,
  TextField,
  Textarea,
} from "@/components/ui";

import {
  initialOpenTakedownActionState,
  openPublicTakedownCaseAction,
} from "./actions";
import styles from "./moderation.module.css";

export function OpenTakedownForm() {
  const [state, formAction, pending] = useActionState(
    openPublicTakedownCaseAction,
    initialOpenTakedownActionState,
  );

  return (
    <Panel
      eyebrow="Public takedown"
      tone="raised"
      title="Open a takedown case"
    >
      <div className={styles.actionPanel}>
        <p className={styles.helperText}>
          Paste the tutor profile id and share the reason. Resolving the case
          with &ldquo;uphold&rdquo; will delist the public profile, remove it
          from search, and notify the tutor.
        </p>

        {state.message ? (
          <InlineNotice tone="warning" title="Couldn't open this case">
            <p>{state.message}</p>
          </InlineNotice>
        ) : null}
        {state.code === "ok" && state.successCaseId ? (
          <InlineNotice tone="success" title="Takedown case opened">
            <p>
              Case {state.successCaseId.slice(0, 8)} is now queued for review.
            </p>
          </InlineNotice>
        ) : null}

        <form action={formAction} className={styles.actionForm}>
          <TextField
            description="The uuid of the tutor profile whose public listing should be reviewed."
            label="Tutor profile id"
            name="tutor_profile_id"
            placeholder="00000000-0000-0000-0000-000000000000"
            required
          />
          <Textarea
            description="Admin-only summary — never shown to the tutor."
            label="Reason"
            maxLength={2000}
            name="reason"
            placeholder="Briefly explain why this profile should be reviewed."
            required
            rows={3}
          />
          <div className={styles.actionSubmitRow}>
            <Button disabled={pending} type="submit" variant="primary">
              {pending ? "Opening…" : "Open takedown case"}
            </Button>
          </div>
        </form>
      </div>
    </Panel>
  );
}
