# Mentor IB Search Platform Decision v1

**Date:** 2026-04-08
**Status:** Standalone architecture decision for Postgres-first search versus Algolia-from-day-one adoption
**Scope:** platform choice for public browse search, relationship to matching, MVP cost and complexity tradeoffs, migration risk, and recommended direction

## 1. Why This Document Exists

This document answers one specific architecture question:

- should Mentor IB use Algolia from the beginning, or keep search on Postgres first and add Algolia only if real need appears later

This matters because the product now has:

- a defined match-first model
- a defined search/query contract
- a future AI-agent implementation workflow
- a desire to avoid painful platform rewrites later

## 2. What This Document Does Not Redefine

This document does not replace:

- `docs/architecture/search-and-query-architecture-v1.md`
- `docs/architecture/matching-and-ranking-architecture-v1.md`
- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/configuration-and-governance-architecture-v1.md`

It only decides the platform direction for search infrastructure.

## 3. Decision Summary

The recommended direction is:

- do **not** make Algolia a day-one MVP dependency
- keep `matching` and `ranking` on Postgres and application-owned logic
- keep `public browse search` on a Postgres-backed query/read model first
- make the query layer `Algolia-ready` through a stable adapter boundary
- reconsider Algolia later only if real usage proves that Postgres-first browse search is no longer enough

Short version:

**Design for Algolia later, but do not pay the complexity cost on day one unless browse search becomes strategically important enough to justify it.**

## 4. The Most Important Boundary

## 4.1 Algolia is only a candidate for browse search

Even if Algolia is adopted later, it should not become the core owner of:

- guided matching
- booking logic
- trust/rating calculations
- availability computation
- eligibility gating

Those remain application-owned and Postgres-backed.

## 4.2 What Algolia could own later

If adopted later, Algolia would be most appropriate for:

- public tutor browse search
- typo-tolerant name and label search
- faceted narrowing on public discovery fields
- maybe selected searchable facet values

That is a narrower role than "owning search for the whole product."

## 5. Option A: Postgres-First MVP

## 5.1 What it means

Use:

- Postgres-backed discovery read model
- SQL filtering
- optional built-in full-text search where useful
- optional `pg_trgm` typo tolerance for narrow public search fields
- application-owned query adapters

## 5.2 Why it fits the product

This fits because the product is:

- match-first
- structurally filtered
- small in tutor volume for MVP
- not dependent on global consumer-style search as the main user promise

## 5.3 Strengths

- fewer moving parts
- no sync pipeline to a second search store
- no second public data surface to secure
- no production dependency on a separate search vendor
- easier to reason about data freshness for trust and availability

## 5.4 Weaknesses

- weaker typo tolerance out of the box than Algolia
- less polished faceting UX unless built carefully
- fewer instant-search conveniences out of the box
- later tuning for larger browse-search volume may require more work

## 6. Option B: Algolia From Day One

## 6.1 What it means

Use Algolia immediately for public browse search and results refinement search.

That would require:

- an Algolia index record shape
- a sync pipeline from canonical product data into Algolia
- search settings for searchable attributes, faceting, synonyms, and typo tolerance
- frontend query integration using search-only or secured search keys

## 6.2 Strengths

- strong typo tolerance and search UX from the beginning
- good faceting and filter support
- fast perceived search performance
- less search-tuning work in the application for browse-specific behavior

## 6.3 Weaknesses

- adds a second system of record for discovery data
- requires index-sync design on day one
- increases vendor surface area and privacy/security review
- still does not replace the need for Postgres-backed matching
- can create pressure to overuse search instead of preserving the match-first product

## 7. Actual Cost Reality

Current official pricing indicates:

- Algolia `Build` offers a generous free development playground, but is intended for development, not public production
- Algolia `Grow` and `Grow Plus` include monthly free usage in production, including `10,000 Search Requests` and `100,000 Records`

This means:

- cost is not the main reason to avoid Algolia for MVP
- complexity and architecture fit are the main reasons

## 8. Security And Privacy Reality

Algolia's official docs make two relevant points:

- search-only keys are meant to be used in frontend code
- anything in an index should be considered data you are comfortable exposing to that search surface

That means if Algolia is used:

- only public tutor discovery data should be indexed
- no private application answers, moderation data, internal trust signals, or sensitive records should be present
- secured API keys and index restrictions should still be used

This is workable, but it is another boundary the team must maintain.

## 9. What Makes Later Algolia Adoption Painful

Adding Algolia later becomes painful only if we do the wrong things now.

The real rewrite risk appears when:

- SQL query logic is scattered directly across routes and components
- there is no stable search/query service boundary
- the UI depends on database-specific behavior instead of a product query contract
- the browse UI and matching UI are mixed into one vague search concept
- the public discovery record shape is not defined clearly

## 10. What Makes Later Algolia Adoption Manageable

Adding Algolia later stays manageable if we lock the following now:

- one domain-owned query interface
- one public tutor discovery projection
- one canonical set of searchable public fields
- one canonical filter model
- one canonical result DTO returned to the UI

If those are stable, later migration is mostly:

1. build Algolia record export
2. keep it synced
3. implement an Algolia-backed adapter behind the existing query contract
4. verify ranking and filter parity
5. switch the browse-search adapter without redesigning the product

That is a contained infrastructure change, not a full UX rewrite.

## 11. What Day-One Algolia Still Would Not Solve

Even with Algolia from the beginning, the application would still need to own:

- match scoring
- availability overlap
- trust and reliability gating
- role-aware visibility rules
- booking continuity
- tutor/public eligibility checks

So Algolia does not remove the need for the hard part of the product architecture.

It mainly improves browse-search ergonomics.

## 12. Recommended Direction For Mentor IB

## 12.1 MVP

Recommended MVP direction:

- Postgres-first for search and matching
- Algolia not required at launch
- use the approved search/query contract
- keep a query-friendly discovery read model
- add light typo tolerance only where it truly improves public browse

## 12.2 Post-MVP readiness

To stay Algolia-ready without adopting it immediately:

- define the discovery record shape clearly
- keep search behavior route-scoped and explicit
- centralize synonym and searchable-field config
- keep the UI dependent on query adapters, not raw SQL behavior

## 12.3 When to flip

Reconsider Algolia when one or more of these become true:

- browse search becomes a major acquisition or conversion path
- users strongly expect typo-tolerant search beyond controlled vocabulary
- filter/facet UX becomes central enough that Algolia's strengths clearly matter
- tutor volume and browse-query traffic rise enough that Postgres-first browse becomes costly to maintain
- the team wants richer search merchandising than the current product needs

## 13. Locked Recommendation

The architecture should lock the following decisions now:

- matching remains Postgres-backed and application-owned
- Algolia is never the owner of core matching logic
- public browse search may adopt Algolia later behind the same query contract
- Algolia is not required for MVP launch
- later adoption should target public discovery search first, not the whole product

## 14. Final Recommendation

Mentor IB should **not** plug in Algolia from the very beginning by default.

The better direction is:

- keep the current Postgres-first architecture
- preserve an Algolia-ready query adapter boundary
- revisit Algolia only when browse search proves it deserves a dedicated engine

This gives you the best balance of:

- low complexity now
- no expensive architectural lock-in
- no forced rewrite later if Algolia becomes worthwhile

## 15. Official Source Notes

The recommendation above is informed by current official documentation for:

- Algolia pricing: `https://www.algolia.com/pricing`
- Algolia API keys: `https://www.algolia.com/doc/guides/security/api-keys`
- Algolia security best practices: `https://www.algolia.com/doc/guides/security/security-best-practices`
- Algolia indexing: `https://www.algolia.com/doc/framework-integration/rails/indexing/indexing`
- Algolia typo tolerance: `https://www.algolia.com/doc/api-reference/api-parameters/typoTolerance`
- Algolia configurable typo tolerance: `https://www.algolia.com/doc/guides/managing-results/optimize-search-results/typo-tolerance/in-depth/configuring-typo-tolerance`
- Algolia searchable attributes: `https://www.algolia.com/doc/api-reference/api-parameters/searchableAttributes`
- Algolia filters: `https://www.algolia.com/doc/api-reference/api-parameters/filters`
- Algolia attributes for faceting: `https://www.algolia.com/doc/api-reference/api-parameters/attributesForFaceting`
- PostgreSQL full text search: `https://www.postgresql.org/docs/current/textsearch.html`
- PostgreSQL `pg_trgm`: `https://www.postgresql.org/docs/current/pgtrgm.html`
