// Algolia configuration for the public tutor search index.
//
// Algolia powers the public browse surface at `/tutors`. Matching (`/match`,
// `/results`) stays on application-owned Postgres logic and never queries
// Algolia. See `docs/architecture/search-platform-decision-v1.md`.
//
// Public env vars (NEXT_PUBLIC_*) are safe to ship to the browser. The admin
// key is server-only and must never appear in client bundles — read it only
// through `getAlgoliaAdminApiKey()` from server contexts.

function normalize(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

// NEXT_PUBLIC_* env vars are inlined into the browser bundle only when they
// appear with literal property access. Dynamic indexing (`process.env[name]`)
// is opaque to the bundler and produces `undefined` on the client, so each
// reader below must use the literal form.

export function getAlgoliaAppId(): string | null {
  return normalize(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID);
}

export function getAlgoliaSearchOnlyKey(): string | null {
  return normalize(process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY);
}

export function getAlgoliaTutorsIndexName(): string | null {
  return normalize(process.env.NEXT_PUBLIC_ALGOLIA_TUTORS_INDEX);
}

export function isAlgoliaPublicSearchConfigured(): boolean {
  return (
    getAlgoliaAppId() !== null &&
    getAlgoliaSearchOnlyKey() !== null &&
    getAlgoliaTutorsIndexName() !== null
  );
}

export function hasAlgoliaAdminApiKey(): boolean {
  return Boolean(process.env.ALGOLIA_ADMIN_API_KEY?.trim());
}

export function getAlgoliaAdminApiKey(): string {
  const value = process.env.ALGOLIA_ADMIN_API_KEY?.trim();
  if (!value) {
    throw new Error(
      "Algolia admin client is not configured. Set ALGOLIA_ADMIN_API_KEY on the server.",
    );
  }
  return value;
}

export function getAlgoliaTutorsIndexNameOrThrow(): string {
  const value = getAlgoliaTutorsIndexName();
  if (!value) {
    throw new Error(
      "Algolia tutors index is not configured. Set NEXT_PUBLIC_ALGOLIA_TUTORS_INDEX.",
    );
  }
  return value;
}

export function getAlgoliaAppIdOrThrow(): string {
  const value = getAlgoliaAppId();
  if (!value) {
    throw new Error(
      "Algolia application ID is not configured. Set NEXT_PUBLIC_ALGOLIA_APP_ID.",
    );
  }
  return value;
}
