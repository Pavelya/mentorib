import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SeoLandingPage } from "@/app/(public)/_seo-landing/seo-landing-page";
import { buildRouteMetadata } from "@/lib/seo/metadata/build-metadata";
import { getServiceLandingPageData } from "@/modules/marketing/seo-landing/page-data";

type ServiceLandingPageProps = {
  params: Promise<{ "need-slug": string }>;
};

export async function generateMetadata({
  params,
}: ServiceLandingPageProps): Promise<Metadata> {
  const { "need-slug": slug } = await params;
  const data = await getServiceLandingPageData(slug);

  if (!data || !data.gate.isPublishable) {
    return buildRouteMetadata({
      description: "This service page is not currently available.",
      isIndexable: false,
      pathname: `/services/${slug}`,
      title: "Service page not available",
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

export default async function ServiceLandingPage({
  params,
}: ServiceLandingPageProps) {
  const { "need-slug": slug } = await params;
  const data = await getServiceLandingPageData(slug);

  if (!data || !data.gate.isPublishable) {
    notFound();
  }

  return <SeoLandingPage data={data} kind="service" />;
}
