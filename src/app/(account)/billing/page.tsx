import { AccountRouteState } from "@/components/account/account-route-state";
import { PendingLegalNotice } from "@/components/account/pending-legal-notice";
import { InlineNotice, Panel, StatusBadge } from "@/components/ui";
import { formatUtcDateTime } from "@/lib/datetime/format";
import {
  getSharedAccountRouteContext,
  listAccountBillingHistory,
} from "@/modules/accounts/shared-account";

import styles from "../account-surfaces.module.css";

export default async function BillingPage() {
  const context = await getSharedAccountRouteContext("/billing");

  if (context.status !== "ready") {
    return <AccountRouteState status={context.status} />;
  }

  const { account, pendingLegalNotice } = context;
  const billingEntries = await listAccountBillingHistory(account.id);
  const capturedTotal = billingEntries
    .filter((entry) => entry.paymentStatus === "paid" || entry.paymentStatus === "refunded")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const authorizedCount = billingEntries.filter((entry) => entry.paymentStatus === "authorized")
    .length;
  const refundedCount = billingEntries.filter((entry) => entry.paymentStatus === "refunded").length;

  return (
    <div className={styles.page}>
      <header className={styles.pageIntro}>
        <h1 className={styles.pageTitle}>Billing</h1>
        <p className={styles.pageDescription}>
          Your payment history and current learner-side billing status.
        </p>
      </header>

      {pendingLegalNotice ? (
        <PendingLegalNotice notice={pendingLegalNotice} returnTo="/billing" />
      ) : null}

      <InlineNotice title="Billing history only" tone="info">
        <p>
          This shared account route is for learner-side payment history. Tutor payout
          operations remain separate on the tutor earnings route.
        </p>
      </InlineNotice>

      <section className={styles.summaryGrid}>
        <Panel
          description="The billing surface stays intentionally narrow and avoids exposing raw payment-provider payloads."
          title="Billing snapshot"
          tone="raised"
        >
          <div className={styles.metricGrid}>
            <div className={styles.metricCard}>
              <p className={styles.metricValue}>
                {formatCurrency(
                  capturedTotal,
                  billingEntries[0]?.currencyCode ?? "USD",
                )}
              </p>
              <p className={styles.metricLabel}>Captured or refunded value</p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricValue}>{authorizedCount}</p>
              <p className={styles.metricLabel}>Authorizations awaiting capture</p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricValue}>{refundedCount}</p>
              <p className={styles.metricLabel}>Refunded payments</p>
            </div>
          </div>
        </Panel>

        <Panel
          description="Student billing history is shared here; tutor earnings stay outside this route family by design."
          title="Scope guardrails"
          tone="mist"
        >
          <div className={styles.badgeRow}>
            <StatusBadge tone="info">Shared account route</StatusBadge>
            <StatusBadge tone="trust">Payer-safe summary</StatusBadge>
            <StatusBadge tone="warning">No payout controls here</StatusBadge>
          </div>
          <p className={styles.bodyText}>
            This page is intentionally limited to operational billing status, amount,
            and timeline visibility for the paying account owner.
          </p>
        </Panel>
      </section>

      <Panel
        description="Records appear here once lesson booking and payment capture flows produce payer-visible history."
        title="Recent billing activity"
      >
        {billingEntries.length > 0 ? (
          <ul className={styles.list}>
            {billingEntries.map((entry) => (
              <li className={styles.listItem} key={entry.id}>
                <div className={styles.itemHeader}>
                  <div className={styles.itemCopy}>
                    <h3 className={styles.itemTitle}>Lesson payment</h3>
                    <p className={styles.bodyText}>
                      {formatCurrency(entry.amount, entry.currencyCode)}
                    </p>
                  </div>
                  <div className={styles.itemMeta}>
                    <StatusBadge tone={getPaymentStatusTone(entry.paymentStatus)}>
                      {formatPaymentStatus(entry.paymentStatus)}
                    </StatusBadge>
                  </div>
                </div>
                <p className={styles.muted}>
                  Created{" "}
                  {formatUtcDateTime(entry.createdAt, {
                    timezone: account.timezone,
                  })}
                </p>
                {entry.capturedAt ? (
                  <p className={styles.muted}>
                    Captured{" "}
                    {formatUtcDateTime(entry.capturedAt, {
                      timezone: account.timezone,
                    })}
                  </p>
                ) : null}
                {entry.refundedAt ? (
                  <p className={styles.muted}>
                    Refunded{" "}
                    {formatUtcDateTime(entry.refundedAt, {
                      timezone: account.timezone,
                    })}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.bodyText}>
              No learner billing records are visible yet for this account.
            </p>
            <p className={styles.muted}>
              The first entries will appear after booking and capture flows create
              payer history.
            </p>
          </div>
        )}
      </Panel>
    </div>
  );
}

function formatCurrency(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    currency: currencyCode,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

function formatPaymentStatus(
  status: "authorized" | "cancelled" | "failed" | "paid" | "pending" | "refunded",
) {
  switch (status) {
    case "pending":
      return "Pending";
    case "authorized":
      return "Authorized";
    case "paid":
      return "Paid";
    case "refunded":
      return "Refunded";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
  }
}

function getPaymentStatusTone(
  status: "authorized" | "cancelled" | "failed" | "paid" | "pending" | "refunded",
) {
  switch (status) {
    case "paid":
      return "positive";
    case "authorized":
    case "pending":
      return "warning";
    case "refunded":
      return "trust";
    case "failed":
    case "cancelled":
      return "destructive";
  }
}
