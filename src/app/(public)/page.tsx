import type { Metadata } from "next";
import Link from "next/link";

import { MatchRow } from "@/components/continuity";
import { Chip, getButtonClassName, Section } from "@/components/ui";
import { ensureAuthAccount } from "@/lib/auth/account-service";
import { buildStaticPublicRouteMetadata } from "@/lib/seo/metadata/build-metadata";
import { staticPublicRouteDefinitions } from "@/lib/seo/public-routes";
import { StructuredData } from "@/lib/seo/schema/json-ld";
import { buildOrganizationSchema } from "@/lib/seo/schema/organization";
import { buildWebPageSchema } from "@/lib/seo/schema/webpage";
import { buildWebSiteSchema } from "@/lib/seo/schema/website";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasRole, isRestrictedAccount } from "@/modules/accounts/account-state";
import {
  matchingSteps,
  pressurePoints,
  reassurancePoints,
  sampleMatches,
  trustProof,
} from "@/modules/marketing/home-content";

import styles from "./home.module.css";

const routeDefinition = staticPublicRouteDefinitions.home;

export const metadata: Metadata = buildStaticPublicRouteMetadata(routeDefinition);

type StudentContinuation = {
  displayName: string | null;
};

export default async function HomePage() {
  const studentContinuation = await getStudentContinuation();

  return (
    <>
      <StructuredData
        data={[
          buildWebPageSchema({
            description: routeDefinition.description,
            pathname: routeDefinition.pathname,
            title: routeDefinition.title,
          }),
          buildOrganizationSchema(routeDefinition.description),
          buildWebSiteSchema(routeDefinition.description),
        ]}
        id="home-route-structured-data"
      />

      <article className={styles.page}>
        {studentContinuation ? (
          <StudentContinuationPanel continuation={studentContinuation} />
        ) : null}

        <section aria-label="Mentor IB hero" className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>IB-native matching</p>
            <h1 className={styles.title}>
              IB help for the part that feels <span className={styles.serif}>hard</span>{" "}
              right now.
            </h1>
            <p className={styles.intro}>
              Mentor IB matches students and parents with tutors who fit the actual
              situation: IA feedback, TOK structure, oral practice, HL exam rescue,
              or steady weekly support.
            </p>

            <div className={styles.actions} aria-label="Primary home actions">
              <Link className={getButtonClassName()} href="/match">
                Get matched
              </Link>
              <Link
                className={getButtonClassName({ variant: "secondary" })}
                href="/how-it-works"
              >
                See how it works
              </Link>
            </div>

            <ul className={styles.pressureList} aria-label="Common IB pressure points">
              {pressurePoints.map((point) => (
                <li key={point.label}>
                  <Chip tone={point.tone}>{point.label}</Chip>
                </li>
              ))}
            </ul>
          </div>

          <aside aria-label="Sample decision story" className={styles.decisionStory}>
            <div>
              <p className={styles.darkEyebrow}>Sample decision story</p>
              <h2>
                From &quot;I&apos;m stuck&quot; to a tutor who{" "}
                <span className={styles.serif}>fits</span>.
              </h2>
            </div>

            <div className={styles.needStrip} aria-label="Example learning need">
              <span>Need</span>
              <strong>English A HL</strong>
              <strong>IA feedback</strong>
              <strong className={styles.urgent}>Urgent</strong>
            </div>

            <div className={styles.storyRows}>
              <div>
                <h3>Best-fit match surfaced first</h3>
                <p>
                  Strong for English A HL written commentary and fast turnaround on
                  IA structure and feedback.
                </p>
              </div>
              <div>
                <h3>Why this works</h3>
                <p>
                  Clear fit reasons, next availability, proof of IB context, and one
                  calm path to booking.
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className={styles.splitBand} aria-label="How Mentor IB matching works">
          <Section
            as="div"
            className={styles.bandPanel}
            density="compact"
            eyebrow="How matching works"
            title="Three calm steps, not a giant marketplace."
          >
            <ol>
              {matchingSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </Section>

          <Section
            as="div"
            className={[styles.bandPanel, styles.warmPanel].join(" ")}
            density="compact"
            eyebrow="Trust and reassurance"
            title="Built for careful decisions, not quick clicks."
          >
            <ul>
              {reassurancePoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </Section>
        </section>

        <Section
          action={
            <Link
              className={getButtonClassName({ variant: "secondary" })}
              href="/results"
            >
              See results view
            </Link>
          }
          aria-label="Sample matches"
          className={styles.matchSection}
          density="spacious"
          eyebrow="Sample matches"
          title="Discovery is a fit row, not a tutor card wall."
          titleAs="h2"
        >
          <div className={styles.matchRows}>
            {sampleMatches.map((match) => (
              <MatchRow key={match.candidateId} match={match} />
            ))}
          </div>
        </Section>

        <Section
          aria-label="Trust proof"
          className={styles.trustSection}
          density="spacious"
          eyebrow="Trust proof"
          title="Specific enough to support a real decision."
          titleAs="h2"
        >
          <div className={styles.trustGrid}>
            {trustProof.map((item) => (
              <div className={styles.trustItem} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <section className={styles.finalCta} aria-label="Begin matching">
          <div>
            <p className={styles.darkEyebrow}>Start with the situation</p>
            <h2>Turn the IB pressure point into a shortlist.</h2>
            <p>
              Tell Mentor IB what feels difficult, then use fit reasoning to decide
              who is worth booking.
            </p>
          </div>
          <Link className={getButtonClassName({ className: styles.finalButton })} href="/match">
            Begin matching
          </Link>
        </section>
      </article>
    </>
  );
}

async function getStudentContinuation(): Promise<StudentContinuation | null> {
  if (!isSupabaseAuthConfigured()) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return null;
    }

    const account = await ensureAuthAccount(user);
    const accountSnapshot = {
      account_status: account.account_status,
      onboarding_state: account.onboarding_state,
      primary_role_context: account.primary_role_context,
      roles: account.roles,
    };

    if (isRestrictedAccount(accountSnapshot) || !hasRole(accountSnapshot, "student")) {
      return null;
    }

    return {
      displayName: getFirstName(account.full_name),
    };
  } catch {
    return null;
  }
}

function StudentContinuationPanel({
  continuation,
}: {
  continuation: StudentContinuation;
}) {
  const greeting = continuation.displayName
    ? `Welcome back, ${continuation.displayName}`
    : "Welcome back";

  return (
    <section aria-label="Continue student session" className={styles.continuationPanel}>
      <Section
        density="compact"
        description="Resume matching, review fit results, or jump back into lessons from the same account."
        eyebrow={greeting}
        title="Continue your IB match plan."
      />
      <div className={styles.continuationActions}>
        <Link className={getButtonClassName()} href="/match">
          Resume matching
        </Link>
        <Link
          className={getButtonClassName({ variant: "secondary" })}
          href="/lessons"
        >
          View lessons
        </Link>
      </div>
    </section>
  );
}

function getFirstName(name: string | null) {
  return name?.trim().split(/\s+/)[0] ?? null;
}
