import type { Route } from "next";
import Link from "next/link";

import { Panel, getButtonClassName } from "@/components/ui";
import {
  buildAuthSignInPath,
  getSafeRedirectPath,
  type AuthVerifyStatus,
} from "@/lib/auth/allowed-redirects";

import styles from "@/app/auth/sign-in/sign-in.module.css";

type VerifyPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const VERIFY_CONTENT: Record<
  AuthVerifyStatus,
  {
    body: string;
    ctaLabel: string;
    title: string;
  }
> = {
  error: {
    body: "We couldn't complete sign-in. Please try again.",
    ctaLabel: "Try sign-in again",
    title: "Callback did not complete",
  },
  expired: {
    body: "This sign-in link has expired. Request a new one.",
    ctaLabel: "Request a new link",
    title: "Your sign-in link expired",
  },
  sent: {
    body: "Check your email for your sign-in link. New to Mentor IB? The same link will create your account.",
    ctaLabel: "Back to sign-in",
    title: "Check your inbox",
  },
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const resolvedSearchParams = await searchParams;
  const status = getVerifyStatus(getSearchParam(resolvedSearchParams.status));
  const nextPath = getSafeRedirectPath(getSearchParam(resolvedSearchParams.next));
  const content = VERIFY_CONTENT[status];

  return (
    <Panel className={styles.authCard} tone="raised">
      <div className={styles.cardTop}>
        <p className={styles.brand}>Mentor IB</p>
        <h1 className={styles.title}>{content.title}</h1>
        <p className={styles.subtitle}>{content.body}</p>
      </div>

      <div className={styles.footerRow}>
        <div className={styles.linkRow}>
          <Link
            className={getButtonClassName({ variant: "primary" })}
            href={buildAuthSignInPath(nextPath) as Route}
          >
            {content.ctaLabel}
          </Link>
          <Link className={getButtonClassName({ variant: "secondary" })} href="/support">
            Contact support
          </Link>
        </div>

        <p className={styles.footerText}>
          {status === "sent"
            ? "The link expires if left unused."
            : "If the problem continues, try requesting a fresh sign-in link."}
        </p>
      </div>
    </Panel>
  );
}

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getVerifyStatus(value: string | undefined): AuthVerifyStatus {
  return value === "error" || value === "expired" || value === "sent" ? value : "sent";
}
