import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StructuredData } from "@/lib/seo/schema/json-ld";
import { buildBreadcrumbListSchema } from "@/lib/seo/schema/breadcrumb";
import { buildProfilePageSchema } from "@/lib/seo/schema/profile-page";
import { buildRouteMetadata } from "@/lib/seo/metadata/build-metadata";
import { buildWebPageSchema } from "@/lib/seo/schema/webpage";
import { buildAbsoluteUrl } from "@/lib/seo/site";
import { evaluateTutorProfileIndexability } from "@/lib/seo/quality/public-indexability";
import {
  buildTutorProfileIndexabilityInput,
  getPublicTutorProfileBySlug,
  type PublicTutorProfileDto,
} from "@/modules/tutors/public-profile";
import { getReferenceLanguageFlagCode } from "@/modules/reference/visuals";
import {
  Avatar,
  Card,
  Chip,
  Flag,
  Panel,
  Section,
  StatusBadge,
  getButtonClassName,
} from "@/components/ui";

import styles from "./tutor-profile.module.css";

type TutorProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: TutorProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicTutorProfileBySlug(slug);

  if (!profile) {
    return buildRouteMetadata({
      description: "This Mentor IB tutor profile is not currently available.",
      isIndexable: false,
      pathname: `/tutors/${slug}`,
      title: "Tutor Profile Not Available",
      type: "profile",
    });
  }

  const qualityGate = evaluateTutorProfileIndexability(
    buildTutorProfileIndexabilityInput(profile),
  );

  return buildRouteMetadata({
    description: profile.seo.description,
    isIndexable: qualityGate.isIndexable,
    pathname: `/tutors/${profile.slug}`,
    title: profile.seo.title,
    type: "profile",
  });
}

