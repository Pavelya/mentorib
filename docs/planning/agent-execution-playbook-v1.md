# Mentor IB Agent Execution Playbook v1

**Date:** 2026-04-11
**Status:** Canonical execution workflow for AI agents implementing the approved backlog
**Scope:** how humans and AI agents should select tasks, read the docs pack, execute implementation safely, handle blockers, verify work, and report results without creating drift or duplicate architecture paths

## 1. Why This Document Exists

Mentor IB now has:

- approved UX and design-system docs
- approved architecture and data docs
- implementation baselines
- phase task packs

That is enough to start building.

The missing piece was not more product architecture.

The missing piece was one explicit execution playbook that answers:

- how a human should hand a task to an AI agent
- how the agent should know which docs to read
- how the agent should know whether a task is actually ready
- how the agent should implement without widening scope
- how the agent should report completion or blockers

Without this playbook, the docs pack can still feel abstract even if the decisions are already solid.

This document turns the planning pack into an operational workflow.

## 2. What This Document Does Not Redefine

This document does not replace:

- `docs/planning/engineering-guardrails-v1.md`
- `docs/planning/implementation-baseline-v1.md`
- `docs/planning/service-dependency-baseline-v1.md`
- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/planning/implementation-task-template-v1.md`
- `docs/planning/implementation-backlog-index-v1.md`
- the phase task packs
- any architecture, data, or design-system source doc

Those documents still own:

- non-negotiable engineering policy rules
- what the product should do
- which stack and providers are approved
- which docs govern each decision area
- what each task means
- how acceptance criteria should be evaluated

This document only owns the execution workflow.

## 3. Core Principle

Mentor IB implementation should run as:

- one approved task at a time per agent
- one clear source-of-truth path per task
- one bounded implementation slice per handoff

Short version:

**Do not ask agents to "build the app." Ask them to implement one concrete task id against the approved doc chain.**

## 4. How The Docs Pack Actually Works

The docs pack is not magic auto-RAG.

It is a curated retrieval system.

The practical retrieval chain is:

1. `docs/README.md` is the navigation map
2. `docs/planning/implementation-backlog-index-v1.md` is the backlog map
3. a phase task pack identifies the task row and detailed task section
4. `docs/planning/agent-implementation-decision-index-v1.md` routes the agent to the correct decision docs
5. `docs/planning/implementation-baseline-v1.md` freezes toolchain choices
6. `docs/planning/service-dependency-baseline-v1.md` freezes provider and SDK choices
7. the task's required source docs define the local implementation truth
8. the repo files become the exact executable truth once scaffold exists

Practical rule:

- the task-pack table row is not enough
- the detailed task section is the real execution card
- the decision index and baselines tell the agent what else to read

## 5. Task Status Meaning

Use task status in this way:

- `ready`: can be implemented if dependencies are satisfied
- `draft`: not ready for implementation; needs clarification or revision first
- `planned`: acknowledged future work, not active implementation scope yet
- `blocked`: implementation started but cannot safely continue
- `done`: implemented and verified against acceptance criteria

Practical rule:

- agents should implement only `ready` tasks unless the human explicitly asks for a draft task to be clarified rather than built

## 6. How To Pick The Next Task

The default selection rule is:

1. choose the current active phase
2. choose the lowest unfinished wave in that phase
3. choose a `ready` task whose dependencies are already satisfied
4. prefer the highest priority available task in that wave
5. prefer the task with the smallest overlap risk if multiple agents may work in parallel

This means:

- do not jump to Wave 3 if Wave 1 still contains unfinished prerequisites
- do not skip dependencies because a later task looks more interesting
- do not implement `draft` or `planned` work just because it seems easy

## 7. Human Operator Workflow

The human should drive execution like this:

1. pick one concrete task id from the active phase pack
2. confirm the task is `ready`
3. confirm the task's dependencies are already complete or intentionally assumed
4. hand the agent the task id and task-pack path
5. require the agent to follow this playbook and the task's required docs
6. review the resulting summary against acceptance criteria and verification
7. mark the task `done` or `blocked`

If multiple agents are used:

- assign one task id per agent
- keep write scopes disjoint where possible
- do not ask two agents to implement the same task
- do not split one task into parallel edits unless the task is explicitly decomposed first

## 8. Agent Read Order

> **Note:** When `CLAUDE.md` exists at the repo root, it is loaded automatically and defines the authoritative read order and execution protocol. The list below is the full reference version. If `CLAUDE.md` and this section conflict, `CLAUDE.md` wins.

For any nontrivial implementation task, the agent should read in this order:

1. `docs/README.md`
2. this playbook
3. the detailed task section in the relevant phase pack
4. `docs/planning/agent-implementation-decision-index-v1.md`
5. `docs/planning/engineering-guardrails-v1.md`
6. `docs/planning/implementation-baseline-v1.md`
7. `docs/planning/service-dependency-baseline-v1.md`
8. every file listed under `Required source docs` for that task
9. the current repo files that define exact implementation truth, such as:
   - `package.json`
   - lockfile
   - `tsconfig.json`
   - `next.config.*`
   - relevant source files in the touched area

Practical rule:

- do not try to read the entire docs pack on every task
- do not skip the detailed task section
- do not guess tool versions or providers from memory once repo files exist

## 9. Pre-Flight Questions For The Agent

Before editing code, the agent should answer:

- What is the exact task id?
- Is the task `ready`?
- Are all stated dependencies already satisfied?
- Which route family, domain module, or data boundary does this task touch?
- Which source docs own the decision?
- Is the task UI-only, data-affecting, auth-sensitive, SEO-sensitive, or privacy-sensitive?
- Does the task require a migration, RLS change, DTO change, provider integration, or structured-data review?
- What is explicitly out of scope?

If these answers are unclear, the agent should pause and read the relevant docs before coding.

## 10. Implementation Loop

Once the task is understood, the agent should work in this order:

1. restate the goal in implementation terms
2. identify the likely work areas and files
3. inspect existing code in the touched area
4. implement the smallest coherent slice that satisfies the task
5. keep changes inside the approved boundaries
6. run the required verification
7. self-review against acceptance criteria and the task checklist
8. report results with files changed, verification, and blockers

Practical rule:

- finish the whole task slice when feasible
- do not stop at analysis if the task is implementable
- do not keep exploring once the task is clear enough to build

## 11. Scope Discipline Rules

**The task's Scope section is the hard boundary.** Before creating any file, ask: "Does the Scope section require this?" If not, do not create it.

Agents should:

- implement only what the task's Scope section lists
- create only the files and packages directly required by the current task
- reuse existing shared components, DTOs, service modules, and route patterns
- update docs only if the implementation reveals a real decision mismatch
- leave unrelated user changes untouched

Agents should not:

- create files, routes, or stubs for other tasks or future phases
- install packages that other tasks will need but this task does not
- widen a feature task into a stack refactor
- add a second provider because it feels nicer
- redesign the route tree during a page task
- rewrite unrelated modules while "cleaning up"
- silently change decisions that belong to architecture or data docs

## 12. Stop And Escalate Conditions

The agent should stop and report instead of improvising when:

- the task is not actually `ready`
- a dependency task is not complete but appears required
- two source docs materially conflict
- the implementation would require a new third-party vendor not approved in the baselines
- required secrets, env vars, or external setup are missing
- the repo contains conflicting user changes in the same area
- the task appears to require schema or auth work that was not named
- the acceptance criteria cannot be met without widening scope significantly

In these cases, the correct result is a clear blocker report, not an improvised workaround hidden inside code.

## 13. Definition Of Done For An Agent Task

A task is done only when all of the following are true:

- the task goal is implemented
- the acceptance criteria are satisfied
- required verification has been run, or a clear reason is given why a specific check could not run
- no out-of-scope behavior was silently added
- no unrelated files or user changes were reverted
- any required doc update is included if a real decision mismatch was discovered

Practical rule:

- "I changed some files" is not completion
- completion means the task card is satisfied

## 14. Verification Rule

Agents should always verify at the smallest meaningful level for the task.

Examples:

- route and layout tasks: manual route review and render sanity checks
- component tasks: manual responsive and interaction review plus any local tests where present
- data tasks: migration review, schema checks, and relevant test coverage
- auth or provider tasks: callback-path sanity review, env expectations, and failure-state checks

If a test cannot be run:

- state exactly what was not run
- state why
- state what was checked instead

## 15. How To Use The Task Packs

Use the phase task packs in two layers:

### 15.1 Table layer

The task table is for:

- backlog visibility
- wave ordering
- dependency scanning
- phase planning

### 15.2 Detailed task layer

The detailed task section is for:

- execution
- scope
- source docs
- acceptance criteria
- verification

Practical rule:

- never launch implementation from the table row alone

## 16. How To Handle Docs During Implementation

Most implementation tasks should not create new docs.

Agents should update docs only when:

- a source doc is clearly wrong
- a path or ownership rule changed materially
- a task exposed a real contradiction
- a required implementation artifact was intentionally added

Agents should not:

- rewrite planning docs just because code structure became more concrete
- create architectural side quests during routine implementation
- duplicate an existing source doc with a second explanation of the same rule

## 17. Reporting Format

When a task is finished or blocked, the agent should report:

1. task id and title
2. whether it was completed or blocked
3. files changed
4. verification run
5. blockers, assumptions, or doc mismatches

Recommended concise structure:

- `Task:` `<task id> - <short title>`
- `Outcome:` `<completed | blocked>`
- `Files:` `<important changed files>`
- `Verification:` `<commands, manual checks, or not run with reason>`
- `Notes:` `<assumptions, blockers, or doc updates>`

## 18. Launch Prompt For Humans

> **Note:** When `CLAUDE.md` exists at the repo root, it is loaded automatically every session. The full execution protocol, read order, rules, and reporting format are already defined there. The long launch prompt below is no longer needed — just say the task ID.

Use this prompt to launch a task:

```text
Implement <TASK_ID>
```

`CLAUDE.md` handles everything else: which docs to read, which rules to follow, how to verify, and how to report.

If `CLAUDE.md` does not exist for any reason, use the full prompt below as a fallback:

<details>
<summary>Full fallback launch prompt (only needed without CLAUDE.md)</summary>

```text
Implement task <TASK_ID> from <PHASE_TASK_PACK_PATH>.

