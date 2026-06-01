"use client";

import { useActionState } from "react";

import { Button, InlineNotice, TextField, Textarea } from "@/components/ui";

import { initialContactFormState, type ContactFormState } from "./action-state";
import { submitContactForm } from "./actions";
import styles from "./contact.module.css";

type ContactFormProps = {
  // The signed-in account email, or null for a logged-out visitor.
  signedInEmail: string | null;
};

export function ContactForm({ signedInEmail }: ContactFormProps) {
  const [state, formAction, pending] = useActionState<
    ContactFormState,
    FormData
  >(submitContactForm, initialContactFormState);

  if (state.code === "ok") {
    return (
      <InlineNotice tone="success" title="Message sent">
        <p>
          Thanks for reaching out. We&apos;ll reply by email
          {signedInEmail ? ` at ${signedInEmail}` : ""} as soon as we can.
        </p>
      </InlineNotice>
    );
  }

  return (
    <form action={formAction} className={styles.form}>
      {state.message ? (
        <InlineNotice tone="warning" title="We couldn't send that">
          <p>{state.message}</p>
        </InlineNotice>
      ) : null}

      {signedInEmail ? (
        <TextField
          description="We'll reply to your account email."
          disabled
          label="Your email"
          name="account_email_display"
          readOnly
          value={signedInEmail}
        />
      ) : (
        <TextField
          autoComplete="email"
          description="We'll reply to this address."
          label="Your email"
          name="email"
          required
          type="email"
        />
      )}

      <TextField
        label="Subject"
        maxLength={200}
        name="subject"
        placeholder="What's this about?"
        required
      />
      <Textarea
        label="Message"
        maxLength={5000}
        name="body"
        placeholder="Tell us what you need help with."
        required
        rows={6}
      />

      <div className={styles.submitRow}>
        <Button disabled={pending} type="submit">
          {pending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
