import "server-only";

import type { Route } from "next";

import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { formatPriceRange } from "@/modules/pricing/tutor-pricing";
import {
  loadActiveReferenceSubjectFocusAreas,
  loadActiveReferenceSubjects,
  loadReferenceSubjectBySlug,
  loadReferenceSubjectFocusAreaBySlug,
  type ReferenceSubject,
  type ReferenceSubjectFocusArea,
} from "@/modules/reference/catalog";
import {
  countExaminersForSubject,
  countExaminersForSubjectFocusArea,
} from "@/modules/tutors/examiner-credentials";
import type { TutorPriceRange } from "@/modules/tutors/price-range";
import { getTutorPriceRangeForScope } from "@/modules/tutors/price-range-repository";
import {
  getAuthoredComboCopy,
  getAuthoredServiceCopy,
  getAuthoredSubjectCopy,
  listAuthoredComboPairs,
  listAuthoredServiceSlugs,
  listAuthoredSubjectSlugs,
  type SeoComboCopy,
  type SeoServiceCopy,
  type SeoSubjectCopy,
} from "@/modules/marketing/seo-landing/authored-content";
import {
  getSeoCuratedTutorsForScope,
  type SeoCuratedTutorListDto,
} from "@/modules/marketing/seo-landing/curated-tutors-repository";
import {
  evaluateSeoLandingGate,
  type SeoLandingGateResult,
  type SeoLandingScopeKind,
} from "@/modules/marketing/seo-landing/publish-gate";

export type SeoBreadcrumbItem = {
  name: string;
  pathname: string;
};

export type SeoRelatedLink = {
  description: string | null;
  pathname: Route;
  slug: string;
  title: string;
};

export type SeoLandingHeroAside = {
  examinerCount: number;
  priceRangeLabel: string | null;
  tutorCount: number;
};

type SeoLandingBaseDto = {
  breadcrumbs: SeoBreadcrumbItem[];
  copyKind: SeoLandingScopeKind;
  curated: SeoCuratedTutorListDto;
  finalCtaHref: Route;
  gate: SeoLandingGateResult;
  heroAside: SeoLandingHeroAside;
  pathname: string;
  priceRange: TutorPriceRange;
  startMatchHref: Route;
};

export type SeoSubjectLandingDto = SeoLandingBaseDto & {
  copy: SeoSubjectCopy;
  copyKind: "subject";
  relatedServices: SeoRelatedLink[];
  relatedSubjects: SeoRelatedLink[];
  subject: ReferenceSubject;
};

export type SeoServiceLandingDto = SeoLandingBaseDto & {
  copy: SeoServiceCopy;
  copyKind: "service";
  focusArea: ReferenceSubjectFocusArea;
  relatedServices: SeoRelatedLink[];
  relatedSubjects: SeoRelatedLink[];
};

export type SeoComboLandingDto = SeoLandingBaseDto & {
  copy: SeoComboCopy;
  copyKind: "combo";
  focusArea: ReferenceSubjectFocusArea;
  parentServiceLink: SeoRelatedLink;
  parentSubjectLink: SeoRelatedLink;
  relatedCombos: SeoRelatedLink[];
  subject: ReferenceSubject;
};

const START_MATCH_HREF: Route = "/match";

export async function getSubjectLandingPageData(
  slug: string,
): Promise<SeoSubjectLandingDto | null> {
  const subject = await loadReferenceSubjectBySlug(slug);
  if (!subject) {
    return null;
  }

  const copy = getAuthoredSubjectCopy(subject.slug);
  const [priceRange, examinerCount, curated] = await Promise.all([
    getTutorPriceRangeForScope({ subjectId: subject.id }),
    countExaminersForSubject(subject.id),
    getSeoCuratedTutorsForScope({ subjectId: subject.id }),
  ]);

  const gate = evaluateSeoLandingGate({
    acceptingTutorCount: curated.acceptingTutorCount,
    hasAuthoredCopy: copy !== null,
    scope: "subject",
  });

  if (!copy) {
    return null;
  }

  const [relatedServices, relatedSubjects] = await Promise.all([
    listRelatedServicesForSubject(subject.slug),
    listRelatedSubjectsExcluding(subject.slug),
  ]);

  return {
    breadcrumbs: [
      { name: "Home", pathname: "/" },
      { name: "Subjects", pathname: `/subjects/${subject.slug}` },
      { name: subject.displayName, pathname: `/subjects/${subject.slug}` },
    ],
    copy,
    copyKind: "subject",
    curated,
    finalCtaHref: START_MATCH_HREF,
    gate,
    heroAside: {
      examinerCount,
      priceRangeLabel: buildHeroPriceRangeLabel(priceRange),
      tutorCount: curated.acceptingTutorCount,
    },
    pathname: `/subjects/${subject.slug}`,
    priceRange,
    relatedServices,
    relatedSubjects,
    startMatchHref: START_MATCH_HREF,
    subject,
  };
}

