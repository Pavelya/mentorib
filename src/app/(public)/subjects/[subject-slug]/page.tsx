import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SeoLandingPage } from "@/app/(public)/_seo-landing/seo-landing-page";
import { buildRouteMetadata } from "@/lib/seo/metadata/build-metadata";
import { getSubjectLandingPageData } from "@/modules/marketing/seo-landing/page-data";

type SubjectLandingPageProps = {
  params: Promise<{ "subject-slug": string }>;
};

export async function generateMetadata({
  params,
}: SubjectLandingPageProps): Promise<Metadata> {
  const { "subject-slug": slug } = await params;
  const data = await getSubjectLandingPageData(slug);

  if (!data || !data.gate.isPublishable) {
    return buildRouteMetadata({
      description: "This subject page is not currently available.",
      isIndexable: false,
      pathname: `/subjects/${slug}`,
      title: "Subject page not available",
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

export default async function SubjectLandingPage({
  params,
}: SubjectLandingPageProps) {
  const { "subject-slug": slug } = await params;
  const data = await getSubjectLandingPageData(slug);

  if (!data || !data.gate.isPublishable) {
    notFound();
  }

  return <SeoLandingPage data={data} kind="subject" />;
}
