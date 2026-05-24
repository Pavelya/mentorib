# Mentor IB Phase 2 Public Landing UX/UI + SEO/AI-SEO Task Pack v1

**Date:** 2026-05-24
**Status:** `ready` — pack of concrete, file-grounded tasks to rework every existing public landing surface under `src/app/(public)/**` AND introduce a net-new programmatic SEO + AI-SEO landing surface. The pack mirrors [phase2-student-ux-task-pack-v1.md](phase2-student-ux-task-pack-v1.md) and [phase2-tutor-ux-task-pack-v1.md](phase2-tutor-ux-task-pack-v1.md) in tone, structure, and reuse-before-extend discipline. No new vendors, no new business logic.

**Scope:**

1. Every existing route under [src/app/(public)/**](../../src/app/(public)) — `/`, `/how-it-works`, `/become-a-tutor`, `/trust-and-safety`, `/support`, `/tutors`, `/tutors/[slug]`, `/services/[need-slug]`, `/subjects/[subject-slug]`, `/subjects/[subject-slug]/[need-slug]`, `/privacy-policy`, `/terms`, plus the shared [(public)/layout.tsx](../../src/app/(public)/layout.tsx), the [_seo-landing template](../../src/app/(public)/_seo-landing/seo-landing-page.tsx), [home.module.css](../../src/app/(public)/home.module.css), and the shared [public-marketing-page.tsx](../../src/components/public/public-marketing-page.tsx).
2. The marketing content modules under [src/modules/marketing/**](../../src/modules/marketing) — copy data, SEO landing authoring, curated tutor surfacing.
3. The shared SEO infrastructure under [src/lib/seo/**](../../src/lib/seo) — metadata builders, schema helpers, public-route registry, `robots.ts`, `sitemap.ts`.
4. Net-new programmatic SEO families introduced for AI-SEO and search head-term coverage: `/destinations/[country]`, `/scoring/[conversion]`, `/compare/[topic]`, `/glossary/[term]` (escalation gates documented per task).
5. Design system extensions strictly needed to make 1–4 DS-compliant: a `PageHero` composition, a `CtaBand` composition, a `FaqAccordion`, a `TestimonialCard`, the previously-spec'd `MetricTile`, the previously-spec'd `CompareTable`, a `Breadcrumb` primitive, plus surface/gradient tokens to retire the 15+ hardcoded `rgb()` overlays in [home.module.css](../../src/app/(public)/home.module.css).

The goal: every public surface ships from one shared landing vocabulary; the home page stops being "another summary-of-the-product" panel stack and starts demonstrating the match-first experience; existing static pages stop being four-near-identical `PublicMarketingPage` clones; programmatic SEO captures the IB-tutoring head-term surface (countries, score conversions, comparisons, glossary) that we currently leak to ibmatch.com and to generic tutor-marketplace SEO; AI search engines (ChatGPT live browsing, Perplexity, Google AI Overviews, Claude with web tools) can discover, parse, and cite Mentor IB content via schema, semantic HTML, FAQ pairs, and an `llms.txt` index.

## 1. Why this pack exists

Reviewing the public surface end-to-end on 2026-05-24 reveals systemic problems no single feature task owns:

### 1.1 The visible landing pages are generic and look the same

- The home page hero copy reads as a colloquial mood ("IB help for the part that feels **hard** right now") rather than as a value proposition. The trust-proof grid uses operator vocabulary: "**Visible fit reasoning**", "**Safe continuity**", "**IB-specific context**". A first-time student or parent has no way to translate "visible fit reasoning" into "I will see *why* a tutor was matched to me, not just *that* they were."
- Four of the static routes — `/how-it-works`, `/become-a-tutor`, `/trust-and-safety`, `/support` — all consume the same [public-marketing-page.tsx](../../src/components/public/public-marketing-page.tsx) wrapper and ship the same shape: eyebrow + H1 + intro + 2 CTAs + 4 signal badges (rendered as `StatusBadge` pills) + 4 `Section` panels in a 2-col grid + a forest-gradient `.finalCta` band. The only thing that differs is the copy. A user clicking from `/how-it-works` to `/trust-and-safety` sees an identical page with different words. This is the canonical "all our marketing pages look the same" failure.
- Several signal badges and section titles are operator-vocabulary that leaked from internal planning docs into user-facing copy: "**One tutor mode**" (become-a-tutor), "**Public claim discipline**" (trust-and-safety), "**Public trust copy stays grounded**" (trust-and-safety section title), "**Profile quality**" (become-a-tutor), "**Decision cues**" (tutor profile sidebar eyebrow), "**Booking continuity**" (how-it-works).
- The home page has no testimonials, no images (beyond tutor avatars inside the sample `MatchRow`s), no video, no FAQ, no social proof beyond two hardcoded `sampleMatches` rows. Every modern tutoring-marketplace landing page in 2026 ships at minimum a hero, a 3-step explainer, a testimonials strip, and a FAQ. We ship a hero, two panels, two sample rows, a trust grid, a browse grid, and a CTA band. That is structurally fine but content-thin.
- `/support` is titled "Mentor IB Support and Common Questions" but ships **zero** common questions. The four `Section` panels each have a 2-bullet generic body. The page advertises FAQ in its `<title>` and does not deliver one.
- `/tutors` (the public tutor index) is the only public route that ships **no `StructuredData` at all** — no `WebPageSchema`, no `BreadcrumbListSchema`, no `WebSiteSchema` with `SearchAction`. Page is otherwise functional but invisible to AI engines parsing the public surface.

### 1.2 DS-first violations and undefined contracts

- [home.module.css](../../src/app/(public)/home.module.css) hardcodes overlay/gradient colors as raw `rgb()` literals in **15+ call sites**: `rgb(184 145 61 / 0.2)`, `rgb(255 255 255 / 0.14)`, `rgb(220 235 228 / 0.8)`, `rgb(252 250 244 / 0.9)`, etc. The DS already owns `--surface-page`, `--surface-panel-soft`, `--panel-warm`, `--panel-forest`, `--mist-100`, `--gold-100` — but the home page bypasses all of them for the decision-story aside and the continuation panel. Same category of violation as the `--display-sm` bug from [P2-TUX-001-01](phase2-tutor-ux-task-pack-v1.md), with knock-on effects: a future token rename can't reach the home page.
- The home hero is composed entirely route-locally in [home.module.css:31–113](../../src/app/(public)/home.module.css#L31): the `.hero` grid layout, `.heroCopy`, `.intro`, `.actions`, `.pressureList`, `.decisionStory`, `.darkEyebrow`, `.needStrip`, `.storyRows`. The shared [public-marketing-page.module.css:6–73](../../src/components/public/public-marketing-page.module.css#L6) builds **its own** different hero shape (left copy + right signal `Panel`). Two routes, two route-local hero shapes, no DS primitive. Every new landing page added by this pack would either build a third or copy one of these two.
- The home `.finalCta` ([home.module.css:274–301](../../src/app/(public)/home.module.css#L274)) and the public-marketing `.finalCta` ([public-marketing-page.module.css:112–141](../../src/components/public/public-marketing-page.module.css#L112)) both build the same forest-gradient CTA band — two route-local copies of the same primitive. New landing pages would copy it a third time.
- The SEO landing template [seo-landing-page.tsx:380–430](../../src/app/(public)/_seo-landing/seo-landing-page.tsx#L380) ships the only FAQ on the entire public site, rendered as a `<dl>` of `<dt>`/`<dd>` pairs. The pattern is correct (semantic, schema-compatible), but the markup is route-local and not in the DS. Any other page that wants a FAQ — `/support`, `/how-it-works`, `/become-a-tutor`, country guides, glossary entries — would copy the markup.
- [seo-landing.module.css:134](../../src/app/(public)/_seo-landing/seo-landing.module.css#L134) hardcodes `font-size: 22px` instead of consuming a `--title-md` / `--body-lg` token. Minor but the only such violation in that file — easy fix during the FAQ extraction.
- The two specs that already exist in the DS — `MetricTile` ([component-specs-phase2-v1.md:493–607](../design-system/component-specs-phase2-v1.md#L493)) and `CompareTable` ([component-specs-phase2-v1.md:381–490](../design-system/component-specs-phase2-v1.md#L381)) — are **specified but not built**. The home "this week" tutor count, the planned country-guide "average IB score required" metric, and the planned comparison-page rows all need them.

### 1.3 SEO posture is foundational but does not reach modern AI-SEO standards

The repo already has a serious SEO foundation, owned by [src/lib/seo/**](../../src/lib/seo) and documented in [docs/architecture/seo-and-ai-discoverability-v1.md], [docs/architecture/structured-data-map-v1.md], [docs/planning/seo-route-ownership-map-v1.md], and [docs/planning/public-route-seo-acceptance-checklist-v1.md]. Every Class A route except `/tutors` already ships schema. The SEO landing template ships `BreadcrumbList` + `WebPage` + `Course`/`Service` + `Offer` + `ItemList` + `FaqPage`. This is **above** typical SaaS quality. But:

- No `llms.txt` or `llms-full.txt` exists at the public root. ChatGPT live browsing, Perplexity, and Claude with web tools all preferentially follow `llms.txt` to discover canonical content as of 2026. We are letting AI crawlers reverse-engineer the site from `robots.txt` + `sitemap.xml` alone. Cheap, high-value gap. ([derivatex.agency](https://derivatex.agency/blog/llms-txt-guide/), [searchscaleai.com](https://www.searchscaleai.com/blog/optimize-website-chatgpt-perplexity-google-ai-2026/))
- Schema objects are emitted as **separate** `WebPage` + `Organization` + `WebSite` JSON-LD blocks on home, not as a unified `@graph` with linked `@id`s. 2026 AI-engine guidance (Perplexity, ChatGPT) gives stronger entity-graph signal to `@graph`-linked schema. Same payload, better citation rate. ([edenrank.com](https://edenrank.com/blog/optimize-schema-markup-for-ai-engines-2026), [averi.ai](https://www.averi.ai/how-to/traditional-seo-is-failing-on-perplexity-and-chatgpt-the-complete-migration-guide-for-2026))
- Tutor profiles ship `ProfilePageSchema` but the underlying `Person` does not yet carry `sameAs` (external profile URLs), `knowsAbout` (IB subjects), `alumniOf` (where credentials apply), or `hasCredential` (examiner status, degree). 2026 E-E-A-T (Experience > Expertise > Authoritativeness > Trustworthiness) leans on `Person` entity fidelity for ranking signal in both Google and AI overviews. ([keywordseverywhere.com](https://keywordseverywhere.com/blog/google-e-e-a-t-guidelines-an-overview/), [capconvert.com](https://www.capconvert.com/learn/blog/how-to-create-person-schema), [digitalapplied.com](https://www.digitalapplied.com/blog/e-e-a-t-march-2026-google-rewards-experience-content-guide))
- Public pages do not surface a visible `Updated YYYY-MM-DD` and the JSON-LD `dateModified` is not consistently populated. Perplexity in particular weights freshness most heavily of the three major AI engines; ChatGPT weights training-data entity recognition. ([amivisibleonai.com](https://www.amivisibleonai.com/blog/ai-seo-guide-2026))
- `/tutors` and the four `PublicMarketingPage`-style routes do not ship FAQ schema. FAQ-schema-bearing pages have one of the highest AI-citation rates because the Q→A pair shape mirrors how AI assistants reply. ([frase.io](https://www.frase.io/blog/faq-schema-ai-search-geo-aeo))
- The "answer-first" / BLUF (Bottom Line Up Front) writing pattern that AI engines preferentially extract is not the dominant pattern in current copy. The home hero opens with mood; the trust-and-safety sections open with abstractions. AI engines preferentially cite pages that lead with a direct, well-structured answer in the first ~200 characters of a `<section>`. ([amivisibleonai.com](https://www.amivisibleonai.com/blog/ai-seo-guide-2026), [averi.ai](https://www.averi.ai/how-to/traditional-seo-is-failing-on-perplexity-and-chatgpt-the-complete-migration-guide-for-2026))

### 1.4 The programmatic landing-page surface is missing

Mentor IB's sister site **ibmatch.com** (also owned by the project) publishes 1,298 indexable URLs against a similar IB audience. A sitemap survey shows it concentrates on:

- **22 country guides** (`/study-in-{country}-with-ib-diploma`) — IB→local-system grade conversion, recognized universities, language requirements, application timeline, FAQ.
- **1,263 individual university-program detail pages** (`/programs/<cuid>`).
- **1 country-hub index** (`/ib-university-requirements`).

The 1,263 university-program detail pages are not portable to a tutoring product — they require a per-university degree-program database that Mentor IB does not own and does not need. **The 22 country guides and the hub page are highly portable**, with the angle shifted from "find a degree program in {country}" to "hit the IB score that {country} expects, with tutoring help". This is the headline pSEO opportunity.

Beyond ibmatch, the surfaces ibmatch *doesn't* publish but a tutoring product should:

- **Standalone IB score-conversion pages** (`/scoring/ib-to-atar`, `/scoring/ib-to-ucas-tariff`, `/scoring/ib-to-gpa`, `/scoring/ib-to-abitur`, `/scoring/ib-to-selectividad`) — ibmatch buries conversion tables inside country prose; pulling them out is high informational intent with natural CTA into tutoring ("predicted grade lower than target? get matched"). Strong 2026 AI-SEO play because the answer is a single table.
- **Comparison pages** (`/compare/ib-vs-a-level`, `/compare/ib-vs-ap`, `/compare/ib-vs-abitur`) — search head-terms with high volume, ibmatch publishes none.
- **IB glossary** (`/glossary/[term]`: `internal-assessment`, `theory-of-knowledge`, `extended-essay`, `creativity-activity-service`, `predicted-grades`, `higher-level`, `standard-level`, `paper-1`, `paper-2`, `paper-3`, etc.) — perfect AI-SEO surface because each entry is a definition-shaped Q→A. 20–40 terms, cheap to author, strong long-tail.

This pack collects all of the above into discrete, testable tasks future agents can pick up one at a time. None of the tasks below add or remove a domain rule, a Server Action signature, or a payments path. The pack does add reference content (countries, score conversions, glossary terms) — that work goes through [src/modules/marketing/**](../../src/modules/marketing) the same way `seo-landing/authored-content.ts` already does, not through `src/modules/reference/**`.

### 1.5 Per-page differentiation contract — what stops the rework from producing new clones

The pack's biggest risk is the inverse of the problem it fixes: six existing pages reworked with the same toolkit (`PageHero` + `Section` + `FaqAccordion` + `CtaBand`) plus four new families assembled the same way could land as **a fresh set of clones**, just with better DS hygiene. Same problem, different decade.

To prevent that, this pack pins a normative **differentiation contract**: each page family commits to a structural fingerprint that the others are not allowed to mimic. Implementation tasks `-10` through `-15`, `-24`, `-26`, `-28`, and `-30` must conform. Enforcement is task `-36` (arch lint + visual review) and the final walk in `-35`.

| Page family | Single-sentence purpose | Hero variant | Signature section | Dominant motif | Primary tone | Typography accent |
| --- | --- | --- | --- | --- | --- | --- |
| `/` home | Convince first-time visitor that match-first beats marketplace | Two-col: copy left + **sample-decision narrative aside** | Live `MatchRow` sample (the product demonstrating itself) | Decision story | warm paper + forest accent | `--display-xl` H1 with serif italic accent word |
| `/how-it-works` | Explain the 3-step matching process concretely with one worked example | **Centered, single-column** large step-preview | Horizontal 3-step flow with `Icon` arrows between (stacked on mobile) | Process / numbered sequence | paper + mist | `--display-lg` H1 + numbered eyebrow ("Step 01") |
| `/become-a-tutor` | Convert qualified tutors to apply | Two-col: copy + **earnings `MetricTile` triplet aside** | Earnings + payout metric block | Money / opportunity | forest + gold accent | `--display-lg` H1 + monospace numerals for earnings |
| `/trust-and-safety` | Reassure parents | **Calm, centered, single-column, smaller H1** | Safeguarding policy list with verified-tick `Icon`s | Verification / shield / quietness | mist + paper (deliberately restrained) | `--title-xl` H1 (smaller on purpose) + sans-only |
| `/support` | Self-serve answer surface | Tight hero + immediate **`TabBar`** | TabBar splitting Students / Parents / Tutors / Safety, each with own `FaqAccordion` | Audience tabs | paper + neutral | `--title-xl` H1 + tab labels in `--caption` |
| `/tutors` | Tutor search entry + subject pillar grid | Search-first hero (`SearchAction` aware) | 6-pillar IB-group grid + 8-flag language row | Browse / grid | paper + mist | `--title-lg` H1 (search-friendly, not hero scale) |
| `/subjects/[slug]` | Subject SEO landing (existing template) | Standard SEO-landing hero with "this week" `MetricTile` aside | 5-question authored block + curated tutor list + FAQ | Subject identity (per-subject color accent + `Icon` glyph) | per-subject accent | `--display-lg` H1 + per-subject eyebrow |
| `/services/[slug]` | Need/focus-area SEO landing | Same as subjects | Same | Need identity (per-service `Icon` glyph) | per-service accent | Same as subjects |
| `/destinations/[country]` | Country admission guide | Two-col: copy + **3-`MetricTile` aside (required IB / typical conditional offer / recognized universities)** | Conversion `CompareTable` | Country (`Flag` lead + recognition list) | per-country accent (subtle) | `--display-lg` H1 + `Flag` adjacent to title |
| `/scoring/[conversion]` | Single conversion answer | **Tight: BLUF + one headline `MetricTile`** ("IB 45 = ATAR 99.95") | The conversion `CompareTable` itself | Conversion arrow (IB → X glyph) | mist + accent | `--display-lg` H1 + **monospace** numerals throughout |
| `/compare/[topic]` | Programme comparison | Two-col: copy + **side-by-side comparison preview** | Full `CompareTable` | Two columns visually balanced | dual-tone split | `--display-lg` H1 with serif italic on the "vs" |
| `/glossary/[term]` | Definition page | **Deliberately small: term + BLUF definition only**, no aside | "In context" block + related-terms `LinkTile` grid | Definition card (single-purpose, restrained) | paper + mist | `--title-xl` H1 (smallest of any family) + **serif body** for definition |

The matrix is normative. A page that violates its row fails the differentiation contract and must be revised before merging.

### 1.6 Typography hierarchy contract per page family

The DS owns the type tokens; this pack pins **which token each family uses for each slot**. Without this, every reworked page would land on `--display-xl` for its H1 and the visual hierarchy across the public surface would flatten.

| Page family | H1 | H2 | H3 | Body lead | Body | Eyebrow | Accent |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | `--display-xl` | `--title-lg` | `--title-md` | `--body-lg` | `--body-md` | `--caption` | serif italic accent word |
| `/how-it-works` | `--display-lg` | `--title-lg` | `--title-md` | `--body-lg` | `--body-md` | `--caption` ("Step 01") | numbered |
| `/become-a-tutor` | `--display-lg` | `--title-lg` | `--title-md` | `--body-lg` | `--body-md` | `--caption` | monospace numerals |
| `/trust-and-safety` | `--title-xl` | `--title-lg` | `--title-md` | `--body-md` | `--body-md` | `--caption` | none (restrained) |
| `/support` | `--title-xl` | `--title-lg` | `--title-md` | `--body-md` | `--body-md` | `--caption` (tab labels) | none |
| `/tutors` | `--title-lg` | `--title-md` | `--body-lg` | `--body-md` | `--body-md` | `--caption` | none |
| `/subjects/[slug]`, `/services/[slug]` | `--display-lg` | `--title-lg` | `--title-md` | `--body-lg` | `--body-md` | `--caption` (per-subject) | per-subject accent |
| `/destinations/[country]` | `--display-lg` | `--title-lg` | `--title-md` | `--body-lg` | `--body-md` | `--caption` | `Flag` adjacent to H1 |
| `/scoring/[conversion]` | `--display-lg` | `--title-lg` | `--title-md` | `--body-md` | `--body-md` | `--caption` | monospace numerals in table |
| `/compare/[topic]` | `--display-lg` | `--title-lg` | `--title-md` | `--body-lg` | `--body-md` | `--caption` | serif italic on "vs" |
| `/glossary/[term]` | `--title-xl` | `--title-md` | `--body-lg` | `--body-md` | `--body-md` | `--caption` | serif body for the definition paragraph |

A token not on this table (e.g. a raw `font-size`, a `clamp(...)` literal, an undefined token) on any public route is a fail.

### 1.7 Motion + animation contract

The DS owns motion tokens; this pack pins **which token applies to which interaction**, and enforces `prefers-reduced-motion: reduce` as a hard out everywhere. No third-party motion library (no Framer Motion, no Lottie) — every motion below is CSS `transition` / `transform` only.

| Interaction | Token | Behavior | Reduced-motion fallback |
| --- | --- | --- | --- |
| `FaqAccordion` expand/collapse | native `<details>` | browser-default disclosure | unchanged (no JS) |
| CTA / button hover | `--motion-fast` (140ms) | background + shadow tween | retain hover state, no animation |
| `LinkTile` / `CountryTile` hover lift | `--motion-fast` | `translate-y(-2px)` + shadow | no transform, retain shadow |
| `PageHero` first paint entrance | `--motion-panel` (260ms) | opacity 0→1 + `translate-y(8px→0)` once | render in final state immediately |
| `TabBar` tab change in `/support` | `--motion-fast` | cross-fade content `opacity` | instant swap |
| Anchor-link scroll (e.g. `Breadcrumb` → section) | native `scroll-behavior: smooth` | gated by media query | `scroll-behavior: auto` |
| `MetricTile` numeric counter | **none** | static; no count-up | n/a (already static) |
| `MatchRow` sample on home | **none** | static; no carousel | n/a |
| Hero illustration | **none** in v1 | static SVG; no Lottie, no motion | n/a |

Anything *not* on this table does not animate. New interactions that want motion must extend this table in the same commit — same rule as the DS token cheatsheet.

### 1.8 Asset + illustration contract

This pack ships visuals but does not ship a new vendor. Every asset below uses only what is already on the frozen baseline plus inline SVG.

| Asset class | Format / source | Where used | Out of scope |
| --- | --- | --- | --- |
| Hero illustrations / decorative SVGs | **Inline SVG**, authored as React components in `src/components/illustrations/` | Per-page-family hero motif (one motif per family per `§1.5`) | external SVG sprite sheet, Lottie, animated SVG |
| Iconography | `Icon` (`lucide-react`) only, via [icon.tsx](../../src/components/ui/icon.tsx) | Everywhere; new icons added to the registry as needed | raw `<svg>`, emoji, image icons |
| Country flags | `Flag` (`country-flag-icons`) only, via [flag.tsx](../../src/components/ui/flag.tsx) | `/destinations`, `/tutors` language row, `TestimonialCard` if author has a country | external flag images, emoji flags |
| OpenGraph images | Next.js built-in `ImageResponse` (already on the framework — no new vendor) via per-route `opengraph-image.tsx` | Every Class A route family | external OG image generator, Figma plugin pipeline |
| Photography (TestimonialCard avatars, hero people) | Curated, attributed real images stored in `public/images/testimonials/` with `.webp` source files. **No AI-generated faces** — Google E-E-A-T treats AI-generated people as a trust signal red flag ([Digital Applied 2026](https://www.digitalapplied.com/blog/e-e-a-t-march-2026-google-rewards-experience-content-guide)) | `TestimonialCard` on home; tutor profile (existing) | stock photo subscriptions, AI-faces |
| Subject group glyphs | `Icon` registry, one icon per IB group, consistent accent token | `/tutors` pillar grid, `/subjects/[slug]` eyebrow | custom subject illustrations |
| Conversion arrow glyph | Inline SVG component in `src/components/illustrations/conversion-arrow.tsx`, used in `/scoring/*` | `/scoring/[conversion]` hero | per-conversion bespoke art |
| Maps / data viz / charts | **None in v1.** Charts are out of scope (would require a vendor) | n/a | Recharts, Visx, D3, Chart.js, any chart lib |
| Video | **None in v1.** Defer until traffic data justifies the asset pipeline cost | n/a | hosted video, YouTube embeds (privacy + perf cost) |
| Animated illustrations (Lottie etc.) | **None in v1.** See §1.7 motion contract | n/a | Lottie, Rive, animated GIF |

§1.5 / §1.6 / §1.7 / §1.8 together define the **non-cloning contract**. The combination is what makes `/destinations/[country]` look unmistakably different from `/scoring/[conversion]` even though both are programmatic, both ship `CompareTable`, and both use the same DS.

## 2. Source-of-truth pointers

Every UI- and SEO-affecting subtask must read these before editing.

**Architecture and DS:**

- [CLAUDE.md](../../CLAUDE.md)
- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) (DS-first, copy discipline, reuse-before-extend, no inline SVGs, no route-local cards/panels, icons via `Icon`, flags via `Flag`)
- [docs/design-system/component-inventory-v1.md](../design-system/component-inventory-v1.md) (existing primitives + extension rules — must be updated in the same commit when this pack adds a new primitive)
- [docs/design-system/tokens-cheatsheet-v1.md](../design-system/tokens-cheatsheet-v1.md) (the only approved token vocabulary — must be updated in the same commit when this pack adds tokens)
- [docs/design-system/design-system-spec-final-v1.md](../design-system/design-system-spec-final-v1.md), [docs/design-system/component-specs-core-v1.md](../design-system/component-specs-core-v1.md), [docs/design-system/component-specs-phase2-v1.md](../design-system/component-specs-phase2-v1.md) (canonical primitive anatomy; `MetricTile` and `CompareTable` are already specified here and need only implementation, not new spec)
- [docs/architecture/canonical-value-ownership-map-v1.md](../architecture/canonical-value-ownership-map-v1.md) (timezone via `src/lib/datetime/**`; currency via `src/modules/pricing/**`; reference vocabularies via `src/modules/reference/**`)

**SEO and AI discoverability:**

- [docs/architecture/seo-and-ai-discoverability-v1.md] (linked by [seo-route-ownership-map-v1.md](seo-route-ownership-map-v1.md))
- [docs/architecture/metadata-matrix-v1.md] / [docs/architecture/structured-data-map-v1.md] / [docs/architecture/content-template-spec-v1.md] / [docs/architecture/seo-page-inventory-v1.md] (all four required for any structured-data change)
- [docs/planning/seo-implementation-foundation-v1.md](seo-implementation-foundation-v1.md)
- [docs/planning/seo-route-ownership-map-v1.md](seo-route-ownership-map-v1.md) (which route family is Class A vs B vs C)
- [docs/planning/public-route-seo-acceptance-checklist-v1.md](public-route-seo-acceptance-checklist-v1.md) (must pass for every new Class A route this pack ships)
- [docs/planning/seo-foundation-task-pack-v1.md](seo-foundation-task-pack-v1.md)
- [docs/planning/phase1-class-a-route-seo-task-pack-v1.md](phase1-class-a-route-seo-task-pack-v1.md) (Class A route precedent)
- [src/lib/seo/public-routes.ts](../../src/lib/seo/public-routes.ts) (static route registry — new routes get registered here)
- [src/lib/seo/schema/](../../src/lib/seo/schema) (existing schema helpers — new schema types get added here, not in route files)
- [src/lib/seo/metadata/build-metadata.ts](../../src/lib/seo/metadata/build-metadata.ts) (metadata builder — every new route reuses it)
- [src/app/robots.ts](../../src/app/robots.ts) and [src/app/sitemap.ts](../../src/app/sitemap.ts) (every new public route family this pack adds must be wired through both)

**Existing marketing content:**

- [src/modules/marketing/home-content.ts](../../src/modules/marketing/home-content.ts)
- [src/modules/marketing/seo-landing/authored-content.ts](../../src/modules/marketing/seo-landing/authored-content.ts)
- [src/modules/marketing/seo-landing/curated-tutors.ts](../../src/modules/marketing/seo-landing/curated-tutors.ts) and [page-data.ts](../../src/modules/marketing/seo-landing/page-data.ts), [publish-gate.ts](../../src/modules/marketing/seo-landing/publish-gate.ts)

**External references for 2026 SEO + AI-SEO** (cited inline below; do not deep-link from code or copy):

- AI-engine optimization patterns: [Search Scale AI](https://www.searchscaleai.com/blog/optimize-website-chatgpt-perplexity-google-ai-2026/), [Averi](https://www.averi.ai/how-to/traditional-seo-is-failing-on-perplexity-and-chatgpt-the-complete-migration-guide-for-2026), [Am I Visible On AI](https://www.amivisibleonai.com/blog/ai-seo-guide-2026)
- Schema for AI engines: [Eden Rank](https://edenrank.com/blog/optimize-schema-markup-for-ai-engines-2026), [Frase on FAQ schema](https://www.frase.io/blog/faq-schema-ai-search-geo-aeo)
- `llms.txt` adoption: [Derivatex](https://derivatex.agency/blog/llms-txt-guide/)
- E-E-A-T + `Person`/`ProfilePage`: [Keywords Everywhere](https://keywordseverywhere.com/blog/google-e-e-a-t-guidelines-an-overview/), [Capconvert](https://www.capconvert.com/learn/blog/how-to-create-person-schema), [Digital Applied (March 2026 update)](https://www.digitalapplied.com/blog/e-e-a-t-march-2026-google-rewards-experience-content-guide)
- Programmatic SEO for marketplaces: [Backlinko](https://backlinko.com/programmatic-seo), [Journey](https://www.journeyh.io/blog/marketplace-seo-playbook), [Shopify](https://www.shopify.com/blog/programmatic-seo)
- Landing-page conversion: [Unicorn Platform 2026](https://unicornplatform.com/blog/seo-for-landing-pages/), [Leadfeeder 2026](https://www.leadfeeder.com/blog/conversion-optimization/landing-pages-convert/)
- Technical SEO baseline: [DebugBear 2026](https://www.debugbear.com/blog/technical-seo-checklist), [Google Helpful Content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

**Out of scope for every subtask in this pack (binding):**

- adding any new third-party library — escalate per `CLAUDE.md`. The pack uses what's already on the frozen baseline: Next.js 16 / React 19 / Drizzle / Zod / luxon / lucide-react / country-flag-icons. Specifically: do **not** add an MDX library, a CMS, a carousel library, a tooltip library, a charts library, an animation library beyond what `motion` tokens already imply
- adding any new domain rule, status enum, business statuses, payments path, Server Action, or Server Component data dependency outside the marketing module
- changing the underlying domain modules under `src/modules/lessons/**`, `src/modules/messages/**`, `src/modules/reviews/**`, `src/modules/booking/**`, `src/modules/pricing/**`, or `src/modules/reference/**` beyond reads
- redesigning the signed-in surfaces under `src/app/(student)/**`, `src/app/tutor/**`, `src/app/(account)/**`, `src/app/setup/**`, `src/app/auth/**`, `src/app/internal/**` (those are covered by the SUX and TUX packs; this pack is public-only)
- adding a blog, a CMS, an editor surface, or user-generated content. All authored content in this pack lives in versioned TypeScript modules under `src/modules/marketing/**`, the same way the existing SEO landing authored content does. The blog/glossary tasks describe a route family backed by static authored content, not a CMS
- shipping any new internal admin surface or moderation tool
- duplicating ibmatch.com's `/programs/<cuid>` university-program detail pages. Mentor IB does not own a per-university degree-program entity and acquiring one is a multi-week scope expansion that requires its own decision doc

## 3. Status and priority vocabulary

Reuses the Phase 2 pack vocabulary verbatim:

- `ready`: concrete enough to implement now
- `draft`: needs sharper interaction or scope decisions before implementation
- `planned`: reserved until a trigger condition exists
- `done`: implemented and verified

Priority:

- `P1`: visible-on-every-landing-page issues, DS-first violations, or AI-SEO foundation gaps
- `P2`: per-surface clarity / copy / content depth
- `P3`: nice-to-have polish and incremental head-term expansion

## 4. Execution order

Tasks on the same step can run in parallel. Complete all tasks in a step before moving on.

| Step | Task id | Status | Priority | Short title |
| --- | --- | --- | --- | --- |
| 1 | `P2-LAND-001-01` | `ready` | `P1` | Surface/overlay tokens — retire 15+ `rgb()` hardcodes in `home.module.css` |
| 1 | `P2-LAND-001-02` | `ready` | `P1` | DS `PageHero` composition (replaces both route-local hero shapes) |
| 1 | `P2-LAND-001-03` | `ready` | `P1` | DS `CtaBand` composition (replaces both route-local `.finalCta` shapes) |
| 1 | `P2-LAND-001-04` | `ready` | `P1` | DS `FaqAccordion` (semantic `<details>`/`<summary>`, schema-compatible) |
| 1 | `P2-LAND-001-05` | `ready` | `P1` | DS `Breadcrumb` primitive (replaces SEO-landing inline breadcrumb) |
| 2 | `P2-LAND-001-06` | `ready` | `P2` | DS `TestimonialCard` (composes `PersonSummary` + `StarRating` + quote) |
| 2 | `P2-LAND-001-07` | `ready` | `P2` | Implement specced `MetricTile` ([component-specs-phase2-v1.md:493](../design-system/component-specs-phase2-v1.md#L493)) |
| 2 | `P2-LAND-001-08` | `ready` | `P2` | Implement specced `CompareTable` ([component-specs-phase2-v1.md:381](../design-system/component-specs-phase2-v1.md#L381)) |
| 2 | `P2-LAND-001-09` | `ready` | `P2` | DS `CountryTile` + `ConversionTile` tiles for hub/index pages |
| 3 | `P2-LAND-001-10` | `ready` | `P1` | Home page rework — adopt `PageHero`, `CtaBand`, `FaqAccordion`, `TestimonialCard`, `MetricTile`; retire hardcoded colors; rewrite operator copy |
| 3 | `P2-LAND-001-11` | `ready` | `P1` | `/how-it-works` rework — `HowTo` schema, concrete worked example, FAQ, differentiated visual rhythm from `/become-a-tutor` |
| 3 | `P2-LAND-001-12` | `ready` | `P1` | `/become-a-tutor` rework — `JobPosting` schema, tutor-facing FAQ, payout/earnings explainer, application-flow walkthrough |
| 3 | `P2-LAND-001-13` | `ready` | `P1` | `/trust-and-safety` rework — parent-facing tone, safeguarding policy block, real FAQ, schema |
| 3 | `P2-LAND-001-14` | `ready` | `P1` | `/support` rework — deliver the FAQ the title promises; route by audience (student / parent / tutor / safety); `FAQPage` + `HelpPage` schema |
| 3 | `P2-LAND-001-15` | `ready` | `P1` | `/tutors` rework — ship structured data parity (`WebPage` + `BreadcrumbList` + `WebSite.SearchAction` + `ItemList` if results render); add content depth; expose subject/language facet entry-point links |
| 4 | `P2-LAND-001-16` | `ready` | `P1` | Cross-page copy pass — replace operator-vocabulary across `(public)/**` (decision cues, visible fit reasoning, one tutor mode, profile quality, public claim discipline, public trust copy stays grounded, booking continuity, safe continuity) |
| 4 | `P2-LAND-001-17` | `ready` | `P2` | Adopt `FaqAccordion` inside the SEO landing template (extract route-local `<dl>` to DS) |
| 4 | `P2-LAND-001-18` | `ready` | `P2` | Subject/service SEO landing copy depth pass — extend `authored-content.ts` with deeper Q→A blocks per existing subject and focus area |
| 5 | `P2-LAND-001-19` | `ready` | `P1` | `llms.txt` + `llms-full.txt` generated from `staticPublicRouteDefinitions` + sitemap data |
| 5 | `P2-LAND-001-20` | `ready` | `P1` | Schema graph unification — emit `@graph` with linked `@id`s on every Class A route (Organization + WebSite + WebPage + main entity), retire stacked `StructuredData` arrays |
| 5 | `P2-LAND-001-21` | `ready` | `P1` | Tutor `Person` schema upgrade — `sameAs` / `knowsAbout` / `alumniOf` / `hasCredential` / `aggregateRating` populated from profile + review data |
| 5 | `P2-LAND-001-22` | `ready` | `P2` | Freshness signal pass — `dateModified` populated on every Class A schema, visible "Updated YYYY-MM-DD" eyebrow on programmatic surfaces |
| 5 | `P2-LAND-001-23` | `ready` | `P2` | Answer-first / BLUF copy rewrite on every Class A surface — first 200 chars of every `<section>` lead with a direct, citation-shaped answer |
| 6 | `P2-LAND-001-24` | `ready` | `P1` | Route family + template: `/destinations` hub + `/destinations/[country]` country guide (mirrors ibmatch T1; 22 countries) |
| 6 | `P2-LAND-001-25` | `ready` | `P1` | Country guide authoring pass — content for the 22 countries (conversion tables, recognition rules, language reqs, application timeline, FAQ) |
| 6 | `P2-LAND-001-26` | `ready` | `P1` | Route family + template: `/scoring` hub + `/scoring/[conversion]` (ib-to-atar, ib-to-ucas-tariff, ib-to-gpa, ib-to-abitur, ib-to-selectividad to ship) |
| 6 | `P2-LAND-001-27` | `ready` | `P2` | Score-conversion authoring pass — the five launch conversions |
| 7 | `P2-LAND-001-28` | `ready` | `P2` | Route family + template: `/compare/[topic]` (ib-vs-a-level, ib-vs-ap, ib-vs-abitur to ship) |
| 7 | `P2-LAND-001-29` | `ready` | `P2` | Comparison authoring pass — the three launch comparisons |
| 7 | `P2-LAND-001-30` | `ready` | `P2` | Route family + template: `/glossary` hub + `/glossary/[term]` (~25 IB terms to ship) |
| 7 | `P2-LAND-001-31` | `ready` | `P2` | Glossary authoring pass — the ~25 launch terms |
| 8 | `P2-LAND-001-32` | `draft` | `P3` | Decision needed: city/region tutor pages (`/tutors-in-[city]`) — requires geo data + tutor distribution decision; escalate before implementation |
| 8 | `P2-LAND-001-33` | `draft` | `P3` | Decision needed: editorial blog (`/blog/[slug]`) — requires content-source decision (TS module vs MCM CMS) and author-bio policy; escalate before implementation |
| 9 | `P2-LAND-001-34` | `ready` | `P1` | Schema validation pass — every Class A route validated against Google Rich Results + schema.org validator + Perplexity preview; failures filed as `-bug-` follow-ups |
| 9 | `P2-LAND-001-36` | `ready` | `P1` | Differentiation + typography contract enforcement — wire §1.5 and §1.6 into [agent-ui-rules.md](../design-system/agent-ui-rules.md) and where possible into `pnpm lint:arch` |
| 9 | `P2-LAND-001-37` | `ready` | `P2` | Illustration set — per-page-family hero motif as inline SVG components in `src/components/illustrations/**`; conversion arrow glyph; subject group glyphs |
| 9 | `P2-LAND-001-38` | `ready` | `P2` | Per-route `opengraph-image.tsx` — extend the top-level OG image to dynamic variants for every Class A route family (existing static pages + 4 new programmatic families) using Next.js `ImageResponse` |
| 9 | `P2-LAND-001-39` | `ready` | `P2` | Motion + animation pass — apply §1.7 tokens consistently, enforce `prefers-reduced-motion: reduce` on every animated rule |
| 10 | `P2-LAND-001-35` | `ready` | `P1` | Final verification — walk every public route at 360 / 768 / 1280 / 1440 px; confirm `PageHero` / `CtaBand` / `FaqAccordion` consistency, no DS violations, no hardcoded colors, all schema renders, `llms.txt` reachable, §1.5/§1.6/§1.7/§1.8 contracts satisfied, OG image renders for every route, reduced-motion respected |

## 5. Detailed tasks

### 5.1 `P2-LAND-001-01` Surface/overlay tokens — retire 15+ `rgb()` hardcodes in `home.module.css`

**Status:** `ready` · **Priority:** `P1`

**Problem**

[home.module.css](../../src/app/(public)/home.module.css) hardcodes raw `rgb()` overlay values in **15+ call sites** instead of consuming DS tokens. Concrete hits:

- [home.module.css:55–57](../../src/app/(public)/home.module.css#L55) — `.hero` gradient uses `rgb(255 255 255 / 0.82)` and `rgb(252 250 244 / 0.9)` instead of `--surface-page` + `--surface-panel-soft`
- [home.module.css:121–122](../../src/app/(public)/home.module.css#L121) — `.decisionStory::before` radial gradient uses `rgb(184 145 61 / 0.2)` (a `--gold-500` derivative) instead of a token
- [home.module.css:139–170](../../src/app/(public)/home.module.css#L139) — `.needStrip` uses 8 hardcoded `rgba`-equivalent overlays on a forest background; should be either `--panel-forest` or a new `--panel-forest-overlay-*` derivative set
- [home.module.css:310–311](../../src/app/(public)/home.module.css#L310) — `.continuationPanel` gradient uses `rgb(220 235 228 / 0.8)` and `rgb(255 255 255 / 0.76)` (a `--forest-100` derivative + `--paper-0` overlay)

Symptom: a future rename of the warm palette (`--gold-500` → `--accent-warm-500`, hypothetical) cannot reach the home page; same vulnerability the lesson-detail CSS had pre-`P2-SUX-001-01`. Side effect: visual rhythm on `/` cannot be propagated to new landing pages without a copy-paste of these overlays.

**Scope**

1. Add to `src/styles/globals.css` (or the corresponding tokens partial used by the DS) a small set of overlay tokens covering the patterns used by both [home.module.css](../../src/app/(public)/home.module.css) and [public-marketing-page.module.css](../../src/components/public/public-marketing-page.module.css). Proposed names — adjust to match the existing token vocabulary if a closer convention exists:
   - `--overlay-paper-strong` (`rgb(255 255 255 / 0.82)`)
   - `--overlay-paper-soft` (`rgb(252 250 244 / 0.9)`)
   - `--overlay-warm-faint` (`rgb(184 145 61 / 0.2)`)
   - `--overlay-forest-faint` (`rgb(220 235 228 / 0.8)`)
   - `--gradient-hero-paper` (composite gradient built from `--overlay-paper-strong` + `--overlay-paper-soft`)
   - `--gradient-hero-forest` (composite for the decision-story aside)
2. Update [docs/design-system/tokens-cheatsheet-v1.md](../design-system/tokens-cheatsheet-v1.md) in the same commit with a new "Overlays and composite gradients" section. Categorize and explain each token's intended use case.
3. Replace all 15+ hits in [home.module.css](../../src/app/(public)/home.module.css) with the new tokens. Run `pnpm lint:arch` to confirm no other route-local CSS regressed.
4. Audit and replace any equivalent hardcodes in [public-marketing-page.module.css](../../src/components/public/public-marketing-page.module.css) (`grep -n 'rgb(' src/components/public/public-marketing-page.module.css`).

**Out of scope**

- Renaming or deprecating existing color tokens (`--forest-700`, `--gold-500`, etc.).
- Touching `(student)/**` or `tutor/**` CSS modules — covered by the SUX/TUX packs.
- Adding `@property` typed CSS custom properties — adopt only if the existing tokens use them already.

**Acceptance**

- `grep -rn 'rgb(' src/app/\(public\)/ src/components/public/` returns zero hits.
- `grep -rn 'rgba(' src/app/\(public\)/ src/components/public/` returns zero hits.
- Visual diff on `/` between before/after shows no perceptible change. Capture before/after screenshots at 1280 px.
- [tokens-cheatsheet-v1.md](../design-system/tokens-cheatsheet-v1.md) lists every new token with one-line description and at least one example consumer.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`. Manual visual check on `/` and the four `PublicMarketingPage`-backed routes (`/how-it-works`, `/become-a-tutor`, `/trust-and-safety`, `/support`).

---

### 5.2 `P2-LAND-001-02` DS `PageHero` composition

**Status:** `ready` · **Priority:** `P1`

**Problem**

Two route-local hero shapes coexist with no DS primitive:

- [home.module.css:31–113](../../src/app/(public)/home.module.css#L31): two-column grid `.hero` + `.heroCopy` + `.decisionStory` aside.
- [public-marketing-page.module.css:6–73](../../src/components/public/public-marketing-page.module.css#L6): two-column grid `.hero` + `.heroCopy` + `.signalPanel` aside, used by `/how-it-works`, `/become-a-tutor`, `/trust-and-safety`, `/support`.

Both encode the same intent (left = copy + CTAs + chip row; right = aside Panel) but in two incompatible primitives. New landing pages added by this pack (country guide, score conversion, comparison, glossary, plus a reworked `/tutors` and `/tutors/[slug]`) would either build a third shape or copy one of these.

**Scope**

1. Extract a new `PageHero` DS primitive at `src/components/ui/page-hero.tsx` + `page-hero.module.css` (or the directory convention the DS already uses). API:

```tsx
type PageHeroProps = {
  eyebrow?: string;            // small all-caps eyebrow above title
  title: ReactNode;            // H1 — accepts ReactNode so callers can wrap an accent in <span>
  intro: ReactNode;            // lead paragraph
  actions?: ReactNode;         // CTA button row — caller composes <Button>s
  chipRow?: ReactNode;         // optional chip row under actions
  aside?: ReactNode;           // optional right-side composition (Panel, MetricTile grid, image, video)
  tone?: "paper" | "warm";     // background variant
};
```

2. The `aside` slot is intentionally a `ReactNode` so callers compose `Panel`, `MetricTile`, `TestimonialCard`, or an image without `PageHero` knowing what's inside. This preserves home's `.decisionStory` and public-marketing's `.signalPanel` use cases.
3. Update [component-inventory-v1.md](../design-system/component-inventory-v1.md) in the same commit. Reference `PageHero` from [docs/design-system/component-specs-core-v1.md](../design-system/component-specs-core-v1.md).
4. Do **not** migrate any existing page in this task — that happens in tasks `-10` through `-15` and the new-route tasks `-24` / `-26` / `-28` / `-30`.

**Out of scope**

- Migrating consumers (deferred to the page-rework tasks).
- Deleting [public-marketing-page.tsx](../../src/components/public/public-marketing-page.tsx) — its wrapping role survives even after `PageHero` extraction; the rework tasks decide whether to keep it.

**Acceptance**

- `PageHero` renders with title-only as the minimal case; renders with full prop set as the maximal case.
- Storybook entry or unit test in `src/test/components/ui/page-hero.test.tsx` covering the four meaningful prop combinations.
- Inventory and spec docs updated.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`. No `pnpm test:e2e` required (no Class A route changed yet).

---

### 5.3 `P2-LAND-001-03` DS `CtaBand` composition

**Status:** `ready` · **Priority:** `P1`

**Problem**

Two route-local CTA bands ship today:

- [home.module.css:274–301](../../src/app/(public)/home.module.css#L274) `.finalCta` — forest-gradient band with split text + button.
- [public-marketing-page.module.css:112–141](../../src/components/public/public-marketing-page.module.css#L112) `.finalCta` — same intent, slightly different markup, also forest-gradient.

Every new landing page in this pack would build a third copy.

**Scope**

1. Extract `CtaBand` at `src/components/ui/cta-band.tsx`. API:

```tsx
type CtaBandProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions: ReactNode;          // 1–2 <Button>s — caller composes
  tone?: "forest" | "paper";   // default "forest"
};
```

2. Consumes the gradient tokens added in `-01`.
3. Update [component-inventory-v1.md](../design-system/component-inventory-v1.md).
4. Do not migrate consumers in this task.

**Out of scope**

- Adding alternate orientations (centered, image-bg, etc.) beyond the two existing patterns.

**Acceptance**

- Primitive renders both tones; description optional; actions required; eyebrow optional. Test in `src/test/components/ui/cta-band.test.tsx`.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`.

---

### 5.4 `P2-LAND-001-04` DS `FaqAccordion`

**Status:** `ready` · **Priority:** `P1`

**Problem**

The only FAQ surface on the public site is the SEO landing template [seo-landing-page.tsx:380–430](../../src/app/(public)/_seo-landing/seo-landing-page.tsx#L380), rendered as a route-local `<dl>` of `<dt>`/`<dd>` pairs styled inside [seo-landing.module.css](../../src/app/(public)/_seo-landing/seo-landing.module.css). The markup is semantically correct but not in the DS, so the four routes that will get FAQs in this pack (`/`, `/how-it-works`, `/become-a-tutor`, `/trust-and-safety`, `/support`) plus every new programmatic surface would each copy the markup.

FAQ schema has the highest AI-citation rate among schema types because the Q→A pair shape mirrors how AI assistants reply. The primitive must (a) render valid HTML the AX tree understands, (b) be paired with a thin schema helper so JSON-LD `FAQPage` emits from the same source array.

**Scope**

1. Extract `FaqAccordion` at `src/components/ui/faq-accordion.tsx`. API:

```tsx
type FaqItem = { question: string; answer: ReactNode };

type FaqAccordionProps = {
  eyebrow?: string;
  title?: string;
  items: FaqItem[];
  defaultOpenFirst?: boolean;
};
```

2. Implementation uses native `<details>`/`<summary>` for zero-JS expand behavior (Web platform, AX-safe by default, no library). Style the `summary` with an `Icon name="chevron-down"` that rotates on `[open]`. Do **not** use a third-party accordion library.
3. Add a paired schema helper at `src/lib/seo/schema/faq.ts` (if not already present) exporting `buildFaqPageSchema(items: FaqItem[])` that consumes the same `FaqItem[]` array. The two must always be fed from one source array so the visible Q→A and the JSON-LD never drift.
4. Update [component-inventory-v1.md](../design-system/component-inventory-v1.md).

**Out of scope**

- Rendering rich-text answers via MDX. `answer: ReactNode` lets the caller compose `<p>` + `<ul>` + `<a>` directly; no editor is required.
- Multi-open / single-open behavior toggle — `<details>` is multi-open by default; that's acceptable for this version.

**Acceptance**

- Keyboard: focus moves into `summary`, `Enter`/`Space` toggles. `tab` cycles through opened answers.
- Two consumers will exist after the rework tasks: SEO landing template (`-17`) and `/support` (`-14`). Both must render identical AX tree behavior.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`. AX assertion via `@testing-library/react` (the project already uses Vitest + Testing Library per [CLAUDE.md](../../CLAUDE.md)).

---

### 5.5 `P2-LAND-001-05` DS `Breadcrumb` primitive

**Status:** `ready` · **Priority:** `P1`

**Problem**

The SEO landing template renders breadcrumbs inline at [seo-landing-page.tsx](../../src/app/(public)/_seo-landing/seo-landing-page.tsx) as a route-local pattern. `BreadcrumbList` JSON-LD already exists in [src/lib/seo/schema/breadcrumb.ts](../../src/lib/seo/schema/breadcrumb.ts) (or wherever the schema family lives — confirm path before editing). New routes (`/destinations/[country]`, `/scoring/[conversion]`, `/compare/[topic]`, `/glossary/[term]`) all need visible breadcrumbs, and the home page is the one static route missing breadcrumb schema.

**Scope**

1. Extract `Breadcrumb` at `src/components/ui/breadcrumb.tsx`. API:

```tsx
type BreadcrumbCrumb = { label: string; href?: Route };

type BreadcrumbProps = {
  trail: BreadcrumbCrumb[]; // last crumb is the current page (no href)
};
```

2. Renders as `<nav aria-label="Breadcrumb">` with an ordered list and `Icon name="chevron-right"` separators. The last crumb gets `aria-current="page"`. Uses `--body-sm` / `--ink-500`.
3. Paired with the existing breadcrumb schema helper — feed both from a single trail array per page.
4. Update [component-inventory-v1.md](../design-system/component-inventory-v1.md).

**Out of scope**

- Collapsing long trails behind an ellipsis menu (defer until a real route has >4 crumbs).

**Acceptance**

- Component renders the SEO landing breadcrumb trail unchanged after migration (visual check in task `-17`).
- Schema and visual trail driven from the same `trail` array in any consumer.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`.

---

### 5.6 `P2-LAND-001-06` DS `TestimonialCard`

**Status:** `ready` · **Priority:** `P2`

**Problem**

No testimonial surface exists on the public site. Trust proof on home is a hand-built grid of three abstract titles. Every 2026 landing-page playbook lists testimonials as a top-three trust-conversion lever ([Unicorn Platform 2026](https://unicornplatform.com/blog/seo-for-landing-pages/), [Leadfeeder 2026](https://www.leadfeeder.com/blog/conversion-optimization/landing-pages-convert/)). Tutor reviews already render inside [src/app/(public)/tutors/[slug]/page.tsx](../../src/app/(public)/tutors/[slug]/page.tsx) but the composition is route-local.

**Scope**

1. Extract `TestimonialCard` at `src/components/ui/testimonial-card.tsx`. API:

```tsx
type TestimonialCardProps = {
  quote: ReactNode;
  author: {
    name: string;
    role?: string;          // e.g. "DP1 parent", "DP2 student"
    avatarUrl?: string;
  };
  rating?: number;          // 1..5, renders <StarRating mode="display" />
  context?: string;         // e.g. "English A HL · IA feedback"
  capturedOn?: string;      // ISO date for dateline + JSON-LD
};
```

2. Composes existing `PersonSummary`, `StarRating`, and `Icon` (no new primitives required beyond layout CSS).
3. Add `src/modules/marketing/testimonials.ts` as an authored-content registry — same pattern as [authored-content.ts](../../src/modules/marketing/seo-landing/authored-content.ts). Ship the registry empty in this task; first content lands in `-10` (home rework). No third-party review API.
4. Update [component-inventory-v1.md](../design-system/component-inventory-v1.md).

**Out of scope**

- Pulling live tutor reviews into the marketing surface. Marketing testimonials are curated, attributed, and authored separately.
- A carousel. Render up to three side-by-side; no animation.
- A `Review` JSON-LD emitter — handle at the consumer (home `-10` and any other consumer) using existing helpers.

**Acceptance**

- Renders with minimum props (quote + author.name) and with maximum props.
- `src/modules/marketing/testimonials.ts` exists with a typed schema and an empty array.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`.

---

### 5.7 `P2-LAND-001-07` Implement specced `MetricTile`

**Status:** `ready` · **Priority:** `P2`

**Problem**

[component-specs-phase2-v1.md:493–607](../design-system/component-specs-phase2-v1.md#L493) specifies `MetricTile` and no implementation exists. Home's "This week" stats (tutors accepting, examiners, price range — currently a `<dl>` inside `.decisionStory`), the country-guide "required IB score" hero stat, and the score-conversion landing "top-of-page conversion answer" all need it.

**Scope**

1. Implement at `src/components/ui/metric-tile.tsx` strictly to the spec at [component-specs-phase2-v1.md:493](../design-system/component-specs-phase2-v1.md#L493). Do not deviate from the spec without escalating.
2. Update [component-inventory-v1.md](../design-system/component-inventory-v1.md) — flip `MetricTile` from "specified" to "implemented".

**Out of scope**

- Animated counters, charts, sparklines — none of these are in the spec.

**Acceptance**

- Visual match to spec; unit tests in `src/test/components/ui/metric-tile.test.tsx`.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`.

---

### 5.8 `P2-LAND-001-08` Implement specced `CompareTable`

**Status:** `ready` · **Priority:** `P2`

**Problem**

[component-specs-phase2-v1.md:381–490](../design-system/component-specs-phase2-v1.md#L381) specifies `CompareTable` and no implementation exists. The comparison route family (`-28` / `-29`) needs it. The reworked `/compare` student surface (covered by the SUX pack) will eventually consume the same primitive — building it here lets both surfaces converge on one component.

**Scope**

1. Implement at `src/components/ui/compare-table.tsx` strictly to the spec.
2. Update [component-inventory-v1.md](../design-system/component-inventory-v1.md).
3. Mobile behavior: the spec defines how columns stack at narrow widths — follow it. If the spec is silent, escalate.

**Out of scope**

- Sortable columns, filterable rows, sticky headers beyond what the spec requires.

**Acceptance / Verification**

- Same shape as `-07`: spec match, tests, lint/typecheck/build pass.

---

### 5.9 `P2-LAND-001-09` DS `CountryTile` + `ConversionTile`

**Status:** `ready` · **Priority:** `P2`

**Problem**

The hub pages (`/destinations`, `/scoring`, `/compare`, `/glossary`) all need a tile grid: short label + optional flag/icon + one-line description + link. Without DS primitives, each hub would build a route-local tile.

**Scope**

1. Add `CountryTile` and `ConversionTile` (and a generic `LinkTile`) to `src/components/ui/`. APIs:

```tsx
type LinkTileProps = {
  href: Route;
  title: string;
  description?: string;
  leading?: ReactNode;          // <Flag>, <Icon>, image
  trailing?: ReactNode;         // metric chip etc.
};

type CountryTileProps = {
  href: Route;
  countryName: string;
  countryCode: FlagCode;        // routed through <Flag />
  averageIbScore?: number;       // optional metric chip
};
```

2. `CountryTile` and `ConversionTile` are thin wrappers around `LinkTile` that bake in the flag / conversion-icon convention. They exist so consumers can't accidentally drop in a raw `<svg>` or emoji flag.
3. Update [component-inventory-v1.md](../design-system/component-inventory-v1.md).

**Out of scope**

- Hover-only flyout previews.
- Image-backed tiles (defer until a route requests them).

**Acceptance / Verification**

- Tests in `src/test/components/ui/link-tile.test.tsx`. Lint/typecheck/build/test pass.

---

### 5.10 `P2-LAND-001-10` Home page rework

**Status:** `ready` · **Priority:** `P1`

**Problem**

The home page has the most traffic and the most generic copy. Concrete problems documented in [§1.1](#11-the-visible-landing-pages-are-generic-and-look-the-same) and [§1.2](#12-ds-first-violations-and-undefined-contracts).

**Scope**

1. Replace the route-local `.hero` block with `PageHero` from `-02`. Keep the decision-story aside content but render it as the `aside={...}` prop, composed from `Panel` + `MetricTile` (`-07`) — not route-local `.decisionStory` CSS.
2. Replace the route-local `.finalCta` with `CtaBand` from `-03`.
3. Add a new section between "Sample matches" and "Trust proof": **Testimonials** — 3 `TestimonialCard`s from `-06`, drawn from `src/modules/marketing/testimonials.ts`. Author the first 3 testimonials in this task (sourced from real tutor reviews if any are review-published in production; otherwise, escalate to product for approved placeholder copy — do **not** ship Lorem ipsum or made-up names).
4. Add a new section between "Trust proof" and "Browse curated IB tutoring pages": **Frequently asked questions** — `FaqAccordion` from `-04` with 6 authored Q→A pairs covering: matching speed, who Mentor IB is for, what fits get surfaced, how pricing works, what to expect from the first lesson, refund posture. Wire the same items array into `buildFaqPageSchema` and merge into the page's `StructuredData`.
5. Rewrite operator-vocabulary copy:
   - "**Visible fit reasoning**" → "**See why each tutor was matched**".
   - "**Safe continuity**" → "**One place for messages and lessons**".
   - "**IB-specific context**" → "**Built around IB, not generic tutoring**".
   - Hero H1: replace "IB help for the part that feels hard right now" with an answer-first headline that names the product's job, e.g. "**Match with the IB tutor who fits your exact subject, level, and need.**" Lead the intro with the concrete "what you get" sentence within the first 200 chars (BLUF — see `-23`).
   - Pressure-point chips keep their domain-specific labels (IA feedback, TOK essay, IO practice, EE planning, HL exam rescue, weekly support) — these are already good.
6. Add `BreadcrumbList` schema (single crumb: Home) using the new `Breadcrumb` schema helper. Visible `Breadcrumb` is not rendered on home.
7. Retire every `rgb()` hardcode left in [home.module.css](../../src/app/(public)/home.module.css) after `-01` lands — by this point the file should consist almost entirely of layout and spacing.

**Out of scope**

- Changing the `StudentContinuationPanel` behavior — the signed-in continuation is functionally correct and gated by the auth check.
- Adding video / image hero (defer to follow-up if traffic data warrants).
- Changing how `seoBrowse` links are loaded.

**Acceptance**

- Visible diff: hero shape standardized, decision story still present but composed via DS aside slot, testimonials section present with 3 cards, FAQ section present with 6 expandable Q→A pairs, CTA band uses `CtaBand`.
- `grep -n 'rgb(' src/app/\(public\)/home.module.css` → zero hits.
- Source view: schema graph includes `WebPage` + `Organization` + `WebSite` + `BreadcrumbList` + `FAQPage`. (Schema graph unification in `-20` will further consolidate to `@graph` form.)
- Lighthouse mobile + desktop both ≥ 95 across Perf / Accessibility / Best practices / SEO. Capture before/after numbers.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`, `pnpm test:e2e` (home is in the Playwright smoke). Manual: walk `/` at 360 / 768 / 1280 / 1440 px; expand each FAQ; tab through hero CTAs.

---

### 5.11 `P2-LAND-001-11` `/how-it-works` rework

**Status:** `ready` · **Priority:** `P1`

**Problem**

`/how-it-works` is one of four routes consuming the same `PublicMarketingPage` shape — 4 sections in a 2-col grid, identical eyebrow→title→bullets rhythm to `/become-a-tutor`, `/trust-and-safety`, `/support`. Copy is generic ("Tutor fit context", "Booking continuity") and there is no worked example, no FAQ, no schema beyond `WebPage` + `BreadcrumbList`.

**Scope**

1. Replace the route-local `PublicMarketingPage` consumer call with direct composition: `PageHero` (`-02`) + a new `HowItWorksSteps` section (3 steps, each with an `Icon` lead, a one-sentence "what happens", and a one-sentence "what you get") + a worked-example callout section (one concrete IB student journey: subject, need, what got surfaced, what they booked, what changed) + `FaqAccordion` (`-04`, 5 Q→A) + `CtaBand` (`-03`).
2. Add `HowTo` schema describing the matching process — three steps, named, with text bodies. Adds AI-citation surface for queries like "how does Mentor IB matching work?". ([averi.ai](https://www.averi.ai/how-to/traditional-seo-is-failing-on-perplexity-and-chatgpt-the-complete-migration-guide-for-2026))
3. Add `FAQPage` schema from the same Q→A array consumed by `FaqAccordion`.
4. Differentiate visually from `/become-a-tutor` / `/trust-and-safety` / `/support` — `HowItWorksSteps` uses a horizontal 3-column flow with arrow `Icon`s between steps on desktop, stacked on mobile. (`HowItWorksSteps` is a route-local composition of DS primitives, not a new DS primitive — three `Section`s in a flex row count as "composition", not a new primitive.)
5. Copy rewrite — answer-first throughout:
   - H1: "How Mentor IB matches students with IB tutors in three steps."
   - Step 1 lead: "**You describe the exact IB subject, level, and need.**"
   - Step 2 lead: "**Mentor IB surfaces a small shortlist with the *why* of each fit.**"
   - Step 3 lead: "**You book, message, and run lessons inside one account.**"
   - Worked example: real subject/level/situation, not a hypothetical.

**Out of scope**

- Animations or scroll-driven step reveal.
- Video walkthrough (defer; would require asset pipeline decision).

**Acceptance**

- Visual: page no longer looks identical to `/become-a-tutor`. Side-by-side comparison shows different section shapes and rhythms.
- Schema: `WebPage` + `BreadcrumbList` + `HowTo` + `FAQPage` validate against Google Rich Results.
- Copy: every section's first 200 chars contains the direct answer to the section's question.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`, `pnpm test:e2e` if the route is in the smoke suite (it is — public route family). Manual: walk `/how-it-works` at 360 / 768 / 1280 / 1440 px.

---

### 5.12 `P2-LAND-001-12` `/become-a-tutor` rework

**Status:** `ready` · **Priority:** `P1`

**Problem**

Same template-clone problem as `/how-it-works`. Signal badges include operator phrase "**One tutor mode**" which means nothing to a prospective tutor. No JSON-LD `JobPosting`. No payouts/earnings explainer, no FAQ, no application-flow walkthrough.

**Scope**

1. Replace `PublicMarketingPage` consumer call with direct composition: `PageHero` + an `ApplicationFlowSteps` block (route-local composition of DS primitives — "1. Tell us about your IB experience → 2. Profile review → 3. Approved + discoverable") + a "**What you earn**" section (composed of `MetricTile`s explaining payout structure at the level the trust-and-safety + pricing docs allow) + `FaqAccordion` (8 Q→A: qualifications, application turnaround, payouts/timing, fees, what gets reviewed, how lessons get scheduled, what happens after approval, how matching surfaces tutors) + `CtaBand`.
2. Add `JobPosting` schema (Mentor IB acts as the platform; schema describes the tutor role with no salary, location: remote, employmentType: contractor). Validate against Google's JobPosting requirements; if any required field cannot be populated without inventing data (e.g. specific salary range), omit the schema rather than ship a partial. Escalate if uncertain.
3. Add `FAQPage` schema.
4. Copy rewrite: remove "One tutor mode" (replace section with "**One profile, one inbox, one earnings view**"); remove "Profile quality" (replace with "**What an approved profile looks like**"); rewrite Standards section to start with the direct answer to "what does Mentor IB look for in a tutor profile?".

**Out of scope**

- Inline application form. Application happens in `/setup/**`; the public page CTAs link there.
- Tutor case studies / interviews (defer to editorial / blog if the blog task `-33` lands).

**Acceptance / Verification**

- Same shape as `-11`: schema validates, visual diff vs `/how-it-works` shows clearly different rhythm, FAQ expands, lint/typecheck/build/test/e2e pass.

---

### 5.13 `P2-LAND-001-13` `/trust-and-safety` rework

**Status:** `ready` · **Priority:** `P1`

**Problem**

Operator-vocabulary leakage in section titles ("Public trust copy stays grounded", "Public claim discipline"). Parent-facing audience but tone is procedural. No FAQ, no concrete safeguarding policy block, no `EducationalOrganization` / `Service` schema upgrade despite being the page parents look at before deciding.

**Scope**

1. Replace `PublicMarketingPage` consumer call with direct composition: `PageHero` + a **Safeguarding** section listing concrete policies (background check posture, age-verification, communication-stays-on-platform rule, payment-stays-on-platform rule, reporting paths — each as a single bullet with one supporting sentence) + a **What we review on tutor profiles** section + a **What parents can expect** section + `FaqAccordion` (6 Q→A: how tutors are reviewed, what data is collected on minors, what happens to lesson recordings (if applicable), how to report a tutor, how disputes are handled, refund policy) + `CtaBand` pointing at `/support`.
2. Add `FAQPage` schema. Optionally extend the `Organization` schema with `knowsAbout: ["IB Diploma Programme", ...]` and `areaServed: "Worldwide"` so AI engines indexing trust/safety pages can place Mentor IB inside an entity graph.
3. Parent-facing tone rewrite:
   - "**Public trust copy stays grounded**" → "**What we will and will not claim**".
   - "**Public claim discipline**" → drop entirely; replace with "Verified credentials only".
   - H1 to lead with the direct parent question's answer: "**Mentor IB reviews every tutor profile before it is discoverable, and keeps all lessons and payments inside one platform.**"

**Out of scope**

- A formal safeguarding policy PDF — links should point at `/privacy-policy` and `/terms` which already own the legal surface.

**Acceptance / Verification**

- Same shape as `-11`/`-12`. Manual review must read like a parent-trust page, not an internal product memo.

---

### 5.14 `P2-LAND-001-14` `/support` rework

**Status:** `ready` · **Priority:** `P1`

**Problem**

`/support` is titled "Mentor IB Support and Common Questions" but ships **no questions**. Four `Section` panels of 2-bullet generic guidance. The signal "Parent clarity" is vague. The route has `HelpPageSchema` but no `FAQPage` schema.

**Scope**

1. Replace `PublicMarketingPage` consumer call with direct composition: `PageHero` + a `TabBar` (already in DS) splitting the page into four audience-keyed FAQ groups: **Students**, **Parents**, **Tutors**, **Safety** + `FaqAccordion` (`-04`) within each tab, 5–8 Q→A per tab + a contact `CtaBand` linking to `/support` with email or a future contact channel (escalate if no email exists yet — do not invent one).
2. Add `FAQPage` schema. Keep `HelpPage` schema (already there). The two coexist on the same `<html>` — emit both inside the `@graph` (see `-20`).
3. Authoring: 20+ Q→A pairs total, written in answer-first form. Each answer leads with the direct answer in the first sentence, then optional supporting context. Reference real product behavior — escalate to product if any answer requires a feature claim that hasn't shipped.

**Out of scope**

- Live chat widget. Out of scope for the pack and would require a new vendor.
- A ticket form. CTAs route to email or `/support` follow-up only.

**Acceptance**

- Page actually delivers what the `<title>` promises: common questions, grouped by audience, with `FAQPage` schema emitted.
- `FAQPage` JSON-LD validates against Google's Rich Results test and includes every visible Q→A.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, `pnpm test:e2e`. Manual walk; expand every FAQ in each tab; validate schema.

---

### 5.15 `P2-LAND-001-15` `/tutors` index rework

**Status:** `ready` · **Priority:** `P1`

**Problem**

`/tutors` is the only public route shipping **no `StructuredData`**. No `WebPage`, no `BreadcrumbList`, no `WebSite.SearchAction`. Page content is otherwise functional (Algolia search experience or unconfigured-state `ScreenState`). H1 is good ("Find an IB tutor by subject, language, or focus area.") but the lede is the only on-page content — no faceted entry-point list, no subject pillar grid.

**Scope**

1. Add `WebPageSchema` (already-existing helper) + `BreadcrumbListSchema` (Home → Find tutors) + extend the existing `WebSiteSchema` emitted on home to include `potentialAction: SearchAction` pointing at `/tutors?q={search_term_string}`. Validate against Google's site-search rich result requirements.
2. Below the search experience, add a subject pillar grid: 6 `CountryTile`-style tiles (use the generic `LinkTile` from `-09`) — one per IB group (Group 1 Studies in Language and Literature, Group 2 Language Acquisition, Group 3 Individuals and Societies, Group 4 Sciences, Group 5 Mathematics, Group 6 The Arts). Each tile links to the corresponding `/subjects/[subject-slug]` (the highest-traffic subject within that group) and labels with a one-line description + the number of approved tutors in that group (loaded from existing reference + repository data — no new query types).
3. Below the pillar grid, add a language entry-point row using existing reference data and the `Flag` primitive — top 8 IB lesson languages, each a `Chip` (tone=info) link to `/tutors?lang={code}`.
4. Add a brief **Why search via Mentor IB** paragraph (BLUF, < 250 chars) answering the "is this a marketplace?" entity question. AI engines parsing `/tutors` should be able to cite this paragraph for queries like "what is Mentor IB?".
5. Indexability gate stays as-is: `isIndexable: !hasFilterParams` is correct.

**Out of scope**

- Changing the Algolia search experience UX, paginate-friendliness, or the unconfigured-state component.
- Adding a tutor-list `ItemList` schema for the rendered results (would require parsing client-side state into server-rendered JSON-LD; defer).

**Acceptance**

- Validate `WebSite.SearchAction` via Google Rich Results test against `/`.
- Visible subject pillar grid + language row render at all breakpoints.
- BLUF paragraph cited correctly when asked "what is Mentor IB" via Perplexity preview (where available).

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, `pnpm test:e2e`. Manual walk + schema validation.

---

### 5.16 `P2-LAND-001-16` Cross-page operator-vocabulary copy pass

**Status:** `ready` · **Priority:** `P1`

**Problem**

Operator vocabulary appears in many places across the public surface. Tasks `-10` through `-15` rewrite most of it on their respective surfaces, but the cross-page audit catches what remains and enforces a single voice.

**Scope**

1. `grep -rn` the public surface (`src/app/(public)/**` plus `src/components/public/**` plus `src/modules/marketing/**`) for the operator-vocabulary phrases:
   - "Decision cues"
   - "Visible fit reasoning"
   - "One tutor mode"
   - "Profile quality"
   - "Public claim discipline"
   - "Public trust copy stays grounded"
   - "Booking continuity"
   - "Safe continuity"
   - "Tutor fit context"
   - "Parent clarity"
   - "Approved profiles" (used as a badge label — keep meaning, soften wording)
2. Replace each instance with the user-facing equivalent decided in tasks `-10` through `-15`. Maintain a single decision table in this task's commit message so the rewrites stay consistent.
3. Update [src/modules/marketing/home-content.ts](../../src/modules/marketing/home-content.ts) `trustProof` titles and bodies to use the rewrites from `-10`.
4. Pass through every `Chip`, `StatusBadge`, `InlineNotice` title on the public surface — if its first word names a user-facing benefit, keep; if its first word names an internal concept (visibility, discoverability, gating, surfacing, posture), rewrite.

**Out of scope**

- Touching `(student)/**`, `tutor/**`, or `(account)/**` copy.

**Acceptance**

- `grep -rn "Decision cues\|Visible fit reasoning\|One tutor mode\|Profile quality\|Public claim discipline\|Public trust copy stays grounded\|Booking continuity\|Safe continuity" src/app/\(public\) src/components/public src/modules/marketing` → zero hits.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, `pnpm test:e2e`. Visual review for tone consistency.

---

### 5.17 `P2-LAND-001-17` Adopt `FaqAccordion` inside SEO landing template

**Status:** `ready` · **Priority:** `P2`

**Problem**

The SEO landing template's `FaqBlock` is route-local `<dl>` markup. With `FaqAccordion` in the DS, this is now reuse-before-extend debt.

**Scope**

1. Replace `FaqBlock` rendering in [seo-landing-page.tsx](../../src/app/(public)/_seo-landing/seo-landing-page.tsx) with `FaqAccordion` from `-04`. Feed the same `faq` array.
2. Confirm `FaqPage` JSON-LD continues to emit identically — same source array drives both.
3. Replace the route-local breadcrumb rendering with `Breadcrumb` from `-05`. Feed the same trail array driving `BreadcrumbListSchema`.
4. Remove now-dead CSS in [seo-landing.module.css](../../src/app/(public)/_seo-landing/seo-landing.module.css). Fix the `font-size: 22px` hardcode at [seo-landing.module.css:134](../../src/app/(public)/_seo-landing/seo-landing.module.css#L134) by routing through `--title-md`.

**Out of scope**

- Changing the SEO landing content shape (5 questions block, related links, curated tutors) — those are correct as is.

**Acceptance / Verification**

- Visual diff of `/subjects/biology` (or any existing SEO landing) before/after shows no perceptible change beyond expand/collapse interaction now being native.
- Same Rich Results validation as before.

---

### 5.18 `P2-LAND-001-18` Subject / service SEO landing copy depth pass

**Status:** `ready` · **Priority:** `P2`

**Problem**

[seo-landing/authored-content.ts](../../src/modules/marketing/seo-landing/authored-content.ts) ships 5 authored answers + an FAQ per slug. The shape is correct (and authored, not templated). 2026 AI-SEO guidance favors deeper content per page when the topic warrants it (a subject page should outweigh a one-paragraph definition page). Programmatic SEO done well in 2026 means **deeper per-page content, not more pages**. ([Backlinko](https://backlinko.com/programmatic-seo), [Shopify](https://www.shopify.com/blog/programmatic-seo))

**Scope**

1. For every subject in `loadActiveReferenceSubjects()` and every focus area in `loadActiveReferenceSubjectFocusAreas()`, audit the corresponding `authored-content.ts` entry. Confirm:
   - The 5 questions answer the entity's most-asked questions (use AI-engine search-suggest tools and existing analytics if available; otherwise commission from product).
   - The FAQ has ≥ 6 Q→A.
   - The intro paragraph is BLUF-shaped (`-23`).
2. Where entries are thin, extend them. Where entries are missing, gate-out via the existing publish-gate ([publish-gate.ts](../../src/modules/marketing/seo-landing/publish-gate.ts)) — do **not** ship thin pages.
3. No template changes. Authoring only.

**Out of scope**

- Adding new subjects or focus areas to reference data.
- AI-generated content. Authoring is by humans (commission via product if needed); LLM drafts are an internal tool, not a substitute.

**Acceptance**

- Every published subject and focus area passes the depth bar: 5 authored answers + 6+ FAQ + BLUF intro.
- Publish-gate fails for any slug not meeting the bar.

**Verification**

- `pnpm test` (publish-gate unit tests). Manual sample-check 3 random subjects + 3 random focus areas.

---

### 5.19 `P2-LAND-001-19` `llms.txt` + `llms-full.txt`

**Status:** `ready` · **Priority:** `P1`

**Problem**

No `llms.txt` exists. AI crawlers (ChatGPT live browsing, Perplexity, Claude with web tools) preferentially follow `llms.txt` to discover canonical content. Cheap, high-value gap. ([derivatex.agency](https://derivatex.agency/blog/llms-txt-guide/))

**Scope**

1. Add `src/app/llms.txt/route.ts` (Next.js Route Handler returning `text/plain`) that emits the canonical `llms.txt` shape:
   - `# Mentor IB` H1
   - One-paragraph site summary (BLUF — answers "what is Mentor IB?")
   - `## Sections` with grouped link lists
   - Sections: Core (home, how-it-works, become-a-tutor, support, trust-and-safety), Subjects (every published `/subjects/[slug]`), Services (every published `/services/[slug]`), Destinations (after `-24` lands — gate behind feature), Scoring (after `-26` lands), Compare (after `-28`), Glossary (after `-30`), Tutors (sample of curated tutor profiles where `evaluateTutorProfileIndexability()` allows)
   - `## Optional` for `/privacy-policy`, `/terms`, `/tutors` (the index, not individual profiles)
2. Add `src/app/llms-full.txt/route.ts` that emits a denser variant with one-sentence descriptions per link, derived from the same `staticPublicRouteDefinitions` registry that drives metadata. Same indexability gates.
3. Pull links from the same sources `sitemap.ts` uses — single source of truth, no drift.
4. Add `llms.txt` and `llms-full.txt` to `src/app/robots.ts` `Allow` rules if not already.
5. Document in `src/lib/seo/README.md` (create if missing) the rule: every new public route family must wire through `sitemap.ts`, `llms.txt`, and `llms-full.txt` simultaneously.

**Out of scope**

- A custom AI-crawler analytics endpoint.
- Blocking specific AI crawlers — leave `robots.txt` AI-friendly per product decision.

**Acceptance**

- `curl https://mentorib.com/llms.txt` returns valid `text/plain` with H1 + grouped link sections.
- `curl https://mentorib.com/llms-full.txt` returns the dense variant.
- Both pass through Vercel's edge cache headers correctly.

**Verification**

- `pnpm build` (route handlers must compile). Local `pnpm start`, `curl localhost:3000/llms.txt`, `curl localhost:3000/llms-full.txt`. Visual sanity-check rendered output.

---

### 5.20 `P2-LAND-001-20` Schema graph unification (`@graph`)

**Status:** `ready` · **Priority:** `P1`

**Problem**

Pages currently emit multiple separate `<script type="application/ld+json">` blocks (e.g. home emits `WebPage` + `Organization` + `WebSite` as three separate blocks via [page.tsx:52–63](../../src/app/(public)/page.tsx#L52)). 2026 AI-engine guidance favors a single `@graph`-linked block with `@id` cross-references — same payload, better entity-graph signal. ([edenrank.com](https://edenrank.com/blog/optimize-schema-markup-for-ai-engines-2026))

**Scope**

1. Refactor [src/lib/seo/schema/json-ld.tsx](../../src/lib/seo/schema/json-ld.tsx) (or whichever file owns `StructuredData`) to accept either a single object, a flat array (today's shape), OR a `@graph` shape. Detect at runtime: if the input array has ≥ 2 schema objects, emit them as a single `@graph` with auto-generated `@id`s and back-references where appropriate.
2. Add a helper `buildGraphSchema(items)` that takes the existing `WebPage` + `Organization` + `WebSite` + `BreadcrumbList` + `FAQPage` + entity (`Course` / `Service` / `ProfilePage` / `HowTo` / `JobPosting`) schemas, assigns stable `@id`s based on URL + schema type, and cross-references (`WebPage.isPartOf` → `WebSite.@id`; `WebPage.about` → entity `@id`; `WebPage.breadcrumb` → `BreadcrumbList.@id`).
3. Migrate every Class A route's `StructuredData` consumer to use `buildGraphSchema`.
4. Backwards-compat: leave the existing per-schema builders intact; only the page-level composition changes.

**Out of scope**

- Adding new schema *types* (those are individual subtasks `-21`, `-11`, `-12`, `-15`).
- Changing the indexability gate logic.

**Acceptance**

- `view-source:` on any Class A route shows a single `<script type="application/ld+json">` per route with `@context: https://schema.org` and `@graph: [...]`.
- Google Rich Results test passes for every Class A route.
- Schema.org validator returns zero errors for every Class A route.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`. Validation pass is `-34`.

---

### 5.21 `P2-LAND-001-21` Tutor `Person` schema upgrade

**Status:** `ready` · **Priority:** `P1`

**Problem**

Tutor profiles emit `ProfilePage` but the embedded `Person` is minimal. 2026 E-E-A-T leans on `Person` fidelity (`sameAs`, `knowsAbout`, `alumniOf`, `hasCredential`) for both Google ranking and AI-overview citation signal. Reviews on the profile are not exposed via `Review` / `AggregateRating` JSON-LD.

**Scope**

1. Extend the existing `Person` schema helper in `src/lib/seo/schema/profile.ts` (confirm path) to accept and emit:
   - `sameAs: string[]` — external verified profile URLs (LinkedIn, ORCID, etc.) — populated from a future tutor-profile field if it exists; otherwise gated out.
   - `knowsAbout: string[]` — IB subjects the tutor is approved for, drawn from the tutor's profile subjects (mapped to canonical subject names).
   - `alumniOf: EducationalOrganization` — degree-issuing institution if present on profile; gated out if missing.
   - `hasCredential: EducationalOccupationalCredential[]` — examiner status, teaching certifications.
2. Add `AggregateRating` to `ProfilePage` when ≥ 3 published reviews exist (gate threshold to avoid skinny rating schema; tune to product preference).
3. Add individual `Review` entries (up to 5 most recent) to the `@graph` for that page.
4. Every new field is *optional* and *gated* — if the underlying profile data is missing, omit the field rather than emit `null` / empty arrays / placeholder text.

**Out of scope**

- Changing the underlying tutor-profile DB schema or DTO. If new fields are required (e.g. a `sameAs` array on the tutor record), that is an escalation.
- Adding `Person` schema to non-tutor surfaces. (Author bios for editorial content are gated behind the blog task `-33`.)

**Acceptance**

- A tutor profile with the maximum data emits all four extension fields. Validate against Google Rich Results.
- A tutor profile missing optional data emits the minimal valid `Person` only — no broken schema.
- `AggregateRating` appears only above the threshold.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`. Schema validation: pick three live tutor profiles spanning the data-completeness spectrum and validate each.

---

### 5.22 `P2-LAND-001-22` Freshness signal pass

**Status:** `ready` · **Priority:** `P2`

**Problem**

`dateModified` is not consistently populated in JSON-LD across Class A routes, and no visible "Updated YYYY-MM-DD" eyebrow exists on programmatic pages. Perplexity weights freshness most heavily of the three major AI engines. ([amivisibleonai.com](https://www.amivisibleonai.com/blog/ai-seo-guide-2026))

**Scope**

1. Add `dateModified` to every Class A schema, populated from the most recent commit touching the page's content source (static routes: commit on the registry entry or the route file; SEO landings: commit on `authored-content.ts` for that slug; tutor profile: profile updated_at). Static-routes case can use a build-time constant.
2. Add a visible eyebrow "Updated <Month> YYYY" on every programmatic surface (SEO landings, country guides, score conversions, comparisons, glossary). Use the same source as the JSON-LD `dateModified`. Do not show on the home page or the four static marketing pages — they are not editorial content and a date eyebrow on them would feel out of place.
3. Add the same date to the `llms.txt` header (`> Last updated: YYYY-MM-DD`).

**Out of scope**

- A CMS-style "edit history" page.

**Acceptance**

- `view-source:` on a SEO landing shows `dateModified` in JSON-LD.
- Visible "Updated <Month> YYYY" on every programmatic surface.

**Verification**

- `pnpm build`, manual sample check on 3 SEO landings.

---

### 5.23 `P2-LAND-001-23` Answer-first / BLUF copy rewrite

**Status:** `ready` · **Priority:** `P2`

**Problem**

AI engines preferentially cite pages that lead with a direct, well-structured answer in the first ~200 characters of a `<section>`. Today many sections open with hero rhetoric or abstraction. ([amivisibleonai.com](https://www.amivisibleonai.com/blog/ai-seo-guide-2026), [averi.ai](https://www.averi.ai/how-to/traditional-seo-is-failing-on-perplexity-and-chatgpt-the-complete-migration-guide-for-2026))

**Scope**

1. For every Class A route, audit each `<section>` against the BLUF rule: the first 200 chars must contain the direct answer to the question the section's title implicitly asks.
2. Rewrite where they don't. Tasks `-10` through `-15` already commit to BLUF for their surfaces; this task is the cleanup pass that catches what remains, including the SEO landing template's authored content, the four `PublicMarketingPage`-derived rewrites, and the new programmatic surfaces from `-24` / `-26` / `-28` / `-30`.
3. Document the BLUF convention in [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) under a new "Public landing copy" section so future copy edits stay aligned.

**Out of scope**

- Rewriting signed-in surface copy.
- Rewriting legal page copy.

**Acceptance**

- Manual review confirms every section on every Class A route leads with an answer-first sentence.

**Verification**

- `pnpm lint:arch` if an arch rule is added; otherwise visual review.

---

### 5.24 `P2-LAND-001-24` `/destinations` route family — template + hub

**Status:** `ready` · **Priority:** `P1`

**Problem**

22 country-guide pages on ibmatch.com (`/study-in-{country}-with-ib-diploma`) capture high-intent IB-tutoring head terms; Mentor IB publishes none. The angle for a tutoring product shifts from "find a degree program in {country}" to "hit the IB score {country} expects, with tutoring help".

**Scope**

1. New route family `(public)/destinations/`:
   - `(public)/destinations/page.tsx` — hub index, server-rendered, lists every country with a published guide. Composes `PageHero` + a grid of `CountryTile`s (`-09`) + `FaqAccordion` (3 Q→A: "do I need to study where I take IB?", "how does my IB score affect university choice?", "what is a competitive IB score?") + `CtaBand`.
   - `(public)/destinations/[country]/page.tsx` — per-country guide template. Composes `Breadcrumb` (`-05`) + `PageHero` (with `MetricTile` aside showing "Required IB", "Typical conditional offer", "Recognized universities") + a **Recognition** section (which universities accept IB, brief authority statement) + a **Grade conversion** section (`CompareTable` from `-08` showing IB → local-system mapping) + a **Subjects and prerequisites** section (subject combinations the destination expects) + a **Language requirements** section + an **Application timeline** section + a **How tutoring helps you hit the target** section (the tutoring conversion bridge — direct CTA into `/match`) + `FaqAccordion` (6 Q→A) + `CtaBand`.
2. Wire into [sitemap.ts](../../src/app/sitemap.ts), [robots.ts](../../src/app/robots.ts), and the `llms.txt` route from `-19`.
3. Add to [src/lib/seo/public-routes.ts](../../src/lib/seo/public-routes.ts).
4. Schema graph: `WebPage` + `BreadcrumbList` + `Course` (the IB Diploma, scoped to destination context) + `Place` (destination country) + `FAQPage`. Emit via `@graph` from `-20`.
5. Content authoring is a separate task (`-25`). This task ships the template + the hub with zero published guides; the publish-gate is content-based, mirroring `seo-landing/publish-gate.ts`.

**Out of scope**

- Mirroring ibmatch's 1,263 individual university-program detail pages — not portable, would require new data, escalation.
- Geo-detection or autoredirect (`/destinations` should not redirect by IP).

**Acceptance**

- Hub renders with zero published guides as "no destinations published yet" `ScreenState` (existing primitive).
- Template renders a sample guide stub correctly at all breakpoints when a single test entry is added to the content registry.
- Schema validates for both hub and stub.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`, `pnpm test:e2e`. Add a Playwright smoke entry for the hub.

---

### 5.25 `P2-LAND-001-25` Country guide authoring pass

**Status:** `ready` · **Priority:** `P1`

**Problem**

Template from `-24` is empty.

**Scope**

1. Author 22 country guides matching ibmatch.com coverage: Australia, UK, USA, Canada, Spain, Germany, Italy, Switzerland, Austria, Sweden, Belgium, Czech Republic, Denmark, Estonia, Hong Kong, Israel, Japan, Netherlands, Ireland, Poland, Portugal, Singapore.
2. Each guide:
   - 800–1200 words
   - BLUF intro: "**To study in {country} with an IB Diploma, you typically need {score} and {subject pattern}.**"
   - Conversion table sourced from public official admissions data; cite the source body in the FAQ.
   - 6+ FAQ entries
   - Updated date populated
3. Content lives in `src/modules/marketing/destinations/authored-content.ts` (or equivalent) — pattern mirrors `seo-landing/authored-content.ts`.
4. Pass publish-gate.

**Out of scope**

- City-level pages (e.g. "study in Sydney with IB") — separate decision needed (`-32`).

**Acceptance**

- 22 guides published, each passing the publish-gate depth bar.
- Schema validates for each.

**Verification**

- `pnpm test` (publish-gate). Manual sample-check 4 random guides.

---

### 5.26 `P2-LAND-001-26` `/scoring` route family — template + hub

**Status:** `ready` · **Priority:** `P1`

**Problem**

ibmatch buries IB-to-local conversion tables inside country prose. Pulling them out as standalone destination-agnostic conversion pages is high informational intent ("ib to atar", "ib to ucas tariff", "ib to gpa") with strong AI-SEO potential (each page answers a discrete table-shaped question).

**Scope**

1. New route family `(public)/scoring/`:
   - `(public)/scoring/page.tsx` — hub listing every published conversion.
   - `(public)/scoring/[conversion]/page.tsx` — per-conversion template. Composes `Breadcrumb` + `PageHero` (with `MetricTile` aside showing the "headline answer" — e.g. "IB 45 = ATAR 99.95") + the conversion table itself (`CompareTable` from `-08`) + a **How to read this table** section + a **What if I'm short of target?** section (direct CTA into `/match`) + `FaqAccordion` (5 Q→A) + `CtaBand`.
2. Schema graph: `WebPage` + `BreadcrumbList` + `FAQPage`. (No `Course` here — conversions are not courses; if `Article` fits better, use `Article` with `about: {Course: IB Diploma}` cross-reference.)
3. Wire into `sitemap.ts`, `robots.ts`, `llms.txt`.

**Out of scope**

- Predicted-grade calculators or interactive widgets. The table is static; the interactive surface is `/match`.

**Acceptance / Verification**

- Same shape as `-24`. Template renders correctly; hub renders correctly; schema validates.

---

### 5.27 `P2-LAND-001-27` Score-conversion authoring pass

**Status:** `ready` · **Priority:** `P2`

**Problem**

Template from `-26` is empty.

**Scope**

1. Ship 5 launch conversions: `ib-to-atar` (Australia), `ib-to-ucas-tariff` (UK), `ib-to-gpa` (US), `ib-to-abitur` (Germany), `ib-to-selectividad` (Spain).
2. Each entry: 600–900 words, authoritative source cited inline.
3. Content in `src/modules/marketing/scoring/authored-content.ts`.

**Acceptance / Verification**

- 5 entries publish, pass publish-gate. Manual review per entry.

---

### 5.28 `P2-LAND-001-28` `/compare/[topic]` route family — template

**Status:** `ready` · **Priority:** `P2`

**Problem**

No comparison content exists. Comparison head terms ("ib vs a-level", "ib vs ap") are high-volume search queries, often a parent's first IB-related search.

**Scope**

1. New route family `(public)/compare/[topic]/`:
   - `(public)/compare/page.tsx` — hub.
   - `(public)/compare/[topic]/page.tsx` — comparison template. Composes `Breadcrumb` + `PageHero` (BLUF answer) + the comparison table (`CompareTable`) + a **Which one fits you?** decision-tree section (a route-local composition of `Card`s, not a new primitive) + `FaqAccordion` (6 Q→A) + `CtaBand`.
2. Schema graph: `WebPage` + `BreadcrumbList` + `FAQPage` + `Article` (the comparison is editorial in shape).
3. Wire into `sitemap.ts`, `robots.ts`, `llms.txt`.

**Acceptance / Verification**

- Same shape as `-24` / `-26`.

---

### 5.29 `P2-LAND-001-29` Comparison authoring pass

**Status:** `ready` · **Priority:** `P2`

**Scope**

1. Ship 3 launch comparisons: `ib-vs-a-level`, `ib-vs-ap`, `ib-vs-abitur`.
2. 800–1200 words each, BLUF intro, 6+ FAQ.
3. Content in `src/modules/marketing/compare/authored-content.ts`.

**Acceptance / Verification**

- 3 entries publish, pass publish-gate.

---

### 5.30 `P2-LAND-001-30` `/glossary` route family — template + hub

**Status:** `ready` · **Priority:** `P2`

**Problem**

No IB glossary exists. Each IB term (IA, EE, TOK, CAS, HL/SL, predicted grades, paper 1/2/3, etc.) is a definition-shaped Q→A — perfect AI-SEO surface. ChatGPT, Perplexity, Claude all preferentially cite definition pages for "what is X" queries. Cheap to author, strong long-tail SEO + AI-SEO compounding.

**Scope**

1. New route family `(public)/glossary/`:
   - `(public)/glossary/page.tsx` — hub, alphabetical list with anchor links.
   - `(public)/glossary/[term]/page.tsx` — per-term template. Composes `Breadcrumb` + a tight `PageHero` (eyebrow + H1 + BLUF definition in the intro) + a **In context** section (where the term appears in the IB Diploma) + a **Related terms** section (`LinkTile` grid) + a **How tutoring helps with {term}** brief tie-in + `CtaBand`.
2. Schema graph: `WebPage` + `BreadcrumbList` + `DefinedTerm` + (optional) `FAQPage`. `DefinedTerm` is the schema type Perplexity preferentially cites for definition queries.
3. Wire into `sitemap.ts`, `robots.ts`, `llms.txt`.

**Acceptance / Verification**

- Same shape as `-24` / `-26` / `-28`.

---

### 5.31 `P2-LAND-001-31` Glossary authoring pass

**Status:** `ready` · **Priority:** `P2`

**Scope**

1. Ship ~25 launch terms covering the IB Diploma Programme surface:
   - Programme structure: IB Diploma Programme, MYP, CP, PYP, DP1, DP2, Group 1–6
   - Levels: Higher Level (HL), Standard Level (SL)
   - Components: Internal Assessment (IA), Extended Essay (EE), Theory of Knowledge (TOK), Creativity Activity Service (CAS), Core
   - Exams: Paper 1, Paper 2, Paper 3, May session, November session
   - Outcomes: Predicted grades, Bonus points (TOK/EE matrix), Bilingual diploma, Full diploma, Course candidates
   - Other: IB Coordinator, IB World School, IBO
2. Each entry: 200–400 words.
3. Content in `src/modules/marketing/glossary/authored-content.ts`.

**Acceptance / Verification**

- 25 entries publish, pass publish-gate.

---

### 5.32 `P2-LAND-001-32` Decision needed: city/region tutor pages

**Status:** `draft` · **Priority:** `P3`

**Problem**

Classic tutoring-marketplace SEO pattern: `/tutors-in-london`, `/tutors-in-singapore`. Strong head terms but requires geo distribution data on tutors and a publish-gate that doesn't create thin pages.

**Why draft**

Two unresolved decisions:

1. Mentor IB's tutor distribution is global by default; many cities would have ≤ 3 tutors. Without sufficient depth, these would be thin / doorway pages — anti-pattern per `Backlinko 2026` programmatic-SEO guidance. ([Backlinko](https://backlinko.com/programmatic-seo))
2. Geo handling (tutor's listed city vs. lessons-anywhere flag) needs a product decision.

**Trigger to lift to `ready`**

Product decides which cities clear a depth bar (≥ 8 active tutors? ≥ 5 reviews?), and the geo flag is sorted on tutor profiles.

**Out of scope until lifted**

Everything.

---

### 5.33 `P2-LAND-001-33` Decision needed: editorial blog

**Status:** `draft` · **Priority:** `P3`

**Problem**

A blog/editorial surface (`/blog/[slug]`) supports the freshness signal Perplexity weights heavily, anchors author E-E-A-T via `Person` + `ProfilePage` schema, and creates internal-link surface for the programmatic pages.

**Why draft**

Two unresolved decisions:

1. **Content source**: a TypeScript module (continues the current "authored content lives in `src/modules/marketing/**`" pattern, no new vendor, slowest to author) vs. an MDX/CMS pipeline (faster authoring, adds a vendor, breaks the "no new third-party library" boundary).
2. **Author bio policy**: who writes? Each `Person` schema needs verifiable credentials (`sameAs`, `knowsAbout`). Without a real bylined author surface, the page can't pass E-E-A-T's first E (Experience). ([digitalapplied.com](https://www.digitalapplied.com/blog/e-e-a-t-march-2026-google-rewards-experience-content-guide))

**Trigger to lift to `ready`**

Product decides on (1) content source and (2) author surface. If `Person`/`ProfilePage` for authors lifts, this becomes a `ready` task and pulls a sibling task for author-page DS work.

**Out of scope until lifted**

Everything.

---

### 5.34 `P2-LAND-001-34` Schema validation pass

**Status:** `ready` · **Priority:** `P1`

**Scope**

1. For every Class A route (existing + new from this pack), validate the emitted JSON-LD with:
   - Google Rich Results test (the version Google publishes as of run date)
   - schema.org's validator
   - A live Perplexity preview where available (manual)
2. File any validation failure as a bug-shaped follow-up task `P2-LAND-001-34-bug-*`.

**Verification**

- All routes pass with zero errors; warnings logged for follow-up if they don't indicate broken markup.

---

### 5.36 `P2-LAND-001-36` Differentiation + typography contract enforcement

**Status:** `ready` · **Priority:** `P1`

**Problem**

§1.5 (per-page differentiation matrix), §1.6 (typography hierarchy per page), §1.7 (motion contract), and §1.8 (asset contract) are normative for the pack but live only inside this document. Without enforcement they decay the moment the next agent forgets the table exists. The DS already has [agent-ui-rules.md](../design-system/agent-ui-rules.md) for hard rules and an arch-lint pass for the rules a script can check.

**Scope**

1. Update [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) with a new section "**Public landing page contracts**" that summarizes §1.5 / §1.6 / §1.7 / §1.8 and links back into this pack as the canonical source. Phrasing follows the existing rule style ("Rule:" / "Why:" / "How to apply:").
2. Extend `scripts/audit-architectural-rules.ts` (the script behind `pnpm lint:arch`) with the checks that a script can perform:
   - No raw `font-size: \d` or `clamp(.*rem` in any `src/app/(public)/**` or `src/components/public/**` CSS module — every size routes through a `--display-*` / `--title-*` / `--body-*` / `--caption` token.
   - No raw `<svg>` outside `src/components/illustrations/**` and the DS `icon.tsx` / `flag.tsx`. (The existing arch rule covers part of this; extend with the illustrations allowlist.)
   - No `transition:` or `animation:` declaration in `src/app/(public)/**` or `src/components/public/**` CSS modules without a paired `@media (prefers-reduced-motion: reduce)` override in the same file.
   - No `keyframes` / Lottie / framer-motion imports — these are already on the no-fly list but extend the check to the public surface explicitly.
3. The §1.5 differentiation matrix (visual fingerprint, signature section, motif) cannot be lint-checked from a script. Wire it into the verification task `-35` instead: the manual walk explicitly evaluates each page family against its matrix row.

**Out of scope**

- A visual-regression CI pipeline. That is a larger infra decision and would require a vendor (Percy, Chromatic, Argos).

**Acceptance**

- `pnpm lint:arch` fails on a deliberately-introduced raw `font-size: 22px` in any public CSS module.
- `pnpm lint:arch` fails on a `transition: 0.2s` without a paired reduced-motion rule.
- `agent-ui-rules.md` "Public landing page contracts" section references this pack and the matrix rows.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`. Demonstrate the new lint rules by introducing and then reverting a deliberate violation.

---

### 5.37 `P2-LAND-001-37` Illustration set — per-page-family hero motif

**Status:** `ready` · **Priority:** `P2`

**Problem**

The differentiation contract (§1.5) requires each page family to have a dominant motif (decision story, numbered sequence, money/opportunity, verification/shield, audience tabs, browse grid, country, conversion arrow, comparison columns, definition card). Without illustrations, the differentiation is carried only by layout and color — that is fragile, and the home page in particular will continue to feel content-thin without at least one substantial visual.

The asset contract (§1.8) constrains the solution: inline SVG React components, no Lottie, no AI-generated people, no charting library. The illustration vocabulary stays small and editorial — closer to *Stripe Press* or *Linear* than to mainstream tutoring-marketplace stock-illustration sets.

**Scope**

1. Create `src/components/illustrations/` directory. Each illustration is a React component exporting an inline SVG with `aria-hidden="true"` and accepting `className` for caller styling. No `fill` hardcodes — colors come from `currentColor` and surrounding CSS, so the same SVG adapts to forest/paper/mist backgrounds.
2. Ship illustrations for the families that need them most:
   - `decision-story.tsx` — home hero aside motif (a small abstract "two paths converging" sketch). Replaces the current `.decisionStory` text-only aside as the visual anchor.
   - `numbered-flow.tsx` — `/how-it-works` step row decoration (arrows + node circles).
   - `earnings-stack.tsx` — `/become-a-tutor` `MetricTile` aside backdrop.
   - `shield-quiet.tsx` — `/trust-and-safety` hero motif (restrained, single-line linework).
   - `conversion-arrow.tsx` — `/scoring/[conversion]` hero motif (IB → target glyph). Same component takes a `targetLabel` prop so all five launch conversions share one SVG.
   - `comparison-columns.tsx` — `/compare/[topic]` hero motif (two stylized columns).
   - `definition-card.tsx` — `/glossary/[term]` hero motif (a small card-shaped flourish; restrained, since glossary entries are deliberately small per §1.5).
3. Sourcing for v1: author all SVGs in-house (a single designer pass; commission via product if no internal capacity). Do **not** ship AI-generated illustrations. Mentor IB's voice is editorial and IB-academic; AI-look illustrations will undercut the trust posture the rest of the pack invests in.
4. Subject group glyphs: extend the `Icon` registry in [icon.tsx](../../src/components/ui/icon.tsx) with six glyphs (one per IB group) drawn from `lucide-react`'s existing set — no custom subject illustrations. Document the mapping in [icon.tsx](../../src/components/ui/icon.tsx)'s comment block.
5. Update [component-inventory-v1.md](../design-system/component-inventory-v1.md) with the new `illustrations/` folder convention.

**Out of scope**

- Per-country illustration on `/destinations/[country]` — `Flag` carries that identity. Adding a country-specific illustration would require 22 bespoke pieces and is not in scope for v1.
- Section dividers, noise textures, decorative backgrounds beyond the seven hero motifs.
- Photography work — `TestimonialCard` photography is sourced separately per §1.8 and is part of the testimonial authoring (task `-10`).

**Acceptance**

- Seven hero motif components exist; each is `aria-hidden`, `currentColor`-driven, sub-12 KB after `next/svgr`-style inlining.
- Each consuming page (home, how-it-works, become-a-tutor, trust-and-safety, scoring, compare, glossary) renders its motif at all four target widths without overflow.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`. Manual visual walk.

---

### 5.38 `P2-LAND-001-38` Per-route OpenGraph image generation

**Status:** `ready` · **Priority:** `P2`

**Problem**

[src/app/opengraph-image.tsx](../../src/app/opengraph-image.tsx) exists at the root and ships a single OG image for every route. Every link shared to Slack, Twitter/X, WhatsApp, LinkedIn — and every preview rendered by ChatGPT live browsing, Perplexity, and Claude — shows the same generic card regardless of which page was shared. This both hurts CTR and weakens the visual differentiation §1.5 invests in.

Next.js ships `ImageResponse` (no new vendor) which compiles a JSX subset to a PNG at request time, then edge-caches. The four `PublicMarketingPage`-derived routes, the four new programmatic families, and the SEO landings should each compose a per-route OG image that reflects their motif and content.

**Scope**

1. Add per-route `opengraph-image.tsx` files (Next.js convention) for:
   - The four reworked static pages: `/how-it-works`, `/become-a-tutor`, `/trust-and-safety`, `/support`.
   - The four new programmatic families: `/destinations/[country]`, `/scoring/[conversion]`, `/compare/[topic]`, `/glossary/[term]`. Each uses `ImageResponse` with the route's title, eyebrow, and motif (from `-37`).
   - The existing SEO landings: `/subjects/[subject-slug]`, `/services/[need-slug]`, `/subjects/[subject-slug]/[need-slug]`.
2. Extract a shared `buildOgImage(props)` helper in `src/lib/seo/opengraph-image.tsx` so the visual template (Mentor IB brand mark + paper background + title + eyebrow + optional `Flag` for destinations) is one source of truth.
3. Twitter/X cards: add the equivalent `twitter-image.tsx` where Next.js requires it separately, OR confirm `metadataBase` + `openGraph.images` propagates correctly via [src/lib/seo/metadata/build-metadata.ts](../../src/lib/seo/metadata/build-metadata.ts) (read the file before deciding which path to use).
4. Cache: rely on Vercel's default edge cache for `ImageResponse`. No custom revalidation logic.

**Out of scope**

- Adding the tutor's headshot to `/tutors/[slug]` OG image — privacy decision; defer to a separate task with explicit consent UX. Use a brand-only OG image for tutor profiles in v1.
- Per-locale OG images.

**Acceptance**

- Sharing any of the listed routes into a preview-rendering tool (Slack unfurl, Twitter card validator, LinkedIn Post Inspector) shows the route-specific image.
- The OG image renders the correct title, eyebrow, and motif for the dynamic route family (test with two representative slugs each).

**Verification**

- `pnpm build`, `pnpm start`. `curl http://localhost:3000/scoring/ib-to-atar/opengraph-image` returns a valid PNG. Manual validate via X / LinkedIn preview tools against a deployed preview URL.

---

### 5.39 `P2-LAND-001-39` Motion + animation pass

**Status:** `ready` · **Priority:** `P2`

**Problem**

§1.7 specifies the motion contract but no consumer applies it consistently today. The pages reworked in `-10` through `-15` and the new families from `-24` / `-26` / `-28` / `-30` will inherit whatever happens to land. Without an explicit pass, the surface ships some routes with subtle button hovers, others without, and a `prefers-reduced-motion` audit will turn up gaps.

**Scope**

1. Apply the §1.7 motion contract to every public-route consumer:
   - Button / CTA hover — confirm the DS Button already implements `--motion-fast` background + shadow tween, with a reduced-motion fallback. If it doesn't, fix in [src/components/ui/button.tsx](../../src/components/ui/button.tsx) + its CSS module.
   - `LinkTile` / `CountryTile` hover lift — `transform: translateY(-2px)` with `--motion-fast` transition, gated on `@media (prefers-reduced-motion: no-preference)`.
   - `PageHero` first-paint entrance — opacity + translate-y once on mount; respect reduced-motion. Implement as pure CSS keyframe with the `@media` guard; do **not** add JS.
   - `TabBar` tab-change content cross-fade in `/support` — `--motion-fast` opacity transition on the panel; respect reduced-motion.
   - Anchor scroll — set `html { scroll-behavior: smooth; }` only inside `@media (prefers-reduced-motion: no-preference)`.
2. Audit every existing public-route CSS module with `grep -rn 'transition\|animation\|@keyframes' src/app/(public) src/components/public src/components/ui`. For every hit, confirm a paired `@media (prefers-reduced-motion: reduce)` rule in the same file. Add the guard where missing.
3. Add a Vitest unit test that renders `PageHero` and `LinkTile` with a mocked `prefers-reduced-motion: reduce` matchMedia and asserts the animated rule is not applied (or is overridden). Pattern follows whatever a11y tests already exist in [src/test/**](../../src/test).
4. Verify no `framer-motion`, `lottie`, or `motion`-package import landed during the rework — `grep -rn 'framer-motion\|lottie\|^import.*motion' src/`.

**Out of scope**

- Animating numerals (`MetricTile` count-up) — §1.7 explicitly excludes this in v1.
- Scroll-driven animations (parallax, etc.).
- View-transitions API adoption — out of scope until a follow-up decision.

**Acceptance**

- Every animated CSS rule in the public surface has a paired reduced-motion override.
- No motion library in the dependency tree.
- Manual: enable "Reduce motion" in the OS, walk every public route, confirm no transforms or fades fire.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch` (extended in `-36`), `pnpm test`. Manual a11y walk with reduced motion enabled.

---

### 5.35 `P2-LAND-001-35` Final verification

**Status:** `ready` · **Priority:** `P1`

**Scope**

1. Walk every public route at 360 / 768 / 1280 / 1440 px. Confirm:
   - `PageHero` shape consistent across surfaces.
   - `CtaBand` shape consistent.
   - `FaqAccordion` expand/collapse behavior consistent.
   - `Breadcrumb` rendering consistent.
   - No `grep`-able operator vocabulary remains.
   - No `rgb(`/`rgba(` hardcodes in public-CSS.
   - `llms.txt` and `llms-full.txt` reachable from production base URL.
   - Every Class A route emits a single `@graph` JSON-LD block.
   - **§1.5 differentiation matrix:** each reworked + new page family matches its row (hero variant, signature section, motif, tone, type accent). Score each row pass/fail.
   - **§1.6 typography contract:** each page family uses the H1/H2/H3/body/eyebrow tokens its row specifies. No raw sizes anywhere.
   - **§1.7 motion contract:** every animated rule has a paired reduced-motion override. Walk every route with OS-level "Reduce motion" enabled and confirm no transforms / fades fire.
   - **§1.8 asset contract:** no raw `<svg>` outside `src/components/illustrations/**` / `icon.tsx` / `flag.tsx`. No external image loader, no Lottie. OG image renders distinct content per route family (sample at least one route from each family in a preview tool).
2. Run Lighthouse mobile + desktop on every Class A route; record Perf / A11y / Best practices / SEO scores. Fail any route below 90.
3. Run `pnpm test:e2e` against `pnpm build && pnpm start`.

**Verification**

- All checks pass; failures filed as follow-ups.

## 6. Cross-references

- Phase 1 SEO baseline: [phase1-class-a-route-seo-task-pack-v1.md](phase1-class-a-route-seo-task-pack-v1.md) and the [seo-foundation-task-pack-v1.md](seo-foundation-task-pack-v1.md). This pack extends that baseline; it does not redo the route-class ownership decisions.
- Student-side UX pack: [phase2-student-ux-task-pack-v1.md](phase2-student-ux-task-pack-v1.md). The header / `AppFrame` / `AvatarMenu` / `BottomNav` work in that pack (subtasks `-14` through `-20`) is shared chrome that affects how every public route renders — coordinate sequencing if both packs run in parallel.
- Tutor-side UX pack: [phase2-tutor-ux-task-pack-v1.md](phase2-tutor-ux-task-pack-v1.md). Same coordination note for chrome.
- DS spec for `MetricTile`, `CompareTable`, `TrustProofBlock` referenced in [component-specs-phase2-v1.md](../design-system/component-specs-phase2-v1.md). `MetricTile` and `CompareTable` get implemented here; `TrustProofBlock` is intentionally deferred (current trust-grid on home is small enough that the spec'd component is overweight for the task).

## 7. What this pack deliberately does not do

To stay inside scope:

- **Not** introducing user-generated reviews or testimonials. All testimonials in `-06` / `-10` come from a curated authored module; the pack does not change the review-publishing pipeline.
- **Not** building a per-tutor SEO landing template (`/tutors/{slug}` already is that template — covered by `-21`).
- **Not** porting ibmatch.com's `/programs/<cuid>` page family. See [§1.4](#14-the-programmatic-landing-page-surface-is-missing).
- **Not** shipping AI-generated copy. Every authoring pass is human-curated; LLM drafts may be used as internal raw material but the output cannot be machine-generated final copy. ([Google Helpful Content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content))
- **Not** adding `Article`, `BlogPosting`, or `NewsArticle` schema until the blog decision (`-33`) lifts.
- **Not** adding a vendor for CMS, MDX, animation, charts, carousels, or analytics. The frozen baseline in [CLAUDE.md](../../CLAUDE.md) is binding.

## 8. Release coordination

- Foundation step 1 (`-01` through `-05`) is the prerequisite for everything else. Step 1 ships in one PR per task (5 PRs in parallel are fine; they touch disjoint files).
- Foundation step 2 (`-06` through `-09`) ships in parallel after step 1 lands.
- Existing-page rework step 3 (`-10` through `-15`) ships in parallel after step 2 lands. Each rework PR includes its own visual regression screenshot pair.
- Copy/IA passes step 4 ships in parallel; the cross-page operator-vocabulary pass (`-16`) is a single PR.
- AI-SEO infrastructure step 5 ships in parallel. `-19` and `-20` are independent; `-21` depends on `-20`'s `@graph` shape; `-22` depends on `-19` for the `llms.txt` date line.
- New programmatic surfaces step 6/7 ship as template-first, authoring-second pairs (`-24` + `-25`, `-26` + `-27`, `-28` + `-29`, `-30` + `-31`).
- Drafts (`-32`, `-33`) do not ship until lifted.
- Verification (`-34`, `-35`) is the final gate before considering this pack `done`.

## 9. Total estimated surface this pack lands

- 8 new DS primitives (`PageHero`, `CtaBand`, `FaqAccordion`, `Breadcrumb`, `TestimonialCard`, `MetricTile`, `CompareTable`, `LinkTile` + `CountryTile`/`ConversionTile` thin wrappers).
- 1 new token group (overlay + gradient tokens).
- 4 normative contracts pinned in §1.5–§1.8 (per-page differentiation, typography hierarchy, motion, assets).
- 7 in-house inline-SVG hero illustrations + a `src/components/illustrations/` convention.
- Per-route OG image generation across every Class A route family via Next.js `ImageResponse`.
- Extended `pnpm lint:arch` checks for raw `font-size`, missing reduced-motion overrides, and illustration allowlist.
- 6 existing pages reworked (`/`, `/how-it-works`, `/become-a-tutor`, `/trust-and-safety`, `/support`, `/tutors`).
- 1 SEO landing template polished (`_seo-landing`).
- 4 new public route families (`/destinations`, `/scoring`, `/compare`, `/glossary`) with ~55 published pages between them (22 + 5 + 3 + 25).
- 2 new SEO infrastructure surfaces (`llms.txt`, `llms-full.txt`).
- 1 schema graph refactor (`@graph` unification).
- 1 tutor `Person` schema upgrade.
- 1 cross-page copy pass.
- 1 motion + animation pass with `prefers-reduced-motion` enforcement.

Roughly: 39 implementation subtasks, 2 escalation drafts, 2 verification tasks (schema + final walk). Comparable in scale to the student UX pack.
