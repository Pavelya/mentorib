import Link from "next/link";

import {
  Card,
  Chip,
  Flag,
  Panel,
  Section,
  StatusBadge,
  getButtonClassName,
} from "@/components/ui";
import { StructuredData } from "@/lib/seo/schema/json-ld";
import { buildBreadcrumbListSchema } from "@/lib/seo/schema/breadcrumb";
import { buildCourseSchema } from "@/lib/seo/schema/course";
import { buildFaqPageSchema } from "@/lib/seo/schema/faq-page";
import { buildItemListSchema } from "@/lib/seo/schema/item-list";
import { buildOfferSchema } from "@/lib/seo/schema/offer";
import { buildServiceSchema } from "@/lib/seo/schema/service";
import { buildWebPageSchema } from "@/lib/seo/schema/webpage";
import { buildAbsoluteUrl, siteConfig } from "@/lib/seo/site";
import {
  type SeoComboLandingDto,
  type SeoServiceLandingDto,
  type SeoSubjectLandingDto,
} from "@/modules/marketing/seo-landing/page-data";
import type { SeoCuratedTutorCardDto } from "@/modules/marketing/seo-landing/curated-tutors-repository";
import { getReferenceLanguageFlagCode } from "@/modules/reference/visuals";

import styles from "./seo-landing.module.css";

export type SeoLandingPageProps =
  | { kind: "subject"; data: SeoSubjectLandingDto }
  | { kind: "service"; data: SeoServiceLandingDto }
  | { kind: "combo"; data: SeoComboLandingDto };

export function SeoLandingPage(props: SeoLandingPageProps) {
  const data = props.data;
  const copy = data.copy;

  return (
    <>
      <StructuredData
        data={buildLandingStructuredData(props)}
        id={`seo-landing-structured-data-${data.copyKind}`}
      />

      <article className={styles.page}>
        <Breadcrumbs items={data.breadcrumbs} />
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <Hero data={data} />
        {props.kind === "combo" ? <ComboRationale data={props.data} /> : null}
        <FiveQuestions data={data} />
        <CuratedTutorList data={data} />
        <RelatedLinks data={data} kind={props.kind} />
        <FaqBlock data={data} />
        <FinalCta data={data} />
      </article>
    </>
  );
}

