"use client";

import { useActionState, useId, useState } from "react";

import {
  Button,
  ConfirmDialog,
  InlineNotice,
  Panel,
  SelectField,
  Textarea,
  TextField,
} from "@/components/ui";

import { FINANCE_INTERVENTION_KIND_LABELS } from "@/modules/admin/labels";

import {
  initialUserDetailActionState,
  runUserDetailAction,
  type UserDetailActionState,
} from "./actions";
import styles from "./user-detail.module.css";

type TutorListingState = "listed" | "paused" | "delisted" | "not_listed" | "eligible";

type Props = {
  targetAppUserId: string;
  tutorProfileId: string | null;
  currentListingStatus: TutorListingState | null;
  currentAccountStatus: "active" | "limited" | "suspended" | "closed";
  currentDisplayName: string | null;
  hasActiveAdminRole: boolean;
  actorIsSelf: boolean;
};

const ACCOUNT_STATUS_LABELS = {
  active: "Active",
  limited: "Limited",
  suspended: "Suspended",
} as const;

export function UserDetailActionForms(props: Props) {
  return (
    <div className={styles.actionStack}>
      <IdentityActions
        currentDisplayName={props.currentDisplayName}
        targetAppUserId={props.targetAppUserId}
      />
      <ListingActions
        currentListingStatus={props.currentListingStatus}
        targetAppUserIdValue={props.targetAppUserId}
        tutorProfileId={props.tutorProfileId}
      />
      <AccountStatusActions
        currentAccountStatus={props.currentAccountStatus}
        targetAppUserId={props.targetAppUserId}
      />
      <AdminRoleActions
        actorIsSelf={props.actorIsSelf}
        hasActiveAdminRole={props.hasActiveAdminRole}
        targetAppUserId={props.targetAppUserId}
      />
      <FinanceInterventionActions targetAppUserId={props.targetAppUserId} />
    </div>
  );
}

function IdentityActions({
  currentDisplayName,
  targetAppUserId,
}: {
  currentDisplayName: string | null;
  targetAppUserId: string;
}) {
  const [state, formAction, pending] = useActionState<
    UserDetailActionState,
    FormData
  >(runUserDetailAction, initialUserDetailActionState);

  return (
    <Panel eyebrow="Identity" tone="raised" title="Display name">
      <p className={styles.helperText}>
        Edit the name shown across Mentor IB for this account. The change is
        audited with your reason.
      </p>
      <IdentityActionFeedback state={state} />
      <form action={formAction} className={styles.actionForm}>
        <input name="intent" type="hidden" value="update_display_name" />
        <input name="target_app_user_id" type="hidden" value={targetAppUserId} />
        <TextField
          defaultValue={currentDisplayName ?? ""}
          label="Display name"
          maxLength={120}
          name="display_name"
          placeholder="Name shown on Mentor IB"
          required
        />
        <Textarea
          description="Admin-only audit reason."
          label="Reason"
          maxLength={2000}
          name="reason"
          placeholder="Why are you changing this name?"
          required
          rows={2}
        />
        <Button disabled={pending} type="submit" variant="primary">
          {pending ? "Saving…" : "Update name"}
        </Button>
      </form>
      <RemoveFromPlatformNotice />
    </Panel>
  );
}

// `IdentityActions` runs its own action state, so its feedback must not show
// success messages bled in from another panel's submission.
function IdentityActionFeedback({ state }: { state: UserDetailActionState }) {
  if (state.intent !== "update_display_name") {
    return null;
  }
  return <ActionFeedback state={state} />;
}

function RemoveFromPlatformNotice() {
  return (
    <InlineNotice tone="info" title="Remove from platform">
      <p>
        Removing an account goes through the data-subject-request erasure flow
        so retention rules are honored. That flow (P2-DSR-001) is not built yet,
        so removal is disabled here — there is no raw-delete path.
      </p>
      <Button disabled type="button" variant="danger">
        Remove from platform
      </Button>
    </InlineNotice>
  );
}

