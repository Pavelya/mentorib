"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { Button, InlineNotice, Textarea } from "@/components/ui";
import { sendMessageAction } from "@/modules/messages/actions";
import {
  initialSendMessageActionState,
  type SendMessageActionState,
} from "@/modules/messages/actions-state";

import styles from "./messages.module.css";

const BODY_FIELD_ID = "conversation-composer-body";

type ConversationComposerProps = {
  conversationId: string;
  counterpartName: string;
  disabled?: boolean;
  disabledReason?: string;
};

export function ConversationComposer({
  conversationId,
  counterpartName,
  disabled = false,
  disabledReason,
}: ConversationComposerProps) {
  const [state, action] = useActionState<SendMessageActionState, FormData>(
    sendMessageAction,
    initialSendMessageActionState,
  );
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.code === "ok") {
      formRef.current?.reset();
    }
  }, [state.code, state.submittedAt]);

  if (disabled) {
    return (
      <div className={styles.composerNotice}>
        <InlineNotice tone="warning" title="Messaging paused">
          <p>
            {disabledReason ??
              "This conversation is not accepting new messages right now."}
          </p>
        </InlineNotice>
      </div>
    );
  }

  return (
    <form
      action={action}
      aria-label={`Send a message to ${counterpartName}`}
      className={styles.composerForm}
      ref={formRef}
    >
      <input name="conversationId" type="hidden" value={conversationId} />

      <Textarea
        defaultValue=""
        error={state.fieldErrors.body}
        id={BODY_FIELD_ID}
        label="Message"
        labelMeta="Required"
        maxLength={4000}
        name="body"
        placeholder={`Write to ${counterpartName}…`}
        rows={4}
      />

      {state.code && state.code !== "ok" && state.message ? (
        <InlineNotice tone="warning" title="Message not sent">
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}

      <div className={styles.composerActions}>
        <ComposerSubmitButton />
      </div>
    </form>
  );
}

function ComposerSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} size="compact" type="submit">
      {pending ? "Sending…" : "Send message"}
    </Button>
  );
}
