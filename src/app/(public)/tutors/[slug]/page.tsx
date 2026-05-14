import type { Metadata, Route } from "next";
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
  listAuthoredServiceSlugs,
  listAuthoredSubjectSlugs,
} from "@/modules/marketing/seo-landing/authored-content";
import {
  Avatar,
  Card,
  Chip,
  Flag,
  Icon,
  InlineNotice,
  Panel,
  Section,
  StatusBadge,
  getButtonClassName,
} from "@/components/ui";
import { REVIEW_MAX_RATING } from "@/modules/reviews";
import { ensureAuthAccount } from "@/lib/auth/account-service";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getTutorShortlistContext,
  type TutorShortlistContextDto,
} from "@/modules/lessons/shortlist";
import {
  toggleCompareAction,
  toggleShortlistAction,
} from "@/modules/lessons/shortlist-actions";

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

  const shortlistContext = await loadViewerShortlistContext(profile.id);
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

            {shortlistContext ? (
              <ShortlistContextPanel
                context={shortlistContext}
                profileSlug={profile.slug}
                tutorName={profile.displayName}
              />
            ) : null}
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
              profile.bio ||
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
            eyebrow="About this tutor"
            title="How lessons tend to feel"
            description={
              profile.bio ||
              "This tutor has not added a bio yet."
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

        <ReviewSurfaceSection profile={profile} />

        {profile.introVideo ? <IntroVideoSection profile={profile} /> : null}

        <SeoLandingLinkSection profile={profile} />

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

async function loadViewerShortlistContext(
  tutorProfileId: string,
): Promise<TutorShortlistContextDto | null> {
  if (!isSupabaseAuthConfigured()) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email?.trim()) {
      return null;
    }

    const account = await ensureAuthAccount(user);

    return await getTutorShortlistContext(account, tutorProfileId);
  } catch {
    return null;
  }
}

function ShortlistContextPanel({
  context,
  profileSlug,
  tutorName,
}: {
  context: TutorShortlistContextDto;
  profileSlug: string;
  tutorName: string;
}) {
  const compareDisabled = !context.isCompared && context.isCompareFull;
  const tone = context.isCompared
    ? "success"
    : context.isShortlisted
      ? "info"
      : "info";
  const title = context.isCompared
    ? `${tutorName} is in your compare list`
    : context.isShortlisted
      ? `${tutorName} is saved on your shortlist`
      : "Save or compare this tutor";
  const summary = context.isCompareFull
    ? `Compare is full at ${context.compareCap} tutors. Remove one before adding ${tutorName}.`
    : `You can compare up to ${context.compareCap} tutors at a time. Currently comparing ${context.comparedCount}.`;
  const returnTo = `/tutors/${profileSlug}`;

  return (
    <InlineNotice
      aria-live="polite"
      className={styles.shortlistNotice}
      showToneLabel={false}
      title={title}
      tone={tone}
    >
      <p>{summary}</p>
      <div className={styles.shortlistActions}>
        <form action={toggleShortlistAction}>
          <input name="candidateId" type="hidden" value={context.candidateId} />
          <input
            name="intent"
            type="hidden"
            value={context.isShortlisted ? "remove" : "add"}
          />
          <input name="profileSlug" type="hidden" value={profileSlug} />
          <input name="returnTo" type="hidden" value={returnTo} />
          <button
            aria-pressed={context.isShortlisted}
            className={getButtonClassName({
              size: "compact",
              variant: context.isShortlisted ? "secondary" : "primary",
            })}
            type="submit"
          >
            {context.isShortlisted ? "Saved" : "Save tutor"}
          </button>
        </form>

        {compareDisabled ? (
          <button
            aria-disabled="true"
            className={getButtonClassName({ size: "compact", variant: "ghost" })}
            disabled
            type="button"
          >
            Compare full
          </button>
        ) : (
          <form action={toggleCompareAction}>
            <input name="candidateId" type="hidden" value={context.candidateId} />
            <input
              name="intent"
              type="hidden"
              value={context.isCompared ? "remove" : "add"}
            />
            <input name="profileSlug" type="hidden" value={profileSlug} />
            <input name="returnTo" type="hidden" value={returnTo} />
            <button
              aria-pressed={context.isCompared}
              className={getButtonClassName({
                size: "compact",
                variant: context.isCompared ? "secondary" : "primary",
              })}
              type="submit"
            >
              {context.isCompared ? "In compare" : "Add to compare"}
            </button>
          </form>
        )}

        <Link
          className={getButtonClassName({ size: "compact", variant: "ghost" })}
          href="/compare"
        >
          Open compare
        </Link>
      </div>
    </InlineNotice>
  );
}

