import type { Metadata, Route } from "next";
import Link from "next/link";

import { getButtonClassName, StatusBadge } from "@/components/ui";
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

import styles from "./home.module.css";

const routeDefinition = staticPublicRouteDefinitions.home;

export const metadata: Metadata = buildStaticPublicRouteMetadata(routeDefinition);

const pressurePoints = [
  { label: "IA feedback", tone: "active" },
  { label: "TOK essay", tone: "default" },
  { label: "IO practice", tone: "default" },
  { label: "EE planning", tone: "default" },
  { label: "HL exam rescue", tone: "warm" },
  { label: "Weekly support", tone: "gold" },
] as const;

const matchingSteps = [
  "Name the IB pressure point that needs attention now.",
  "Review ranked tutor fits with clear reasons and availability overlap.",
  "Move into booking, messages, and lessons with the context still attached.",
] as const;

const reassurancePoints = [
  "IB-specific tutors and scenario-led fit language",
  "Visible trust proof before a profile deep dive",
  "Timezone-aware booking and shared message continuity",
] as const;

const sampleMatches = [
  {
    badges: [
      { label: "Best fit", tone: "positive" },
      { label: "42 reviews", tone: "trust" },
    ],
    bullets: [
      "Strong written feedback language for English A HL and commentary planning.",
      "Open evening overlap for Europe and Middle East timezones this week.",
    ],
    descriptor: "English A, TOK, EE guidance",
    fit: "Best for students who need fast, clear IA structure feedback.",
    metrics: [
      { label: "Next slot", value: "Wed 18:30" },
      { label: "Trial", value: "$48" },
    ],
    name: "Ivan M.",
    profileHref: "/tutors/ivan-m" as Route,
    proof: "4.9 rating - verified credentials",
  },
  {
    badges: [{ label: "Structured thinker", tone: "info" }],
    bullets: [
      "Good for students who need a calm TOK or oral-practice plan.",
      "Strong review proof for turning vague drafts into next steps.",
    ],
    descriptor: "TOK essay, oral prep, weekly support",
    fit: "Best for students who need structured thinking and calm explanation.",
    metrics: [
      { label: "Availability", value: "Thu 16:00" },
      { label: "Lesson", value: "$52" },
    ],
    name: "Alicia R.",
    profileHref: "/tutors/alicia-r" as Route,
    proof: "4.8 rating - strong review proof",
  },
] as const;

const trustProof = [
  {
    body: "Tutors are framed by the exact scenarios they solve, not generic subject labels alone.",
    title: "IB-specific context",
  },
  {
    body: "Students can see why a tutor was surfaced before committing time to a profile.",
    title: "Visible fit reasoning",
  },
  {
    body: "Booking, lessons, and messages preserve one shared context instead of splitting the journey.",
    title: "Safe continuity",
  },
] as const;

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

        <section aria-labelledby="home-title" className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>IB-native matching</p>
            <h1 className={styles.title} id="home-title">
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
                <li
                  className={[styles.pressureChip, styles[point.tone]]
                    .filter(Boolean)
                    .join(" ")}
                  key={point.label}
                >
                  {point.label}
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
          <div className={styles.bandPanel}>
            <p className={styles.sectionEyebrow}>How matching works</p>
            <h2>Three calm steps, not a giant marketplace.</h2>
            <ol>
              {matchingSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div className={[styles.bandPanel, styles.warmPanel].join(" ")}>
            <p className={styles.sectionEyebrow}>Trust and reassurance</p>
            <h2>Built for careful decisions, not quick clicks.</h2>
            <ul>
              {reassurancePoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="sample-matches-title" className={styles.matchSection}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Sample matches</p>
              <h2 id="sample-matches-title">
                Discovery is a fit row, not a tutor card wall.
              </h2>
            </div>
            <Link
              className={getButtonClassName({ variant: "secondary" })}
              href="/results"
            >
              See results view
            </Link>
          </div>

          <div className={styles.matchRows}>
            {sampleMatches.map((match) => (
              <article className={styles.matchRow} key={match.name}>
                <div className={styles.matchPerson}>
                  <div aria-hidden="true" className={styles.avatar}>
                    {getInitials(match.name)}
                  </div>
                  <div>
                    <h3>{match.name}</h3>
                    <p>
                      {match.descriptor}
                      <br />
                      {match.proof}
                    </p>
                  </div>
                  <div className={styles.badgeRow}>
                    {match.badges.map((badge) => (
                      <StatusBadge key={badge.label} tone={badge.tone}>
                        {badge.label}
                      </StatusBadge>
                    ))}
                  </div>
                </div>

                <div className={styles.fitBlock}>
                  <p className={styles.fitStatement}>{match.fit}</p>
                  <ul>
                    {match.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.matchActionBlock}>
                  <dl className={styles.metrics}>
                    {match.metrics.map((metric) => (
                      <div key={metric.label}>
                        <dt>{metric.label}</dt>
                        <dd>{metric.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className={styles.matchActions}>
                    <Link
                      className={getButtonClassName({
                        size: "compact",
                        variant: "secondary",
                      })}
                      href="/compare"
                    >
                      Compare
                    </Link>
                    <Link
                      className={getButtonClassName({ size: "compact" })}
                      href={match.profileHref}
                    >
                      View profile
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="trust-proof-title" className={styles.trustSection}>
          <div>
            <p className={styles.sectionEyebrow}>Trust proof</p>
            <h2 id="trust-proof-title">Specific enough to support a real decision.</h2>
          </div>

          <div className={styles.trustGrid}>
            {trustProof.map((item) => (
              <div className={styles.trustItem} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.finalCta} aria-labelledby="home-final-title">
          <div>
            <p className={styles.darkEyebrow}>Start with the situation</p>
            <h2 id="home-final-title">Turn the IB pressure point into a shortlist.</h2>
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
    <section
      aria-labelledby="student-continuation-title"
      className={styles.continuationPanel}
    >
      <div>
        <p className={styles.sectionEyebrow}>{greeting}</p>
        <h2 id="student-continuation-title">Continue your IB match plan.</h2>
        <p>
          Resume matching, review fit results, or jump back into lessons from the
          same account.
        </p>
      </div>
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

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getFirstName(name: string | null) {
  return name?.trim().split(/\s+/)[0] ?? null;
}