function Breadcrumbs({
  items,
}: {
  items: SeoSubjectLandingDto["breadcrumbs"];
}) {
  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.pathname}-${index}`}>
              {isLast ? (
                <a aria-current="page" href={item.pathname}>
                  {item.name}
                </a>
              ) : (
                <a href={item.pathname}>{item.name}</a>
              )}
              {!isLast ? (
                <span aria-hidden="true" className={styles.breadcrumbSeparator}>
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Hero({
  data,
}: {
  data: SeoSubjectLandingDto | SeoServiceLandingDto | SeoComboLandingDto;
}) {
  const copy = data.copy;
  return (
    <section aria-label="Page hero" className={styles.hero}>
      <div className={styles.heroCopy}>
        <h1 className={styles.heroTitle}>{copy.heroTitle}</h1>
        <p className={styles.heroIntro}>{copy.heroIntro}</p>
        <div className={styles.heroActions}>
          <Link className={getButtonClassName()} href={data.startMatchHref}>
            Get matched
          </Link>
          <Link
            className={getButtonClassName({ variant: "secondary" })}
            href="/how-it-works"
          >
            How matching works
          </Link>
        </div>
        <ul aria-label="Common pressure points" className={styles.pressureRow}>
          {copy.pressurePoints.map((label) => (
            <li key={label}>
              <Chip>{label}</Chip>
            </li>
          ))}
        </ul>
      </div>
      <aside aria-label="Live coverage" className={styles.heroAside}>
        <p className={styles.eyebrow}>This week</p>
        <dl>
          <div>
            <dt>Tutors accepting</dt>
            <dd>{data.heroAside.tutorCount}</dd>
          </div>
          <div>
            <dt>Examiners on staff</dt>
            <dd>{data.heroAside.examinerCount}</dd>
          </div>
          <div>
            <dt>Trial price range</dt>
            <dd>{data.heroAside.priceRangeLabel ?? "Set after match"}</dd>
          </div>
        </dl>
      </aside>
    </section>
  );
}

function FiveQuestions({
  data,
}: {
  data: SeoSubjectLandingDto | SeoServiceLandingDto | SeoComboLandingDto;
}) {
  return (
    <Section
      aria-label="What this is and who it's for"
      density="spacious"
      eyebrow="What this is"
      title="Five questions, answered before you book."
      titleAs="h2"
    >
      <div className={styles.fiveQuestions}>
        {data.copy.fiveAnswers.map((entry) => (
          <Card as="article" key={entry.label} variant="static">
            <p className={styles.eyebrow}>{entry.label}</p>
            <h3>{entry.title}</h3>
            <p>{entry.body}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function ComboRationale({ data }: { data: SeoComboLandingDto }) {
  return (
    <Section
      aria-label="Why this combination exists"
      density="spacious"
      eyebrow="Why this page exists"
      title={data.copy.rationale.title}
      titleAs="h2"
    >
      <p>{data.copy.rationale.body}</p>
      <ol className={styles.rationaleGrid}>
        {data.copy.rationale.pillars.map((pillar) => (
          <li key={pillar.title}>
            <Card as="article" variant="static">
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
            </Card>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function CuratedTutorList({
  data,
}: {
  data: SeoSubjectLandingDto | SeoServiceLandingDto | SeoComboLandingDto;
}) {
  if (data.curated.visibleTutors.length === 0) {
    return null;
  }

  return (
    <Section
      action={
        <Link
          className={getButtonClassName({ size: "compact", variant: "secondary" })}
          href={data.startMatchHref}
        >
          See full match
        </Link>
      }
      aria-label="Curated tutor list"
      density="spacious"
      eyebrow="Tutors who match"
      title={data.copy.ranker.listHeading}
      titleAs="h2"
      description={data.copy.ranker.listIntro}
    >
      <div className={styles.tutorList}>
        {data.curated.visibleTutors.map((tutor, index) => (
          <CuratedTutorCard key={tutor.tutorProfileId} index={index} tutor={tutor} />
        ))}
      </div>
    </Section>
  );
}

function CuratedTutorCard({
  index,
  tutor,
}: {
  index: number;
  tutor: SeoCuratedTutorCardDto;
}) {
  return (
    <article className={styles.tutorCard}>
      <div className={styles.tutorIdentity}>
        <div className={styles.tutorIdentityHeader}>
          <h3 className={styles.tutorName}>{tutor.displayName}</h3>
          {tutor.headline ? (
            <span className={styles.tutorDescriptor}>{tutor.headline}</span>
          ) : null}
        </div>
        <div className={styles.tutorBadgeRow}>
          {index === 0 ? <StatusBadge tone="trust">Top match</StatusBadge> : null}
          {tutor.examinerBadgeForScope ? (
            <StatusBadge tone="trust">IB examiner</StatusBadge>
          ) : null}
        </div>
        {tutor.languages.length > 0 ? (
          <div className={styles.languageRow} aria-label="Languages">
            {tutor.languages.map((language) => {
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
        ) : null}
      </div>
      <div className={styles.tutorFitColumn}>
        <p className={styles.tutorFitText}>
          {tutor.bio ?? "Reviews fit before booking."}
        </p>
      </div>
      <div className={styles.tutorMetricsColumn}>
        <div className={styles.tutorMetrics}>
          <div className={styles.tutorMetricRow}>
            <span>Trial</span>
            <span>{tutor.trialPriceLabel ?? "Set in match"}</span>
          </div>
          <div className={styles.tutorMetricRow}>
            <span>Hourly</span>
            <span>{tutor.hourlyRateLabel ?? "Set in match"}</span>
          </div>
        </div>
        <div className={styles.tutorActions}>
          <Link
            className={getButtonClassName({ size: "compact" })}
            href={tutor.profileHref}
          >
            View profile
          </Link>
        </div>
      </div>
    </article>
  );
}

function RelatedLinks({
  data,
  kind,
}: {
  data: SeoSubjectLandingDto | SeoServiceLandingDto | SeoComboLandingDto;
  kind: SeoLandingPageProps["kind"];
}) {
  if (kind === "subject") {
    return (
      <RelatedColumns
        leftHeading="Related services for this subject"
        leftLinks={data.copyKind === "subject" ? data.relatedServices : []}
        rightHeading="Other IB subjects to look at"
        rightLinks={data.copyKind === "subject" ? data.relatedSubjects : []}
      />
    );
  }
  if (kind === "service") {
    return (
      <RelatedColumns
        leftHeading="IB subjects this service supports"
        leftLinks={data.copyKind === "service" ? data.relatedSubjects : []}
        rightHeading="Other IB pressure points"
        rightLinks={data.copyKind === "service" ? data.relatedServices : []}
      />
    );
  }

  if (data.copyKind !== "combo") {
    return null;
  }

  return (
    <Section
      aria-label="Parent and sibling pages"
      density="spacious"
      eyebrow="Broader pages"
      title="Prefer the broader path?"
      titleAs="h2"
    >
      <div className={styles.relatedGrid}>
        <div className={styles.relatedColumn}>
          <p className={styles.eyebrow}>Subject parent</p>
          <ul className={styles.relatedList}>
            <li>
              <Link href={data.parentSubjectLink.pathname}>
                <span>
                  {data.parentSubjectLink.title}
                  {data.parentSubjectLink.description ? (
                    <span className={styles.relatedDescription}>
                      {data.parentSubjectLink.description}
                    </span>
                  ) : null}
                </span>
                <span className={styles.relatedSlug}>
                  {data.parentSubjectLink.pathname}
                </span>
              </Link>
            </li>
          </ul>
        </div>
        <div className={styles.relatedColumn}>
          <p className={styles.eyebrow}>Service parent</p>
          <ul className={styles.relatedList}>
            <li>
              <Link href={data.parentServiceLink.pathname}>
                <span>
                  {data.parentServiceLink.title}
                  {data.parentServiceLink.description ? (
                    <span className={styles.relatedDescription}>
                      {data.parentServiceLink.description}
                    </span>
                  ) : null}
                </span>
                <span className={styles.relatedSlug}>
                  {data.parentServiceLink.pathname}
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
      {data.relatedCombos.length > 0 ? (
        <Panel
          eyebrow="Other curated combinations"
          title="More high-intent pairings"
        >
          <ul className={styles.relatedList}>
            {data.relatedCombos.map((link) => (
              <li key={link.slug}>
                <Link href={link.pathname}>
                  <span>
                    {link.title}
                    {link.description ? (
                      <span className={styles.relatedDescription}>
                        {link.description}
                      </span>
                    ) : null}
                  </span>
                  <span className={styles.relatedSlug}>{link.pathname}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </Section>
  );
}

function RelatedColumns({
  leftHeading,
  leftLinks,
  rightHeading,
  rightLinks,
}: {
  leftHeading: string;
  leftLinks: SeoSubjectLandingDto["relatedServices"];
  rightHeading: string;
  rightLinks: SeoSubjectLandingDto["relatedSubjects"];
}) {
  return (
    <Section
      aria-label="Related pages"
      density="spacious"
      eyebrow="Related"
      title="Where students go from here."
      titleAs="h2"
    >
      <div className={styles.relatedGrid}>
        <div className={styles.relatedColumn}>
          <p className={styles.eyebrow}>{leftHeading}</p>
          <ul className={styles.relatedList}>
            {leftLinks.map((link) => (
              <li key={link.slug}>
                <Link href={link.pathname}>
                  <span>
                    {link.title}
                    {link.description ? (
                      <span className={styles.relatedDescription}>
                        {link.description}
                      </span>
                    ) : null}
                  </span>
                  <span className={styles.relatedSlug}>{link.pathname}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.relatedColumn}>
          <p className={styles.eyebrow}>{rightHeading}</p>
          <ul className={styles.relatedList}>
            {rightLinks.map((link) => (
              <li key={link.slug}>
                <Link href={link.pathname}>
                  <span>
                    {link.title}
                    {link.description ? (
                      <span className={styles.relatedDescription}>
                        {link.description}
                      </span>
                    ) : null}
                  </span>
                  <span className={styles.relatedSlug}>{link.pathname}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

function FaqBlock({
  data,
}: {
  data: SeoSubjectLandingDto | SeoServiceLandingDto | SeoComboLandingDto;
}) {
  return (
    <Section
      aria-label="Frequently asked questions"
      density="spacious"
      eyebrow="FAQ"
      title="What students and parents ask before booking."
      titleAs="h2"
    >
      <dl className={styles.faqList}>
        {data.copy.faq.map((entry) => (
          <div className={styles.faqItem} key={entry.question}>
            <dt>{entry.question}</dt>
            <dd>{entry.answer}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function FinalCta({
  data,
}: {
  data: SeoSubjectLandingDto | SeoServiceLandingDto | SeoComboLandingDto;
}) {
  return (
    <section aria-label="Final call to action" className={styles.finalCta}>
      <p className={styles.eyebrow}>Ready when you are</p>
      <h2>{data.copy.finalCta.title}</h2>
      <p>{data.copy.finalCta.body}</p>
      <div className={styles.finalCtaActions}>
        <Link className={getButtonClassName()} href={data.finalCtaHref}>
          Get matched
        </Link>
        <Link
          className={getButtonClassName({ variant: "secondary" })}
          href="/how-it-works"
        >
          How matching works
        </Link>
      </div>
    </section>
  );
}

function buildLandingStructuredData(props: SeoLandingPageProps) {
  const data = props.data;
  const copy = data.copy;
  const canonicalAbs = buildAbsoluteUrl(data.pathname).toString();
  void canonicalAbs;
  const providerName = siteConfig.name;
  const providerUrl = siteConfig.origin.toString().replace(/\/$/, "");

  const breadcrumb = buildBreadcrumbListSchema(data.breadcrumbs);
  const webpage = buildWebPageSchema({
    description: copy.metaDescription,
    pathname: data.pathname,
    title: copy.metaTitle,
  });
  const faq = buildFaqPageSchema(copy.faq);
  const tutorItemList =
    data.curated.visibleTutors.length > 0
      ? buildItemListSchema(
          data.curated.visibleTutors.map((tutor) => ({
            name: tutor.displayName,
            pathname: tutor.profileHref,
          })),
        )
      : null;

  const offer = data.heroAside.priceRangeLabel
    ? buildOfferSchema({
        currencyCode: data.priceRange.currencyCode,
        description: `${copy.metaTitle} — trial price range across accepting tutors.`,
        priceRangeLabel: data.heroAside.priceRangeLabel,
      })
    : null;

  const subjectOrServiceSchema = (() => {
    if (props.kind === "subject" || props.kind === "combo") {
      return buildCourseSchema({
        description: copy.metaDescription,
        name: copy.metaTitle,
        pathname: data.pathname,
        providerName,
        providerUrl,
      });
    }
    return buildServiceSchema({
      description: copy.metaDescription,
      name: copy.metaTitle,
      pathname: data.pathname,
      providerName,
      providerUrl,
      serviceType: copy.metaTitle,
    });
  })();

  return [
    breadcrumb,
    webpage,
    subjectOrServiceSchema,
    ...(offer ? [offer] : []),
    ...(tutorItemList ? [tutorItemList] : []),
    faq,
  ];
}