export async function getServiceLandingPageData(
  slug: string,
): Promise<SeoServiceLandingDto | null> {
  const focusArea = await loadReferenceSubjectFocusAreaBySlug(slug);
  if (!focusArea) {
    return null;
  }

  const copy = getAuthoredServiceCopy(focusArea.slug);
  const [priceRange, examinerCount, curated] = await Promise.all([
    getTutorPriceRangeForScope({ focusAreaId: focusArea.id }),
    countExaminersForSubjectFocusArea(focusArea.id),
    getSeoCuratedTutorsForScope({ focusAreaId: focusArea.id }),
  ]);

  const gate = evaluateSeoLandingGate({
    acceptingTutorCount: curated.acceptingTutorCount,
    hasAuthoredCopy: copy !== null,
    scope: "service",
  });

  if (!copy) {
    return null;
  }

  const [relatedServices, relatedSubjects] = await Promise.all([
    listRelatedServicesExcluding(focusArea.slug),
    listRelatedSubjectsForService(),
  ]);

  return {
    breadcrumbs: [
      { name: "Home", pathname: "/" },
      { name: "Services", pathname: `/services/${focusArea.slug}` },
      { name: focusArea.displayName, pathname: `/services/${focusArea.slug}` },
    ],
    copy,
    copyKind: "service",
    curated,
    finalCtaHref: START_MATCH_HREF,
    focusArea,
    gate,
    heroAside: {
      examinerCount,
      priceRangeLabel: buildHeroPriceRangeLabel(priceRange),
      tutorCount: curated.acceptingTutorCount,
    },
    pathname: `/services/${focusArea.slug}`,
    priceRange,
    relatedServices,
    relatedSubjects,
    startMatchHref: START_MATCH_HREF,
  };
}

export async function getComboLandingPageData(
  subjectSlug: string,
  needSlug: string,
): Promise<SeoComboLandingDto | null> {
  const [subject, focusArea] = await Promise.all([
    loadReferenceSubjectBySlug(subjectSlug),
    loadReferenceSubjectFocusAreaBySlug(needSlug),
  ]);
  if (!subject || !focusArea) {
    return null;
  }

  const copy = getAuthoredComboCopy(subject.slug, focusArea.slug);
  const [priceRange, examinerSubjectCount, curated] = await Promise.all([
    getTutorPriceRangeForScope({
      focusAreaId: focusArea.id,
      subjectId: subject.id,
    }),
    countExaminersForSubject(subject.id),
    getSeoCuratedTutorsForScope({
      focusAreaId: focusArea.id,
      subjectId: subject.id,
    }),
  ]);

  const gate = evaluateSeoLandingGate({
    acceptingTutorCount: curated.acceptingTutorCount,
    hasAuthoredCopy: copy !== null,
    scope: "combo",
  });

  if (!copy) {
    return null;
  }

  const subjectPathname = `/subjects/${subject.slug}` as Route;
  const servicePathname = `/services/${focusArea.slug}` as Route;
  const comboPathname = `/subjects/${subject.slug}/${focusArea.slug}`;

  return {
    breadcrumbs: [
      { name: "Home", pathname: "/" },
      { name: "Subjects", pathname: subjectPathname },
      { name: subject.displayName, pathname: subjectPathname },
      { name: focusArea.displayName, pathname: comboPathname },
    ],
    copy,
    copyKind: "combo",
    curated,
    finalCtaHref: START_MATCH_HREF,
    focusArea,
    gate,
    heroAside: {
      examinerCount: examinerSubjectCount,
      priceRangeLabel: buildHeroPriceRangeLabel(priceRange),
      tutorCount: curated.acceptingTutorCount,
    },
    parentServiceLink: {
      description: `${focusArea.displayName} support across every IB subject we cover.`,
      pathname: servicePathname,
      slug: focusArea.slug,
      title: focusArea.displayName,
    },
    parentSubjectLink: {
      description: `${subject.displayName} tutoring across every learning need we cover.`,
      pathname: subjectPathname,
      slug: subject.slug,
      title: subject.displayName,
    },
    pathname: comboPathname,
    priceRange,
    relatedCombos: await listOtherComboLinks(subject.slug, focusArea.slug),
    startMatchHref: START_MATCH_HREF,
    subject,
  };
}

export async function listPublishedSubjectSeoSlugs(): Promise<string[]> {
  if (!isSupabaseAuthConfigured()) {
    return [];
  }

  const slugs: string[] = [];
  for (const slug of listAuthoredSubjectSlugs()) {
    const data = await getSubjectLandingPageData(slug);
    if (data?.gate.isPublishable) {
      slugs.push(slug);
    }
  }
  return slugs;
}

