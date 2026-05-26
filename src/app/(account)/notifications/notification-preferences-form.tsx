"use client";

import { useState, useTransition } from "react";

import { InlineNotice, Section, Switch } from "@/components/ui";
import {
  IN_APP_ONLY_NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_DESCRIPTIONS,
  NOTIFICATION_CATEGORY_LABELS,
  notificationCategories,
  type NotificationCategory,
} from "@/modules/notifications/constants";
import type { NotificationPreferenceSnapshot } from "@/modules/notifications/preferences";

import styles from "../account-surfaces.module.css";
import {
  updateNotificationPreference,
  type UpdateNotificationPreferenceResult,
} from "./notification-preference-actions";

type NotificationPreferencesFormProps = {
  initialSnapshot: NotificationPreferenceSnapshot;
};

type PendingKey = `${NotificationCategory}:${"in_app" | "email"}`;

const ALWAYS_SENT_SUMMARY =
  "Booking confirmations · Payment receipts · Lesson cancellations · Dispute outcomes · Legal updates · Payout updates";

export function NotificationPreferencesForm({
  initialSnapshot,
}: NotificationPreferencesFormProps) {
  const [snapshot, setSnapshot] =
    useState<NotificationPreferenceSnapshot>(initialSnapshot);
  const [pending, setPending] = useState<Set<PendingKey>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const markPending = (key: PendingKey, value: boolean) => {
    setPending((previous) => {
      const next = new Set(previous);
      if (value) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const handleToggle = (
    category: NotificationCategory,
    channel: "in_app" | "email",
    enabled: boolean,
  ) => {
    const pendingKey: PendingKey = `${category}:${channel}`;
    const previous = snapshot[category];

    setSnapshot((current) => ({
      ...current,
      [category]: {
        ...current[category],
        [channel === "in_app" ? "in_app_enabled" : "email_enabled"]: enabled,
      },
    }));
    markPending(pendingKey, true);
    setErrorMessage(null);

    startTransition(() => {
      void (async () => {
        let result: UpdateNotificationPreferenceResult;
        try {
          result = await updateNotificationPreference({
            category,
            channel,
            enabled,
          });
        } catch {
          result = {
            code: "persist_failed",
            message:
              "We couldn't save that change just now. Please try again in a moment.",
          };
        }

        if (result.code !== "success") {
          setSnapshot((current) => ({
            ...current,
            [category]: previous,
          }));
          setErrorMessage(result.message);
        }

        markPending(pendingKey, false);
      })();
    });
  };

  return (
    <div className={styles.profileSectionList}>
      {errorMessage ? (
        <InlineNotice tone="actionNeeded" title="We couldn't save that change">
          <p>{errorMessage}</p>
        </InlineNotice>
      ) : null}

      {notificationCategories.map((category) => {
        const channelState = snapshot[category];
        const emailLocked = IN_APP_ONLY_NOTIFICATION_CATEGORIES.has(category);
        const inAppPendingKey: PendingKey = `${category}:in_app`;
        const emailPendingKey: PendingKey = `${category}:email`;

        return (
          <Section
            divider="bottom"
            eyebrow={NOTIFICATION_CATEGORY_LABELS[category]}
            key={category}
          >
            <p className={styles.sectionNote}>
              {NOTIFICATION_CATEGORY_DESCRIPTIONS[category]}
            </p>
            <Switch
              checked={channelState.in_app_enabled}
              disabled={pending.has(inAppPendingKey)}
              label="In-app"
              onCheckedChange={(next) => handleToggle(category, "in_app", next)}
            />
            <Switch
              checked={emailLocked ? false : channelState.email_enabled}
              disabled={emailLocked || pending.has(emailPendingKey)}
              helperText={
                emailLocked
                  ? "This category is delivered in-app only."
                  : undefined
              }
              label="Email"
              onCheckedChange={(next) => handleToggle(category, "email", next)}
            />
          </Section>
        );
      })}

      <Section eyebrow="Always sent">
        <p className={styles.sectionNote}>
          Some notifications keep dispatching by policy and can&apos;t be turned
          off here: {ALWAYS_SENT_SUMMARY}.
        </p>
      </Section>
    </div>
  );
}
