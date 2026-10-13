# JG-038 Stage 3 handoff — 2026-10-13

## Immediate next action

1. Read this handoff, then `project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/stage3-integration-checkpoint.md`.
2. Consume the independent integrated review at `project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/stage3-integrated-review.md` if it has landed. Resolve every FIX FIRST finding before claiming Stage 3 exit.
3. Prove the remaining Stage 3 runtime items in a fresh task-owned preview: real cutter framing/occlusion/clearance, explicit shaft-study controls, and matched mechanical parity. Do not infer these from CPU samplers or static DOM checks.
4. Only after Stage 3 exit, enter Stage 4 opening/pit recovery. Stage 4 requires camera/remap A/B, pressure/shatter/emergence/pit/electricity telemetry and unaltered PNGs, then separate Astra and owner review.

## Exact current state

- Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`.
- Branch: `torque-wrench/rebuild`; starting HEAD for this work: `dc44fb79ed43d6a62db47ae58900afb718ad15d1`.
- Stage 0 and static Stage 1 are closed. Stage 2 is closed in `stage2-gates.md` and `stage2-closure.md`.
- Stage 3 is integrated but its leaf exit is not closed. See `stage3-integration-checkpoint.md`.
- G0–G9 remain open; partial gate evidence is in the task-local `GATES.md`.
- No publication, cutover, archive, protected-sibling access, or push authorization is implied. The owner authorized the local commit requested on 2026-10-13.

## Verified checkpoint

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

## Ownership and integration boundaries

- External D-core/D-bake 19-path patch is released and independently reviewed PASS in `parallel-drawing-second-review.md`.
- M1 mechanics, ring core/factory, shaft runtime/tools, private sheet, opening/mechanism/inspection directors, and private world host are integrated.
- The final Canvas fix is important: R3F `Canvas fallback` is DOM canvas content and must not be used as a WebGL failure callback. The current capability check happens before Canvas mount.
- Automatic tier/failure downgrade stops playback but preserves an already-open disclosure. User Escape/close restores trigger focus.
- All heavy jobs must remain serialized and task-owned. Restart preview after every rebuild.
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
Continue JG-038 in C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench on branch torque-wrench/rebuild. Read docs/torque-wrench-rebuild/HANDOFF-2026-10-13-stage3.md first, then project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/stage3-integration-checkpoint.md and the task-local GATES.md. Stage 0-2 are closed and Stage 3 is integrated but not exited. First consume stage3-integrated-review.md if present and resolve every FIX FIRST finding. Then prove real cutter framing/occlusion/clearance, explicit shaft-study controls, and matched mechanical parity in a fresh task-owned production preview; only after those pass, record Stage 3 exit and begin Stage 4 opening/pit recovery. Preserve the protected sibling jgun-portfolio, serialize heavy jobs, restart preview after every rebuild, never commit .scratch or unrelated REA files, and do not push/publish/cutover. Use the exact skills and boundaries in the handoff.
```
