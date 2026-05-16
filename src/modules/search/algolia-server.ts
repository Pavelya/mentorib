import "server-only";

import { algoliasearch } from "algoliasearch";

import {
  getAlgoliaAdminApiKey,
  getAlgoliaAppIdOrThrow,
} from "@/lib/algolia/env";

type AlgoliaServerClient = ReturnType<typeof algoliasearch>;

let cachedClient: AlgoliaServerClient | null = null;

// Returns the server-only admin client. Calls fail loudly when admin
// credentials are missing because mutations must never silently no-op.
export function getAlgoliaAdminClient(): AlgoliaServerClient {
  if (cachedClient) {
    return cachedClient;
  }
  cachedClient = algoliasearch(getAlgoliaAppIdOrThrow(), getAlgoliaAdminApiKey());
  return cachedClient;
}