export default async function TutorProfilePage({
  params,
}: TutorProfilePageProps) {
  const { slug } = await params;
  const profile = await getPublicTutorProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  const pathname = `/tutors/${profile.slug}`;
  const qualityGate = evaluateTutorProfileIndexability(
    buildTutorProfileIndexabilityInput(profile),
  );
  const profileSchema = qualityGate.isSchemaEligible
    ? buildProfilePageSchema({
        description: profile.seo.description,
        imageUrl:
          profile.seo.imageUrl ?? buildAbsoluteUrl("/opengraph-image").toString(),
        name: profile.displayName,
        pathname,
        subjects: profile.subjects.map((subject) => subject.subject),
      })
    : buildWebPageSchema({
        description: profile.seo.description,
        pathname,
        title: profile.seo.title,
      });

  return (
    <>
      <StructuredData
        data={[
          profileSchema,
          buildBreadcrumbListSchema([
            { name: "Home", pathname: "/" },
            { name: profile.displayName, pathname },
          ]),
        ]}
        id="tutor-profile-structured-data"
      />

      <article className={styles.page}>
        <section aria-label={`${profile.displayName} profile hero`} className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.identityRow}>
              <Avatar
                alt={profile.primaryImage?.alt}
                className={styles.profileAvatar}
                name={profile.displayName}
                size="lg"
                src={profile.primaryImage?.url}
              />
              <div className={styles.identityText}>
                <p className={styles.eyebrow}>Public tutor profile</p>
                <h1>{profile.displayName}</h1>
              </div>
            </div>

            {profile.headline ? (
              <p className={styles.headline}>{profile.headline}</p>
            ) : null}

            <p className={styles.bio}>{profile.bio}</p>

            <div className={styles.actionRow} aria-label="Tutor profile actions">
              {profile.bookingHref ? (
                <Link className={getButtonClassName()} href={profile.bookingHref}>
                  Book with {profile.displayName}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className={getButtonClassName({ className: styles.disabledAction })}
                >
                  Booking unavailable
                </span>
              )}
              <Link
                className={getButtonClassName({ variant: "secondary" })}
                href="/match"
              >
                Start matching
              </Link>
            </div>
          </div>

          <aside
            aria-label={`${profile.displayName} decision summary`}
            className={styles.summaryPanel}
          >
            <div>
              <p className={styles.darkEyebrow}>Decision cues</p>
              <h2>Fit, proof, and next steps in one place.</h2>
            </div>

            <div className={styles.badgeRow}>
              <StatusBadge tone="trust">Profile reviewed</StatusBadge>
              <StatusBadge
                tone={profile.availability.acceptingNewStudents ? "positive" : "warning"}
              >
                {profile.availability.acceptingNewStudents
                  ? "Accepting requests"
                  : "Not taking requests"}
              </StatusBadge>
              {profile.introVideo ? (
                <StatusBadge tone="info">{profile.introVideo.provider} intro</StatusBadge>
              ) : null}
            </div>

            <dl className={styles.summaryList}>
              <div>
                <dt>Best for</dt>
                <dd>{profile.bestForSummary ?? "Students reviewing fit in matching."}</dd>
              </div>
              <div>
                <dt>Availability</dt>
                <dd>{profile.availability.summary}</dd>
              </div>
              <div>
                <dt>Pricing</dt>
                <dd>{profile.pricingSummary ?? "Shown when you book."}</dd>
              </div>
            </dl>
          </aside>
        </section>

        <div className={styles.detailGrid}>
          <Panel
            eyebrow="Fit guidance"
            title="Where this tutor is strongest"
            description={
              profile.bestForSummary ??
              "Use the subject and focus areas below to decide whether this tutor fits the current IB need."
            }
          >
            {profile.subjects.length > 0 ? (
              <div className={styles.capabilityList}>
                {profile.subjects.map((capability) => (
                  <Card
                    as="article"
                    key={`${capability.subjectSlug}-${capability.focusAreaSlug}`}
                    variant="static"
                  >
                    <div className={styles.capabilityHeader}>
                      <h3>{capability.subject}</h3>
                      <p className={styles.capabilityFocus}>{capability.focusArea}</p>
                    </div>
                    {capability.experienceSummary ? (
                      <p className={styles.capabilityBody}>{capability.experienceSummary}</p>
                    ) : null}
                  </Card>
                ))}
              </div>
            ) : (
              <p className={styles.muted}>
                Subject coverage is confirmed during the matching flow.
              </p>
            )}
          </Panel>

          <Panel
            eyebrow="Teaching style"
            title="How lessons tend to feel"
            description={
              profile.teachingStyleSummary ??
              "This tutor has not added a teaching-style note yet."
            }
            tone="warm"
          >
            {profile.languages.length > 0 ? (
              <div className={styles.languageBlock}>
                <p className={styles.microLabel}>Languages</p>
                <div className={styles.languageChipRow}>
                  {profile.languages.map((language) => {
                    const flagCode = getReferenceLanguageFlagCode(language.code);
                    return (
                      <Chip key={language.code}>
                        {flagCode ? (
                          <span aria-hidden="true" className={styles.languageFlag}>
                            <Flag code={flagCode} />
                          </span>
                        ) : null}
                        {language.displayName}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </Panel>
        </div>

        <Section
          action={
            <Link
              className={getButtonClassName({ size: "compact", variant: "secondary" })}
              href="/trust-and-safety"
            >
              Trust standards
            </Link>
          }
          aria-label="Trust proof"
          className={styles.trustSection}
          density="spacious"
          eyebrow="Trust proof"
          title="Public proof without private files."
          titleAs="h2"
        >
          <div className={styles.trustGrid}>
            {profile.trustProofs.map((proof, index) => (
              <article className={styles.trustItem} key={`${proof.title}-${index}`}>
                <h3>{proof.title}</h3>
                <p>{proof.body}</p>
              </article>
            ))}
          </div>
        </Section>

        {profile.introVideo ? <IntroVideoSection profile={profile} /> : null}

        <section className={styles.finalCta} aria-label="Booking call to action">
          <div>
            <p className={styles.darkEyebrow}>Ready to decide?</p>
            <h2>Book a lesson with this tutor.</h2>
            <p>
              Review available times and confirm the lesson details on the next screen.
            </p>
          </div>
          {profile.bookingHref ? (
            <Link
              className={getButtonClassName({ className: styles.finalButton })}
              href={profile.bookingHref}
            >
              Start booking
            </Link>
          ) : (
            <Link
              className={getButtonClassName({
                className: styles.finalButton,
                variant: "secondary",
              })}
              href="/match"
            >
              Find another fit
            </Link>
          )}
        </section>
      </article>
    </>
  );
}

function IntroVideoSection({ profile }: { profile: PublicTutorProfileDto }) {
  if (!profile.introVideo) {
    return null;
  }

  return (
    <Section
      action={
        <a
          className={getButtonClassName({ size: "compact", variant: "secondary" })}
          href={profile.introVideo.watchUrl}
          rel="noreferrer"
          target="_blank"
        >
          Watch on {profile.introVideo.provider}
        </a>
      }
      aria-label={`Intro video — ${profile.displayName}`}
      className={styles.videoSection}
      density="spacious"
      eyebrow="Intro video"
      title={`Meet ${profile.displayName} before booking.`}
      titleAs="h2"
    >
      <div className={styles.videoFrame}>
        <iframe
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          src={profile.introVideo.embedUrl}
          title={profile.introVideo.title}
        />
      </div>
    </Section>
  );
}
