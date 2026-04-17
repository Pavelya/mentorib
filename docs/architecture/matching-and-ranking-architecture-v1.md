# Mentor IB Matching And Ranking Architecture v1

**Date:** 2026-04-08
**Status:** Standalone architecture for tutor matching, ranking, fit explanation, and ranking-configuration control
**Scope:** match inputs, candidate filtering, weighted scoring, explanation generation, rank-configuration rules, persistence posture, trust-signal handling, and scaling path for the matching system

## 1. Why This Document Exists

This document defines how Mentor IB should turn a student's need into a ranked set of tutor fits.

It exists now because matching is one of the product's core differentiators.

The approved product is not a generic tutor directory.

It is a system that should:

- understand a real IB need
- surface a small number of likely good tutors
- explain why they fit
- preserve that context through booking and lessons

Without an explicit architecture, matching usually becomes:

- a vague sort order over tutor cards
- a hidden black box that cannot be explained
- fragile because weights and filters get scattered across many files
- hard for AI-driven implementation to extend safely

## 2. What This Document Does Not Redefine

This document does not replace the approved core, scheduling, profile, analytics, or privacy architecture.

It inherits from:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/foundations/ux-object-model.md`
- `docs/foundations/service-blueprint-two-sided.md`
- `docs/architecture/analytics-and-product-telemetry-architecture-v1.md`
- `docs/architecture/privacy-and-data-retention-architecture-v1.md`

It does not define:

- the final statistical tuning of weights
- the final rating formula in detail
- the final admin tooling for ranking changes
- the final experimentation program

Those can come later as companion artifacts.

## 3. Core Recommendation

Mentor IB should start with a deterministic, explainable, Postgres-backed matching system built around:

- hard eligibility filters
- weighted structured signals
- explicit penalties
- structured fit explanations
- one centralized ranking-configuration source

The practical rule is:

- filter first
- score second
- explain from the same signals that were actually scored
- do not use black-box ML or generic text search as the MVP ranker
- do not scatter weights across query files, components, or copy logic

## 4. Architecture Style For AI-Driven Implementation

This project is expected to be implemented largely by AI agents.

That means the matching system should be:

- explicit
- versioned
- testable
- explainable
- config-driven at the ranking-profile layer

The architecture should not rely on:

- hidden ranking heuristics inside UI components
- prompt-based ranking as the primary logic
- unstructured free-text explanation generation
- magic numbers copied into many modules

## 5. Goals

The matching and ranking architecture should:

- produce high-quality first-pass tutor fits
- keep the product's matching-first promise visible and credible
- remain understandable to users and internal operators
- preserve a clean path for tuning and scaling later
- support analytics without leaking sensitive student context

## 6. What Matching Must Actually Solve

The matching system is trying to answer one concrete question:

- given this `LearningNeed`, which tutors are both relevant and realistically bookable soon enough to be useful

That means matching must consider more than subject tags alone.

It must consider:

- need specificity
- scenario fit
- availability viability
- trust and reliability
- language and timezone realities

## 7. Canonical Input And Output Objects

## 7.1 Main input object

The canonical match input is the approved `LearningNeed`.

Relevant attributes may include:

- subject or component
- pressure-point or scenario type
- urgency
- timezone
- language preference
- support style
- desired frequency or booking intent

## 7.2 Main candidate object

The candidate side should be a normalized tutor match projection built from:

- tutor profile data
- public trust-proof state
- availability state
- language support
- reliability and responsiveness signals

The exact physical shape can vary.

The architectural rule is that the matching layer should read from structured tutor capability data, not scrape presentation text from public pages.

## 7.3 Main output object

The canonical output is a `Match`.

As already approved in the UX object model, it should include:

- fit rationale
- score or confidence label
- best-for statement
- availability overlap
- key proof signals

## 8. Candidate Filtering Architecture

## 8.1 Hard-filter rule

Before scoring, the system should apply hard eligibility filters.

These remove tutors who should not meaningfully compete for the request.

## 8.2 Recommended MVP hard filters

Phase 1 should filter at least on:

- tutor is approved to teach
- tutor is publicly listable if the flow is public matching
- subject or component coverage exists
- tutor has minimally usable profile quality
- tutor has viable availability for the need's timezone and urgency window
- tutor is not suspended, hidden, or otherwise unavailable

## 8.3 Language filter posture

Language should behave as:

- a hard filter when the student explicitly requires it
- otherwise a weighted positive signal rather than a mandatory gate

## 8.4 Price filter posture

Do not make price a universal hard filter in MVP unless the user has clearly specified a budget boundary.

The product promise is fit-first, not cheapest-first.

## 9. Signal Families

Signals should be grouped into explicit families so tuning remains understandable.

## 9.1 Need-fit signals

These capture whether the tutor is relevant to the actual academic problem.

Examples:

- subject match
- component match
- scenario or pressure-point match
- support-style fit
- best-for alignment

## 9.2 Availability and timing signals

These capture whether the tutor can realistically help soon enough.

Examples:

- timezone overlap
- next available slot proximity
- recurring overlap for weekly support
- urgency fit

## 9.3 Trust and reliability signals

These capture whether the tutor is credible and dependable.

Examples:

- approved trust proof
- review quality
- review volume
- lesson history
- responsiveness
- profile completeness

## 9.4 Communication and language signals

These capture ease of working together.

Examples:

- student-tutor language overlap
- communication-style alignment if modeled

## 9.5 Commercial signals

These are secondary supporting signals.

Examples:

- price fit if a budget exists
- trial availability later if introduced

Rule:

- commercial signals should not dominate pedagogical and availability fit in MVP

## 10. Scoring Architecture

## 10.1 Main rule

After hard filtering, the system should calculate a weighted score from normalized sub-scores.

## 10.2 Recommended MVP math posture

The MVP ranker should use a weighted deterministic formula, conceptually:

```text
total_score =
  sum(signal_weight_i * normalized_signal_i)
  - sum(penalty_weight_j * penalty_signal_j)
