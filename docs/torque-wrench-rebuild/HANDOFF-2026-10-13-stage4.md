# JG-038 Stage 4 handoff — 2026-10-13

## Immediate next action

1. Read this handoff, then `project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/README.md`, the task ledger `project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/GATES.md`, and `docs/torque-wrench-rebuild/09-design.md` (recovery baseline).
2. Re-check live branch/HEAD, dirty state and writer ownership before editing. Stage 3's leaf exit is recorded, but its uncommitted source and evidence still sit in the working tree.
3. Continue Stage 4 in order: finish cause attribution (camera/remap is measured; pit geometry is not isolated), then the pit/occlusion work, then the unified electricity, then the lit-metal/desk-exposure/continuity verification, and only then Astra and owner review.
4. Collect Stage 4 exit evidence the same way Stage 3 did: one task-owned production build, one task-owned preview restarted after every rebuild, serialized heavy jobs, telemetry plus unaltered PNGs, and an explicit provenance binding.

## Exact current state

- Workspace `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`; branch `torque-wrench/rebuild`; HEAD `4e620d48` plus a large uncommitted working tree (see below).
- Stage 0, static Stage 1 and Stage 2 are closed. **Stage 3 leaf exit recorded 2026-10-13** in `07-autonomous-2026-10-12/stage3-exit-2026-10-13.md` on build `.scratch/jg038-stage3-20261013-h`.
- Stage 4 opened 2026-10-13; step 1 (the controlled camera/remap A/B) is measured and the live opening telemetry capture passes at both viewports. Stage 4 is **not** exited.
- G0–G9 remain open. G3's ledger line now records the Stage 3 runtime results but is still partial (narrow/lite parity, continuous clearance, final motion acceptance).

## Verified in this session

Stage 3, build `.scratch/jg038-stage3-20261013-h` (aggregate `88e8038e…`), one task-owned preview, hardware-reported ANGLE/AMD Radeon 780M:

- TypeScript exit 0; import-boundary PASS with exactly one lazy `cadGate.ts -> ./Scene` edge.
- Full CPU suite: 75 files, 950 tests pass, 4 pre-existing skips.
- Cutter/controls roster: 4/4 cases, 258/258 assertions each (desktop/narrow x full/lite); served assets hash-matched to the build.
- Matched mechanical parity: 3493 PASS / 0 FAIL / 0 UNVERIFIED (desktop/full).
- Static/fallback 14/14 (396/396); timeline 17/17 (382/382).

Stage 4, build `.scratch/jg038-stage4-20261013-j` (aggregate `1aca78b8…`):

- Camera-law A/B measured: up to 0.490962 m position, 0.217352 m target, 2.0560 °FOV between the current and recovered (`8988c2da^`) opening camera law under matched layout/aspect/intro times.
- Live opening telemetry + unaltered PNGs: desktop 11/11 and narrow 11/11 assertions; solved crossing 0.73; paper opaque mid-bulge; opening completes at the emergence handoff.

## Uncommitted working-tree changes owned by this work

Product source: `RuntimeWorld.tsx`, `InspectionDirector.ts` (+test), `OpeningDirector.ts` (+test), `Story.tsx`, `torque-wrench.css`, `inspectionProof.ts` (new), `inspectionFailure.ts` (new, +2 test files), `inspection/ringRuntimeCore.ts` (+test), `inspection/shaft/shaftRuntime.ts` (+test), `TorqueWrenchHero.tsx` (opt-in `?mechanicalProof=1` comparator port only).

Verifiers: `scripts/verify-torque-cutter.mjs`, `scripts/verify-torque-mechanical-parity.mjs`, `scripts/verify-torque-opening-ab.mjs` (all new).

Docs/evidence: this handoff, `13-implementation-plan.md`, `TODO.md`, and the `07-autonomous-2026-10-12` and `08-stage4-opening-recovery` evidence folders.

## Boundaries

- Never access `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio`.
- Never commit `.scratch/`, the unrelated REA documents (`docs/HANDOFF-rea-*`, `docs/rea-integration-implementation-plan-2026-10-13.md`), or the root `GATES.md` line-ending drift.
- Restart the preview after every rebuild; serialize heavy jobs; keep browser work task-owned.
- No push, publication, cutover, archive, or owner/Astra acceptance is implied by anything here.

## Suggested skills

| When | Skill |
| --- | --- |
| Before opening/pit or camera work | `C:/Projects/skills-master/local/build-threejs-scroll-worlds/SKILL.md` |
| Before any camera/opening motion authoring | `C:/Projects/skills-master/local/cinematic-gsap-lenis-motion-system/SKILL.md` and `C:/Projects/skills-master/local/animate/SKILL.md` |
| Before shader/sheet/lightning changes | `C:/Projects/skills-master/local/glsl-transition-shader-pipeline/SKILL.md` |
| Before camera/clearance/telemetry claims or PNG collection | `C:/Projects/skills-master/local/webgl-telemetry-verifier/SKILL.md` |
| Before browser verifier edits | `C:/Projects/skills-master/local/playwright/SKILL.md` |
| Before delegated waves | `C:/Users/Markimus/.codex/skills/parallel-workstreams/SKILL.md`, `C:/Users/Markimus/.codex/skills/codex-tiers/SKILL.md` |

Also read `docs/torque-wrench-rebuild/smooth-scrolling.md` before every scrolling or cinematic edit.

## Ready-to-paste next-session prompt

```text
Continue JG-038 in C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench on branch torque-wrench/rebuild. Read docs/torque-wrench-rebuild/HANDOFF-2026-10-13-stage4.md first, then project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/README.md and the task-local GATES.md in 07-autonomous-2026-10-12. Stage 0-2 are closed and the Stage 3 leaf exit is recorded. Stage 4 is in progress: the controlled camera/remap A/B is measured and live opening telemetry with unaltered PNGs passes at both viewports on build .scratch/jg038-stage4-20261013-j. Continue Stage 4 by isolating the pit-geometry contribution from the measured camera/remap contribution, then the pit relief/occlusion work, then unified electricity, then lit-metal/aperture-occlusion/desk-exposure/continuity verification, then prepare the Astra effects review and owner unaltered-PNG review. Rebuild into a fresh task-owned .scratch output, restart the preview after every rebuild, serialize heavy jobs, keep everything telemetry-verified with provenance, and preserve the protected sibling jgun-portfolio. Never commit .scratch, the unrelated REA documents, or the root GATES.md drift. Do not push, publish, cutover, or claim owner/Astra acceptance.
```