function ListingActions({
  tutorProfileId,
  currentListingStatus,
  targetAppUserIdValue,
}: {
  tutorProfileId: string | null;
  currentListingStatus: TutorListingState | null;
  targetAppUserIdValue: string;
}) {
  const [state, formAction, pending] = useActionState<
    UserDetailActionState,
    FormData
  >(runUserDetailAction, initialUserDetailActionState);

  if (!tutorProfileId) {
    return null;
  }

  const canPause = currentListingStatus === "listed";
  const canDelist =
    currentListingStatus !== "delisted" && currentListingStatus !== null;
  const canLift =
    currentListingStatus === "paused" || currentListingStatus === "delisted";

  return (
    <Panel eyebrow="Listing" tone="raised" title="Tutor listing controls">
      <p className={styles.helperText}>
        Pause for a soft hold, delist to remove from public discovery, or lift
        an existing hold. Lifting does not auto-publish — the tutor must
        re-publish from /tutor/profile.
      </p>
      <ActionFeedback state={state} />
      <ListingActionForm
        action="pause_listing"
        availableWhen={canPause}
        confirmLabel="Pause listing"
        disabled={pending}
        formAction={formAction}
        label="Pause"
        targetAppUserId={targetAppUserIdValue}
        tutorProfileId={tutorProfileId}
      />
      <ListingActionForm
        action="delist_listing"
        availableWhen={canDelist}
        confirmLabel="Delist"
        danger
        disabled={pending}
        formAction={formAction}
        label="Delist"
        targetAppUserId={targetAppUserIdValue}
        tutorProfileId={tutorProfileId}
      />
      <ListingActionForm
        action="lift_listing_hold"
        availableWhen={canLift}
        confirmLabel="Lift hold"
        disabled={pending}
        formAction={formAction}
        label="Lift hold"
        targetAppUserId={targetAppUserIdValue}
        tutorProfileId={tutorProfileId}
      />
    </Panel>
  );
}

function ListingActionForm({
  action,
  availableWhen,
  confirmLabel,
  danger,
  disabled,
  formAction,
  label,
  targetAppUserId,
  tutorProfileId,
}: {
  action: "pause_listing" | "delist_listing" | "lift_listing_hold";
  availableWhen: boolean;
  confirmLabel: string;
  danger?: boolean;
  disabled: boolean;
  formAction: (formData: FormData) => void;
  label: string;
  targetAppUserId: string;
  tutorProfileId: string;
}) {
  const reasonId = useId();
  if (!availableWhen) {
    return null;
  }
  return (
    <form action={formAction} className={styles.actionForm}>
      <input name="intent" type="hidden" value={action} />
      <input name="tutor_profile_id" type="hidden" value={tutorProfileId} />
      <input name="target_app_user_id" type="hidden" value={targetAppUserId} />
      <Textarea
        description="Admin-only audit reason."
        id={reasonId}
        label={`${label} — reason`}
        maxLength={2000}
        name="reason"
        placeholder="Why are you taking this action?"
        required
        rows={2}
      />
      <Button disabled={disabled} type="submit" variant={danger ? "danger" : "primary"}>
        {disabled ? "Saving…" : confirmLabel}
      </Button>
    </form>
  );
}

function AccountStatusActions({
  currentAccountStatus,
  targetAppUserId,
}: {
  currentAccountStatus: "active" | "limited" | "suspended" | "closed";
  targetAppUserId: string;
}) {
  const [state, formAction, pending] = useActionState<
    UserDetailActionState,
    FormData
  >(runUserDetailAction, initialUserDetailActionState);
  const nextOptions = pickAccountStatusOptions(currentAccountStatus);

  if (nextOptions.length === 0) {
    return null;
  }

  return (
    <Panel eyebrow="Account status" tone="raised" title="Change account status">
      <p className={styles.helperText}>
        `closed` is reserved for account-deletion (P2-DSR-001) and is not
        reachable here.
      </p>
      <ActionFeedback state={state} />
      <form action={formAction} className={styles.actionForm}>
        <input name="intent" type="hidden" value="set_account_status" />
        <input
          name="target_app_user_id"
          type="hidden"
          value={targetAppUserId}
        />
        <SelectField
          defaultValue={nextOptions[0]}
          label="New status"
          name="next_status"
          required
        >
          {nextOptions.map((status) => (
            <option key={status} value={status}>
              {ACCOUNT_STATUS_LABELS[status]}
            </option>
          ))}
        </SelectField>
        <Textarea
          description="Admin-only audit reason."
          label="Reason"
          maxLength={2000}
          name="reason"
          placeholder="Why is this status change being made?"
          required
          rows={2}
        />
        <Button disabled={pending} type="submit" variant="primary">
          {pending ? "Saving…" : "Update status"}
        </Button>
      </form>
    </Panel>
  );
}

