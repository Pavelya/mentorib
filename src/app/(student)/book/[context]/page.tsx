import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";

import { NeedSummaryBar, PersonSummary } from "@/components/continuity";
import { TimezoneNotice } from "@/components/datetime";
import { InlineNotice, Panel, getButtonClassName } from "@/components/ui";
import {
  buildPostSignInRedirect,
  ensureAuthAccount,
} from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { routeFamilies } from "@/lib/routing/route-families";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  hasRole,
  isRestrictedAccount,
  requiresRoleSelection,
} from "@/modules/accounts/account-state";
import {
  getBookingRequestOutcome,
  getStudentBookingContext,
  isBookingContextNotFound,
} from "@/modules/lessons/booking";

import { BookingForm } from "./booking-form";
import styles from "./booking.module.css";

type BookingPageProps = {
  params: Promise<{
    context: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BookingPage({
  params,
  searchParams,
}: BookingPageProps) {
  const { context } = await params;
  const resolvedSearchParams = await searchParams;
  const checkoutState = getSearchParam(resolvedSearchParams.checkout);
  const operationKey = getSearchParam(resolvedSearchParams.operation);

  if (!isSupabaseAuthConfigured()) {
    return renderConfigurationState(context);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(`/book/${context}`) as Route);
  }

  const account = await ensureAuthAccount(user);

  if (requiresRoleSelection(account)) {
    redirect(routeFamilies.setup.defaultHref);
  }

  if (isRestrictedAccount(account)) {
    return (
      <InlineNotice title="Booking unavailable" tone="warning">
        <p>This account cannot request a lesson right now.</p>
      </InlineNotice>
    );
  }

  if (!hasRole(account, "student")) {
    redirect(buildPostSignInRedirect(account, `/book/${context}`) as Route);
  }

  const bookingContext = await getStudentBookingContext(account, context);

  if (isBookingContextNotFound(bookingContext)) {
    notFound();
  }

  const bookingOutcome = await getBookingRequestOutcome(account, context, operationKey);
  const showForm = bookingContext.status === "ready" && !bookingOutcome;

  return (
    <article className={styles.page}>
      <header className={styles.pageHeader}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Booking handoff</p>
          <h1 className={styles.title}>Confirm the lesson request before Stripe takes over.</h1>
          <p className={styles.description}>
            The tutor, need, schedule rules, and request expiry stay attached here so the
            payment authorization step does not feel like a restart.
          </p>
        </section>

        {bookingContext.need ? (
          <NeedSummaryBar
            label="Current need"
            mode="editable"
            need={bookingContext.need.headline}
            qualifiers={bookingContext.need.qualifiers}
            state={bookingContext.need.status === "booked" ? "locked" : "active"}
            variant="stacked"
          />
        ) : null}
      </header>

      <TimezoneNotice timezone={account.timezone} />

      {checkoutState === "cancelled" ? (
        <InlineNotice title="Authorization step cancelled" tone="warning">
          <p>Your lesson request was not submitted. You can choose a slot and try again.</p>
        </InlineNotice>
      ) : null}

      {checkoutState === "error" ? (
        <InlineNotice title="Booking return failed" tone="warning">
          <p>
            We couldn&apos;t confirm the Stripe return yet. Refresh the page or try the
            request again.
          </p>
        </InlineNotice>
      ) : null}

      {bookingOutcome ? (
        <Panel
          description="The tutor now reviews the request while Stripe keeps the payment method on hold."
          title="Request sent"
          tone="warm"
        >
          <div className={styles.resultGrid}>
            <p className={styles.resultMeta}>
              {bookingOutcome.scheduledLabel} with {bookingOutcome.tutorName}
            </p>
            <p className={styles.resultMeta}>
              Hold amount: {bookingOutcome.priceLabel}. Request expires at{" "}
              {bookingOutcome.requestExpiresLabel}.
            </p>
            <p className={styles.resultMeta}>
              Lesson status: {bookingOutcome.lessonStatus}. Payment status:{" "}
              {bookingOutcome.paymentStatus}.
            </p>
          </div>
          <div className={styles.actionRow}>
            <Link className={getButtonClassName()} href="/lessons">
              Open lessons
            </Link>
            {bookingContext.tutor?.profileHref ? (
              <Link
                className={getButtonClassName({ variant: "secondary" })}
                href={bookingContext.tutor.profileHref}
              >
                Back to tutor profile
              </Link>
            ) : null}
          </div>
        </Panel>
      ) : null}

      <div className={styles.surfaceGrid}>
        <div className={styles.primaryColumn}>
          {bookingContext.tutor ? (
            <PersonSummary
              badges={[
                {
                  label:
                    bookingContext.source === "match_candidate"
                      ? "Match context preserved"
                      : "Tutor profile handoff",
                  tone: "trust",
                },
                {
                  label: bookingContext.tutor.acceptingNewStudents
                    ? "Accepting requests"
                    : "Requests paused",
                  tone: bookingContext.tutor.acceptingNewStudents ? "positive" : "warning",
                },
              ]}
              descriptor={
                bookingContext.tutor.headline ??
                bookingContext.tutor.bestForSummary ??
                "Tutor summary stays visible during booking."
              }
              eyebrow="Tutor"
              meta={[
                `Tutor timezone · ${bookingContext.tutor.timezone}`,
                ...(bookingContext.tutor.languages.length > 0
                  ? [`Lesson languages · ${bookingContext.tutor.languages.join(", ")}`]
                  : []),
                ...(bookingContext.tutor.pricingSummary
                  ? [`Pricing summary · ${bookingContext.tutor.pricingSummary}`]
                  : []),
              ]}
              name={bookingContext.tutor.displayName}
              variant="header"
            />
          ) : null}

          {bookingContext.status === "needs_learning_need" ? (
            <Panel
              description="Booking needs a live student need so the lesson stays tied to the right IB context."
              title="Start with your current need"
              tone="mist"
            >
              <div className={styles.statusCard}>
                <p>
                  Complete the guided match first, then come back into booking with that
                  current need attached.
                </p>
                <div className={styles.actionRow}>
                  <Link className={getButtonClassName()} href="/match">
                    Build learning need
                  </Link>
                </div>
              </div>
            </Panel>
          ) : null}

          {bookingContext.status === "not_accepting_requests" ? (
            <InlineNotice title="Tutor unavailable" tone="warning">
              <p>This tutor isn&apos;t taking new lesson requests right now.</p>
            </InlineNotice>
          ) : null}

          {bookingContext.status === "pricing_unavailable" ? (
            <InlineNotice title="Pricing incomplete" tone="warning">
              <p>
                This tutor&apos;s pricing summary isn&apos;t ready for Stripe Checkout yet, so
                the lesson request stays blocked.
              </p>
            </InlineNotice>
          ) : null}

          {bookingContext.status === "no_slots" ? (
            <InlineNotice title="No live slots right now" tone="warning">
              <p>
                We couldn&apos;t find a bookable slot inside the current notice window and
                conflict rules.
              </p>
            </InlineNotice>
          ) : null}

          {showForm && bookingContext.priceLabel ? (
            <Panel
              description="Choose one live slot, add an optional lesson note, and continue into Stripe Checkout for authorization."
              title="Request lesson"
            >
              <BookingForm
                context={context}
                initialNote={bookingContext.notePrefill}
                operationKey={crypto.randomUUID()}
                priceLabel={bookingContext.priceLabel}
                slotOptions={bookingContext.slotOptions}
              />
            </Panel>
          ) : null}
        </div>

        <aside className={styles.sidebar}>
          <Panel
            description="The request and payment boundaries stay explicit before the tutor sees the lesson."
            title="Booking summary"
            tone="raised"
          >
            <div className={styles.summaryCard}>
              <div className={styles.metricGrid}>
                <div className={styles.metricCard}>
                  <p className={styles.metricLabel}>Lesson length</p>
                  <p className={styles.metricValue}>
                    {bookingContext.sessionDurationMinutes} minutes
                  </p>
                </div>
                <div className={styles.metricCard}>
                  <p className={styles.metricLabel}>Authorization</p>
                  <p className={styles.metricValue}>
                    {bookingContext.priceLabel ?? "Pricing not ready"}
                  </p>
                </div>
                <div className={styles.metricCard}>
                  <p className={styles.metricLabel}>Current slot count</p>
                  <p className={styles.metricValue}>{bookingContext.slotOptions.length}</p>
                </div>
              </div>

              <ul className={styles.policyList}>
                {bookingContext.bookingPolicy.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </Panel>

          {bookingContext.tutor?.bestForSummary ? (
            <Panel
              description="This stays visible during booking so fit still leads the decision."
              title="Best for"
              tone="mist"
            >
              <p className={styles.muted}>{bookingContext.tutor.bestForSummary}</p>
            </Panel>
          ) : null}
        </aside>
      </div>
    </article>
  );
}

function renderConfigurationState(context: string) {
  return (
    <Panel
      description={`Booking context "${context}" is ready for the real flow, but local auth and Stripe are not configured yet.`}
      title="Booking configuration required"
      tone="mist"
    >
      <div className={styles.configCard}>
        <p>
          Enable the Supabase auth environment variables and Stripe secret key to run the
          real booking request flow end to end.
        </p>
      </div>
    </Panel>
  );
}

function getSearchParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}
