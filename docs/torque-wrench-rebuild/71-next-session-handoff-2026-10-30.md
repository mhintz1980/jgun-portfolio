# JGUN cascade camera and feature proof — next-session handoff, 2026-10-30

## Start here

Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`
Branch: `torque-wrench/rebuild`
Implementation commit: `404a03920ca606024b7b7e6d380833b8220f4b6f` (2026-10-30 13:32:22 -0400), pushed to `origin/torque-wrench/rebuild`.
Working tree was clean and tracking origin when this handoff was written. `dist/` and `output/` are ignored.
This handoff file is committed on top of `404a0392`; use `git log -1 -- docs/torque-wrench-rebuild/71-next-session-handoff-2026-10-30.md` for its own commit hash.

### Current approval and delivery status — 2026-10-30

Mark approved all current changes and explicitly requested a commit and push:
"It's all approved." The eight-item review and required control refinement are
complete. Do not repeat that approval review. This supersedes the historical
approval instructions and continuation prompt below. Technical failures and
unrun verification remain open; owner approval does not turn them into passes.
Deployment is not authorized. The current checkpoint and remaining work are
recorded in [execution note 72](72-owner-review-and-control-refinement-2026-10-30.md).

### Historical owner review — completed

Before any new implementation, test campaign, or further change, walk Mark through **what changed in this session, one item at a time, in plain language**. For each item explain:

1. What it does now, and what it did before.
2. Why it changed (owner direction or proof requirement).
3. Where it lives (file path).
4. What evidence supports it, and what remains unproven.
5. Ask explicitly: **approve as-is, or change it?**

Do not bundle the items into one question. Mark asked for each item to be explained and approved. Record his decision for every row below in this handoff or a new review note. Do not infer approval from silence.

| # | Review item | Plain-language explanation | Evidence | Decision |
|---|---|---|---|---|
| 1 | High-to-low tracking camera | The cascade camera starts at an elevated oblique view at 43.5 s and lowers gradually toward the output while tracking the shaft target; the 76 mm dolly still starts at 52.2 s. This replaces the near-axis, 16-degree-off-shaft view. Azimuth is unchanged after 43.5 s; Mark selected this path from four previews. | `src/scene/inspection/shaft/camera.ts`, `camera.test.ts`; preview clips in the temporary candidate clone | Approved as-is by Mark on 2026-10-30 ("yes" to the item 1 approve/change question). Full verification and final visual acceptance remain open. |
| 2 | Input shaft stays visible | The previous session faded the input shaft out at 52.2–53.1 s. That fade is removed: the shaft remains visible until it naturally leaves the frame. Stage 1 planets still retire at 52.2–53.1 s exactly as before. | `src/scene/inspection/shaft/schedule.ts`, `schedule.test.ts`, `finalCascade.test.ts` | Approved as-is by Mark on 2026-10-30 ("aApproved as is."). Full verification and final visual acceptance remain open. |
| 3 | Option A: retain Stage 1 carrier P001836 | Stage 1 carrier `P001836` stays opaque until 61.5 s and fades out over 61.5–62.25 s. Previously it faded at 55.5–56.4 s. Retaining it keeps the carrier plate in front of the input sun teeth while the shaft body remains visible, and keeps `stage1Sun` below the 0.35 periods/frame rung while on screen. Mark selected this option. | `src/scene/inspection/shaft/schedule.ts`; runtime proof below | Approved as-is by Mark on 2026-10-30 ("Approved as is."). Study-only hob lead-out decision, full verification and final visual acceptance remain open. |
| 4 | Authenticated ten-tooth and sixfold bounds | The proof no longer treats the entire shaft as a tooth or sixfold feature. Draco measurement established the shared ten-tooth functional face at 3.174827–9.524858 mm, a source shaped exit to 9.789711 mm, a study hob lead-out to 13.938684 mm, and the far-end sixfold at 61.109647–71.523950 mm. Source and study meshes differ, so the tooth contract carries per-mesh variant bands plus a shared-face comparison mode. | `src/scene/torque-wrench/cascadeFeatureMask.ts`, `cascadeFeatureMask.test.ts`; evidence 70 | Approved as-is by Mark on 2026-10-30 ("Approved as is."). Full runtime verification remains open. |
| 5 | Region-scoped pixel proof and controls | `captureCascadeProof` turns only authenticated feature fragments black/white for the identity test, and discards only those fragments for the removal test. The rest of the shaft stays in the depth and beauty renders. Live per-mesh transforms are recomputed at capture time, so the study clone and consolidated rig source `P001835` map into the same shaft datum. Added controls: full-band equivalence, null-band zero, shared-functional versus variant-full comparison, and study/source population split. | `src/scene/torque-wrench/cascadeProof.ts`; `runtime-summary.json` | Approved by Mark on 2026-10-30 with the control-baseline refinement required ("i approve, youre still doing the refinement though, right?"). Implement and verify that refinement after the approval review and before the full verification run. |
| 6 | Runtime diagnostic harness | A focused diagnostic samples 32 timestamps on desktop and narrow in forward and reverse, enforces the canonical 2e-6 reachability tolerance, and records camera/subject reverse error, feature pixels, alias step rates and controls. It is a diagnostic, not a full-roster pass. | `scripts/diagnose-high-low-features.mjs`; `runtime-summary.json` | Approved as-is by Mark on 2026-10-30 ("APPROVED"). Full coverage and dense per-frame replay remain open. |
| 7 | Preview helper | A small helper renders camera-path candidates and a native-scroll clip for owner review. It is preview tooling, not production behavior or a verification gate. | `scripts/preview-camera-candidate.mjs` | Approved as-is by Mark on 2026-10-30 ("approveapproved as is"). Preview clips do not establish verification gate results. |
| 8 | Documentation and evidence | The canonical animation spec, TODO banner, README banner and evidence folder now record the high-to-low path, the retained shaft, Option A, the authenticated bounds, and the open gates. Documents 59/60 remain historical and were not rewritten. | `project/context/architecture/animation-spec.md`, `TODO.md`, `project/README.md`, evidence 70 | Approved as-is by Mark on 2026-10-30 ("APPROVED"). Full verification, control-baseline refinement, the 66.9 s source-takeover C1 stop and final visual acceptance remain open. |

### Explanation guidance

Say plainly that the preview helper and diagnostic harness are tools used to decide and prove the animation. They do not ship inside the scene. If Mark wants either removed, that is a simple follow-up commit.

For item 5, explain the two pixel tests: the black/white identity difference answers whether the real feature is visible through original depth and alpha; the beauty removal difference answers what background the feature exposes when removed. The new masks keep the shaft body in both renders, which the old whole-shaft stand-in could not do.

---

## What was implemented

Commit `404a0392` contains 19 files:

- Camera: `src/scene/inspection/shaft/camera.ts` and `camera.test.ts`.
- Schedule: `src/scene/inspection/shaft/schedule.ts`, `schedule.test.ts`, `src/scene/torque-wrench/finalCascade.test.ts`, `src/scene/inspection/shaft/shaftRuntime.test.ts`.
- Feature proof: new `src/scene/torque-wrench/cascadeFeatureMask.ts` and `cascadeFeatureMask.test.ts`; modified `src/scene/torque-wrench/cascadeProof.ts`.
- Tooling: `scripts/diagnose-high-low-features.mjs`, `scripts/preview-camera-candidate.mjs`.
- Documentation: `TODO.md`, `project/README.md`, `project/context/architecture/animation-spec.md`.
- Evidence: `project/work/evidence/torque-wrench-rebuild/70-high-low-feature-proof-2026-10-30/` with `SUMMARY.md`, `GEOMETRY-FINDINGS.md`, `analyze-geometry.mjs`, `geometry-report.json`, and `runtime-summary.json`.

The compact runtime summary omits PNG payloads. The raw 69 MB report with images remains in the temporary candidate clone:
`C:/Users/Markimus/AppData/Local/Temp/jgun-camera-preview-20261029/output/high-low-feature-proof/runtime-option-a-full-points/report.json`

The temporary candidate clone also holds the full-size evidence images and original comparison clips. Treat it as scratch storage; the committed evidence and source are authoritative.

## Verified evidence

- Focused Vitest: 81/81 PASS (`cascadeFeatureMask`, `camera`, `schedule`, `shaftRuntime`, `finalCascade`).
- `npm run typecheck`: PASS.
- `npm run build`: PASS; build asset `dist/assets/Scene-DIluicBv.js`, SHA-256 `9EC1F56E5FD4E04CA52061C55911AB8EFD0F3410766EEEDEF0C12E1BFE99CCED`.
- `git diff --check`: PASS.
- Runtime diagnostic: desktop 1440×900 and narrow 390×844, forward and reverse, zero camera and subject reverse error at every sampled pose, canonical 2e-6 reachability tolerance.
- The served preview reported module hashes matching local build output.

Measured feature behavior:

| Feature | Before Option A | After Option A |
|---|---|---|
| Shared functional ten-tooth face at 56.25 s | 4,974 px desktop / 1,120 px narrow | 0 px / 0 px |
| Functional face at every over-limit sample 56.00–66.90 s | visible in many samples | 0 px on both aspects |
| `inputSixfold` on narrow 44.40–66.90 s | 0 px | 0 px |
| `inputSixfold` on desktop 56.00 s (0.282 periods/frame) | 45 px | 45 px (same) |
| `inputSixfold` on desktop 56.25 s (0.371 periods/frame) | 1 bottom-edge pixel | 1 bottom-edge pixel |
| `inputSixfold` on desktop 56.35–66.90 s | 0 px | 0 px |
| `stage1Sun` over-limit samples 62.80–66.90 s | 0 px | 0 px |
| Whole shaft at 60.00 s | 3,198 px desktop / 1,263 px narrow | 3,198 px desktop / 1,284 px narrow |
| Whole shaft at 62.25 s | 60 px desktop / 481 px narrow | 60 px desktop / 481 px narrow |

The shaft body remains visible after the feature masks: the whole-shaft identity contribution is still 3,198 px at 60.00 s on desktop while the functional tooth face is 0 px.

## Known residuals and honest limits

1. **Study-only hob lead-out.** The study shaft carries a ten-fold hob runout from 9.524858 to 13.938684 mm. Stage 1 carrier `P001836` ends at `y = 9.14 mm`; retaining ring `K000211` starts at `y = 14.60 mm`. The runout sits in a 5.46 mm axial gap between cage and ring. With Option A it contributes 1,610–7 px on desktop from 56.00–59.10 s (`0 px` from 59.60 s) and 462–2 px on narrow from 56.00–60.90 s (`1 px` at 61.90 s, `0 px` at 62.25 s). This is recorded, not hidden. Do not claim the variant-full study band is zero unless measured as zero.
2. **One bottom-edge sixfold pixel.** At 56.25 s on desktop the sixfold feature grazes the bottom scanline with exactly 1 px. It is gone by 56.35 s and on every later sample.
3. **Control baseline compiler artifact.** The full-band equivalence control compares a patched pass against an unpatched beauty baseline. On desktop at 44.40 s it reports 74,671 versus 74,672 identity pixels (one pixel), and at 40.20 s the null-band beauty comparison reports 6 differing pixels while identity is exactly 0. This is consistent with ANGLE/D3D11 changing derivative or early-Z behavior when a discard branch is compiled in. It is not feature leakage. The next session should compare null/full controls against the same patched program with an empty band, so the control isolates the mask rather than shader compilation.
4. **`inputSunTeeth` source band.** The source shaped exit is 9.524858–9.789711 mm; the study lead-out is 9.524858–13.938684 mm. A single common band to 13.938684 mm would falsely label source journal body as teeth. Keep the variant bands.
5. **`stage1Sun` at 62.80 s** is 0.373 periods/frame, above the 0.35 design rung. Option A retires the carrier before this, so it contributes 0 px. Do not extend the carrier fade past 62.25 s without re-running the proof.

## 2026-10-30 owner review and refinement update

All eight review items above are approved; Mark accepted option 1 for the study-only
hob lead-out. The required control refinement is implemented and its targeted runtime
proof passes on desktop and narrow. See
[review/execution note 72](72-owner-review-and-control-refinement-2026-10-30.md) and
[evidence 72](../../project/work/evidence/torque-wrench-rebuild/72-control-baseline-refinement-2026-10-30/SUMMARY.md).

Correction to residual 3's original diagnosis: same-program empty-band baselines
resolved the null comparison, but full-band equivalence still differed by one pixel.
Centroid interpolation of the diagnostic feature datum resolved that discrepancy
while retaining exact RGBA comparisons. A compiler-only explanation was insufficient.
Historical feature pixel counts above predate centroid interpolation and must not be
presented as measurements from the new build. Full verification results remain separate.

## Open gates

- Owner review of all eight items completed on 2026-10-30; decisions are recorded above. Item 5 approval explicitly requires the control-baseline refinement. Full verification and final visual acceptance are not granted by this review.
- Study-only hob lead-out decision completed on 2026-10-30: Mark selected option 1 ("1"), accepting the residual as-is with its measured visibility documented and checked during full verification. Retain the current geometry and approved framing; do not claim the study variant-full tooth band is invisible.
- Full same-build six-case runtime/beauty/HUD roster.
- Dense per-frame replay of every recorded over-limit pose.
- Full opening verifier roster (the camera and shaft schedule changed).
- Inherited 66.9 s source-takeover C1 stop.
- Owner visual acceptance of the final execution.
- Control-baseline refinement: completed with same-program empty-band baselines and centroid interpolation; targeted desktop/narrow controls pass (evidence 72). Full verification remains separate.

## Boundaries for the next session

- Do not change approved timing, rotation/mechanical laws, part identities, materials, lighting, the approved shaper framing, or the suspended ring-switch and stage-2-planet callouts without Mark's direction.
- Do not modify protected GLBs (`Default.glb`, `msp-enclosure.glb`, `m249-transformed.glb`).
- Do not commit `.scratch/` or ignored output.
- Parent owns builds and browser runs. Do not run two heavy captures at once.
- Restart a preview server after every rebuild. Use a task-owned port; do not disturb an unrelated `:4173` server.
- Keep one writer per file. Two routed subagents stalled after a model/context switch in this session; the parent completed the critical work locally. Only delegate if the live roster responds, and verify returned artifacts.
- Full assertion mode is required for completion evidence. `--quick` captures are iteration aids only.

## Exact next action

1. Owner approval and the hob lead-out choice are recorded; resume with Mark's next notes.
2. Remaining technical work uses a fresh build and task-owned preview:
   - `npm run build`
   - restart preview on a task-owned port
   - `node scripts/verify-final-cascade.mjs --url=http://localhost:<port>/torque-wrench/ --headed --dense`
   - `node scripts/verify-torque-camera-hud.mjs` in full assertion mode
   - `node scripts/verify-page-cinematography.mjs` for the current six-case private-route roster, using its documented URL/output options
   - establish compatible opening-specific coverage; the legacy `verify-jgun-opening.mjs` cannot verify the private route
