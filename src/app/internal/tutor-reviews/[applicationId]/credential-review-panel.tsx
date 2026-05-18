"use client";

import { useActionState, useId, useRef, useState } from "react";

import {
  Button,
  Card,
  InlineNotice,
  Menu,
  MenuItem,
  OverflowMenuTrigger,
  Section,
  StatusBadge,
  Textarea,
  getButtonClassName,
} from "@/components/ui";
import {
  type TutorCredentialReviewStatus,
  type TutorCredentialType,
} from "@/modules/tutors/constants";
import type { TutorCredentialAdminRow } from "@/modules/tutors/media-credentials";

import { initialCredentialReviewActionState } from "./action-types";
import { runTutorCredentialReviewAction } from "./credential-review-actions";
import styles from "../tutor-reviews.module.css";

type CredentialReviewPanelProps = {
  credentials: readonly TutorCredentialAdminRow[];
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
  rejected: "Rejected",
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

export const CREDENTIAL_REVIEW_ACTIONS = [
  "approve",
  "reject",
  "request_update",
  "mark_expired",
] as const;

export type CredentialReviewActionKey =
  (typeof CREDENTIAL_REVIEW_ACTIONS)[number];

const ACTION_LABELS: Record<CredentialReviewActionKey, string> = {
  approve: "Approve",
  reject: "Reject",
  request_update: "Request update",
  mark_expired: "Mark expired",
};

const ACTION_TONES: Record<CredentialReviewActionKey, "default" | "destructive"> =
  {
    approve: "default",
    reject: "destructive",
    request_update: "default",
    mark_expired: "destructive",
  };

export function CredentialReviewPanel({ credentials }: CredentialReviewPanelProps) {
  return (
    <Section
      density="default"
      eyebrow="Credentials"
      title="Credential review"
      titleAs="h2"
    >
      {credentials.length === 0 ? (
        <InlineNotice tone="info" title="No credentials on file">
          <p>This tutor has not uploaded credential evidence yet.</p>
        </InlineNotice>
      ) : (
        <ul className={styles.historyList}>
          {credentials.map((credential) => (
            <li key={credential.id}>
              <Card>
                <CredentialRow credential={credential} />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function CredentialRow({ credential }: { credential: TutorCredentialAdminRow }) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedAction, setSelectedAction] =
    useState<CredentialReviewActionKey>("approve");
  const [state, formAction, pending] = useActionState(
    runTutorCredentialReviewAction,
    initialCredentialReviewActionState,
  );

  return (
    <div className={styles.historyEntry}>
      <div className={styles.queueRowHeader}>
        <p className={styles.queueRowTitle}>
          {credential.title}
          <span className={styles.queueRowMeta}>
            {" · "}
            {CREDENTIAL_TYPE_LABELS[credential.credentialType]}
          </span>
        </p>
        <StatusBadge tone={REVIEW_STATUS_TONES[credential.reviewStatus]}>
          {REVIEW_STATUS_LABELS[credential.reviewStatus]}
        </StatusBadge>
      </div>
      <p className={styles.historyMeta}>
        {credential.issuingBody ? (
          <>
            <span>Issuing body: {credential.issuingBody}</span>
            <span aria-hidden="true"> · </span>
          </>
        ) : null}
        {credential.downloadUrl ? (
          <a
            className={getButtonClassName({ size: "compact", variant: "ghost" })}
            href={credential.downloadUrl}
            rel="noreferrer noopener"
            target="_blank"
          >
            Open file
          </a>
        ) : (
          <span>File temporarily unavailable.</span>
        )}
      </p>

      {state.credentialId === credential.id && state.message ? (
        <InlineNotice tone="warning" title="Couldn't update this credential">
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}
      {state.credentialId === credential.id && state.successMessage ? (
        <InlineNotice tone="success" title="Credential review updated">
          <p>{state.successMessage}</p>
        </InlineNotice>
      ) : null}

      <div className={styles.filterRow}>
        <OverflowMenuTrigger
          aria-controls={menuId}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={`Choose credential action — current: ${ACTION_LABELS[selectedAction]}`}
          onClick={() => setMenuOpen((open) => !open)}
          ref={triggerRef}
        />
        <span className={styles.helperText}>
          Current action: <strong>{ACTION_LABELS[selectedAction]}</strong>
        </span>
      </div>
      <Menu
        anchorRef={triggerRef}
        contentId={menuId}
        onOpenChange={setMenuOpen}
        open={menuOpen}
      >
        {CREDENTIAL_REVIEW_ACTIONS.map((action) => (
          <MenuItem
            key={action}
            onSelect={() => {
              setSelectedAction(action);
              setMenuOpen(false);
            }}
            tone={ACTION_TONES[action]}
          >
            {ACTION_LABELS[action]}
          </MenuItem>
        ))}
      </Menu>

      <form action={formAction} className={styles.actionForm}>
        <input name="credential_id" type="hidden" value={credential.id} />
        <input name="intent" type="hidden" value={selectedAction} />
        <Textarea
          description="Reviewer-only — never shown to the tutor."
          label="Internal note"
          maxLength={2000}
          name="internal_note"
          placeholder="Optional context for other reviewers."
          rows={3}
        />
        <div className={styles.actionSubmitRow}>
          <Button
            disabled={pending}
            type="submit"
            variant={
              ACTION_TONES[selectedAction] === "destructive" ? "danger" : "primary"
            }
          >
            {pending ? "Saving…" : ACTION_LABELS[selectedAction]}
          </Button>
        </div>
      </form>
    </div>
  );
}
