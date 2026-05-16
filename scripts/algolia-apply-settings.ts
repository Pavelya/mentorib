#!/usr/bin/env tsx
// Applies the declarative public-tutor index settings to Algolia.
//
// Usage:
//   pnpm tsx scripts/algolia-apply-settings.ts
//
// Env vars (set in `.env.local` or the shell):
//   - NEXT_PUBLIC_ALGOLIA_APP_ID
//   - NEXT_PUBLIC_ALGOLIA_TUTORS_INDEX
//   - ALGOLIA_ADMIN_API_KEY
//
// The settings live in `src/modules/search/index-settings.ts` so the index
// configuration is checked into the repo, not configured in the dashboard.

import process from "node:process";

import { algoliasearch } from "algoliasearch";

import { PUBLIC_TUTOR_INDEX_SETTINGS } from "../src/modules/search/index-settings";

async function main() {
  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID?.trim();
  const adminKey = process.env.ALGOLIA_ADMIN_API_KEY?.trim();
  const indexName = process.env.NEXT_PUBLIC_ALGOLIA_TUTORS_INDEX?.trim();

  if (!appId || !adminKey || !indexName) {
    console.error(
      "Missing required env vars. Set NEXT_PUBLIC_ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, and NEXT_PUBLIC_ALGOLIA_TUTORS_INDEX.",
    );
    process.exit(1);
  }

  const client = algoliasearch(appId, adminKey);
  await client.setSettings({
    indexName,
    indexSettings: PUBLIC_TUTOR_INDEX_SETTINGS,
  });

  console.log(`Applied public-tutor index settings to ${indexName}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
