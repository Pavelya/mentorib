import Link from "next/link";

import { AccountRouteState } from "@/components/account/account-route-state";
import { PendingLegalNotice } from "@/components/account/pending-legal-notice";
import { Card, Panel, StatusBadge } from "@/components/ui";
import { formatUtcDateTime, formatUtcShortDate } from "@/lib/datetime/format";
import { hasRole } from "@/modules/accounts/account-state";
import {
  getSharedAccountRouteContext,
  listAccountBillingHistory,
} from "@/modules/accounts/shared-account";
import {
  DEFAULT_PLATFORM_CURRENCY_CODE,
  formatCurrencyFromMinorUnits,
} from "@/modules/pricing/money";

import styles from "../account-surfaces.module.css";

export default async function BillingPage() {
  const context = await getSharedAccountRouteContext("/billing");

  if (context.status !== "ready") {
    return <AccountRouteState status={context.status} />;
  }

  const { account, pendingLegalNotice } = context;
  const isStudent = hasRole(account, "student");

  if (!isStudent) {
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

        <Panel title="Tutor payouts live in Earnings" tone="raised">
          <p className={styles.bodyText}>
            Payout balances, transfers, and Stripe Connect status for tutors are
            managed on the Earnings route.
          </p>
          <p>
            <Link className={styles.inlineLink} href="/tutor/earnings">
              Go to Earnings
            </Link>
          </p>
        </Panel>
      </div>
    );
  }

  const billingEntries = await listAccountBillingHistory(account.id);
  const capturedTotal = billingEntries
    .filter((entry) => entry.paymentStatus === "paid" || entry.paymentStatus === "refunded")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const authorizedCount = billingEntries.filter((entry) => entry.paymentStatus === "authorized")
    .length;
  const refundedCount = billingEntries.filter((entry) => entry.paymentStatus === "refunded").length;
  const summaryCurrencyCode =
    billingEntries[0]?.currencyCode ?? DEFAULT_PLATFORM_CURRENCY_CODE;

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

      <section className={styles.summaryGrid}>
        <Panel title="Billing snapshot" tone="raised">
          <div className={styles.metricGrid}>
            <Card>
              <p className={styles.metricValue}>
                {formatCurrency(capturedTotal, summaryCurrencyCode)}
              </p>
              <p className={styles.metricLabel}>Total paid</p>
            </Card>
            <Card>
              <p className={styles.metricValue}>{authorizedCount}</p>
              <p className={styles.metricLabel}>Awaiting confirmation</p>
            </Card>
            <Card>
              <p className={styles.metricValue}>{refundedCount}</p>
              <p className={styles.metricLabel}>Refunds</p>
            </Card>
          </div>
        </Panel>
      </section>

      <Panel
        description="Records appear here once lesson booking and payment capture flows produce payer-visible history."
        title="Recent billing activity"
      >
        {billingEntries.length > 0 ? (
          <div className={styles.list}>
            {billingEntries.map((entry) => (
              <Card key={entry.id}>
                <div className={styles.itemHeader}>
                  <div className={styles.itemCopy}>
                    <h3 className={styles.itemTitle}>
                      Lesson payment ·{" "}
                      {formatUtcShortDate(entry.createdAt, account.timezone)}
                    </h3>
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
              </Card>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.bodyText}>No payments yet</p>
            <p className={styles.muted}>
              Your first lesson payment will appear here once you book a tutor.
            </p>
          </div>
        )}
      </Panel>
    </div>
  );
}

function formatCurrency(amount: number, currencyCode: string) {
  return formatCurrencyFromMinorUnits(amount, currencyCode);
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
