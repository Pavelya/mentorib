import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SeoLandingPage } from "@/app/(public)/_seo-landing/seo-landing-page";
import { buildRouteMetadata } from "@/lib/seo/metadata/build-metadata";
import { getComboLandingPageData } from "@/modules/marketing/seo-landing/page-data";

type ComboLandingPageProps = {
  params: Promise<{ "need-slug": string; "subject-slug": string }>;
};

export async function generateMetadata({
  params,
}: ComboLandingPageProps): Promise<Metadata> {
  const { "subject-slug": subjectSlug, "need-slug": needSlug } = await params;
  const data = await getComboLandingPageData(subjectSlug, needSlug);

  if (!data || !data.gate.isPublishable) {
    return buildRouteMetadata({
      description: "This curated subject and service combination is not currently available.",
      isIndexable: false,
      pathname: `/subjects/${subjectSlug}/${needSlug}`,
      title: "Combination page not available",
      type: "article",
    });
  }

  return buildRouteMetadata({
    description: data.copy.metaDescription,
    isIndexable: true,
    pathname: data.pathname,
    title: data.copy.metaTitle,
    type: "article",
  });
}

export default async function ComboLandingPage({
  params,
}: ComboLandingPageProps) {
  const { "subject-slug": subjectSlug, "need-slug": needSlug } = await params;
  const data = await getComboLandingPageData(subjectSlug, needSlug);

  if (!data || !data.gate.isPublishable) {
    notFound();
  }

  return <SeoLandingPage data={data} kind="combo" />;
}
