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
  ModerationCaseResolutionKind,
  ModerationCaseStatus,
} from "@/modules/admin/constants";

import {
  initialCaseActionState,
  runCaseAction,
  type CaseActionState,
} from "./actions";
import styles from "../moderation.module.css";

type CaseActionKey = "claim" | "resolve" | "dismiss";

const ACTION_LABELS: Record<CaseActionKey, string> = {
  claim: "Claim for review",
  dismiss: "Dismiss",
  resolve: "Resolve",
};

const RESOLUTION_LABELS: Record<ModerationCaseResolutionKind, string> = {
  dismiss: "Dismiss (no action)",
  escalated_to_legal: "Escalate to legal",
  no_action: "No action",
  reject: "Reject (no violation found)",
  split: "Split outcome",
  uphold: "Uphold (action taken)",
};

const REPORT_RESOLUTION_KINDS: ModerationCaseResolutionKind[] = [
  "uphold",
  "reject",
  "no_action",
  "escalated_to_legal",
];

const TAKEDOWN_RESOLUTION_KINDS: ModerationCaseResolutionKind[] = [
  "uphold",
  "reject",
  "no_action",
];

const BLOCK_RESOLUTION_KINDS: ModerationCaseResolutionKind[] = [
  "no_action",
  "uphold",
];

type Props = {
  caseId: string;
  caseKind:
    | "report"
    | "block"
    | "public_content_takedown"
    | "lesson_issue"
    | "finance_intervention";
  caseStatus: ModerationCaseStatus;
};

export function CaseActionsPanel({ caseId, caseKind, caseStatus }: Props) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuLabelId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    CaseActionState,
    FormData
  >(runCaseAction, initialCaseActionState);

  const availableActions = pickAvailableActions(caseStatus);
  const defaultAction = availableActions[0] ?? ("claim" as CaseActionKey);
  const [activeAction, setActiveAction] = useState<CaseActionKey>(defaultAction);

  if (availableActions.length === 0) {
    return (
      <Panel eyebrow="Decisions" tone="mist" title="No further actions">
        <p className={styles.helperText}>
          This case is in a terminal state. Open a new case if a fresh report
          is needed.
        </p>
      </Panel>
    );
  }

  const resolutionKinds =
    activeAction === "resolve" ? resolutionKindsForCase(caseKind) : null;

  return (
    <Panel eyebrow="Decisions" tone="raised" title="Apply a decision">
      <div className={styles.actionPanel}>
        <div className={styles.filterRow}>
          <OverflowMenuTrigger
            aria-controls={menuLabelId}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`Choose moderation action — current: ${ACTION_LABELS[activeAction]}`}
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
                setActiveAction(action);
                setMenuOpen(false);
              }}
              tone={action === "dismiss" ? "destructive" : "default"}
            >
              {ACTION_LABELS[action]}
            </MenuItem>
          ))}
        </Menu>

        {state.message ? (
          <InlineNotice tone="warning" title="Couldn't apply this action">
            <p>{state.message}</p>
          </InlineNotice>
        ) : null}
        {state.successMessage ? (
          <InlineNotice tone="success" title="Action recorded">
            <p>{state.successMessage}</p>
          </InlineNotice>
        ) : null}

        <form action={formAction} className={styles.actionForm}>
          <input name="case_id" type="hidden" value={caseId} />
          <input name="intent" type="hidden" value={activeAction} />

          {activeAction === "resolve" && resolutionKinds ? (
            <label className={styles.actionForm}>
              <span className={styles.helperText}>Resolution kind</span>
              <select
                defaultValue={resolutionKinds[0]}
                name="resolution_kind"
                required
              >
                {resolutionKinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {RESOLUTION_LABELS[kind]}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {activeAction === "resolve" ? (
            <Textarea
              description="Admin-only summary appended to the case; never user-visible."
              label="Internal summary"
              maxLength={2000}
              name="internal_summary"
              placeholder="Briefly summarize the outcome for future reviewers."
              rows={3}
            />
          ) : null}

          {activeAction === "dismiss" ? (
            <Textarea
              description="Admin-only reason recorded with the audit row."
              label="Reason"
              maxLength={2000}
              name="reason"
              placeholder="Why is this case being dismissed?"
              required
              rows={3}
            />
          ) : null}

          {activeAction === "resolve" ? (
            <Textarea
              description="Optional admin-only reason recorded with the audit row."
              label="Audit reason"
              maxLength={2000}
              name="reason"
              placeholder="Optional context for the audit log."
              rows={2}
            />
          ) : null}

          <div className={styles.actionSubmitRow}>
            <Button
              disabled={pending}
              type="submit"
              variant={activeAction === "dismiss" ? "danger" : "primary"}
            >
              {pending ? "Saving…" : ACTION_LABELS[activeAction]}
            </Button>
          </div>
        </form>
      </div>
    </Panel>
  );
}

export function AddCaseNoteForm({ caseId }: { caseId: string }) {
  const [state, formAction, pending] = useActionState<
    CaseActionState,
    FormData
  >(runCaseAction, initialCaseActionState);
  return (
    <div className={styles.actionForm}>
      {state.message ? (
        <InlineNotice tone="warning" title="Couldn't save that note">
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}
      {state.code === "ok" && state.intent === "add_note" ? (
        <InlineNotice tone="success" title="Note added">
          <p>{state.successMessage}</p>
        </InlineNotice>
      ) : null}
      <form action={formAction} className={styles.actionForm}>
        <input name="case_id" type="hidden" value={caseId} />
        <input name="intent" type="hidden" value="add_note" />
        <Textarea
          description="Admin-only — never visible outside this case."
          label="Internal note"
          maxLength={2000}
          name="body"
          placeholder="Share context for the next reviewer."
          required
          rows={3}
        />
        <div className={styles.actionSubmitRow}>
          <Button disabled={pending} type="submit" variant="secondary">
            {pending ? "Saving…" : "Add note"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function pickAvailableActions(
  status: ModerationCaseStatus,
): readonly CaseActionKey[] {
  switch (status) {
    case "queued":
      return ["claim", "dismiss"] as const;
    case "under_review":
      return ["resolve", "dismiss"] as const;
    case "resolved":
    case "dismissed":
    case "escalated":
    default:
      return [] as const;
  }
}

function resolutionKindsForCase(
  caseKind: Props["caseKind"],
): readonly ModerationCaseResolutionKind[] {
  if (caseKind === "report") {
    return REPORT_RESOLUTION_KINDS;
  }
  if (caseKind === "public_content_takedown") {
    return TAKEDOWN_RESOLUTION_KINDS;
  }
  if (caseKind === "block") {
    return BLOCK_RESOLUTION_KINDS;
  }
  return [
    "uphold",
    "reject",
    "split",
    "no_action",
    "escalated_to_legal",
  ] as const;
}
