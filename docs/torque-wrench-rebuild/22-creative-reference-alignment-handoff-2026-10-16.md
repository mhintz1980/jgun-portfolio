# 22 — Creative reference-alignment handoff — 2026-10-16

## Owner's changed operating mode

Mark explicitly moved JG-038 from verification-heavy correction to **visible creative iteration**. The next session optimizes for seeing and reacting to the page. Do not launch the full suite, ten-case Stage5 matrix, G8/AC roster, broad graph/proof generation, or another review wave during draft styling.

Use a short draft loop:

1. Make a coherent visual candidate.
2. Run only checks that protect that edit, usually TypeScript plus focused tests, then a production build when a new preview is needed.
3. Restart the task preview after every rebuild and bind it to the served build.
4. Let Mark view and react to the actual page.
5. Repeat on the specific visual or objective he names.

Run the full verification/review/performance package only after Mark says the visual direction is settled. Exception: fix immediately anything that prevents a feature from appearing or functioning, such as failure to mount, broken scrolling, a missing subject, or a perceptible hard stall in the sequence under review.

## Read first

1. This handoff.
2. `docs/torque-wrench-rebuild/00-owner-rulings.md` — latest 2026-10-16 camera-continuity and breakthrough-priority rulings.
3. `docs/torque-wrench-rebuild/21-owner-reference-image-index-2026-10-16.md` — canonical reference and image index.
4. `docs/torque-wrench-rebuild/20-owner-parity-gap-2026-10-16.md` — context only; do not implement parity items in this first creative pass.
5. `project/work/evidence/torque-wrench-rebuild/09-stage5-rendering-20261015/owner-review-20261015-V1.md` — original owner objections.
6. `project/work/evidence/torque-wrench-rebuild/09-stage5-rendering-20261015/ac-final-checkpoint-20261016.md` — parked G8/AC failures; do not spend the next session there.

Repository start still requires `AGENTS.md`, `TODO.md`, and `project/README.md`. For this sequence, this handoff supersedes the stale JG-038 status sentence in `TODO.md`; reconcile TODO during a later closeout after creative direction settles.

## Exact creative scope: drawing-breakthrough sequence

### A. Drawing sheet first

Owner screenshots:

- `C:/Users/Markimus/Pictures/Screenshots/drawing-feeback.png`
- `C:/Users/Markimus/Pictures/Screenshots/drawing feedback_crosshatch-misplaced_detail-circles-lineweight_detail-letter-location.png`

Targets:

- Correct misplaced crosshatching.
- Clarify detail circles and their connections.
- Tighten line weights and hierarchy.
- Put detail letters where the reference expects them.
- Preserve the owner-approved drafting content and exact red `RUN FEA.` treatment already implemented.

Likely owners: `src/scene/torque-wrench/privateSheetContent.ts`, `src/scene/drawing/sheet/composeSheet.ts`, `src/scene/drawing/sheet/sheetBake.ts`, and their focused tests. Inspect current source directly before editing.

### B. Lightning profile and crack network

Canonical references:

- `C:/Projects/Misc/cracks.png`
- `C:/Projects/Misc/portal.png`
- `C:/Projects/Misc/lightning outline.mp4` — motion reference; study timing and branching before retiming.
- `C:/Users/Markimus/Pictures/Screenshots/intro-feedbaxk-1-2.png`
- `C:/Users/Markimus/Pictures/Screenshots/intro-feedbaxk-3.png`

Targets:

- Irregular, branching, owner-reference-like profile trace rather than a generic glow outline.
- Cracks that fill the enclosed profile and grow from the trace in readable stages.
- Motion matching the supplied video: trace, branch, fill, and hold without a mechanical sweep.
- Keep deterministic scroll and reverse behavior; no accumulated per-frame randomness.

Likely owners: `src/scene/torque-wrench/OpeningDirector.ts`, `ElectricalDirector.ts`, `src/scene/drawing/sheet/portalGeometry.ts`, and `privateSheetRuntime.ts`. Treat the current 2x scroll distance as a starting point, not final acceptance.

### C. Shattered-glass and breakthrough bullet time

References:

- `C:/Users/Markimus/Pictures/Screenshots/drawing feedback_dark-glass -shatter.png`
- `C:/Projects/Misc/portal.png`

Targets:

- Dark glass-like shard material and thickness, not paper confetti.
- A continuous cause and effect: lightning lines form, cracks branch, the sheet ruptures, and shards separate or fall.
- Add the owner-named second Bullet Time beat at drawing breakthrough: the subject and shards extremely slowed while the camera stays on path at normal speed.
- No camera cut to an unrelated position. Continue from the drawing composition into the pit reveal.

Likely owners: `portalGeometry.ts`, `privateSheetRuntime.ts`, `OpeningDirector.ts`, and the camera handoff path in `RuntimeWorld.tsx` and `CameraHandoff.ts`.

### D. Cavernous pit

Canonical target:

- `project/work/evidence/JG-035-opening-drafting-table/blue-trace-tunnel-2026-10-03/concept-media/03-deep-tunnel-feedback.png`

