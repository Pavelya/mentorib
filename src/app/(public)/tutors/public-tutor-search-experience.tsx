"use client";

import posthog from "posthog-js";
import type { ChangeEvent, ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import {
  MatchRow,
  ScreenState,
  type BrowseTutorRowDto,
} from "@/components/continuity";
import {
  Chip,
  Flag,
  TextField,
  getButtonClassName,
} from "@/components/ui";
import type { FlagCode } from "@/components/ui";
import { getAlgoliaSearchClient } from "@/modules/search/algolia-search-client";
import { getAlgoliaTutorsIndexName } from "@/lib/algolia/env";
import type { PublicTutorSearchFilterOptions } from "@/modules/search/public-tutor-filters";

import styles from "./tutors-index.module.css";

const HITS_PER_PAGE = 12;

type AlgoliaPublicTutorHit = {
  objectID: string;
  slug: string;
  displayName: string;
  headline: string | null;
  bioPreview: string | null;
  subjects: string[];
  focusAreas: string[];
  languages: string[];
  languageFlagCodes: FlagCode[];
  priceRangeLabel: string | null;
  averageRating: number | null;
  reviewCount: number;
  hasFeaturedRating: boolean;
  hasExaminerBadge: boolean;
  hasIntroVideo: boolean;
  acceptingNewStudents: boolean;
};

type SearchResultState = {
  hits: BrowseTutorRowDto[];
  nbHits: number;
  nbPages: number;
  page: number;
  loading: boolean;
  error: string | null;
};

type FilterState = {
  query: string;
  subject: string | null;
  language: string | null;
  level: string | null;
  page: number;
};

const INITIAL_RESULT_STATE: SearchResultState = {
  hits: [],
  nbHits: 0,
  nbPages: 0,
  page: 0,
  loading: true,
  error: null,
};

const UNCONFIGURED_RESULT_STATE: SearchResultState = {
  hits: [],
  nbHits: 0,
  nbPages: 0,
  page: 0,
  loading: false,
  error: "Search isn't configured in this environment.",
};

// URL is the single source of truth for filter state. The SSR snapshot is
// always the default — that way server and client first-render match even
// when the URL carries query/filter values, which prevents hydration
// mismatches on the filter chips. After hydration, `useSyncExternalStore`
// re-reads from the URL via `getUrlFiltersSnapshot` and renders the deep-
// linked state.
const DEFAULT_FILTERS: FilterState = {
  query: "",
  subject: null,
  language: null,
  level: null,
  page: 0,
};

const URL_FILTER_CHANGE_EVENT = "mentorib:url-filter-change";

function getDefaultFilters(): FilterState {
  return DEFAULT_FILTERS;
}

function readSearchParams(): FilterState {
  if (typeof window === "undefined") {
    return DEFAULT_FILTERS;
  }
  const params = new URLSearchParams(window.location.search);
  const rawPage = Number.parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage - 1 : 0;
  return {
    query: params.get("q") ?? "",
    subject: params.get("subject") || null,
    language: params.get("language") || null,
    level: params.get("level") || null,
    page,
  };
}

// `useSyncExternalStore` requires `getSnapshot` to return a stable reference
// when nothing has changed, otherwise React loops. Cache by `location.search`.
let cachedSearch: string | null = null;
let cachedFilters: FilterState = DEFAULT_FILTERS;

function getUrlFiltersSnapshot(): FilterState {
  if (typeof window === "undefined") {
    return DEFAULT_FILTERS;
  }
  const search = window.location.search;
  if (cachedSearch === search) {
    return cachedFilters;
  }
  cachedSearch = search;
  cachedFilters = readSearchParams();
  return cachedFilters;
}

function subscribeToUrlFilters(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("popstate", callback);
  window.addEventListener(URL_FILTER_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(URL_FILTER_CHANGE_EVENT, callback);
  };
}

function setUrlFilters(
  updater: FilterState | ((current: FilterState) => FilterState),
) {
  const current = getUrlFiltersSnapshot();
  const next =
    typeof updater === "function"
      ? (updater as (c: FilterState) => FilterState)(current)
      : updater;
  commitUrlFilters(next);
}

function commitUrlFilters(filters: FilterState) {
  if (typeof window === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  const params = url.searchParams;
  setOrDelete(params, "q", filters.query.trim() || null);
  setOrDelete(params, "subject", filters.subject);
  setOrDelete(params, "language", filters.language);
  setOrDelete(params, "level", filters.level);
  setOrDelete(params, "page", filters.page > 0 ? String(filters.page + 1) : null);
  const nextSearch = params.toString();
  const nextUrl = nextSearch ? `${url.pathname}?${nextSearch}` : url.pathname;
  window.history.replaceState(window.history.state, "", nextUrl);
  // Invalidate the snapshot cache before fanning out so the next
  // `getUrlFiltersSnapshot()` reflects the write.
  cachedSearch = null;
  window.dispatchEvent(new Event(URL_FILTER_CHANGE_EVENT));
}

function setOrDelete(params: URLSearchParams, key: string, value: string | null) {
  if (value && value.length > 0) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
}

function captureSearchEvent(eventName: string, properties: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    posthog.capture(eventName, properties);
  } catch {
    // PostHog may be uninitialized in dev/test. Capture errors must never
    // bubble up to the UI.
  }
}

function toBrowseRow(hit: AlgoliaPublicTutorHit): BrowseTutorRowDto {
  return {
    objectId: hit.objectID,
    slug: hit.slug,
    displayName: hit.displayName,
    headline: hit.headline,
    bioPreview: hit.bioPreview,
    subjects: hit.subjects ?? [],
    focusAreas: hit.focusAreas ?? [],
    languages: hit.languages ?? [],
    languageFlagCodes: hit.languageFlagCodes ?? [],
    priceRangeLabel: hit.priceRangeLabel,
    averageRating: hit.averageRating,
    reviewCount: hit.reviewCount,
    hasFeaturedRating: hit.hasFeaturedRating,
    hasExaminerBadge: hit.hasExaminerBadge,
    hasIntroVideo: hit.hasIntroVideo,
    acceptingNewStudents: hit.acceptingNewStudents,
  };
}

function buildFilterExpression(filters: FilterState): string[] {
  const expressions: string[] = [];
  if (filters.subject) {
    expressions.push(`subjectSlugs:${escapeFilterValue(filters.subject)}`);
  }
  if (filters.language) {
    expressions.push(`languageCodes:${escapeFilterValue(filters.language)}`);
  }
  if (filters.level) {
    expressions.push(`focusAreaSlugs:${escapeFilterValue(filters.level)}`);
  }
  return expressions;
}

function escapeFilterValue(value: string): string {
  // Quote to handle slug values that include `-` safely with the facet
  // filter parser.
  return `"${value.replace(/"/g, '\\"')}"`;
}

type PublicTutorSearchExperienceProps = {
  filterOptions: PublicTutorSearchFilterOptions;
};

export function PublicTutorSearchExperience({
  filterOptions,
}: PublicTutorSearchExperienceProps) {
  const client = useMemo(() => getAlgoliaSearchClient(), []);
  const indexName = useMemo(() => getAlgoliaTutorsIndexName(), []);
  const isConfigured = Boolean(client && indexName);
  // The URL is the single source of truth. `useSyncExternalStore` returns
  // the SSR default on the server's first render and the URL-derived state
  // on subsequent client renders — so deep links work without a hydration
  // mismatch on the filter chips.
  const filters = useSyncExternalStore(
    subscribeToUrlFilters,
    getUrlFiltersSnapshot,
    getDefaultFilters,
  );
  const [results, setResults] = useState<SearchResultState>(() =>
    isConfigured ? INITIAL_RESULT_STATE : UNCONFIGURED_RESULT_STATE,
  );

  useEffect(() => {
    if (!client || !indexName) {
      // Initial state already reflects the unconfigured posture — nothing
      // to sync from this effect.
      return;
    }

    let cancelled = false;
    const facetFilters = buildFilterExpression(filters);

    client
      .searchSingleIndex<AlgoliaPublicTutorHit>({
        indexName,
        searchParams: {
          query: filters.query,
          page: filters.page,
          hitsPerPage: HITS_PER_PAGE,
          filters: facetFilters.join(" AND "),
        },
      })
      .then((response) => {
        if (cancelled) return;
        setResults({
          hits: (response.hits ?? []).map(toBrowseRow),
          nbHits: response.nbHits ?? 0,
          nbPages: response.nbPages ?? 0,
          page: response.page ?? 0,
          loading: false,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setResults({
          hits: [],
          nbHits: 0,
          nbPages: 0,
          page: 0,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "We couldn't load search results just now.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [client, indexName, filters]);

  // Telemetry: emit a search-performed event when query/filters change.
  useEffect(() => {
    captureSearchEvent("public_tutor_search_performed", {
      has_query: filters.query.trim().length > 0,
      subject_slug: filters.subject ?? null,
      language_code: filters.language ?? null,
      focus_area_slug: filters.level ?? null,
      page: filters.page,
    });
  }, [filters]);

  const handleQueryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setUrlFilters((current) => ({ ...current, query: value, page: 0 }));
  }, []);

  const handleToggleFilter = useCallback(
    (key: "subject" | "language" | "level", value: string) => {
      setUrlFilters((current) => {
        const isActive = current[key] === value;
        captureSearchEvent("public_tutor_search_filter_changed", {
          filter_key: key,
          filter_value: isActive ? null : value,
        });
        return { ...current, [key]: isActive ? null : value, page: 0 };
      });
    },
    [],
  );

  const handlePageChange = useCallback((nextPage: number) => {
    setUrlFilters((current) => ({ ...current, page: Math.max(0, nextPage) }));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleResultClick = useCallback(
    (hit: BrowseTutorRowDto) => {
      captureSearchEvent("public_tutor_search_result_clicked", {
        object_id: hit.objectId,
        slug: hit.slug,
        page: filters.page,
        position_on_page: results.hits.findIndex((row) => row.objectId === hit.objectId),
      });
    },
    [filters.page, results.hits],
  );

  return (
    <section
      aria-label="Public tutor search"
      className={styles.searchSurface}
    >
      <div className={styles.searchBar}>
        <TextField
          autoComplete="off"
          inputMode="search"
          label="Search tutors"
          onChange={handleQueryChange}
          placeholder="Search by tutor name, subject, or focus area"
          type="search"
          value={filters.query}
        />
      </div>

      <FilterRail
        filters={filters}
        filterOptions={filterOptions}
        onToggle={handleToggleFilter}
      />

      <ResultsList
        loading={results.loading}
        error={results.error}
        hits={results.hits}
        nbHits={results.nbHits}
        onResultClick={handleResultClick}
      />

      {results.nbPages > 1 && !results.error ? (
        <Pagination
          page={results.page}
          nbPages={results.nbPages}
          onPageChange={handlePageChange}
        />
      ) : null}
    </section>
  );
}

type FilterRailProps = {
  filters: FilterState;
  filterOptions: PublicTutorSearchFilterOptions;
  onToggle: (key: "subject" | "language" | "level", value: string) => void;
};

function FilterRail({ filters, filterOptions, onToggle }: FilterRailProps) {
  return (
    <div className={styles.filterRail}>
      <FilterGroup label="Subject">
        {filterOptions.subjects.map((option) => {
          const isActive = filters.subject === option.filterValue;
          return (
            <Chip
              key={`subject-${option.filterValue}`}
              onClick={() => onToggle("subject", option.filterValue)}
              pressed={isActive}
              tone={isActive ? "trust" : "default"}
            >
              {option.label}
            </Chip>
          );
        })}
      </FilterGroup>

      <FilterGroup label="Focus area">
        {filterOptions.focusAreas.map((option) => {
          const isActive = filters.level === option.filterValue;
          return (
            <Chip
              key={`focus-${option.filterValue}`}
              onClick={() => onToggle("level", option.filterValue)}
              pressed={isActive}
              tone={isActive ? "trust" : "default"}
            >
              {option.label}
            </Chip>
          );
        })}
      </FilterGroup>

      <FilterGroup label="Language">
        {filterOptions.languages.map((option) => {
          const isActive = filters.language === option.filterValue;
          return (
            <Chip
              key={`language-${option.filterValue}`}
              onClick={() => onToggle("language", option.filterValue)}
              pressed={isActive}
              tone={isActive ? "trust" : "default"}
            >
              {option.flagCode ? (
                <span aria-hidden="true" className={styles.languageFlag}>
                  <Flag code={option.flagCode} />
                </span>
              ) : null}
              {option.label}
            </Chip>
          );
        })}
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.filterGroup}>
      <p className={styles.filterGroupLabel}>{label}</p>
      <div className={styles.filterGroupItems}>{children}</div>
    </div>
  );
}

type ResultsListProps = {
  error: string | null;
  hits: BrowseTutorRowDto[];
  loading: boolean;
  nbHits: number;
  onResultClick: (hit: BrowseTutorRowDto) => void;
};

function ResultsList({
  error,
  hits,
  loading,
  nbHits,
  onResultClick,
}: ResultsListProps) {
  if (loading) {
    return (
      <ScreenState
        description="Searching Mentor IB's approved tutors."
        kind="loading"
        title="Loading tutors"
      />
    );
  }

  if (error) {
    return (
      <ScreenState
        description={error}
        kind="error"
        title="Search failed"
      />
    );
  }

  if (hits.length === 0) {
    return (
      <ScreenState
        description="Try widening your filters or starting the guided match flow."
        hints={[
          "Remove a filter chip to broaden the result set.",
          "Use /match for guided fit matching across the full tutor pool.",
        ]}
        kind="empty"
        title="No tutors match these filters"
      />
    );
  }

  return (
    <div aria-label="Tutor search results" className={styles.resultsList}>
      <p className={styles.resultsMeta}>
        {nbHits} {nbHits === 1 ? "tutor" : "tutors"} matched
      </p>
      <ul className={styles.resultsGrid}>
        {hits.map((hit) => (
          <li key={hit.objectId}>
            <MatchRow
              onProfileClick={() => onResultClick(hit)}
              tutor={hit}
              variant="browse"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

type PaginationProps = {
  page: number;
  nbPages: number;
  onPageChange: (nextPage: number) => void;
};

function Pagination({ page, nbPages, onPageChange }: PaginationProps) {
  const hasPrev = page > 0;
  const hasNext = page < nbPages - 1;
  return (
    <nav aria-label="Tutor search pagination" className={styles.pagination}>
      <button
        className={getButtonClassName({ size: "compact", variant: "secondary" })}
        disabled={!hasPrev}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        Previous
      </button>
      <span className={styles.paginationMeta}>
        Page {page + 1} of {nbPages}
      </span>
      <button
        className={getButtonClassName({ size: "compact", variant: "secondary" })}
        disabled={!hasNext}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        Next
      </button>
    </nav>
  );
}