export async function listPublishedServiceSeoSlugs(): Promise<string[]> {
  if (!isSupabaseAuthConfigured()) {
    return [];
  }

  const slugs: string[] = [];
  for (const slug of listAuthoredServiceSlugs()) {
    const data = await getServiceLandingPageData(slug);
    if (data?.gate.isPublishable) {
      slugs.push(slug);
    }
  }
  return slugs;
}

export async function listPublishedComboSeoPairs(): Promise<
  { needSlug: string; subjectSlug: string }[]
> {
  if (!isSupabaseAuthConfigured()) {
    return [];
  }

  const pairs: { needSlug: string; subjectSlug: string }[] = [];
  for (const pair of listAuthoredComboPairs()) {
    const data = await getComboLandingPageData(pair.subjectSlug, pair.needSlug);
    if (data?.gate.isPublishable) {
      pairs.push(pair);
    }
  }
  return pairs;
}

function buildHeroPriceRangeLabel(range: TutorPriceRange) {
  if (range.tutorCount === 0) {
    return null;
  }
  return formatPriceRange({
    currencyCode: range.currencyCode,
    maxMinor: range.trialMaxMinor,
    minMinor: range.trialMinMinor,
  });
}

async function listRelatedServicesForSubject(
  excludeSubjectSlug: string,
): Promise<SeoRelatedLink[]> {
  void excludeSubjectSlug;
  return await listPublishedServiceLinks();
}

async function listRelatedServicesExcluding(
  excludeSlug: string,
): Promise<SeoRelatedLink[]> {
  const all = await listPublishedServiceLinks();
  return all.filter((link) => link.slug !== excludeSlug);
}

async function listRelatedSubjectsForService(): Promise<SeoRelatedLink[]> {
  return listPublishedSubjectLinks();
}

async function listRelatedSubjectsExcluding(
  excludeSlug: string,
): Promise<SeoRelatedLink[]> {
  const all = await listPublishedSubjectLinks();
  return all.filter((link) => link.slug !== excludeSlug);
}

async function listPublishedSubjectLinks(): Promise<SeoRelatedLink[]> {
  const [authoredSlugs, allSubjects] = await Promise.all([
    Promise.resolve(listAuthoredSubjectSlugs()),
    loadActiveReferenceSubjects(),
  ]);
  const subjectsBySlug = new Map(allSubjects.map((row) => [row.slug, row]));

  return authoredSlugs
    .map((slug) => subjectsBySlug.get(slug))
    .filter((subject): subject is ReferenceSubject => Boolean(subject))
    .map((subject) => ({
      description: subject.displayDescription,
      pathname: `/subjects/${subject.slug}` as Route,
      slug: subject.slug,
      title: subject.displayName,
    }));
}

async function listPublishedServiceLinks(): Promise<SeoRelatedLink[]> {
  const [authoredSlugs, allFocusAreas] = await Promise.all([
    Promise.resolve(listAuthoredServiceSlugs()),
    loadActiveReferenceSubjectFocusAreas(),
  ]);
  const focusAreasBySlug = new Map(allFocusAreas.map((row) => [row.slug, row]));

  return authoredSlugs
    .map((slug) => focusAreasBySlug.get(slug))
    .filter((focusArea): focusArea is ReferenceSubjectFocusArea => Boolean(focusArea))
    .map((focusArea) => ({
      description: null,
      pathname: `/services/${focusArea.slug}` as Route,
      slug: focusArea.slug,
      title: focusArea.displayName,
    }));
}

async function listOtherComboLinks(
  excludeSubjectSlug: string,
  excludeNeedSlug: string,
): Promise<SeoRelatedLink[]> {
  const pairs = listAuthoredComboPairs();
  if (pairs.length === 0) {
    return [];
  }
  const [allSubjects, allFocusAreas] = await Promise.all([
    loadActiveReferenceSubjects(),
    loadActiveReferenceSubjectFocusAreas(),
  ]);
  const subjectsBySlug = new Map(allSubjects.map((row) => [row.slug, row]));
  const focusAreasBySlug = new Map(allFocusAreas.map((row) => [row.slug, row]));

  return pairs
    .filter(
      (pair) =>
        pair.subjectSlug !== excludeSubjectSlug ||
        pair.needSlug !== excludeNeedSlug,
    )
    .flatMap((pair) => {
      const subject = subjectsBySlug.get(pair.subjectSlug);
      const focusArea = focusAreasBySlug.get(pair.needSlug);
      if (!subject || !focusArea) {
        return [];
      }
      return [
        {
          description: `${subject.displayName} tutors who also coach ${focusArea.displayName}.`,
          pathname:
            `/subjects/${subject.slug}/${focusArea.slug}` as Route,
          slug: `${subject.slug}-${focusArea.slug}`,
          title: `${subject.displayName} × ${focusArea.displayName}`,
        },
      ];
    });
}