function SeoLandingLinkSection({ profile }: { profile: PublicTutorProfileDto }) {
  const authoredSubjects = new Set(listAuthoredSubjectSlugs());
  const authoredServices = new Set(listAuthoredServiceSlugs());

  const subjectLinks = uniqueLinkValues(
    profile.subjects
      .filter((capability) => authoredSubjects.has(capability.subjectSlug))
      .map((capability) => ({
        href: `/subjects/${capability.subjectSlug}` as Route,
        label: capability.subject,
        slug: capability.subjectSlug,
      })),
  );
  const serviceLinks = uniqueLinkValues(
    profile.subjects
      .filter((capability) => authoredServices.has(capability.focusAreaSlug))
      .map((capability) => ({
        href: `/services/${capability.focusAreaSlug}` as Route,
        label: capability.focusArea,
        slug: capability.focusAreaSlug,
      })),
  );

  if (subjectLinks.length === 0 && serviceLinks.length === 0) {
    return null;
  }

  return (
    <Section
      aria-label="Related subject and service pages"
      density="spacious"
      eyebrow="Related pages"
      title="Browse the IB pages this tutor supports."
      titleAs="h2"
    >
      <div className={styles.relatedLinkGrid}>
        {subjectLinks.length > 0 ? (
          <div>
            <p className={styles.microLabel}>Subjects</p>
            <ul className={styles.relatedLinkList}>
              {subjectLinks.map((link) => (
                <li key={`subject-${link.slug}`}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {serviceLinks.length > 0 ? (
          <div>
            <p className={styles.microLabel}>Services</p>
            <ul className={styles.relatedLinkList}>
              {serviceLinks.map((link) => (
                <li key={`service-${link.slug}`}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

function uniqueLinkValues<T extends { slug: string }>(values: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const value of values) {
    if (seen.has(value.slug)) {
      continue;
    }
    seen.add(value.slug);
    out.push(value);
  }
  return out;
}

function ReviewSurfaceSection({ profile }: { profile: PublicTutorProfileDto }) {
  const { rating, reviews } = profile.reviewSummary;
  const hasFeatured = rating.hasPublicRating && rating.smoothedRatingValue !== null;
  const eyebrow = "Student reviews";

  return (
    <Section
      aria-label="Student reviews"
      density="spacious"
      eyebrow={eyebrow}
      title={
        hasFeatured
          ? `What students say about ${profile.displayName}.`
          : `${profile.displayName} is new to Mentor IB.`
      }
      titleAs="h2"
    >
      {hasFeatured ? (
        <FeaturedRatingBlock
          publishedReviewCount={rating.publishedReviewCount}
          smoothedRatingValue={rating.smoothedRatingValue ?? 0}
          tutorDisplayName={profile.displayName}
        />
      ) : (
        <NewTutorReviewFraming
          publishedReviewCount={rating.publishedReviewCount}
          tutorDisplayName={profile.displayName}
        />
      )}

      {reviews.length > 0 ? (
        <ul className={styles.reviewList}>
          {reviews.map((review) => (
            <li className={styles.reviewCard} key={review.id}>
              <div className={styles.reviewCardHeader}>
                <span className={styles.reviewCardReviewer}>
                  {review.reviewerLabel}
                </span>
                <ReviewStarsRow ratingValue={review.ratingValue} />
              </div>
              {review.context.subject || review.context.focus ? (
                <p className={styles.reviewCardContext}>
                  {[review.context.subject, review.context.focus]
                    .filter((label): label is string => Boolean(label))
                    .join(" · ")}
                </p>
              ) : null}
              {review.comment ? (
                <p className={styles.reviewCardComment}>{review.comment}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  );
}

function FeaturedRatingBlock({
  publishedReviewCount,
  smoothedRatingValue,
  tutorDisplayName,
}: {
  publishedReviewCount: number;
  smoothedRatingValue: number;
  tutorDisplayName: string;
}) {
  return (
    <div className={styles.reviewSummary}>
      <div className={styles.reviewHeadline}>
        <p
          aria-label={`${smoothedRatingValue.toFixed(1)} out of ${REVIEW_MAX_RATING} stars`}
          className={styles.reviewRatingValue}
        >
          {smoothedRatingValue.toFixed(1)}
        </p>
        <ReviewStarsRow ratingValue={smoothedRatingValue} />
        <p className={styles.reviewRatingMeta}>
          {publishedReviewCount}{" "}
          {publishedReviewCount === 1 ? "published review" : "published reviews"}
        </p>
      </div>
      <p className={styles.reviewRatingMeta}>
        Mentor IB stabilizes star ratings so a small number of lessons cannot skew the
        score for or against {tutorDisplayName}.
      </p>
    </div>
  );
}

function NewTutorReviewFraming({
  publishedReviewCount,
  tutorDisplayName,
}: {
  publishedReviewCount: number;
  tutorDisplayName: string;
}) {
  if (publishedReviewCount === 0) {
    return (
      <p className={styles.reviewRatingMeta}>
        {tutorDisplayName} hasn&apos;t collected published lesson reviews yet on
        Mentor IB. Trust here comes from verified credentials and approved profile
        review — not from review count.
      </p>
    );
  }

  return (
    <p className={styles.reviewRatingMeta}>
      {tutorDisplayName} has {publishedReviewCount}{" "}
      {publishedReviewCount === 1 ? "published review" : "published reviews"} so
      far. Mentor IB only foregrounds a star rating once there is enough lesson
      evidence to make it meaningful.
    </p>
  );
}

function ReviewStarsRow({ ratingValue }: { ratingValue: number }) {
  const rounded = Math.round(Math.min(Math.max(ratingValue, 0), REVIEW_MAX_RATING));

  return (
    <span
      aria-hidden="true"
      className={styles.reviewStarsRow}
    >
      {Array.from({ length: REVIEW_MAX_RATING }, (_, index) => {
        const filled = index < rounded;
        return (
          <Icon
            filled={filled}
            key={index}
            name="star"
            size={16}
          />
        );
      })}
    </span>
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
