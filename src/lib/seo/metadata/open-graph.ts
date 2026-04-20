import { buildAbsoluteUrl, siteConfig } from "@/lib/seo/site";

type OpenGraphType = "article" | "profile" | "website";

type BuildOpenGraphInput = {
  description: string;
  pathname: string;
  title: string;
  type: OpenGraphType;
};

export function buildDefaultOpenGraphImageUrl() {
  return buildAbsoluteUrl(siteConfig.defaultOgImagePath).toString();
}

export function buildOpenGraphMetadata({
  title,
  description,
  pathname,
  type,
}: BuildOpenGraphInput) {
  const url = buildAbsoluteUrl(pathname).toString();
  const image = buildDefaultOpenGraphImageUrl();

  return {
    description,
    images: [
      {
        alt: `${title} | ${siteConfig.name}`,
        height: 630,
        url: image,
        width: 1200,
      },
    ],
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title,
    type,
    url,
  };
}

export function buildTwitterMetadata(title: string, description: string) {
  return {
    card: "summary_large_image",
    description,
    images: [buildDefaultOpenGraphImageUrl()],
    title,
  };
}
