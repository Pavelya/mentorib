"use client";

import { useActionState } from "react";

import { Button, InlineNotice } from "@/components/ui";

import {
  initialPolicyNoticeActionState,
  type PolicyNoticeActionState,
} from "./action-types";
import { runPolicyNoticeAction } from "./actions";
import styles from "../reference-data.module.css";

type PolicyNoticeRowFormProps = {
  id: string;
  intent: "publish" | "revoke";
};

export function PolicyNoticeRowForm({ id, intent }: PolicyNoticeRowFormProps) {
  const [state, formAction, pending] = useActionState<
    PolicyNoticeActionState,
    FormData
  >(runPolicyNoticeAction, initialPolicyNoticeActionState);

  const message =
    state.intent === intent && state.code !== "ok" ? state.message : null;
  const success =
    state.intent === intent && state.code === "ok" ? state.successMessage : null;

  return (
    <form action={formAction} className={styles.editForm}>
      <input name="id" type="hidden" value={id} />
      <input name="intent" type="hidden" value={intent} />
      {message ? (
        <InlineNotice tone="warning" title="Couldn't apply">
          <p>{message}</p>
        </InlineNotice>
      ) : null}
      {success ? (
        <InlineNotice tone="success" title="Done">
          <p>{success}</p>
        </InlineNotice>
      ) : null}
      <div className={styles.editFormFooter}>
        <Button
          disabled={pending}
          type="submit"
          variant={intent === "revoke" ? "danger" : "primary"}
        >
          {pending
            ? "Working…"
            : intent === "publish"
              ? "Publish"
              : "Revoke"}
        </Button>
      </div>
    </form>
  );
}