```

This is sufficient for the first release and is much easier to reason about than a model-driven ranker.

## 10.3 Public-score rule

Users do not need a raw hidden algorithm number.

The public UI can show:

- confidence labels
- fit reasoning
- best-for language

instead of exposing a raw numeric score directly.

## 10.4 Sub-score rule

Each signal family should be normalized independently enough that:

- one large raw field does not overwhelm the rest
- tuning can happen at the family level
- explanations can map back to the score cleanly

## 10.5 Penalty rule

Some traits should be modeled as penalties instead of absences.

Examples:

- weak near-term availability
- stale profile readiness
- limited overlap for the requested support mode

This keeps the ranker more interpretable than burying everything in one blended positive score.

## 11. Explanation Architecture

## 11.1 Main rule

Visible fit explanations should be derived from the same structured signals used in ranking.

## 11.2 No generative-first explanation rule

Do not use an LLM to invent the core fit rationale in MVP.

If language generation is ever used later, it should operate on approved structured explanation inputs, not create the reasoning from scratch.

## 11.3 Recommended explanation outputs

Each match should support:

- one best-for statement
- two or three fit reasons
- one availability or timing cue when relevant
- one trust cue when relevant

## 11.4 Truthfulness rule

The explanation layer must never claim:

- expertise that is not actually modeled
- availability that is not actually present
- verification that has not actually happened

## 11.5 Caution cue rule

If a tutor is relevant but has clear friction, the explanation model may show a limited caution cue such as:

- good fit, but fewer near-term slots
- useful for language confidence, less specialized for this exact IA need

This preserves trust better than hiding important tradeoffs.

## 12. Persistence Architecture

## 12.1 Main rule

`Match` is a first-class domain object, not only a transient UI calculation.

## 12.2 Persistence posture

The architecture should support persisting:

- the match run or evaluation context
- the ranking version used
- the ranked top results returned
- the structured explanation snapshot

This matters for:

- compare
- later booking context
- tutor-side request context
- analytics and outcome analysis

## 12.3 Do-not-overcache rule

The system should not persist every exploratory sort or page refresh as a permanent match artifact.

Persist meaningful match outputs tied to:

- a submitted `LearningNeed`
- a meaningful result set shown to the user
- later shortlist or booking flows

## 13. Ranking Configuration Architecture

## 13.1 Main rule

Ranking weights and thresholds should come from one centralized ranking profile, not from scattered hardcoded values.

## 13.2 Why this matters

This directly addresses one of the highest-risk implementation problems:

- weights duplicated in SQL
- weights duplicated in server code
- weights duplicated again in explanation copy

That drift would make the system untrustworthy and hard for AI agents to maintain.

## 13.3 Recommended MVP posture

Use one versioned ranking configuration source, owned in the application codebase or structured config layer.

It should define:

- signal families
- weights
- thresholds
- penalty rules
- confidence-band mapping

## 13.4 No admin weight editor rule

Do not build a full internal weight-editing UI in MVP.

Centralized and versioned configuration is enough.

## 13.5 Version rule

Every meaningful match result should be traceable to a ranking-profile version.

That supports:

- analytics
- debugging
- tuning reviews
- future experiments

## 14. Tie-Breaking Architecture

## 14.1 Main rule

Ties or near-ties should resolve through explicit tie-breakers rather than unstable database ordering.

## 14.2 Recommended MVP tie-breakers

Good tie-breakers include:

- stronger availability viability
- stronger trust signal quality
- stronger recent responsiveness
- deterministic stable id ordering last

## 14.3 Stability rule

A user should not see wild rank reshuffling for essentially identical conditions without an actual signal change.

## 15. Trust Signals And Rating Posture

## 15.1 Main rule

Reviews and ratings are only one trust family inside matching.

They should not dominate the whole ranker.

## 15.2 Rating-signal rule

The ranking layer should prefer a derived trust-quality signal over sorting directly by raw star average.

This derived signal can combine:

- rating average
- rating count
- lesson volume
- verification state
- reliability context

## 15.3 Sparse-review rule

Tutors with a tiny number of reviews should not outrank stronger overall fits purely because of a fragile raw average.

## 15.4 Companion-topic rule

The exact rating formula should be treated as a separate later companion topic if needed.

That companion now exists:

- `rating-and-review-trust-architecture-v1.md`

This document only locks how ratings behave inside matching:

- one trust input among several
- smoothed or derived, not naive

## 16. Availability And Time Architecture

## 16.1 Main rule

Availability fit is core to ranking, not a decorative label.

## 16.2 Recommended availability-fit signals

The ranker should consider:

- next-available time
- overlap with the student's timezone
- overlap with intended lesson cadence
- urgency fit for near-term needs

## 16.3 Snapshot rule

Ranking can use current availability, but once booking happens the lesson should preserve its own booking snapshot as already defined in scheduling architecture.

## 17. Security And Privacy Boundaries

## 17.1 Privacy rule

Matching should rely on structured need attributes, not on broadcasting raw sensitive student text through analytics or public layers.

## 17.2 Public-surface rule

Public tutor pages may show trust proof and fit framing, but they must not reveal:

- private matching logic internals
- private student need details
- hidden ranking factors not represented honestly in the UI

## 17.3 Sensitive-input rule

If a `LearningNeed` contains free text later, that free text should not automatically become a ranking feature unless it is intentionally parsed into safe structured attributes.

## 18. Analytics And Learning Loop

## 18.1 Main rule

Matching architecture should be measurable from day one.

## 18.2 Important telemetry outputs

The product should be able to relate:

- match run
- ranking version
- viewed tutor profiles
- shortlist actions
- compare usage
- booking starts
- booking confirmations

This is how tuning can become evidence-based later.

## 18.3 No-self-optimization rule

The MVP ranking system should not automatically retune itself from user behavior.

Tuning should remain controlled and reviewable.

## 19. Scaling Path

## 19.1 MVP path

Start with:

- normalized relational data
- SQL-backed candidate filtering
- application-layer scoring and explanation assembly
- persisted match outputs for meaningful flows

## 19.2 Next scale step

If query cost or tutor volume grows, add:

- denormalized tutor match projections
- materialized views
- precomputed overlap helpers

## 19.3 Later optional steps

Only if real need appears later, consider:

- specialized text search
- vector-assisted retrieval for richer tutor-content matching
- learned reranking or experimentation layers

These are later options, not MVP dependencies.

## 20. What This Architecture Prevents

This architecture is meant to prevent:

- generic marketplace sort order masquerading as matching
- hidden black-box ranking with no visible reasoning
- weights hardcoded in many different places
- price or star average dominating fit quality
- unstable rank order with no tie-break rules
- future AI agents inventing their own ranking heuristics per route

## 21. Recommended Phase Scope

## 21.1 Phase 1

Phase 1 should support:

- hard eligibility filtering
- deterministic weighted scoring
- structured fit explanations
- centralized ranking configuration
- persisted match outputs for real match flows

## 21.2 Phase 1.5

Good next candidates:

- stronger denormalized read model
- ranking-profile refinement from evidence
- better tutor-activation signals in ranking
- more nuanced availability-fit scoring

## 21.3 Phase 2

Consider later:

- controlled experiments on ranking profiles
- specialized search infrastructure
- learned reranking only if it is actually justified by scale and evidence

## 22. Decisions To Lock Now

The architecture should lock the following decisions now:

- matching is deterministic and explainable in MVP
- hard filters run before ranking
- ranking uses weighted structured signals and explicit penalties
- visible reasons come from the same scored signals
- `Match` remains a first-class domain object
- ranking weights and thresholds come from one centralized versioned configuration source
- ratings are one trust input, not the dominant ranker
- black-box ML and generic third-party search are not MVP dependencies

## 23. Final Recommendation

Mentor IB should implement matching as a domain-owned ranking system, not as a generic search layer.

The recommended MVP is:

- Postgres-backed candidate filtering
- application-owned weighted scoring
- structured fit explanations
- centralized ranking configuration
- match persistence tied to meaningful learning-need flows

This gives the product a strong matching-first foundation, preserves trust through explainability, and keeps the system tunable without overbuilding it.

## 24. Official Source Notes

The recommendation above is informed by current official documentation for:

- PostgreSQL indexes: `https://www.postgresql.org/docs/current/indexes.html`
- PostgreSQL materialized views: `https://www.postgresql.org/docs/current/rules-materializedviews.html`
- PostgreSQL full text search: `https://www.postgresql.org/docs/current/textsearch.html`
- Supabase pgvector: `https://supabase.com/docs/guides/database/extensions/pgvector`
