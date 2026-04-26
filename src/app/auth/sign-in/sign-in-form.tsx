"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  type MagicLinkActionState,
  sendMagicLinkAction,
  startGoogleSignInAction,
} from "@/app/auth/actions";
import {
  GoogleMark,
  InlineNotice,
  Panel,
  TextField,
  getButtonClassName,
} from "@/components/ui";
import { useDetectedTimezone } from "@/lib/datetime/client";

import styles from "./sign-in.module.css";

const initialGoogleActionState = {
  error: null,
};

const initialMagicLinkActionState: MagicLinkActionState = {
  email: "",
  emailError: null,
  error: null,
};

type SignInFormProps = {
  canStartAuth: boolean;
  hasReturnPath: boolean;
  nextPath: string | null;
};

export function SignInForm({
  canStartAuth,
  hasReturnPath,
  nextPath,
}: SignInFormProps) {
  const [magicLinkState, magicLinkAction] = useActionState(
    sendMagicLinkAction,
    initialMagicLinkActionState,
  );
  const [googleState, googleAction] = useActionState(
    startGoogleSignInAction,
    initialGoogleActionState,
  );
  const detectedTimezone = useDetectedTimezone("");

  return (
    <Panel className={styles.authCard} tone="raised">
      <div className={styles.cardTop}>
        <p className={styles.brand}>Mentor IB</p>
        <h1 className={styles.title}>Sign in or create your account</h1>
        <p className={styles.subtitle}>
          Use Google or email. If you&apos;re new, we&apos;ll create your account after
          you verify.
        </p>
      </div>

      {hasReturnPath ? (
        <div className={styles.returnNotice}>
          <p className={styles.returnLabel}>Returning to</p>
          <p className={styles.returnPath}>{nextPath}</p>
        </div>
      ) : null}

      {!canStartAuth ? (
        <InlineNotice title="Auth configuration required" tone="warning">
          <p>
            Local auth is disabled because the Supabase environment variables have
            not loaded yet. Restart the dev server after updating `.env.local`.
          </p>
        </InlineNotice>
      ) : null}

      <form action={googleAction} className={styles.providerForm}>
        <input name="next" type="hidden" value={nextPath ?? ""} />
        <input name="timezone" type="hidden" value={detectedTimezone} />

        {googleState.error ? (
          <InlineNotice title="Google sign-in could not start" tone="warning">
            <p>{googleState.error}</p>
          </InlineNotice>
        ) : null}

        <SubmitButton
          className={styles.googleButton}
          disabled={!canStartAuth}
          fullWidth
          label="Continue with Google"
          leadingVisual={<GoogleMark />}
          variant="secondary"
        />
      </form>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      <form action={magicLinkAction} className={styles.magicLinkForm}>
        <input name="next" type="hidden" value={nextPath ?? ""} />
        <input name="timezone" type="hidden" value={detectedTimezone} />

        {magicLinkState.error ? (
          <InlineNotice title="Magic link could not be sent" tone="warning">
            <p>{magicLinkState.error}</p>
          </InlineNotice>
        ) : null}

        <TextField
          autoComplete="email"
          defaultValue={magicLinkState.email}
          description="We’ll email you a one-time sign-in link."
          disabled={!canStartAuth}
          error={magicLinkState.emailError ?? undefined}
          label="Email address"
          name="email"
          placeholder="you@example.com"
          type="email"
        />

        <SubmitButton
          className={styles.magicLinkButton}
          disabled={!canStartAuth}
          fullWidth
          label="Email me a sign-in link"
          variant="primary"
        />
      </form>

      <div className={styles.footerRow}>
        <p className={styles.footerText}>No password needed.</p>

        <div className={styles.linkRow}>
          <Link className={styles.utilityLink} href="/support">
            Need help?
          </Link>
        </div>
      </div>
    </Panel>
  );
}

type SubmitButtonProps = {
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  label: string;
  leadingVisual?: ReactNode;
  variant: "primary" | "secondary";
};

function SubmitButton({
  className,
  disabled = false,
  fullWidth = false,
  label,
  leadingVisual,
  variant,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={getButtonClassName({ className, fullWidth, variant })}
      disabled={disabled || pending}
      type="submit"
    >
      <span className={styles.buttonContent}>
        {leadingVisual}
        <span>{pending ? "Working..." : label}</span>
      </span>
    </button>
  );
}

