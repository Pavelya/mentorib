"use client";

import { Button, InlineNotice, Panel } from "@/components/ui";

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
    <Panel
      className={styles.errorCard}
      description={
        <>
          This is an intentional top-level error boundary for the{" "}
          {familyLabel.toLowerCase()} section. Later tasks can replace this with
          domain-specific recovery.
        </>
      }
      eyebrow={`${familyLabel} boundary`}
      title="Something broke inside this route family."
      titleAs="h1"
      tone="raised"
    >
      <InlineNotice title="Runtime message" tone="actionNeeded">
        <p>{error.message || "Unknown error"}</p>
      </InlineNotice>

      <Button onClick={reset} variant="danger">
        Try again
      </Button>
    </Panel>
  );
}
