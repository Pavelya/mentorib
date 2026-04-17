# Mentor IB Admin And Internal Operations Architecture v1

**Date:** 2026-04-08
**Status:** Standalone privileged-operations architecture for admin, trust and safety, and internal workflows
**Scope:** internal role model, privileged route boundaries, operational queues, review and approval flows, auditability, escalation, and lifecycle rules for admin actions

## 1. Why This Document Exists

This document defines how privileged internal operations should work in Mentor IB.

It exists now because the product already implies the need for:

- tutor approval and rejection
- public-profile approval and takedown
- credential review
- report handling
- block enforcement
- trust and safety investigation
- financial and support interventions later

Without an explicit architecture, admin and moderation work tends to become:

- over-privileged
- weakly audited
- hard for AI-driven implementation to reason about safely

## 2. What This Document Does Not Redefine

This document does not replace the approved security, privacy, message, or core application architecture.

It inherits from:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/message-architecture-v1.md`

It does not define:

- final admin UI screens
- final post-MVP internal staffing split
- final legal escalation policy
- final support tooling

Those can come later as dedicated implementation or operations artifacts.

## 3. Core Recommendation

Mentor IB should treat internal operations as a tightly scoped admin product capability with explicit privilege boundaries.

The practical rule is:

- internal operations are not part of the public product surface
- privileged actions must be auditable
- do not turn the MVP into a sprawling internal suite
- review, trust, and payout decisions should be represented as explicit domain state changes
- AI-driven implementation should follow explicit action rules instead of inferred operator power

## 4. Architectural Principles

## 4.1 Internal by default

Admin internal surfaces are operational tools.

They are never public SEO surfaces and should never be indexable.

## 4.2 Capability-scoped admin access

MVP uses one internal role, `admin`, but individual admin actions should still be capability-scoped rather than treated as automatic global power.

## 4.3 Reviewable state transitions

Trust, approval, and payout-affecting decisions should be modeled as explicit state transitions, not as hidden field edits with no history.

## 4.4 Auditability first

Any action that changes user trust, public visibility, money movement, or safety state should leave a durable audit trail.

## 4.5 Human-accountable operations

Even if AI agents help implement the system, privileged production actions should remain attributable to identified human operators or clearly controlled service actions.

## 5. Operational Surface Model

The product should distinguish between three internal operational surface families even when MVP staff all use the `admin` role.

## 5.1 Admin surface

This is the general internal operations layer for:

- user lookup
- tutor account review
- public-profile state
- account and support-style interventions

## 5.2 Trust and safety surface

This is the narrower operational layer for:

- reports
- blocks
- abuse handling
- content or profile takedowns
- internal trust notes

## 5.3 Finance and operations surface

This is the later internal layer for:

- payout-state review
- billing anomalies
- reconciliation support

This does not need to be broad in MVP, but the architecture should keep it separable.

## 6. Internal Role Architecture

## 6.1 Main rule

MVP internal access should be explicit and capability-based.

Do not start with:

- one blanket `admin` role that bypasses everything without distinction

## 6.2 Recommended internal capability families

At the architectural level, the system should support separation between:

- support operations
- tutor review operations
- trust and safety moderation
- finance operations
- platform-level technical administration

Exact naming can vary, but the separation should exist.

## 6.3 Escalation rule

Not every internal operator should be able to:

- approve tutors
- publish or unpublish public tutor profiles
- resolve sensitive reports
- alter payout-affecting state

Those should be explicitly granted capabilities.

## 6.4 Emergency privilege rule

If a broad emergency role exists at all, it should be:

- rare
- highly restricted
- strongly audited

It should not be the normal operating mode.

## 7. Internal Route And Surface Architecture

## 7.1 Internal route boundary

Admin trust and operations routes should live in a clearly internal route boundary.

Recommended conceptual shape:

```text
src/app/
  admin/
    layout.tsx
    queue/page.tsx
    tutors/page.tsx
    reports/page.tsx
    users/[id]/page.tsx
    moderation/[caseId]/page.tsx
