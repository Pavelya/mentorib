# Mentor IB Search And Query Architecture v1

**Date:** 2026-04-08
**Status:** Standalone architecture for search bars, browse queries, filter behavior, typo tolerance, and scaling boundaries
**Scope:** public tutor discovery search, results refinement, authenticated list filtering, conversation filtering posture, supported query types, typo-tolerance boundaries, performance posture, and later search-index transition strategy

## 1. Why This Document Exists

This document defines how search bars and query-based discovery should behave across Mentor IB.

It exists now because the product is intentionally:

- match-first
- not marketplace-first
- not generic-site-search-first

At the same time, users will still expect search-like behavior in some places.

Without an explicit search contract, teams usually drift into:

- every list getting a different search behavior
- natural-language expectations that the backend does not actually support
- slow routes caused by live joins over presentation data
- a later painful rewrite when a dedicated search engine is introduced

## 2. What This Document Does Not Redefine

This document does not replace the approved matching, IA, messaging, SEO, or performance architecture.

It inherits from:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/matching-and-ranking-architecture-v1.md`
- `docs/foundations/ia-map-two-sided.md`
- `docs/foundations/ux-object-model.md`
- `docs/architecture/message-architecture-v1.md`
- `docs/architecture/performance-and-runtime-architecture-v1.md`
- `docs/architecture/configuration-and-governance-architecture-v1.md`

It does not define:

- the exact final SQL schema
- the exact final index set
- the final ranking weights
- the final admin operator search experience

Those can come later as implementation companions.

## 3. Core Recommendation

Mentor IB should use **one query architecture with multiple constrained query surfaces**, not one magical search bar that tries to understand everything.

The practical rule is:

- guided matching is the primary discovery path
- browse search is a secondary refinement tool
- operational search bars are scoped filters over the user's own data
- generic whole-product search is not an MVP requirement
- query behavior should be explicit enough that users and implementation agents can predict what works

## 4. The Most Important Distinction

## 4.1 Matching is not search

`Matching` answers:

- given this structured learning need, who are the best tutor fits

`Search` answers:

- inside this allowed data set, which records match the user's query or filters

## 4.2 Product rule

Mentor IB should never present a search bar as though it replaces the guided matching flow.

If a user has a real academic problem but no clear tutor in mind, the product should steer them toward:

- `Get Matched`

not toward a generic text box.

## 5. Search Surfaces In The System

The product should support a small number of distinct search/query surfaces.

## 5.1 Public discovery search

Surface:

- `Browse Tutors`
- `Results / Search`

Purpose:

- let a user refine the visible tutor set when they already know what they want to narrow by

## 5.2 Match-results refinement

Surface:

- results screen after `Get Matched`

Purpose:

- let a user refine ranked matches without breaking the original learning-need context

## 5.3 Student operational filtering

Surface:

- lessons list
- saved tutors if searchable
- maybe support/history lists

Purpose:

- quickly narrow the student's own records

## 5.4 Tutor operational filtering

Surface:

- students
- lessons
- schedule or requests views

Purpose:

- quickly find records the tutor already has access to

## 5.5 Conversation list filtering

Surface:

- messages sidebar or conversation list

Purpose:

- find a conversation by participant or known context

## 5.6 Internal operator search

Surface:

- later admin and moderation tools

Purpose:

- constrained internal lookup by purpose and permission

This is not part of the public/student/tutor search contract for MVP.

## 6. MVP Search Bars That Should Exist

## 6.1 Public browse/results query bar

This is the most visible search bar in MVP.

It should exist on:

- browse tutors
- results page when the user is refining matches or open exploration

## 6.2 Tutor lessons/students filter bar

This should exist because tutors need fast operational lookup.

It should support simple high-signal filtering, not clever semantic search.

## 6.3 Student lessons filter bar

This is useful but narrow.

It should be a scoped filter over the student's own lessons and saved objects.

## 6.4 Conversation list filter

For phase 1, this should be lightweight:

- find a conversation by person or visible conversation context

Full message-body search is not phase 1.

## 7. Search Bars That Should Not Exist In MVP

The following should not be treated as MVP requirements:

- one global product-wide omnibox
- whole-message-body search
- semantic "ask anything" tutor search
- vector/LLM-powered tutor retrieval
- support-site search unless the support content volume justifies it
- public search over hidden or internal tutor fields

## 8. Public Tutor Discovery Search Behavior

## 8.1 Main rule

Public tutor discovery search should search only over **public, listable, discovery-relevant fields**.

It should not read from arbitrary raw tutor profile text or private internal state.

## 8.2 Recommended searchable fields in MVP

The browse/results query should match against:

- tutor display name
- subject labels
- component labels
- controlled scenario or pressure-point labels
- language labels
- approved public headline / best-for labels
- approved public credential labels if exposed as structured public proof

## 8.3 Recommended filter controls in MVP

Filters should do most of the heavy lifting.

Recommended structured filters:

- subject
- component
- language
- timezone overlap or region-friendly availability
- price band if introduced
- availability soon
- trust proof states exposed publicly

## 8.4 Query intent examples that should work

Examples:

- `economics`
- `math aa hl`
- `tok`
- `ee`
- `english oral`
- `spanish`
- a tutor's name such as `ivan`

## 8.5 Query intent examples that should route to matching instead

Examples:

- `I need help before my exam tomorrow`
- `my tok essay is weak and I panic during deadlines`
- `someone patient who can guide me through my IA`

Those are better handled by `Get Matched` because they describe a learning need, not a narrow browse query.

## 9. What Public Search Should Return

## 9.1 Should return

Public tutor discovery search should return tutors when the query matches:

- their name
- their structured subject/component coverage
- their structured public scenario labels
- their structured language labels
- a supported public alias or synonym

## 9.2 Should not return

Public tutor discovery search should not return tutors merely because the match appears in:

- hidden admin notes
- private application answers
- moderation history
- lesson notes
- internal trust calculations
- private reviews or reports

## 10. Typo Tolerance Posture

## 10.1 Main rule

MVP search should support **light typo tolerance**, not unlimited fuzzy interpretation.

## 10.2 What should usually work

With a trigram-backed fuzzy layer over the narrow public search fields, the system should usually recover from:

- one missing or extra character
- one transposed or nearby typo
- small name misspellings
- common IB shorthand variations

Examples that should usually work:

- `econmics`
- `phsyics`
- `englih`
- `tok essay`
- `ivan` vs a slightly misspelled tutor name

## 10.3 What should not be promised

The system should not promise reliable recovery from:

- multiple misspellings in a long query
- very noisy sentence-like queries
- unrelated words that only imply a need semantically
- non-supported abbreviations invented by users
- deep semantic similarity without shared words

Examples that should not be relied on:

- `som1 for panik before mocks`
- `good nice tutor for daughter stress`
- `ee help but not essay maybe history thing`

## 10.4 Product-language rule

Do not market the MVP search as if it were Google-like or AI-understanding search.

Call it:

- search
- browse tutors
- refine results

not:

- smart semantic tutor finder

## 11. Synonyms, Aliases, And IB Vocabulary

## 11.1 Main rule

The search layer should support a small controlled synonym map for high-value IB vocabulary.

## 11.2 Examples of supported alias families

Examples:

- `tok` <-> `theory of knowledge`
- `ee` <-> `extended essay`
- `ia` <-> `internal assessment`
- `math aa` <-> `mathematics analysis and approaches`
- `math ai` <-> `mathematics applications and interpretation`
- `hl` and `sl` where they are modeled explicitly

## 11.3 Why this should be controlled

These are product-owned vocabulary rules.

They should not be improvised through random copy matching in the UI.

## 12. Route-By-Route Query Contract

## 12.1 Home

Home should not use a generic search bar as the dominant entry pattern.

Primary entry remains:

- guided problem-led matching

Secondary entry remains:

- browse tutors

## 12.2 Browse tutors / results

This is the main public search surface.

Behavior:

- text query over discovery fields
- structured filters
- sorting
- pagination or progressive loading

## 12.3 Tutor profile

No search bar is required inside the tutor profile itself.

The profile is an evaluation surface, not a search surface.

## 12.4 Student lessons

Search/filter should work over the student's own lessons by:

- tutor name
- subject label if modeled
- lesson status
- timing filters

## 12.5 Tutor lessons

Search/filter should work over the tutor's own lesson records by:

- student name
- subject label if modeled
- lesson status
- timing filters

## 12.6 Tutor students

Search/filter should work over:

- student name
- active/inactive state
- subject relationship if modeled

## 12.7 Messages

Phase 1:

- filter conversations by participant name and visible conversation label/context

Phase 1.5 or later:

- search within conversation content if the product proves it is needed

## 13. Query Ranking Inside Search

## 13.1 Public browse ranking

Public browse search should use a stable, understandable ordering.

If there is a text query, ranking should blend:

- textual match strength
- public listability and quality gates
- trust/reliability contribution where appropriate
- optional active-need context if the user came from matching

## 13.2 Match-results refinement ranking

If the user arrives from a `LearningNeed`, the original match ranking should remain primary.

Text query or filters should refine that candidate set, not throw away the match-first model entirely.

## 13.3 Operational search ranking

Operational search does not need sophisticated ranking.

It should prefer:

- obvious exact matches first
- then partial matches
- then recent or relevant records

## 14. Performance Posture

## 14.1 Main rule

Search should be fast because it reads from a purpose-built read model, not because the product buys a search vendor too early.

## 14.2 MVP scale posture

At around `100 tutors`, the system should be fast with:

- normalized canonical data
- a discovery read projection
- proper indexes
- narrow query scope
- server-owned query composition

At this scale, slowness would usually indicate implementation mistakes, not a platform limitation.

## 14.3 Primary performance risk

The biggest risk is not the number of tutors.

The biggest risk is doing expensive live joins and availability calculations on every request against UI-shaped data.

## 14.4 Required read-model rule

The product should maintain a purpose-built tutor discovery and match projection for querying.

That projection can be:

- a view
- a denormalized table
- a materialized view later

The important rule is that search and match should read from query-friendly data, not from raw presentation fragments.

## 15. How To Avoid A Painful Future Rewrite

## 15.1 Main rule

The UI should depend on a stable **search/query contract**, not on one specific infrastructure implementation.

## 15.2 Adapter boundary

The implementation should expose a domain-owned query service interface such as:

- public tutor discovery query
- match refinement query
- tutor lessons query
- tutor students query
- conversation list query

The exact code name can change.

The rule is that routes and components should call a product query service, not database-specific search code scattered everywhere.

## 15.3 Why this matters

If later the product truly needs:

- a dedicated search index
- stronger typo tolerance
- richer text relevance
- multilingual search tuning

the underlying implementation can change while the product contract stays stable.

## 16. When To Reconsider External Search

External or specialized search should be reconsidered only when one of these becomes true:

- tutor volume grows enough that the read model and indexes are no longer sufficient
- free-text query usage becomes a major discovery path
- users strongly expect typo-tolerant and semantic text search beyond controlled vocabulary
- multilingual retrieval quality becomes a real bottleneck
- operational search needs exceed what scoped Postgres queries handle comfortably

## 17. Phase Scope Recommendation

## 17.1 Phase 1

Phase 1 should support:

- guided matching as the primary discovery path
- public tutor browse search over narrow public fields
- structured filters for browse and results
- light typo tolerance on public discovery search
- lessons/students/conversation list filtering on scoped owned data
- no full message-body search
- no global omnibox

## 17.2 Phase 1.5

Good next candidates:

- stronger denormalized read model
- improved IB synonym handling
- better conversation list filtering
- scoped message-content search if truly needed

## 17.3 Phase 2

Consider later:

- specialized text search infrastructure
- richer multilingual retrieval
- vector-assisted retrieval only if there is proven user value

## 18. Decisions To Lock Now

The architecture should lock the following decisions now:

- matching remains primary and is not replaced by generic search
- public browse search is a secondary refinement surface
- search bars are scoped by route and data ownership
- public search operates only on public, listable, structured discovery fields
- MVP typo tolerance is light and controlled, not unlimited semantic understanding
- whole-message-body search is not phase 1
- a query-friendly read model is required
- the UI should depend on a stable query contract so later infrastructure changes are not a rewrite

## 19. Final Recommendation

Mentor IB should build search as a small set of explicit, route-scoped query tools around a strong match-first core.

The recommended MVP posture is:

- `Get Matched` for real student needs
- lightweight public tutor browse search for narrowing known criteria
- scoped operational filters for user-owned records
- Postgres-backed querying over purpose-built read models
- a clean adapter boundary so future search upgrades are evolutionary, not disruptive

This keeps the experience fast now, protects the product strategy, and avoids the worst kind of future rewrite: changing both infrastructure and UX contract at the same time.

## 20. Official Source Notes

The recommendation above is informed by current official documentation for:

- PostgreSQL indexes: `https://www.postgresql.org/docs/current/indexes.html`
- PostgreSQL full text search: `https://www.postgresql.org/docs/current/textsearch.html`
- PostgreSQL `pg_trgm`: `https://www.postgresql.org/docs/current/pgtrgm.html`
- PostgreSQL materialized views: `https://www.postgresql.org/docs/current/rules-materializedviews.html`
- Supabase full text search: `https://supabase.com/docs/guides/database/full-text-search`
- Supabase query optimization: `https://supabase.com/docs/guides/database/query-optimization`
