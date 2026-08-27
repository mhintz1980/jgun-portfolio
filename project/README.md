# Project Knowledge Map — JGUN Portfolio

This directory contains the durable internal knowledge for the JGUN portfolio. It is deliberately separate from application source and from the concise task queue in [`../TODO.md`](../TODO.md).

> **Rule:** A checked TODO item must link to an accepted plan and verification evidence. A plan without a `JG-###` ID remains a proposal and belongs in `work/inbox/`.

## Required Read Order

1. Read [`../AGENTS.md`](../AGENTS.md) for non-negotiable project rules.
2. Read [`../TODO.md`](../TODO.md) for approved and ordered work.
3. Read [`work/INDEX.md`](work/INDEX.md) for the matching plan ID, status, and evidence.
4. Read the plan in [`work/plans/`](work/plans/) before modifying code.
5. Read relevant durable context in [`context/`](context/), including the named skills in [`context/agent-skills.md`](context/agent-skills.md).
6. After implementation, create or update the linked record in [`work/evidence/`](work/evidence/) before checking the TODO item off.

## Directory Responsibilities

| Directory | Contains | Does not contain |
|---|---|---|
| [`context/`](context/) | Durable architecture, constraints, domain vocabulary, owner specs, skill paths, and source references. | Open work, temporary session notes, and raw task history. |
| [`decisions/`](decisions/) | Dated decisions that remain relevant after their original task is closed. | Proposals or incomplete implementation notes. |
| [`work/inbox/`](work/inbox/) | Untriaged plan drafts and incoming proposals. | Approved work already in the TODO queue. |
| [`work/plans/`](work/plans/) | Accepted `JG-###` plans at stable paths. | One-off scratch notes. |
| [`work/evidence/`](work/evidence/) | Build, telemetry, accessibility, and release evidence tied to a plan ID. | Implementation plan prose. |
| [`work/INDEX.md`](work/INDEX.md) | The registry linking state, plan, TODO entry, and evidence. | Duplicated plan bodies. |
| [`archive/superseded/`](archive/superseded/) | Explicitly replaced documents with a replacement link. | Canonical active specs or plans. |

## Source-of-Truth Boundaries

| Question | Canonical location |
|---|---|
| What is approved and next? | [`../TODO.md`](../TODO.md) |
| What is the full change scope and acceptance criteria? | `work/plans/JG-###-*.md` |
| What evidence proves a task is complete? | `work/evidence/JG-###-verification.md` |
| What is permanently true about the system? | `context/` |
| Why was a durable design choice made? | `decisions/ADR-###-*.md` |

## Protected Material

Do not move, delete, commit, or build on `.scratch/` or `docs/orzo-style-portfolio-implemetation-roadmap.md` until the parallel-session owner explicitly releases it. See [`../AGENTS.md`](../AGENTS.md).
