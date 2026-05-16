import { algoliasearch } from "algoliasearch";

import {
  getAlgoliaAppId,
  getAlgoliaSearchOnlyKey,
} from "@/lib/algolia/env";

type AlgoliaSearchClient = ReturnType<typeof algoliasearch>;

let cachedClient: AlgoliaSearchClient | null = null;

// Browser-safe client backed by the search-only API key. Returns null when
// the public credentials are absent so the page can render an unconfigured
// empty state instead of throwing.
export function getAlgoliaSearchClient(): AlgoliaSearchClient | null {
  if (cachedClient) {
    return cachedClient;
  }
  const appId = getAlgoliaAppId();
  const searchKey = getAlgoliaSearchOnlyKey();
  if (!appId || !searchKey) {
    return null;
  }
  cachedClient = algoliasearch(appId, searchKey);
  return cachedClient;
}