```

The exact structure can change, but the boundary should be explicit.

## 7.2 Indexation rule

All internal admin routes are:

- non-indexable
- excluded from sitemap
- protected by authenticated server-side authorization

## 7.3 Metadata rule

Internal routes may have functional metadata only.

They should never participate in search optimization.

## 8. Access Control Architecture For Internal Operations

## 8.1 Dual-layer rule

Internal operations require:

- route-level and domain-level authorization
- data-layer protection for any exposed or queryable internal data paths

## 8.2 Internal DTO rule

Internal tools should still use scoped DTOs.

An internal operator should see only the fields needed for the assigned capability.

## 8.3 Sensitive-field rule

Highly sensitive data such as:

- moderation notes
- credential files
- payout references
- internal trust signals

should have tighter visibility than ordinary support data.

## 8.4 Write-action rule

Privileged actions should go through explicit server-side action handlers or route handlers with authorization and audit hooks.

Do not let internal tools mutate raw tables casually from the browser.

## 9. Operational Queue Architecture

Admin and moderation work should be queue-driven where possible.

## 9.1 Why queues matter

Queues reduce risk because they:

- make work visible
- make ownership clearer
- preserve ordering and status
- reduce hidden one-off interventions

## 9.2 Core queue families

The architecture should support at least these queue families:

- tutor application review queue
- credential verification queue
- report review queue
- public-profile review or takedown queue

## 9.3 Queue state rule

Every queue item should have explicit status.

Examples:

- pending
- in_review
- resolved
- escalated
- rejected

## 9.4 Assignment rule

Where useful, queue items should support assignment or claim semantics so actions remain attributable.

## 10. Tutor Approval Architecture

## 10.1 Application review rule

Tutor approval should remain the main human review decision.

Public discovery state should still remain distinct because an approved tutor may be withheld from listing for operational reasons such as incomplete payout readiness or an intentional pause.

## 10.2 Recommended state split

The architecture should conceptually distinguish:

- tutor account application state
- credential verification state
- payout readiness state
- public listing state

## 10.3 Why the split matters

A tutor may be:

- in application review
- approved to teach but not yet publicly listed because payout setup is incomplete
- temporarily unlisted without losing account access
- under investigation without immediate account deletion

## 10.4 Public profile gate

Public tutor profiles should not become publicly visible or indexable until:

- account approval conditions are met
- payout readiness conditions are met when paid lessons are active
- explicit public-listing state allows it

This should align with the SEO quality-gate model.

## 11. Credential Review Architecture

## 11.1 Private-file rule

Credential uploads are private verification artifacts and should never be exposed through public profile flows.

## 11.2 Review rule

Credential review actions should be recorded as explicit review outcomes rather than implicit file access.

Examples:

- approved
- rejected
- needs_more_information

## 11.3 Retention rule

Credential files should be retained only as long as legitimate verification, audit, or trust processes require them, in line with the privacy architecture.

## 12. Report And Trust-Case Architecture

## 12.1 Report rule

User reports should create durable reviewable cases, not only transient notifications.

## 12.2 Case model

A moderation case should be able to associate:

- the reporter
- the reported subject
- the triggering content or event
- case notes
- status
- decision outcome

## 12.3 Scope rule

Reports may concern:

- user behavior
- message content
- tutor-profile content
- lesson-related interactions

The architecture should support different source types without requiring a different system for each one.

## 12.4 Escalation rule

Cases should support escalation without losing the original decision trail.

## 12.5 Operational lesson-issue rule

Not every lesson problem is an abuse report.

No-show claims, wrong meeting links, and major lesson-delivery failures should create a reviewable operational lesson case linked to the lesson.

## 12.6 Shared-queue rule

Operational lesson cases may share internal queue infrastructure with abuse or trust cases, but they should keep distinct case typing and resolution outcomes.

This avoids mixing ordinary lesson operations with harmful-behavior moderation by accident.

## 12.7 Resolution-trail rule

Lesson-case resolution should record enough outcome detail to support:

- refund or payout consequences
- reliability penalties where applicable
- no-penalty outcomes for unresolved or no-fault incidents

## 13. Block Architecture

## 13.1 Product block rule

Blocking is a product behavior and a trust signal.

It should be enforceable in product flows and visible to authorized admins where relevant.

## 13.2 Enforcement rule

Block state must affect:

- messaging access
- future message sends
- related trust-case context where needed

## 13.3 Visibility rule

Block records should not be broadly visible to all staff by default.

Only roles with legitimate need should see them in detail.

## 14. Public Content Takedown Architecture

## 14.1 Public takedown rule

The system must support rapid removal of public tutor content from:

- public rendering
- sitemap eligibility
- indexable posture where appropriate

## 14.2 Why this matters

Moderation is not only about private product access.

Because Mentor IB has public tutor pages, moderation can affect the public web surface too.

## 14.3 Search-surface coordination

When public content is taken down for moderation or safety reasons, the action should coordinate with the SEO and observability architecture.

That means the architecture should support:

- removing sitemap eligibility
- changing public route visibility or robots behavior if needed
- preserving internal review evidence privately

## 15. Internal Notes And Evidence Architecture

## 15.1 Internal-notes rule

Internal notes are privileged operational records.

They should never appear in:

- public DTOs
- ordinary user-facing DTOs
- analytics exports by default

## 15.2 Evidence rule

If moderation decisions rely on captured evidence, the architecture should support:

- secure referencing of relevant content
- restricted access
- durable linkage to the moderation case

## 15.3 Redaction rule

If sensitive content is preserved for review, visibility should remain restricted even after the user-facing surface is hidden or removed.

## 16. Audit And Accountability Architecture

## 16.1 Core rule

Every privileged action should leave a durable audit event.

## 16.2 Actions that must be auditable

At minimum:

- tutor approval or rejection
- public-profile publication or takedown
- credential review outcomes
- block and unblock actions
- report-case resolution
- privileged role assignment changes
- payout-affecting internal actions later

## 16.3 Audit event contents

Audit events should capture:

- actor
- action
- target
- time
- resulting state

Optional structured reason fields are strongly recommended.

## 16.4 AI-agent rule

If AI-assisted tooling proposes privileged actions later, the final executed action still needs an attributable actor and a durable audit record.

## 17. Safety And Privacy Boundary

## 17.1 Retention alignment

Moderation records should follow the privacy architecture, which already treats reports, blocks, and moderation notes as sensitive retained records.

## 17.2 Access minimization

Even within internal tools, not every operator should have access to every case artifact or note.

## 17.3 Search-removal alignment

Public content takedowns should coordinate with the privacy and SEO architectures so removal from product visibility and public discoverability are aligned.

## 18. Internal Search And Lookup Architecture

## 18.1 Controlled lookup rule

Internal operator search should be constrained by capability and purpose.

The admin system should not become a broad unrestricted personal-data browser.

## 18.2 Result shaping rule

Search results in internal tools should show:

- what the operator needs
- not every field the system knows

## 18.3 Identifier rule

Internal tools should prefer stable internal identifiers and scoped summaries rather than raw dumps of all related records.

## 19. Incident And Emergency Action Architecture

## 19.1 Emergency actions

The architecture should support a small set of emergency actions such as:

- unlisting a public profile
- suspending internal visibility of harmful content
- locking access pending review where necessary

## 19.2 Guardrail rule

Emergency actions should still be:

- authenticated
- authorized
- auditable

## 19.3 Post-incident rule

A fast action should not erase the review trail.

Containment and accountability both matter.

## 20. MVP Scope Recommendation

For MVP, keep the internal architecture focused on:

- tutor application and credential review
- tutor approval and public-listing state
- report intake and resolution
- block visibility where relevant
- auditable privileged actions

Do not start with:

- giant all-purpose admin tables
- broad direct database consoles as the operating model
- full finance back-office complexity

## 21. Decisions To Lock Now

These decisions are mature enough to lock now:

- admin and moderation are internal-only operational surfaces
- internal roles should be capability-based, not one broad default admin role
- tutor approval remains the main review decision, while listing state stays separate for payout-readiness and pause control
- reports should become durable moderation cases
- privileged write actions must be server-side and auditable
- public content takedowns must coordinate with SEO and privacy behavior
- internal notes and moderation evidence are privileged data with tighter access boundaries
- AI-driven implementation should follow explicit privileged-action rules instead of inferred operator power

## 22. Decisions To Defer Slightly

These can be designed later as companion topics:

- final admin UI information architecture
- final support console design
- final moderation staffing and SLAs
- finance operations tooling
- advanced case automation or risk scoring

## 23. Final Recommendation

Mentor IB should treat internal admin operations as a small, explicit, auditable operational system.

The right practical model is:

- internal route boundary
- capability-based internal access
- queue-driven review work
- separate application and public listing states where payout readiness or pause control can affect visibility
- durable moderation cases
- auditable privileged actions

## 24. Official Source Notes

This recommendation is informed by the already approved internal architecture directions for:

- Next.js server-side authorization and route boundaries
- Supabase RLS and privileged server-side access
- storage ownership and private credential handling
- moderation and message-security rules
- SEO public-surface takedown coordination