function AdminRoleActions({
  actorIsSelf,
  hasActiveAdminRole,
  targetAppUserId,
}: {
  actorIsSelf: boolean;
  hasActiveAdminRole: boolean;
  targetAppUserId: string;
}) {
  const [state, formAction, pending] = useActionState<
    UserDetailActionState,
    FormData
  >(runUserDetailAction, initialUserDetailActionState);
  const [grantConfirmOpen, setGrantConfirmOpen] = useState(false);
  const [pendingGrantSubmit, setPendingGrantSubmit] = useState<
    (() => void) | null
  >(null);

  return (
    <Panel eyebrow="Admin role" tone="raised" title="Admin role management">
      <p className={styles.helperText}>
        Granting admin access is high-impact — the confirmation dialog runs
        before submission. Self-revoke is blocked; use the grant-admin script
        to recover from full lockout.
      </p>
      <ActionFeedback state={state} />
      {!hasActiveAdminRole ? (
        <form
          action={formAction}
          className={styles.actionForm}
          onSubmit={(event) => {
            if (!pendingGrantSubmit) {
              event.preventDefault();
              const form = event.currentTarget;
              setPendingGrantSubmit(() => () => form.requestSubmit());
              setGrantConfirmOpen(true);
            }
          }}
        >
          <input name="intent" type="hidden" value="grant_admin_role" />
          <input
            name="target_app_user_id"
            type="hidden"
            value={targetAppUserId}
          />
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
            {pending ? "Saving…" : "Grant admin access"}
          </Button>
        </form>
      ) : null}
      {hasActiveAdminRole && !actorIsSelf ? (
        <form action={formAction} className={styles.actionForm}>
          <input name="intent" type="hidden" value="revoke_admin_role" />
          <input
            name="target_app_user_id"
            type="hidden"
            value={targetAppUserId}
          />
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
      ) : null}
      {hasActiveAdminRole && actorIsSelf ? (
        <InlineNotice tone="info" title="Self-revoke is blocked">
          <p>
            You can&apos;t revoke your own admin role here. Use the
            grant-admin script for emergency lockout recovery.
          </p>
        </InlineNotice>
      ) : null}
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Grant admin access"
        confirmVariant="primary"
        description={
          <p>
            This grants the target account full admin access immediately.
            Confirm only if you are sure.
          </p>
        }
        onCancel={() => {
          setGrantConfirmOpen(false);
          setPendingGrantSubmit(null);
        }}
        onConfirm={() => {
          setGrantConfirmOpen(false);
          if (pendingGrantSubmit) {
            const submit = pendingGrantSubmit;
            setPendingGrantSubmit(null);
            submit();
          }
        }}
        open={grantConfirmOpen}
        title="Grant admin access?"
      />
    </Panel>
  );
}

function FinanceInterventionActions({
  targetAppUserId,
}: {
  targetAppUserId: string;
}) {
  const [state, formAction, pending] = useActionState<
    UserDetailActionState,
    FormData
  >(runUserDetailAction, initialUserDetailActionState);

  return (
    <Panel
      eyebrow="Finance"
      tone="raised"
      title="Record finance-intervention note"
    >
      <p className={styles.helperText}>
        Records intent (payout hold, refund anomaly) as a
        `finance_intervention` case. No Stripe write happens from this
        surface — refunds and hold execution stay in the payments domain.
      </p>
      <ActionFeedback state={state} />
      <form action={formAction} className={styles.actionForm}>
        <input name="intent" type="hidden" value="record_finance_intervention" />
        <input
          name="target_app_user_id"
          type="hidden"
          value={targetAppUserId}
        />
        <SelectField defaultValue="payout_hold" label="Kind" name="kind" required>
          {(["payout_hold", "refund_anomaly", "general_finance"] as const).map(
            (kind) => (
              <option key={kind} value={kind}>
                {FINANCE_INTERVENTION_KIND_LABELS[kind]}
              </option>
            ),
          )}
        </SelectField>
        <Textarea
          description="Admin-only narrative captured on the case."
          label="Note"
          maxLength={2000}
          name="body"
          placeholder="What needs follow-up?"
          required
          rows={3}
        />
        <Button disabled={pending} type="submit" variant="primary">
          {pending ? "Saving…" : "Record note"}
        </Button>
      </form>
    </Panel>
  );
}

function ActionFeedback({ state }: { state: UserDetailActionState }) {
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

function pickAccountStatusOptions(
  current: "active" | "limited" | "suspended" | "closed",
): readonly ("active" | "limited" | "suspended")[] {
  switch (current) {
    case "active":
      return ["limited", "suspended"] as const;
    case "limited":
      return ["active", "suspended"] as const;
    case "suspended":
      return ["active", "limited"] as const;
    case "closed":
    default:
      return [] as const;
  }
}
