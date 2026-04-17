# Mentor IB Compliance And Regulatory Posture v1

**Date:** 2026-04-08
**Status:** Standalone compliance-readiness architecture for privacy, minors, communications, public claims, payments, and policy surfaces
**Scope:** baseline EU/UK/US consumer-internet compliance posture, minors handling, consent posture, analytics and cookies gating, communications rules, review authenticity, payment-scope minimization, policy-document surfaces, and future legal-work handoff boundaries

## 1. Why This Document Exists

This document defines the product's compliance and regulatory posture at the architecture level.

It exists now because the approved product already implies the need for:

- student and tutor personal-data handling
- users who may be minors
- email communications
- public reviews and trust claims
- payments and refunds
- public legal and policy pages

Without an explicit posture, compliance work usually becomes:

- late
- scattered across unrelated features
- impossible for AI-driven implementation to infer safely
- dependent on legal wording before the product has even defined its system boundaries

## 2. What This Document Does Not Redefine

This document does not replace the approved privacy, security, moderation, analytics, rating, or payment architecture.

It inherits from:

- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/admin-and-moderation-architecture-v1.md`
- `docs/architecture/analytics-and-product-telemetry-architecture-v1.md`
- `docs/architecture/rating-and-review-trust-architecture-v1.md`
- `docs/architecture/architecture-discussion-v1.md`

It also does not constitute legal advice.

Its purpose is to define:

- what the product should be architected to support
- what the MVP should avoid
- which legal and policy surfaces must exist before launch

Final jurisdiction-specific legal review still requires qualified counsel.

## 3. Core Recommendation

Mentor IB should adopt a conservative compliance-readiness posture built around:

- privacy by design and by default
- minor-aware product behavior
- clear separation between essential and optional tracking
- truthful public claims and authentic reviews
- hosted payment flows that minimize payment-card scope
- explicit public policy surfaces

The practical rule is:

- do not design the MVP as a child-directed product
- do not collect more data than needed
- do not rely on hidden legal assumptions
- do not make compliance depend on engineers remembering edge cases manually

## 4. Architecture Style For AI-Driven Implementation

This project is expected to be implemented largely by AI agents.

That means compliance-relevant rules should be:

- explicit
- scope-limited
- default-conservative
- machine-checkable where possible

The architecture should not rely on:

- vague assumptions like "this is probably fine"
- free-form policy interpretation by implementation agents
- hardcoded region behavior with no clear boundary
- public claims that are not backed by system state

## 5. Baseline Scope Posture

This document is not an exhaustive jurisdiction-by-jurisdiction compliance map.

It defines a baseline posture for a consumer internet product that may serve users in:

- the EU or EEA
- the UK
- the United States

The MVP should be architected so later legal review can tighten rules by jurisdiction without requiring a full product rewrite.

## 6. Product Classification Posture

## 6.1 Main rule

Mentor IB should be architected as a consumer tutoring platform with minors potentially present, not as:

- a child-directed product by default
- a school information system
- a regulated healthcare service
- an accredited educational institution

## 6.2 Why this matters

Different regulatory regimes depend heavily on service classification.

The architecture should avoid accidentally presenting the product as something it is not.

## 6.3 Public-claim rule

Do not imply through product copy or UI that Mentor IB is:

- an official IB body
- a licensed school
- a guaranteed outcome service
- a therapeutic or counseling service

unless those claims are actually true and supported.

## 7. Minors And Age Posture

## 7.1 Main rule

Because IB students may be minors, the product should be minor-aware by default.

## 7.2 Under-13 posture

The MVP should not support general self-service under-13 learner accounts.

Recommended architecture rule:

- if the product has actual knowledge a user is under 13, block or route them into a guardian-managed or institution-managed path rather than treating them as a normal self-service learner

## 7.3 Why this is the default

This is the safest posture for MVP because COPPA obligations are more demanding for under-13 users.

## 7.4 Minor-aware data rule

For minors above that threshold, the product should still behave conservatively:

- minimal student identity exposure
- no public student reputation
- conservative messaging and analytics posture
- careful review identity masking

## 7.5 Age-data minimization rule

Do not collect exact date of birth by default unless there is a clear operational reason.

Prefer an age or school-stage posture such as:

- adult tutor
- learner age band if needed
- guardian-managed billing state if needed

## 7.6 Parent and guardian posture

The existing parent billing-wrapper direction should remain available as an architectural option for:

- billing control
- guardian communication where appropriate
- safer handling of younger or minor learners

## 8. Privacy And Data-Protection Posture

## 8.1 Main rule

Privacy architecture is the primary compliance foundation for the product.

## 8.2 GDPR and UK GDPR readiness

The product should be architected so it can support obligations commonly associated with data-protection law, including:

- lawful and documented processing posture
- access and deletion workflows
- correction support
- data minimization
- privacy by design and by default

## 8.3 Rights-readiness rule

Even before exact legal workflows are finalized, the architecture should preserve the ability to support:

- access requests
- deletion requests
- data export
- correction requests

## 8.4 Accountability rule

The product should make it possible to demonstrate what data is collected, where it goes, and why.

That means the architecture should support:

- vendor inventory
- data-flow awareness
- policy-surface alignment
- auditable lifecycle rules

## 9. Consent, Cookies, And Analytics Posture

## 9.1 Main rule

The analytics architecture must be able to distinguish between:

- essential product behavior
- optional analytics and optimization behavior

## 9.2 Consent-readiness rule

The product should be able to suppress optional analytics and replay behavior by region or consent state.

## 9.3 Non-essential tracking rule

Do not architect the MVP in a way that requires optional analytics or replay tools to function.

## 9.4 Cookie and tracking rule

Where a tool depends on non-essential cookies or similar tracking, the architecture should support:

- prior gating where required
- clear user information
- revocation later

## 9.5 Why this matters

This allows later legal review to tighten EU or UK consent behavior without changing the core event model.

## 10. Communications Posture

## 10.1 Main rule

The system must separate transactional communications from marketing communications.

## 10.2 Transactional-message posture

Examples:

- magic links
- lesson confirmations
- reminder emails
- application status updates

These belong to product operations.

## 10.3 Marketing-message posture

Examples:

- re-engagement campaigns
- promotional newsletters
- feature marketing

These should remain separable from transactional traffic.

## 10.4 Opt-out rule

Marketing communications should be architecturally separable so opt-out behavior can be honored without breaking essential product email.

## 11. Public Claims, Reviews, And Marketing Integrity

## 11.1 Main rule

Public trust and marketing surfaces must be truthful and supportable.

## 11.2 Review-authenticity rule

The rating and review architecture already restricts public reviews to real lesson-linked feedback.

That should remain a locked compliance posture.

## 11.3 No-fake-review rule

The platform should not support:

- fabricated reviews
- purchased reviews
- AI-generated fake testimonials
- selective publication behavior that creates a misleading independent-review impression

## 11.4 Public-claim evidence rule

Any public claim such as:

- verified
- reviewed
- experienced
- highly rated

must map to a real governed product state.

## 11.5 Outcome-claims rule

Do not architect or market the product around unsupported guarantees such as:

- guaranteed grade improvements
- guaranteed exam outcomes
- guaranteed university admission results

unless the business is truly prepared to substantiate those claims.

## 12. Payments And Financial-Scope Posture

## 12.1 Main rule

The product should minimize payment-card compliance scope by using Stripe-hosted payment flows.

## 12.2 Card-data rule

Mentor IB should not store or process raw payment card details in its own application database or UI.

## 12.3 Financial-record rule

The product should still retain the minimum payment and refund records needed for:

- reconciliation
- support
- disputes
- legitimate financial retention needs

## 12.4 Refund and cancellation policy rule

The public product must expose clear policy surfaces for:

- cancellation
- rescheduling
- refunds where applicable

These policies are not just legal copy. They affect booking flow and support architecture.

## 13. Educational-Regime Posture

## 13.1 FERPA non-default rule

Do not architect the MVP as though FERPA automatically governs the platform.

## 13.2 Why this is the default

FERPA applies to educational agencies and institutions that receive funds from programs administered by the U.S. Department of Education.

That is not the default consumer-platform posture for Mentor IB.

## 13.3 School-partnership rule

If the product later adds:

- school contracts
- district relationships
- institution-managed student accounts
- school-owned data imports or exports

then FERPA and institution-contract posture should be revisited as a separate companion topic.

## 14. Vendor, Transfer, And Documentation Posture

## 14.1 Main rule

The system should maintain enough vendor and data-flow clarity that data-protection and contractual review are possible.

## 14.2 Required vendor categories

At minimum, the posture should track vendors for:

- hosting
- database and auth
- storage
- payments
- email delivery
- analytics

## 14.3 Data-processing posture

For each material vendor, the business should be able to determine later:

- what data is sent
- why it is sent
- which region or transfer posture applies
- which contract or DPA is in place

## 14.4 Region-awareness rule

Architecture should not assume that region choices are only operational.

They also affect compliance review, especially for personal data.

## 15. Policy And Public Document Surface Requirements

## 15.1 Main rule

Before public launch, the product should have a defined public-policy surface.

## 15.2 Required baseline surfaces

The architecture should leave clear room for:

- `/privacy`
- `/terms`
- `/trust-and-safety`
- refund and cancellation policy surface
- cookie or tracking notice and controls where required

## 15.3 Two-sided policy rule

Because the product has students and tutors, the business should be prepared for role-specific policy surfaces where needed.

Examples:

- student-facing terms
- tutor terms or tutor agreement

## 15.4 Support-contact rule

The product should expose a clear operational contact path for:

- privacy questions
- account and deletion requests
- abuse and safety reports
- billing or refund issues

## 16. Compliance Operations Posture

## 16.1 Main rule

The architecture should support reviewable operational handling of compliance-relevant events.

## 16.2 Required operational capabilities

At minimum, the system should make it possible later to handle:

- deletion and access requests
- review or takedown requests
- underage-account issues
- safety escalations
- refund and dispute inquiries

## 16.3 Legal-hold posture

The architecture should avoid destructive deletion behavior that would make it impossible to preserve records when there is a legitimate safety, fraud, or dispute reason to hold them.

This aligns with the existing privacy and moderation architecture.

## 17. Phase Scope Recommendation

## 17.1 Phase 1

Phase 1 should support:

- conservative privacy and minor-aware defaults
- under-13 self-service avoidance posture
- role-safe public claims
- authentic lesson-linked reviews only
- hosted Stripe checkout
- separable transactional versus marketing communications
- consent-ready optional analytics architecture
- policy-route readiness for privacy, terms, trust and safety, and refund logic

## 17.2 Phase 1.5

Good next candidates:

- stronger regional consent behavior
- deeper vendor and subprocessor documentation
- more formal request-handling operations

## 17.3 Phase 2

Consider later:

- institution and school partnership compliance mode
- deeper jurisdiction overlays
- more advanced age-assurance or guardian flows if the product scope expands

## 18. Decisions To Lock Now

The architecture should lock the following decisions now:

- the MVP is not a child-directed under-13 self-service product
- the product is minor-aware and privacy-conservative by default
- optional analytics must be suppressible by consent or region later
- marketing and transactional communications must remain separable
- public reviews must remain authentic and lesson-linked
- public claims must map to governed product state
- Stripe-hosted payment flows are the default payment posture
- FERPA is not assumed by default for the consumer MVP
- public policy surfaces are a launch requirement, not an afterthought

## 19. What This Posture Prevents

This architecture is meant to prevent:

- accidental under-13 self-service onboarding
- analytics or replay becoming impossible to gate later
- fake or misleading review and trust surfaces
- payment-card scope growing unnecessarily
- implementation agents inventing their own regional legal assumptions
- launch without the minimum policy and support surfaces

## 20. Final Recommendation

Mentor IB should treat compliance as a product-boundary problem early, not as a late legal-copy problem.

The recommended MVP posture is:

- conservative data collection
- minor-aware handling
- authentic trust surfaces
- hosted payments
- consent-ready optional analytics
- explicit public policy routes

This creates a product architecture that is much easier for counsel to review, much safer for AI agents to implement, and much less likely to require structural rewrites before launch.

## 21. Official Source Notes

The recommendation above is informed by current official documentation for:

- GDPR applicability: `https://commission.europa.eu/law/law-topic/data-protection/reform/rules-business-and-organisations/application-regulation/who-does-data-protection-law-apply_en`
- GDPR accountability: `https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/obligations/how-can-i-demonstrate-my-organisation-compliant-gdpr_en`
- GDPR by design and by default: `https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/obligations/what-does-data-protection-design-and-default-mean_en`
- UK ICO cookies guidance: `https://ico.org.uk/for-the-public/online/cookies/`
- UK ICO Children's Code: `https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/`
- FTC COPPA rule: `https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa`
- FTC COPPA business guidance: `https://www.ftc.gov/business-guidance/resources/childrens-online-privacy-protection-rule-not-just-kids-sites`
- FTC CAN-SPAM Act page: `https://www.ftc.gov/enforcement/statutes/controlling-assault-non-solicited-pornography-marketing-act-2003-can-spam-act`
- FTC reviews guidance for platforms: `https://www.ftc.gov/business-guidance/resources/featuring-online-customer-reviews-guide-platforms`
- FTC fake reviews rule update: `https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials`
- FERPA applicability: `https://studentprivacy.ed.gov/faq/which-educational-agencies-or-institutions-does-ferpa-apply`
- Stripe integration security guide: `https://docs.stripe.com/security/guide`
