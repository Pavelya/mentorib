import type { Metadata } from "next";

import { ScreenState } from "@/components/continuity";
import { buildRouteMetadata } from "@/lib/seo/metadata/build-metadata";
import { isAlgoliaPublicSearchConfigured } from "@/lib/algolia/env";
import {
  loadPublicTutorSearchFilterOptions,
  type PublicTutorSearchFilterOptions,
} from "@/modules/search/public-tutor-filters";

import { PublicTutorSearchExperience } from "./public-tutor-search-experience";
import styles from "./tutors-index.module.css";

type TutorsIndexPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: TutorsIndexPageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasFilterParams = hasAnyFilterParam(params);

  return buildRouteMetadata({
    description:
      "Search IB tutors on Mentor IB by subject, language, and IB focus area. Browse approved tutor profiles with public ratings, examiner credentials, and pricing.",
    // Filtered or paginated query-string variants stay noindex so we do not
    // pollute the index with every filter permutation.
    isIndexable: !hasFilterParams,
    pathname: "/tutors",
    title: "Find IB Tutors on Mentor IB",
    type: "website",
  });
}

export default async function TutorsIndexPage() {
  const filterOptions = await loadPublicTutorSearchFilterOptions();
  const isSearchConfigured = isAlgoliaPublicSearchConfigured();

  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Public tutor search</p>
        <h1>Find an IB tutor by subject, language, or focus area.</h1>
        <p className={styles.lede}>
          Search Mentor IB&apos;s approved tutors. Matching and booking still live
          inside the guided <a href="/match">match flow</a> — this page is a
          discovery surface for visitors who want to browse first.
        </p>
      </header>

      {isSearchConfigured ? (
        <PublicTutorSearchExperience filterOptions={filterOptions} />
      ) : (
        <UnconfiguredSearchState filterOptions={filterOptions} />
      )}
    </article>
  );
}

function UnconfiguredSearchState({
  filterOptions,
}: {
  filterOptions: PublicTutorSearchFilterOptions;
}) {
  const subjectCount = filterOptions.subjects.length;
  const languageCount = filterOptions.languages.length;

  return (
    <ScreenState
      description={
        <>
          Tutor search isn&apos;t configured in this environment yet. When the
          Algolia credentials are set, you&apos;ll be able to search across{" "}
          {subjectCount} subjects and {languageCount} languages.
        </>
      }
      hints={[
        "Set NEXT_PUBLIC_ALGOLIA_APP_ID, NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY, and NEXT_PUBLIC_ALGOLIA_TUTORS_INDEX.",
        "Use the guided match flow at /match to get matched today.",
      ]}
      kind="empty"
      title="Search is not configured here"
    />
  );
}

function hasAnyFilterParam(
  params: Record<string, string | string[] | undefined>,
): boolean {
  const keys = ["q", "subject", "language", "level", "page"];
  return keys.some((key) => {
    const value = params[key];
    if (Array.isArray(value)) {
      return value.some((entry) => entry && entry.trim().length > 0);
    }
    return typeof value === "string" && value.trim().length > 0;
  });
}
