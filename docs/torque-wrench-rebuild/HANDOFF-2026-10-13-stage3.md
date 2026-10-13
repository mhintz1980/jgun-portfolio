# JG-038 Stage 3 handoff — 2026-10-13

> **Superseded for continuation on 2026-10-13.** Stage 3 leaf exit is recorded in `project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/stage3-exit-2026-10-13.md`; Stage 4 is in progress. Commit `27cb8be4` includes the Stage 3 fixes, exit evidence, Stage 4 camera/opening A/B, and the earlier edits to this handoff. Start from `docs/torque-wrench-rebuild/HANDOFF-2026-10-13-stage4.md`. The Stage 3 instructions and results below are historical, not the current execution queue. G0–G9 and Astra/owner acceptance remain open.

## Immediate next action

1. Read this handoff, then `project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/stage3-integration-checkpoint.md`, `stage3-continuation-2026-10-13.md`, and `GATES.md` in that same evidence directory. Root `GATES.md` belongs to JG-035 and is not this task's ledger.
2. Check live branch/HEAD, dirty state, current writer ownership, and newer evidence before editing or launching jobs. Reconcile existing uncommitted fixes and verifier work with their current owners; preserve that work and avoid duplicate writers or previews.
3. Consume `stage3-integrated-review.md` in the same evidence directory. Its initial verdict is NOT PASS with four FIX FIRST findings: shaft host cleanup reporting, shaft tool-factory cleanup forwarding, ring factory cleanup reporting, and held-opening resampling when the real bake crossing installs. Reconcile existing fixes, resolve every finding, and obtain independent re-review before claiming Stage 3 exit.
4. Consume the cutter and mechanical reports below, plus any newer completed reports. Resolve remaining failures without treating incomplete runs or historical passes as proof for changed source. Prove real cutter framing/occlusion/clearance, explicit shaft-study controls, and matched mechanical parity on a fresh task-owned production build/preview; retain valid existing evidence when its source/build provenance still matches. Do not infer these from CPU samplers or static DOM checks.
5. Only after the Stage 3 leaf requirements pass and independent re-review is recorded, record Stage 3 exit and enter Stage 4 opening/pit recovery. Stage 4 requires camera/remap A/B, pressure/shatter/emergence/pit/electricity telemetry and unaltered PNGs, then separate Astra and owner review. Stage 3 exit does not automatically close G0–G9.

## Exact current state

- Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`.
- Branch: `torque-wrench/rebuild`; integration HEAD at this prompt refresh: `4e620d48b4eb45a1e940f6b4684cf5e492fd6ab0`. Original starting HEAD: `dc44fb79ed43d6a62db47ae58900afb718ad15d1`. Verify live HEAD on resume.
- Stage 0 and static Stage 1 are closed. Stage 2 is closed in `stage2-gates.md` and `stage2-closure.md`.
- Stage 3 is integrated but its leaf exit is not closed. See `stage3-integration-checkpoint.md`.
- G0–G9 remain open; partial gate evidence is in `project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/GATES.md`.
- No publication, cutover, archive, protected-sibling access, or push authorization is implied. The owner authorized the local commit requested on 2026-10-13.

## Historical verified checkpoint

These results describe the recorded integration build, not automatic verification of the current dirty tree.

- TypeScript exit 0.
- Full CPU suite: 73 files / 947 tests pass, 4 pre-existing skips.
- Source boundary: one lazy edge `cadGate.ts -> ./Scene`; no root runtime/store value edge.
- Production build: `.scratch/jg038-stage3-20261012-a`, aggregate SHA-256 `7ea5c88aedf4cbe7eee07755d4efd2decd0b9004d885fbbca337dec8e085a05c`.
- Entry SHA-256: `8f84cde8c6998d59056faab5d09f78c997635dbd0be49c0e982c2b3d03a6c716`.
- Lazy Scene SHA-256: `334196936862bf0394990aaca51eb0b8c33751ba4c7451503584e3a4f2c7b00a`.
- Static/fallback browser: `../05-stage1-integration/runtime/stage3-static-d.json`, 14/14 cases and 396/396 assertions.
- Timeline/conductor browser: `runtime-timeline/stage3-full-d.json`, 17/17 cases and 382/382 assertions.
- Drawing integration: `drawing-runtime-integration-stage3-final.json`, 5 PASS / 0 FAIL / 1 UNVERIFIED (BFCache not restored).
- The timeline harness now waits for live-world plus initial sheet-bake readiness before input. Cold bake responsiveness remains a G8 concern, not accepted performance.

## Continuation evidence — prompt refresh 2026-10-13

All paths below are relative to `project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/`. Check for newer completed reports on resume.

- `stage3-integrated-review.md`: initial bounded review, NOT PASS; four FIX FIRST findings require resolution and independent re-review. Uncommitted fixes are already in progress; do not assume they are absent or accepted.
- `runtime-cutter-20261013-e/report.json`: historical failed run, all four desktop/narrow full/lite cases failed tier, controls, DOM occlusion, and asset-provenance assertions. Preserve this failure evidence.
- `runtime-cutter-20261013-f/report.json`: newer completed run, overall FAIL; each of the four cases retains only `served request matches build: drawing/jgun-sheet-v2.bin.gz` as a failed assertion. The other assertions passed in this report, but the provenance failure still prevents accepting the run as Stage 3 exit evidence. Establish whether the remaining failure belongs to product behavior, serving/provenance, or the verifier before correcting and rerunning.
- `runtime-mechanical-20261013-f/mechanical-parity-2026-10-13T08-00-30-659Z-e041202d-9568-49ee-89fa-d96fc3093629.json`: recorded PASS, exit 0, 3,493 PASS / 0 FAIL / 0 UNVERIFIED. Bind this result to its exact source/build and reviewed method; rerun if relevant source changes invalidate that binding. This report alone does not close Stage 3 or any G0–G9 gate.

## Ownership and integration boundaries

- External D-core/D-bake 19-path patch is released and independently reviewed PASS in `parallel-drawing-second-review.md`.
- M1 mechanics, ring core/factory, shaft runtime/tools, private sheet, opening/mechanism/inspection directors, and private world host are integrated.
- The final Canvas fix is important: R3F `Canvas fallback` is DOM canvas content and must not be used as a WebGL failure callback. The current capability check happens before Canvas mount.
- Automatic tier/failure downgrade stops playback but preserves an already-open disclosure. User Escape/close restores trigger focus.
- All heavy jobs must remain serialized and task-owned. Restart preview after every rebuild.
- Current source, tests, verifier scripts, and evidence contain ongoing uncommitted work. Reconcile live ownership before modifying those paths; do not reset, overwrite, or stage another writer's changes.
- Never access `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio`.
- Never commit `.scratch/`, unrelated REA documents, or the content-identical line-ending-only root `GATES.md` drift.

## Suggested skills

| When | Skill |
| --- | --- |
| Before Stage 3 runtime camera/mechanics verification | `C:/Projects/skills-master/local/webgl-telemetry-verifier/SKILL.md` |
| Before changing rig/mechanics | `C:/Projects/skills-master/local/cad-scene-graph-rigging/SKILL.md` |
| Before more R3F/conductor/frame work | `C:/Projects/skills-master/local/r3f-scroll-performance-guard/SKILL.md` |
| Before Stage 4 world/effects composition | `C:/Projects/skills-master/local/build-threejs-scroll-worlds/SKILL.md` |
| Before shader/sheet changes | `C:/Projects/skills-master/local/glsl-transition-shader-pipeline/SKILL.md` |
| Before browser verifier edits | `C:/Projects/skills-master/local/playwright/SKILL.md` |
| Before delegated waves | `C:/Users/Markimus/.codex/skills/parallel-workstreams/SKILL.md` and `C:/Users/Markimus/.codex/skills/codex-tiers/SKILL.md` |

Also read `docs/torque-wrench-rebuild/smooth-scrolling.md` before every scrolling/cinematic edit.

## Ready-to-paste next-session prompt

```text
Continue JG-038 in C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench on branch torque-wrench/rebuild. This Stage 3 handoff is superseded: read docs/torque-wrench-rebuild/HANDOFF-2026-10-13-stage4.md first and use its continuation prompt. Commit 27cb8be4 records Stage 3 leaf exit and Stage 4 opening A/B. Stage 4 is in progress; G0-G9 and Astra/owner acceptance remain open. Check live branch/HEAD, dirty state, writer ownership, and newer evidence before editing or launching jobs. Never access the protected sibling C:/Users/Markimus/.buzz/REPOS/jgun-portfolio. Preserve unrelated work, serialize heavy jobs, restart preview after every rebuild, never commit .scratch, unrelated REA files, or root GATES.md drift, and do not push/publish/cutover. Use the exact skills and boundaries in the Stage 4 handoff.
```
