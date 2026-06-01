"use client";

import { useActionState } from "react";

import {
  Button,
  InlineNotice,
  SelectField,
  Textarea,
} from "@/components/ui";
import {
  SUPPORT_TICKET_STATUSES,
  type SupportTicketStatus,
} from "@/modules/admin/constants";
import { SUPPORT_TICKET_STATUS_LABELS } from "@/modules/admin/labels";

import { initialSupportActionState, type SupportActionState } from "./action-state";
import {
  runAssignToMeAction,
  runReplyAction,
  runSetStatusAction,
} from "./actions";
import styles from "./support.module.css";

type SupportTicketActionsProps = {
  ticketId: string;
  currentStatus: SupportTicketStatus;
  isAssignedToViewer: boolean;
};

function ActionNotice({ state }: { state: SupportActionState }) {
  if (state.code === "ok" && state.successMessage) {
    return (
      <InlineNotice tone="success" title="Done">
        <p>{state.successMessage}</p>
      </InlineNotice>
    );
  }
  if (state.message) {
    return (
      <InlineNotice tone="warning" title="That didn't work">
        <p>{state.message}</p>
      </InlineNotice>
    );
  }
  return null;
}

export function SupportTicketActions({
  currentStatus,
  isAssignedToViewer,
  ticketId,
}: SupportTicketActionsProps) {
  const [replyState, replyAction, replyPending] = useActionState<
    SupportActionState,
    FormData
  >(runReplyAction, initialSupportActionState);
  const [statusState, statusAction, statusPending] = useActionState<
    SupportActionState,
    FormData
  >(runSetStatusAction, initialSupportActionState);
  const [assignState, assignAction, assignPending] = useActionState<
    SupportActionState,
    FormData
  >(runAssignToMeAction, initialSupportActionState);

  return (
    <div className={styles.actionsPanel}>
      <form action={replyAction} className={styles.actionForm}>
        <input name="ticket_id" type="hidden" value={ticketId} />
        <ActionNotice state={replyState} />
        <Textarea
          description="Sent to the requester by email and recorded in the audit log."
          label="Reply"
          maxLength={5000}
          name="body"
          placeholder="Write your reply to the requester."
          required
          rows={5}
        />
        <div className={styles.actionSubmitRow}>
          <Button disabled={replyPending} type="submit">
            {replyPending ? "Sending…" : "Send reply"}
          </Button>
        </div>
      </form>

      <form action={statusAction} className={styles.actionForm}>
        <input name="ticket_id" type="hidden" value={ticketId} />
        <ActionNotice state={statusState} />
        <SelectField defaultValue={currentStatus} label="Status" name="status">
          {SUPPORT_TICKET_STATUSES.map((value) => (
            <option key={value} value={value}>
              {SUPPORT_TICKET_STATUS_LABELS[value]}
            </option>
          ))}
        </SelectField>
        <div className={styles.actionSubmitRow}>
          <Button disabled={statusPending} type="submit" variant="secondary">
            {statusPending ? "Saving…" : "Update status"}
          </Button>
        </div>
      </form>

      {isAssignedToViewer ? null : (
        <form action={assignAction} className={styles.actionForm}>
          <input name="ticket_id" type="hidden" value={ticketId} />
          <ActionNotice state={assignState} />
          <div className={styles.actionSubmitRow}>
            <Button disabled={assignPending} type="submit" variant="ghost">
              {assignPending ? "Assigning…" : "Assign to me"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