Before coding, read in order:
1. docs/planning/agent-execution-playbook-v1.md
2. the detailed task section for <TASK_ID>
3. docs/planning/agent-implementation-decision-index-v1.md
4. docs/planning/engineering-guardrails-v1.md
5. docs/planning/implementation-baseline-v1.md
6. docs/planning/service-dependency-baseline-v1.md
7. every file listed under Required source docs for that task
8. package.json, lockfile, tsconfig, next.config, and the existing local code in the touched area

Rules:
- implement only this task
- do not widen scope
- do not invent providers, packages, or versions
- do not introduce hardcoded design tokens, statuses, provider ids, reference data, or legal copy
- do not revert unrelated user changes
- if the task is blocked by missing dependencies, doc conflicts, or missing setup, stop and report it clearly

When finished, report:
1. task id and outcome
2. files changed
3. verification run
4. blockers, assumptions, or doc mismatches
```
</details>

## 19. Parallel-Agent Rule

Parallel agent work is allowed only when:

- each agent owns a different task id
- the tasks are both `ready`
- dependencies are already satisfied
- the expected write scopes are meaningfully disjoint

Avoid parallel work when:

- two tasks touch the same route family in the same files
- one task depends logically on another's output
- one task is mostly architecture clarification rather than implementation

Practical rule:

- parallelize independent tasks, not confusion

## 20. Relationship To Engineering Guardrails

This playbook defines the execution workflow.

`docs/planning/engineering-guardrails-v1.md` defines the non-negotiable repo and engineering policy layer beneath that workflow.

Use this split:

- this playbook answers how to execute a task
- the guardrails doc answers what implementation behavior is not allowed

## 21. Final Recommendation

The practical Mentor IB build workflow should be:

1. human picks one `ready` task id
2. agent reads this playbook, the detailed task section, the decision index, the baselines, and the task source docs
3. agent implements only that task
4. agent verifies and reports
5. human marks the task done or blocked

That is the working bridge from the docs pack into actual coding.
