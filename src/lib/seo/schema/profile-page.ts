import { buildCanonicalUrl } from "@/lib/seo/metadata/canonical";
import { buildAbsoluteUrl, siteConfig } from "@/lib/seo/site";

type BuildProfilePageSchemaInput = {
  description: string;
  imageUrl: string;
  name: string;
  pathname: string;
  subjects: string[];
};

export function buildProfilePageSchema({
  name,
  description,
  pathname,
  imageUrl,
  subjects,
}: BuildProfilePageSchemaInput) {
  const canonical = buildCanonicalUrl(pathname).toString();
  const personId = `${canonical}#person`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": canonical,
        "@type": "ProfilePage",
        about: {
          "@id": personId,
        },
        description,
        isPartOf: {
          "@type": "WebSite",
          name: siteConfig.name,
          url: buildAbsoluteUrl("/").toString(),
        },
        name,
        url: canonical,
      },
      {
        "@id": personId,
        "@type": "Person",
        description,
        image: imageUrl,
        knowsAbout: subjects,
        name,
        url: canonical,
      },
    ],
  };
}
