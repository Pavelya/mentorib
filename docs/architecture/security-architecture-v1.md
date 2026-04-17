# Mentor IB Security Architecture v1

**Date:** 2026-04-08
**Status:** Standalone security architecture for the shared application stack
**Scope:** trust boundaries, authentication, authorization, data protection, secrets, abuse prevention, webhooks, storage, auditability, and incident posture

## 1. Why This Document Exists

This document defines the security architecture for Mentor IB.

It exists now because security decisions cut across:

- authentication
- authorization
- database access
- storage
- messaging
- payments
- public pages
- admin and moderation work that will come later

This document should become the anchor security reference for later architecture topics.

## 2. What This Document Does Not Redefine

This document does not replace the already approved architecture documents.

It inherits from:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/message-architecture-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/architecture/search-console-and-observability-architecture-v1.md`

It does not define:

- full privacy and retention policy
- full admin and moderation workflows
- final compliance program
- detailed test plans

Those should become dedicated companion docs later.

## 3. Core Recommendation

Mentor IB should use a defense-in-depth security model built around:

- `Supabase Auth` for identity
- Next.js server-side authorization as the main business-rule layer
- `Postgres RLS` as the hard data boundary for exposed access paths
- strict secret isolation on Vercel
- server-side webhook verification
- narrow public data shaping through DTOs and quality gates

The practical rule is:

- trust nothing by default
- authorize at more than one layer
- keep privileged credentials out of the browser
- expose only route-safe and role-safe data

## 4. Security Architecture Style

This project is expected to be implemented largely by AI agents.

That makes the security architecture more, not less, important.

The rules in this document should therefore be:

- explicit
- default-deny where possible
- machine-checkable
- narrow enough that implementation agents do not need to guess intent

Security should not rely on:

- vague human memory
- "safe by convention" assumptions
- UI hiding as a substitute for authorization

## 5. Security Goals

The security architecture should reliably protect:

- account identity
- student and tutor private data
- lesson and conversation data
- billing and payout state
- uploaded documents and media
- internal moderation and admin state
- secrets and webhook credentials

It should also reduce:

- accidental data exposure
- abuse and spam
- unauthorized role escalation
- insecure direct access to storage or database objects

## 6. Trust Boundaries

The main security boundaries in the system are:

## 6.1 Browser boundary

The browser is untrusted.

Even authenticated browser code must be treated as attacker-controlled for authorization purposes.

## 6.2 Public internet boundary

All inbound traffic from the internet is untrusted until proven otherwise.

That includes:

- anonymous traffic
- authenticated traffic
- bots
- webhook traffic before signature verification

## 6.3 Next.js server boundary

The Next.js server layer is the main trusted business-logic boundary.

It should:

- verify session and role
- enforce domain authorization
- shape public and private DTOs
- own access to privileged credentials

## 6.4 Supabase boundary

Supabase is the managed backend platform for:

- auth
- Postgres
- storage
- optional realtime

Security relies on correct configuration of:

- RLS
- storage policies
- schema boundaries
- service-role isolation

## 6.5 Stripe boundary

Stripe is a trusted external billing system, but its incoming events are not trusted until webhook signature verification passes.

## 6.6 Email and magic-link boundary

Auth emails and login flows are part of the trust chain.

Users should be considered authenticated only after Supabase has completed the auth flow and the server has resolved the canonical application user.

## 7. Security Principles

## 7.1 Default deny

If access is not explicitly granted, it should be denied.

## 7.2 Dual-layer authorization

Sensitive data paths should use:

- Next.js domain-layer authorization
- database-layer protection where exposed paths can reach data directly

## 7.3 Least privilege

Each credential, route, and role should receive only the permissions it actually needs.

## 7.4 Public-data minimization

Public routes should receive only public-safe DTOs and approved fields.

## 7.5 Environment separation

Development, preview, and production should not share secrets or accidentally share trust assumptions.

## 7.6 Explicit security state

Important states should be modeled explicitly.

Examples:

- role pending
- tutor approved
- tutor publicly indexable
- conversation participant
- user blocked

## 8. Authentication Architecture

## 8.1 Auth provider

Use `Supabase Auth` as the single authentication provider for the first version of the product.

Supported flows:

- Google login
- magic link sign-in

## 8.2 Canonical account rule

Every successful auth flow should resolve one canonical `app_user`.

The shared rule is:

1. Supabase verifies the identity.
2. The server resolves the verified email and auth user.
3. The server finds or creates the canonical application user.
4. The server routes the user into onboarding or product flow based on account state.

## 8.3 Session rule

Session trust should come from verified Supabase session state, not from custom client-side assumptions.

Do not build a second session system.

## 8.4 Session hardening rule

The MVP should rely on the secure session handling provided by the approved Supabase integration path.

Additional session constraints such as stricter limits or advanced timeout controls can be added later if risk or compliance needs require them.

## 8.5 Logout and sensitive-state rule

Security-sensitive account changes should invalidate or re-check trust where appropriate.

Examples:

- email changes
- credential changes
- privilege or role changes

## 9. Authorization Architecture

## 9.1 Main rule

Authorization should happen in the Next.js domain layer before any sensitive data is returned or any mutation is applied.

## 9.2 Database hard boundary

For any exposed schema, direct browser access path, or realtime path, authorization must also exist at the database level through `RLS`.

## 9.3 UI rule

UI visibility checks are useful for product experience.

They are never sufficient for security.

## 9.4 Role model rule

Roles should be capability-based, not app-split.

One account can later support more than one mode, but authorization must still be explicit at every sensitive operation.

## 10. Database Security Architecture

## 10.1 Public versus private schema rule

Data that must never be directly exposed through the Supabase Data API should live outside the exposed schema surface.

Recommended posture:

- keep browser-accessible tables in a tightly governed exposed schema
- move internal-only tables and sensitive helpers into a private schema where appropriate

## 10.2 RLS rule

Every exposed table, view, or function must have `RLS` enabled and reviewed.

No exposed table should rely on "nobody will query this directly" as a protection model.

## 10.3 Policy rule

RLS policies should be:

- explicit
- narrow
- role-aware
- easy to reason about

Avoid broad "authenticated users can read all" patterns unless the data is genuinely safe.

## 10.4 Service-role rule

The Supabase service-role key is strictly server-side only.

It must never be:

- embedded in the browser bundle
- exposed to client-side code
- passed through public route handlers

## 10.5 SQL function rule

Use database functions and triggers carefully.

If a function changes trust boundaries or accesses privileged data:

- document it
- review it
- keep its permissions narrow

## 11. DTO And Data-Shaping Security

## 11.1 DTO rule

Routes should receive DTO-safe data, not raw database rows.

This applies especially to:

- tutor public profiles
- lessons
- messages
- billing and payout state

## 11.2 Public DTO rule

Public routes must use explicitly public DTOs.

Do not rely on "we just do not render the sensitive field" if the field was already fetched.

## 11.3 Role-safe DTO rule

Role-specific routes should receive only the fields their mode requires.

For example:

- tutors should not receive another tutor's internal moderation notes
- students should not receive tutor financial data

## 12. Secrets And Environment Variable Architecture

## 12.1 Secret location rule

Secrets should live in Vercel environment variables or the equivalent managed secret system for the deployment environment.

## 12.2 Sensitive variable rule

Sensitive values should be stored as sensitive environment variables where supported.

They must not be committed to the repository.

## 12.3 Client exposure rule

Only explicitly public values should ever be available to browser code.

Treat any `NEXT_PUBLIC_*` variable as fully public by design.

## 12.4 Rotation rule

Secrets that authenticate external systems should have a clear rotation path.

Examples:

- Stripe webhook signing secrets
- Supabase service-role keys
- SMTP or email-provider credentials if introduced later

## 12.5 Environment separation rule

Development, preview, and production should use separate secret values.

Production credentials must not be reused in preview environments.

## 13. Input Validation And Mutation Security

## 13.1 Server-boundary validation rule

All mutations must validate input at the server boundary before domain logic runs.

That applies to:

- Server Actions
- Route Handlers
- webhook handlers

## 13.2 Output encoding rule

User-generated content must be treated as untrusted when rendered.

The MVP should prefer plain-text rendering for user content wherever possible.

## 13.3 Rich content rule

If rich text is introduced later, it will require explicit sanitization architecture.

Do not assume that future rich content is safe by default.

## 14. Browser And Frontend Security

## 14.1 Header policy

The app should ship with a deliberate security-header strategy.

That should include review of:

- Content Security Policy
- `frame-ancestors`
- `Referrer-Policy`
- `X-Content-Type-Options`

## 14.2 Cookie rule

Auth and any app cookies should use secure defaults appropriate to production:

- secure in production
- httpOnly where applicable
- sameSite policy chosen intentionally

## 14.3 XSS posture

The architecture should assume XSS is a major risk because:

- the product includes user-generated content
- future messaging and tutor content may evolve

The safest MVP posture is:

- plain text for user content
- avoid dangerous HTML rendering

## 14.4 CSRF posture

The architecture should avoid creating mutation paths that rely on unsafe implicit trust.

Any route handling state changes should rely on:

- authenticated server-side checks
- intentional mutation boundaries
- correct cookie policy

## 15. Rate Limiting And Abuse Protection

## 15.1 Main rule

Public and authenticated write paths that can be abused should be rate-limited.

## 15.2 Priority surfaces

Rate limiting matters most for:

- auth-related entry points where applicable
- message send actions
- booking or request actions
- report and block actions
- tutor application submission
- any future contact or support form

## 15.3 Platform rule

Use Vercel's platform protections where available, but do not rely only on platform-wide protection for product-specific abuse.

Application-level rate limiting still matters.

## 15.4 Bot and scraping posture

The MVP should at minimum distinguish:

- legitimate product traffic
- obvious abuse or spam patterns

More advanced WAF or bot-management rules can be layered later if traffic warrants it.

## 16. Messaging And Realtime Security

Messaging already has a dedicated companion architecture.

The key inherited rules are:

- only participants can access a conversation
- only participants can send into a conversation
- blocked users cannot continue exchange
- report events create durable records
- service-role privileges stay off the client

## 16.1 Realtime rule

If private realtime channels are used, they must be protected by explicit authorization rules.

Do not treat realtime channels as public by default.

## 16.2 Typing and presence rule

Typing and presence should use lightweight, non-durable mechanisms where possible.

They should not weaken the core authorization model.

## 17. Storage And File Security

## 17.1 Storage architecture rule

Storage objects are not product state by themselves.

Every important file should resolve into a domain-owned metadata record.

## 17.2 Bucket separation rule

Different trust levels should not share the same storage policy model.

At minimum, distinguish between:

- public profile media
- private credential or verification uploads
- future report attachments if added

## 17.3 Access control rule

Storage access must be enforced through:

- storage policies
- server-side authorization where needed
- path and bucket conventions that reflect ownership and trust level

## 17.4 Upload rule

Uploads should be constrained by:

- allowed type
- allowed size
- allowed purpose

## 17.5 Future attachment rule

If attachments are later added to messaging or reports, they should be:

- explicit
- scoped
- moderated or scanned as needed
- accessible only through approved access rules

## 18. Webhook Security Architecture

## 18.1 Core webhook rule

Webhook traffic is untrusted until signature verification passes.

## 18.2 Stripe rule

Stripe webhooks must:

- verify the signature using the raw request body
- use the correct signing secret for the environment
- reject invalid signatures
- return quickly after verification and event recording

## 18.3 Idempotency rule

Webhook processing should be idempotent.

The system must be able to detect and safely handle duplicate deliveries.

## 18.4 Minimal surface rule

Webhook route handlers should do only the work necessary to:

- verify
- parse
- record
- dispatch into domain logic safely

## 19. Logging And Auditability

## 19.1 Audit rule

Security-relevant actions should leave durable records.

Examples:

- tutor approval or rejection
- block and report actions
- payout-state changes
- significant role or status changes

## 19.2 Logging rule

Logs should support debugging and incident response without leaking sensitive secrets or personal data unnecessarily.

## 19.3 Admin-action rule

When admin or moderation tools arrive, privileged actions should be auditable by design.

## 20. Backup And Recovery Posture

## 20.1 Core rule

Security architecture is incomplete without a recovery posture.

The system should assume that:

- data mistakes can happen
- bad deployments can happen
- credentials may need rotation

## 20.2 Recovery expectation

The architecture should maintain a clear view of:

- how database recovery would work
- how storage recovery is handled by provider capabilities and application metadata
- how secrets are rotated after an incident

This does not require a full disaster-recovery program yet, but it does require an explicit path.

## 21. Incident Posture

## 21.1 Security-incident examples

Examples include:

- unintended public data exposure
- leaked secret or webhook credential
- unauthorized access to conversation or lesson data
- storage policy misconfiguration
- privileged route behavior exposed to the wrong role

## 21.2 Response rule

When a security issue is discovered:

- contain the exposure first
- rotate affected credentials if relevant
- fix the architectural gap, not only the symptom
- keep an incident record

## 22. Security Decisions To Lock Now

These decisions are mature enough to lock now:

- `Supabase Auth` is the single auth provider
- Next.js server-side authorization is the main business-rule boundary
- `RLS` is mandatory for exposed data paths
- the service-role key is server-side only
- public routes use explicit public DTOs
- secrets live in managed environment variables and stay separated by environment
- write paths require server-side input validation
- high-risk write paths should be rate-limited
- file access uses domain metadata plus storage policy
- webhook requests require signature verification and idempotent handling
- AI-agent implementation must follow explicit default-deny rules rather than implicit conventions

## 23. Decisions To Defer Slightly

These can be designed later as companion topics:

- privacy and data retention schedules
- admin and moderation UI security
- exact backup and disaster-recovery procedures
- richer attachment scanning and moderation
- enterprise-only security controls not needed for MVP

## 24. Final Recommendation

Mentor IB should anchor security in a small number of hard rules:

- identity through `Supabase Auth`
- authorization in the Next.js server layer
- hard data boundaries through `RLS`
- no privileged secrets in the browser
- explicit rate limits and abuse controls
- verified webhooks
- auditable privileged actions

This gives the product a practical MVP-grade security architecture without bloating the stack or forcing premature enterprise complexity.

## 25. Official Source Notes

This recommendation is informed by current official documentation for:

- Next.js App Router and header configuration
- Supabase Auth sessions
- Supabase API hardening and `RLS`
- Supabase Storage ownership and schema behavior
- Supabase Realtime authorization
- Vercel environment variables, encryption, and firewall guidance
- Stripe webhook signature verification
- OWASP ASVS