3. Preserve the three recorded camera/HUD failures and check the 66.9 s source takeover. Report actual results; do not infer a technical pass from owner approval.

## Historical continuation prompt — superseded by current approval above

Continue JGUN in `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench` on branch `torque-wrench/rebuild` from pushed commit `404a03920ca606024b7b7e6d380833b8220f4b6f`.

FIRST TASK — BLOCKING: Mark wants to review and approve what changed in the previous session before any new implementation or test campaign. Read this handoff and explain each of the eight review items to him, one at a time, in plain language: what changed, why, where it lives, the evidence, and what remains uncertain. Ask "approve as-is, or change it?" for each item and record his answer. Do not bundle the items into one question, do not infer approval from silence, and do not start new work until he has responded.

Context: the session selected the high-to-low tracking cascade camera, retained the input shaft while it remains on screen, replaced the whole-shaft alias stand-in with authenticated Draco feature bounds and depth-tested masks, and implemented owner-selected Option A (Stage 1 carrier `P001836` retained through 61.5 s, retired by 62.25 s). Focused 81/81 tests, typecheck, build and `git diff --check` pass. The shared functional ten-tooth face is 0 px at every over-limit sample from 56.00–66.90 s on desktop and narrow. The study-only hob lead-out still contributes 1,610–7 px on desktop (56.00–59.10 s) and 462–2 px on narrow (56.00–60.90 s) inside the 9.14–14.60 mm gap between `P001836` and ring `K000211`; this needs Mark's decision.

After approval, run the full same-build six-case roster, dense per-frame replay, full camera/HUD assertions and opening roster, then report actual results. Preserve timing, rotation, identities, materials, lighting, approved shaper framing and suspended callouts. Do not touch protected GLBs or `.scratch`. Full same-build verification, the 66.9 s C1 takeover stop and owner visual acceptance remain open.

