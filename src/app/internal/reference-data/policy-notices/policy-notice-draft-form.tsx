"use client";

import { useActionState } from "react";

import {
  Button,
  InlineNotice,
  Panel,
  SelectField,
  TextField,
  Textarea,
} from "@/components/ui";

import {
  initialPolicyNoticeActionState,
  type PolicyNoticeActionState,
} from "./action-types";
import { runPolicyNoticeAction } from "./actions";
import styles from "../reference-data.module.css";

export function PolicyNoticeDraftForm() {
  const [state, formAction, pending] = useActionState<
    PolicyNoticeActionState,
    FormData
  >(runPolicyNoticeAction, initialPolicyNoticeActionState);

  const error = state.intent === "draft" ? state.message : null;
  const success = state.intent === "draft" ? state.successMessage : null;

  return (
    <Panel eyebrow="Draft" tone="raised" title="Draft a new notice version">
      <form action={formAction} className={styles.editForm}>
        <input name="intent" type="hidden" value="draft" />
        <div className={styles.editFormRow}>
          <SelectField defaultValue="privacy" label="Notice type" name="notice_type">
            <option value="terms">Terms</option>
            <option value="privacy">Privacy</option>
          </SelectField>
          <TextField
            label="Version label"
            maxLength={60}
            name="version_label"
            placeholder="2026-Q3"
            required
          />
        </div>
        <TextField
          label="Title"
          maxLength={120}
          name="title"
          placeholder="Privacy policy update — Q3 2026"
          required
        />
        <Textarea
          description="Plain text shown alongside the link to the canonical published document."
          label="Summary"
          maxLength={2000}
          name="summary"
          placeholder="What changed and what users should review."
          required
          rows={4}
        />
        <TextField
          description="Public URL of the canonical published doc (must start with https://)."
          label="Document URL"
          maxLength={1000}
          name="document_url"
          placeholder="https://mentorib.com/legal/privacy/2026-q3"
          required
          type="url"
        />
        <div className={styles.editFormRow}>
          <TextField
            description="When the notice takes effect (local time, stored as UTC)."
            label="Effective at"
            name="effective_at"
            type="datetime-local"
          />
          <label className={styles.activeToggle}>
            <input
              name="requires_acknowledgement"
              type="checkbox"
            />
            <span>Requires acknowledgement</span>
          </label>
        </div>

        {error ? (
          <InlineNotice tone="warning" title="Couldn't save draft">
            <p>{error}</p>
          </InlineNotice>
        ) : null}
        {success ? (
          <InlineNotice tone="success" title="Draft saved">
            <p>{success}</p>
          </InlineNotice>
        ) : null}

        <div className={styles.editFormFooter}>
          <Button disabled={pending} type="submit" variant="primary">
            {pending ? "Saving…" : "Save draft"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
