"use client";

import { useActionState, useId, useRef, useState } from "react";

import {
  Button,
  InlineNotice,
  Menu,
  MenuItem,
  OverflowMenuTrigger,
  Panel,
  Textarea,
} from "@/components/ui";


import type {
  TutorApplicationReviewActionKey,
} from "@/modules/tutors/application-review";

import { initialReviewActionState } from "./action-types";
import { runTutorApplicationReviewAction } from "./actions";
import styles from "../tutor-reviews.module.css";

type ReviewActionsPanelProps = {
  applicationId: string;
  availableActions: readonly TutorApplicationReviewActionKey[];
};

const ACTION_LABELS: Record<TutorApplicationReviewActionKey, string> = {
  claim: "Claim for review",
  approve: "Approve",
  request_changes: "Request changes",
  reject: "Reject",
};

const ACTION_DESCRIPTIONS: Record<TutorApplicationReviewActionKey, string> = {
  claim:
    "Move this application out of the queue and into your in-review list.",
  approve:
    "Approve the application and activate the tutor role. The applicant is notified.",
  request_changes:
    "Send the applicant a note describing what to update. They can resubmit afterwards.",
  reject:
    "Decline the application with a short note. The applicant is notified.",
};

export function ReviewActionsPanel({
  applicationId,
  availableActions,
}: ReviewActionsPanelProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuLabelId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedAction, setSelectedAction] =
    useState<TutorApplicationReviewActionKey | null>(null);
  const [state, formAction, pending] = useActionState(
    runTutorApplicationReviewAction,
    initialReviewActionState,
  );

  if (availableActions.length === 0) {
    return (
      <Panel eyebrow="Decisions" tone="mist" title="No further actions">
        <p className={styles.helperText}>
          This application is in a terminal state. New decisions need a fresh
          applicant submission.
        </p>
      </Panel>
    );
  }

  const activeAction = selectedAction ?? availableActions[0];
  const requiresNote =
    activeAction === "request_changes" || activeAction === "reject";

  return (
    <Panel eyebrow="Decisions" tone="raised" title="Apply a decision">
      <div className={styles.actionPanel}>
        <div className={styles.filterRow}>
          <OverflowMenuTrigger
            aria-controls={menuLabelId}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`Choose review action — current: ${ACTION_LABELS[activeAction]}`}
            onClick={() => setMenuOpen((open) => !open)}
            ref={triggerRef}
          />
          <span className={styles.helperText}>
            Current action: <strong>{ACTION_LABELS[activeAction]}</strong>
          </span>
        </div>
        <Menu
          anchorRef={triggerRef}
          contentId={menuLabelId}
          onOpenChange={setMenuOpen}
          open={menuOpen}
        >
          {availableActions.map((action) => (
            <MenuItem
              key={action}
              onSelect={() => {
                setSelectedAction(action);
                setMenuOpen(false);
              }}
              tone={action === "reject" ? "destructive" : "default"}
            >
              {ACTION_LABELS[action]}
            </MenuItem>
          ))}
        </Menu>
        <p className={styles.helperText}>{ACTION_DESCRIPTIONS[activeAction]}</p>

        {state.message ? (
          <InlineNotice tone="warning" title="Couldn't apply this decision">
            <p>{state.message}</p>
          </InlineNotice>
        ) : null}
        {state.successMessage ? (
          <InlineNotice tone="success" title="Decision recorded">
            <p>{state.successMessage}</p>
          </InlineNotice>
        ) : null}

        <form action={formAction} className={styles.actionForm}>
          <input name="application_id" type="hidden" value={applicationId} />
          <input name="intent" type="hidden" value={activeAction} />
          {requiresNote ? (
            <Textarea
              description="Shared with the applicant alongside the decision."
              label="Reviewer note"
              maxLength={2000}
              name="reviewer_note"
              placeholder={
                activeAction === "request_changes"
                  ? "What does the applicant need to update?"
                  : "Briefly explain the outcome."
              }
              required
              rows={4}
            />
          ) : null}
          <Textarea
            description="Reviewer-only — never shown to the applicant."
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
              variant={activeAction === "reject" ? "danger" : "primary"}
            >
              {pending ? "Saving…" : ACTION_LABELS[activeAction]}
            </Button>
          </div>
        </form>
      </div>
    </Panel>
  );
}
