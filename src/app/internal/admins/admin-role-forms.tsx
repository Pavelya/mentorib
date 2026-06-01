"use client";

import { useActionState, useState } from "react";

import { Button, ConfirmDialog, InlineNotice, Textarea } from "@/components/ui";

import {
  initialAdminDirectoryActionState,
  runAdminDirectoryAction,
  type AdminDirectoryActionState,
} from "./actions";
import styles from "./admins.module.css";

export function GrantAdminForm({
  targetAppUserId,
  disabled,
}: {
  targetAppUserId: string;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    AdminDirectoryActionState,
    FormData
  >(runAdminDirectoryAction, initialAdminDirectoryActionState);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<(() => void) | null>(null);

  if (disabled) {
    return (
      <InlineNotice tone="info" title="Already an admin">
        <p>This account already holds an active admin role.</p>
      </InlineNotice>
    );
  }

  return (
    <div className={styles.actionForm}>
      <ActionFeedback intent="grant_admin_role" state={state} />
      <form
        action={formAction}
        className={styles.actionForm}
        onSubmit={(event) => {
          if (!pendingSubmit) {
            event.preventDefault();
            const form = event.currentTarget;
            setPendingSubmit(() => () => form.requestSubmit());
            setConfirmOpen(true);
          }
        }}
      >
        <input name="intent" type="hidden" value="grant_admin_role" />
        <input name="target_app_user_id" type="hidden" value={targetAppUserId} />
        <Textarea
          description="Admin-only audit reason."
          label="Grant — reason"
          maxLength={2000}
          name="reason"
          placeholder="Why are you granting admin access?"
          required
          rows={2}
        />
        <Button disabled={pending} type="submit" variant="primary">
          {pending ? "Saving…" : "Promote to admin"}
        </Button>
      </form>
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Grant admin access"
        confirmVariant="primary"
        description={
          <p>
            This grants the account full admin access immediately. Confirm only
            if you are sure.
          </p>
        }
        onCancel={() => {
          setConfirmOpen(false);
          setPendingSubmit(null);
        }}
        onConfirm={() => {
          setConfirmOpen(false);
          if (pendingSubmit) {
            const submit = pendingSubmit;
            setPendingSubmit(null);
            submit();
          }
        }}
        open={confirmOpen}
        title="Grant admin access?"
      />
    </div>
  );
}

export function RevokeAdminForm({
  targetAppUserId,
  actorIsSelf,
}: {
  targetAppUserId: string;
  actorIsSelf: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    AdminDirectoryActionState,
    FormData
  >(runAdminDirectoryAction, initialAdminDirectoryActionState);

  if (actorIsSelf) {
    return (
      <InlineNotice tone="info" title="Self-revoke is blocked">
        <p>
          You can&apos;t revoke your own admin role here. Use the grant-admin
          script for emergency lockout recovery.
        </p>
      </InlineNotice>
    );
  }

  return (
    <div className={styles.actionForm}>
      <ActionFeedback intent="revoke_admin_role" state={state} />
      <form action={formAction} className={styles.actionForm}>
        <input name="intent" type="hidden" value="revoke_admin_role" />
        <input name="target_app_user_id" type="hidden" value={targetAppUserId} />
        <Textarea
          description="Admin-only audit reason."
          label="Revoke — reason"
          maxLength={2000}
          name="reason"
          placeholder="Why are you revoking admin access?"
          required
          rows={2}
        />
        <Button disabled={pending} type="submit" variant="danger">
          {pending ? "Saving…" : "Revoke admin access"}
        </Button>
      </form>
    </div>
  );
}

function ActionFeedback({
  intent,
  state,
}: {
  intent: AdminDirectoryActionState["intent"];
  state: AdminDirectoryActionState;
}) {
  if (state.intent !== intent) {
    return null;
  }
  if (state.message) {
    return (
      <InlineNotice tone="warning" title="Couldn't apply that action">
        <p>{state.message}</p>
      </InlineNotice>
    );
  }
  if (state.successMessage) {
    return (
      <InlineNotice tone="success" title="Action recorded">
        <p>{state.successMessage}</p>
      </InlineNotice>
    );
  }
  return null;
}
