"use client";

import styles from "./app-frame.module.css";

type RouteFamilyErrorProps = {
  familyLabel: string;
  error: Error & { digest?: string };
  reset: () => void;
};

export function RouteFamilyError({
  familyLabel,
  error,
  reset,
}: RouteFamilyErrorProps) {
  return (
    <div className={styles.errorCard}>
      <p className={styles.eyebrow}>{familyLabel} boundary</p>
      <h1>Something broke inside this route family.</h1>
      <p>
        This is an intentional top-level error boundary for the {familyLabel.toLowerCase()}{" "}
        section. Later tasks can replace this with domain-specific recovery.
      </p>
      <p>{error.message || "Unknown error"}</p>
      <button onClick={reset} type="button">
        Try again
      </button>
    </div>
  );
}
