---
id: JG-###
plan: ../plans/JG-###-slug.md
verified_on: YYYY-MM-DD
verified_by: unassigned
commit: null
status: draft # draft | verified | failed
---

# JG-### — Verification Evidence

## Claimed Outcome

Name the acceptance criteria being verified. Do not write a success statement until the evidence below has been collected.

## Environment

| Field | Value |
|---|---|
| Branch / commit | `git rev-parse --short HEAD` |
| Build or preview URL | State exact URL and fresh server start. |
| Quality tier / viewport | State device, dimensions, and motion preference. |
| Asset revision | State model/hash when relevant. |

## Evidence

| Acceptance criterion | Exact command, probe, or procedure | Result | Pass |
|---|---|---|---|
| Criterion 1 | Command or precise runtime probe. | Measured output. | `[ ]` |
| Criterion 2 | Command or precise runtime probe. | Measured output. | `[ ]` |

## Required Project Checks

- [ ] `npm run typecheck` completed with no errors.
- [ ] `npm run build` completed with no errors.
- [ ] The `:4173` preview was restarted after the current build.
- [ ] Runtime telemetry was used for WebGL/scene claims; screenshots are supporting evidence only.
- [ ] Relevant keyboard, touch, reduced-motion, and poster-tier behavior was checked when the change affects it.
- [ ] No protected `.scratch/` or parallel-session file was committed or modified by this work.

## Result

State one of the following exactly: `verified`, `failed`, or `partial`. If partial or failed, retain the TODO checkbox and link the blocker in the plan.

## Residual Risk and Follow-up

Record known limitations and any newly discovered proposal that belongs in `../inbox/`.
