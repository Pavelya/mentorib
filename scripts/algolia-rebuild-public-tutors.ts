#!/usr/bin/env tsx
// One-shot rebuild of the public tutor search index. Reads every currently
// eligible tutor (approved + public_visible + listed) through the same
// canonical sources used by the public profile route and pushes them to
// Algolia. Use this when bootstrapping a new environment or after a schema
// migration that changes the record shape.
//
// Usage:
//   pnpm tsx scripts/algolia-rebuild-public-tutors.ts
//
// Required env vars (loaded from `.env.local` automatically by Next builds
// but must be set in the shell for this standalone script):
//   - NEXT_PUBLIC_ALGOLIA_APP_ID
//   - NEXT_PUBLIC_ALGOLIA_TUTORS_INDEX
//   - ALGOLIA_ADMIN_API_KEY
//   - NEXT_PUBLIC_SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY

import process from "node:process";

import { algoliasearch } from "algoliasearch";

import { listEligiblePublicTutorRecords } from "../src/modules/search/public-tutor-indexer";

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

  const records = await listEligiblePublicTutorRecords();
  console.log(`Building ${records.length} record(s) for ${indexName}.`);

  const client = algoliasearch(appId, adminKey);
  if (records.length === 0) {
    await client.clearObjects({ indexName });
    console.log(`Cleared ${indexName} — no eligible tutors right now.`);
    return;
  }

  await client.replaceAllObjects({ indexName, objects: records });
  console.log(`Pushed ${records.length} record(s) to ${indexName}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
