# Mentor IB Engineering Guardrails v1

**Date:** 2026-04-11
**Status:** Canonical engineering policy layer for AI-agent and human implementation work
**Scope:** non-negotiable implementation rules for scope control, repo hygiene, hardcoded values, environment access, dependency churn, component reuse, migration safety, verification, and commit or branch discipline

## 1. Why This Document Exists

Mentor IB now has:

- product and UX definition
- architecture and data decisions
- implementation baselines
- a service baseline
- an execution playbook
- phase task packs

That is enough to start coding.

What still needs to be explicit is the engineering policy layer:

- what agents must not do
- what values must not be hardcoded
- when dependency changes are allowed
- how verification should work before code is considered done
- how commits, branches, and lockfiles should be treated
- how to avoid repo drift while many implementation tasks are executed over time

Without this layer, execution drifts even with strong planning.

This document exists to make the non-negotiable engineering rules easy to follow and hard to misread.

## 2. What This Document Does Not Redefine

This document does not replace:

- `docs/planning/agent-execution-playbook-v1.md`
- `docs/planning/implementation-baseline-v1.md`
- `docs/planning/service-dependency-baseline-v1.md`
- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/planning/implementation-task-template-v1.md`
- `docs/architecture/configuration-and-governance-architecture-v1.md`
- `docs/architecture/testing-and-release-architecture-v1.md`
- `docs/architecture/security-architecture-v1.md`
- any task pack

Those documents still own:

- task execution workflow
- toolchain and provider choices
- doc routing
- source-of-truth ownership
- testing and release architecture
- security rules
- task-specific acceptance criteria

This document only defines the engineering guardrails that implementation must stay inside.

## 3. Core Principle

Mentor IB implementation should optimize for:

- small coherent changes
- stable source-of-truth boundaries
- zero surprise stack churn
- predictable verification
- safe collaboration between humans and AI agents

Short version:

**Do the smallest correct change, in the right layer, with explicit verification, and without inventing new local rules.**

## 4. Guardrail Hierarchy

When deciding what an agent may do, use this order:

1. task scope and acceptance criteria
2. source-of-truth architecture, data, and design docs
3. implementation baseline and service baseline
4. this engineering guardrails document
5. local repo files such as `package.json`, lockfile, config files, and existing source code

Practical rule:

- if a task says what to build, follow it
- if a source doc says who owns a decision, respect it
- if this document says "do not widen scope" or "do not hardcode this," that rule is active unless a stronger source doc explicitly says otherwise

## 5. Non-Negotiable Rules

The following rules apply to all implementation work:

- do not implement from a backlog row alone
- do not implement a task that is not `ready` unless the human explicitly asks for clarification work
- do not widen scope beyond the assigned task
- do not add an unapproved provider, SDK family, or parallel stack
- do not guess versions when the repo or baseline defines them
- do not revert unrelated user changes
- do not create a second student or tutor UI world
- do not treat UI hiding as security
- do not ship unverified code as "done"

## 6. Scope And Change Isolation

**The task's Scope section is the hard boundary for what an agent may create.** If a file, route, package, or behavior is not listed in the Scope section, do not create it. Another task owns it.

Each change set and implementation pass should stay focused on one coherent task.

Agents should:

- implement one task id at a time
- create only the files, routes, and packages listed or directly implied by the task's Scope section
- separate follow-up cleanup into later tasks unless it directly blocks the assigned task
- call out adjacent issues without silently fixing all of them

Agents should not:

- mix multiple backlog tasks into one change set
- create placeholder files, stubs, or empty routes for future tasks
- install packages that are needed by other tasks but not by the current task
- create routes that belong to other phases or other task IDs
- refactor unrelated modules during feature work
- restructure broad folders because the current task touched one file there
- upgrade tooling or dependencies while doing UI or feature work unless the task requires it

## 7. Hardcoded-Value Rules

Hardcoding is allowed only for values that are truly local and semantically insignificant.

Hardcoding is not allowed for values that should be centrally owned.

Do not introduce route-local or feature-local hardcoded values for:

- design tokens
- shared spacing scales
- status families
- reference data
- legal or policy copy
- provider ids
- provider allowlists
- analytics destinations
- webhook paths
- bucket names with product meaning
- route metadata that belongs to a central SEO or content layer
- matching, trust, or rating behavior knobs

Allowed local literals include:

- tiny helper labels unique to one component
- temporary test fixture values
- implementation-only constants with no cross-module meaning

Practical rule:

- if a value affects cross-screen consistency, business behavior, provider behavior, or public policy surfaces, it belongs in a shared source of truth

## 8. Environment, Secrets, And Config Access

Environment access must stay centralized.

Agents must:

- use typed env modules
- keep server-only env values separate from public env values
- commit `.env.example` but not real secrets
- fail fast when required env values are missing in server code

Agents must not:

- scatter `process.env.*` reads across arbitrary modules
- put secret values in committed code
- put sensitive config into `NEXT_PUBLIC_` variables unless it is intentionally browser-visible
- use env vars as a general-purpose feature-configuration dumping ground

Practical rule:

- read env once, parse it once, export it once

## 9. Dependency And Version Rules

Dependency churn is expensive and should be tightly controlled.

Agents must:

- use only the providers and SDK families approved in the baselines
- pin exact dependency versions in `package.json`
- treat the lockfile as exact operational truth once it exists
- install a new package only when the assigned task genuinely requires it

Agents must not:

- add packages "just in case"
- add overlapping libraries that solve the same problem
- switch package families during feature work
- silently bump versions because a newer release exists
- modify the lockfile unless `package.json` or an install action truly required it

Lockfile rule:

- lockfile changes are allowed only when a dependency change is intentional and in scope
- if `package.json` did not change, a lockfile diff is suspicious and should be reviewed

## 10. Service And Provider Rules

Service integrations must follow the approved provider posture.

Agents must:

- use `Supabase` for auth, Postgres, storage, and realtime
- use `Resend` for email delivery when email tasks enter scope
- use `PostHog` for product telemetry when telemetry tasks enter scope
- use `Stripe` for payments when payment tasks enter scope
- keep browse search internal and Postgres-backed unless a later approved doc changes that

Agents must not:

- add Firebase Auth, Clerk, Auth0, or another auth system
- add Algolia for day-one implementation
- add external chat SaaS
- add workflow platforms or media platforms without an explicit doc change
- add an extra logger or error tracker by default

## 11. Reuse And Component Rules

Mentor IB should grow through shared primitives, variants, wrappers, and domain-owned components.

Agents must:

- reuse design tokens and approved primitives
- extend shared components through variants or wrappers where appropriate
- preserve one shared design language across student and tutor routes
- look for an existing continuity anchor before creating a new composite

Agents must not:

- create one-off cards and panels on every page
- clone a shared component into a second local version because it is faster
- treat tutor operations as a separate visual product
- bury business rules inside UI components

Practical rule:

- if the UI difference is structural and repeated, add a shared component or a variant
- if the UI difference is one-time composition, keep it in the route layer

## 12. Data And Security Rules

Data and security shortcuts are not allowed.

Agents must:

- keep authorization in the server or domain layer
- review RLS when a task affects exposed data access paths
- shape DTOs deliberately before UI exposure
- keep sensitive data out of logs, analytics, metadata, and public routes
- verify webhooks server-side and preserve raw-body requirements where relevant

Agents must not:

- expose raw database rows to UI by convenience
- rely on client-only checks for object-level access
- bypass DTO shaping because a route is server-rendered
- log secrets, tokens, message bodies, meeting URLs, credential evidence, or payment-sensitive payloads

## 13. Database And Migration Rules

Database work must be forward-safe and reviewable.

Agents must:

- use migration files in version control
- keep schema changes aligned with schema, RLS, DTO, and index review
- test migrations locally before claiming completion
- separate domain facts from generic JSON blobs when the data is filterable, permission-sensitive, or query-critical

Agents must not:

- change database structure ad hoc in production-only tooling
- hide meaningful schema change inside application code with no migration
- combine broad refactors with risky data migrations in one unreviewable step
- assume rollback is trivial when a migration changes data shape

Practical rule:

- if a task changes data shape, think through migration, query impact, auth impact, and verification together

## 14. Testing And Verification Rules

Every meaningful task needs explicit verification.

At minimum, agents must name one of:

- automated test required
- manual verification sufficient
- no test required with reason

Default verification expectations:

- UI tasks need responsive and interaction review
- public route tasks need route, metadata, and SEO checklist review
- auth, provider, and callback tasks need success and failure-path checks
- Server Actions need validation and authorization checks where meaningful
- Route Handlers need method, auth, and response-shape checks where meaningful
- database tasks need schema, migration, and data-access verification

Agents must not:

- leave verification implicit
- call a task complete without at least the verification named by the task card
- use "not tested" as a silent default

## 15. CI And Preview Rules

The engineering baseline assumes:

- typecheck and lint
- unit and integration tests where present
- production build
- preview deployment for meaningful changes

Agents should:

- keep CI check names stable once introduced
- avoid changes that break preview verification incidentally
- call out when a task likely needs preview validation even if local checks passed

Agents should not:

- rename CI checks casually
- weaken required checks because a task is urgent
- assume preview verification is optional for design-heavy or flow-heavy changes

## 16. Branch Rules

If a branch is created for task work, use one branch per coherent task or tightly related slice.

Recommended naming:

- `codex/<task-id>-<short-slug>`

Examples:

- `codex/p1-found-001-app-shell`
- `codex/p1-auth-001-sign-in-entry`

Branch rules:

- do not reuse one long-lived branch for many unrelated tasks
- do not mix Phase 1 and Phase 2 work on the same branch
- do not rename a branch mid-task unless there is a real operational reason

## 17. Commit Rules

Commit behavior depends on the operator workflow, but if an agent makes commits, the commits should be intentional and reviewable.

Recommended commit message format:

- `<TASK_ID>: <short imperative summary>`

Examples:

- `P1-FOUND-001: add app shell and route groups`
- `P1-AUTH-001: implement sign-in entry and callback flow`

Commit rules:

- do not commit unrelated files together
- do not create "misc fixes" commits spanning multiple tasks
- do not amend history unless explicitly asked
- do not commit broken generated output or accidental lockfile churn
- do not commit secrets, local env files, or machine-specific artifacts

## 18. Repo Hygiene Rules

Agents must leave the repo easier to reason about, not harder.

Agents should:

- keep filenames and module boundaries clear
- remove obviously dead code only when it is directly tied to the task
- avoid introducing duplicate helpers with overlapping meaning
- keep generated files and source files clearly separated

Agents should not:

- rename or move large file trees casually
- delete docs because code now exists
- rewrite code style broadly without a tooling task
- leave temporary debug code behind

## 19. Docs Update Rules

Most feature tasks should not rewrite planning docs.

Docs should be updated only when:

- a source-of-truth decision actually changed
- a new required implementation artifact was intentionally added
- an existing doc was materially wrong or incomplete for real implementation

Docs should not be updated merely because:

- code became more concrete
- an agent prefers a different wording style
- a local implementation detail does not belong in architecture or planning docs

## 20. Escalation Rules

The agent should stop and escalate when:

- a guardrail conflicts with task scope
- the task appears to need a new provider or package family
- a migration or auth change is implied but not named
- existing local changes make the safe path unclear
- a doc conflict cannot be resolved by the normal source-of-truth order
- verification cannot be completed with reasonable confidence

The correct behavior is to report the issue clearly, not to improvise a silent exception.

## 21. Minimum Review Checklist

Before calling a task done, the agent should confirm:

- the change matches one concrete task id
- scope was not widened
- no unapproved providers or packages were added
- no hardcoded shared values were introduced
- env access stayed centralized
- UI reused the design system
- security and DTO boundaries were respected
- verification was run or explicitly explained
- no unrelated user changes were reverted

## 22. Final Recommendation

Use this document as the repo-level "must follow" policy layer.

The practical working set for implementation is now:

1. `docs/planning/agent-execution-playbook-v1.md`
2. `docs/planning/agent-implementation-decision-index-v1.md`
3. `docs/planning/implementation-baseline-v1.md`
4. `docs/planning/service-dependency-baseline-v1.md`
5. `docs/planning/engineering-guardrails-v1.md`
6. the relevant phase task pack and detailed task section

That gives future agents a full chain:

- how to pick work
- how to find the right docs
- which stack and services are approved
- what engineering rules must not be broken
- how to report completion safely