Supporting references:

- `03-deep-tunnel.png`
- `02-first-rupture-v2.png` and its owner-marked feedback image
- `feedback-rerender/03-vertical-shaft.png`

Targets:

- Cavernous, irregular cliff-face volume rather than an extruded profile.
- Visible near walls, deep occlusion, and believable scale under the torn opening.
- Integrate with shatter and breakthrough lighting; the pit must not read as a separate decal.

Likely owners: `src/scene/torque-wrench/PitGeometry.ts`, `PitDirector.ts`, `RuntimeWorld.tsx`, and lighting in `privateSheetRuntime.ts`. Immutable CAD remains immutable; derived procedural geometry only.

## Skill activation map

Read each skill only when its domain is touched:

| When | Skill and exact path | Why |
|---|---|---|
| Before changing crack, lightning, or shatter shaders and geometry | `C:/Users/Markimus/.codex/skills/glsl-transition-shader-pipeline/SKILL.md` | Shader ownership, uniforms, deterministic effects, fallback safety |
| Before changing pit, mount, subject visibility, or rig relationships | `C:/Users/Markimus/.codex/skills/cad-scene-graph-rigging/SKILL.md` | Part-number identity, union bounds, derived geometry boundaries |
| Before changing breakthrough pacing or camera path | `C:/Users/Markimus/.codex/skills/gsap-scrolltrigger/SKILL.md` and `C:/Users/Markimus/.codex/skills/r3f-scroll-performance-guard/SKILL.md` | Scroll ownership, canonical beat timing, no React frame churn |
| For motion craft and staging | `C:/Users/Markimus/.agents/skills/animate/SKILL.md` | Purpose, curves, dwell, anticipation, perceptual timing |
| Before critiquing a completed draft | `C:/Users/Markimus/.agents/skills/review-animations/SKILL.md` | Critique without redesigning unrelated work |
| Before art-directing the whole scroll world | `C:/Users/Markimus/.codex/skills/animated-3d-video-sites/SKILL.md`; use `C:/Projects/skills-master/local/build-threejs-scroll-worlds/SKILL.md` only if its scroll-world lens is needed | Cinematic composition and pacing; owner references still lead |
| For a small proof that a feature appears or functions | `C:/Users/Markimus/.codex/skills/webgl-telemetry-verifier/SKILL.md` | Telemetry and unaltered captures; never vision-only WebGL claims |
| For programmatic owner-view captures | `C:/Users/Markimus/.codex/skills/playwright/SKILL.md` | Use only when needed; Mark should still inspect the live page himself |
| When structural impact is unclear | `C:/Users/Markimus/.codex/skills/codebase-memory/SKILL.md` | Query project `jgun-torque-wrench-rebuild`, check exact-file coverage, then read missed source directly |
| Only at visual freeze or delivery readiness | `C:/Users/Markimus/.codex/skills/asset-and-bundle-hygiene/SKILL.md` | Production build and asset checks; not during every creative draft |

Do not use Higgsfield generation in this pass unless Mark asks for a new concept variant. The supplied references are the authority.

## Current technical checkpoint

- Branch: `torque-wrench/rebuild`.
- Product candidate: **f**.
- Build: `.scratch/jg038-two-findings-20261015-f`; scratch is never committed.
- Last preview: `http://localhost:5288/torque-wrench/`, historically PID `47448`; inspect the live command before reuse or stopping.
- Candidate f full suite: 86 files, 985 tests passed, 4 skipped.
- Candidate f functional matrix: 136/136 PASS.
- Both scoped two-finding reviews: independent GLM and separate Astra SHIP.
- AC/G8 is intentionally parked: phase roster MEASURED_WITH_FAILURES and startup FAIL. See `ac-final-checkpoint-20261016.md`. Candidate f is not performance-accepted; resume that work only if a visual feature is blocked.
- Historical owner decisions remain: close camera position and footer entrance speed approved; five direction decisions previously denied. Fresh explicit owner direction in this creative loop can supersede those denials.
- No push, deployment, cutover, archival, or inferred owner acceptance.

## Ready-to-paste continuation prompt

Continue JG-038 in `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench` on `torque-wrench/rebuild`. Read `docs/torque-wrench-rebuild/22-creative-reference-alignment-handoff-2026-10-16.md` first and follow its owner-directed creative mode: draft, build and restart when needed, let Mark view the live page, then iterate on his named fixes. Start only with the drawing-breakthrough sequence: drawing-sheet crosshatch, detail circles, line weights, and detail letters; lightning profile and branching cracks; dark shattered-glass bullet-time breakthrough; and cavernous pit. Align to the exact references in the handoff and doc 21. Do not run full suites, matrices, AC, or reviews during styling; use focused checks required by each edit and fix only blockers that prevent features from appearing or functioning. Read the listed domain skill when its file is touched. Preserve `.scratch/`, unrelated dirty files, immutable CAD, and protected siblings. No push, deployment, cutover, archival, or inferred owner acceptance.
