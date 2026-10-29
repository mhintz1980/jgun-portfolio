# JG-038-C1-STAGE1 execution ledger

Date: 2026-10-25. Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`.
Branch: `torque-wrench/rebuild`; starting HEAD: `57e903d6f9f4578916b1271cfb818cc19aef0a9e`.
Authority: Mark explicitly requested reading plan 47 and beginning implementation. This supersedes its historical plan-only header. No commit, push, deployment, or owner visual acceptance is implied.

## Ownership and interface 47-v1

| Lane | Configured seat | Ownership | Status |
|---|---|---|---|
| A, tasks 1/3 | tier-worker, GPT-6.1-Sol/high | story.ts, schedule.ts/tests, progression.ts/tests, kinematics.test.ts | Running |
| B, tasks 2/5 | tier-worker, GPT-6.1-Sol/high | camera.ts/tests, InspectionDirector.ts/tests, beats.ts | Running |
| Integration, task 4 | Parent | shaftRuntime.ts/tests, inspectionProof.ts, registry test, docs/evidence | Runtime tests and typecheck passed; live proof pending |
| Narrative, task 6 | tier-worker, GPT-6.1-Sol/high | script.ts/tests, ShaftStoryLayer.tsx, StaticShaftStory.tsx, Story.tsx, staticChapter.test.tsx | 35 focused tests passed; six new stills pending |
| Verifier, task 7 | Lane A after handover, GPT-6.1-Sol/high | verify-stage1-cascade.mjs and six generated stills | Running |
| Bounded API gathering | tier-reader, GPT-6-Luna/high | Read-only | Complete |
| Final critical review | tier-reviewer, GPT-6-Astra/medium | Read-only integrated implementation and evidence | Pending |

These are configured role pins, not independently proven backend identity. Adversarial review is reserved for critical integration/acceptance.

The cascade tuple has eight downstream units, excluding the input sun: `[stage1, stage2, stage5, bearing, stage3, stage4, output, outerHousing]`. Units own isolated material clones, rest transforms and a stable tuple index. The schedule preallocates tuple arrays; runtime telemetry mutates stable arrays. All per-frame samplers remain allocation-free. Housing alpha means actual reveal opacity, including its 0.28 plateau and opaque endpoint.

## Preservation baseline

Preexisting dirty tracked files: fosPresentation.test.ts, progression.ts/tests, rig/materials.ts/tests, OpeningDirector.ts/tests, RuntimeWorld.tsx. Preexisting untracked: docs 46/47, verify-torque-owner-three-fixes.mjs, openingExtraction.ts/tests. Keep these changes; progression additions build on the existing shader correction. `.scratch/` stays uncommitted.

Protected asset SHA-256 before implementation:

| Asset | SHA-256 |
|---|---|
| Default.glb | 8b07246cf857aca29d1832815d8d183e0a1fd8ef06da5a7a089019706a57a257 |
| m249-transformed.glb | 1c251f45b05b736a08858e47c53c8fa779870b636bb1a174d1422d8003305423 |
| msp-enclosure.glb | c1c919ab8f747e9e2bd9eeb51b5ac31ee66dc39145cac44ad7c8fddfa056428e |

## Interpretation and gates

- Use plan 47's explicit quintic slide law. Its Gate 3 offset range at 35.4s conflicts with that law (quintic gives approximately 27.55 mm); verify actual motion during the fade against the law instead of distorting the animation to match a conflicting bound.
- Page progress, private inspection progress and modal seconds are distinct. The verifier must seek the live page using its actual mapping, and separately inspect exact modal-time states where needed.
- Preserve pre-35s camera anchors, owner corrections and private context/phase handoff controls.
- Numeric conjugacy proves pitch-circle rolling, not triangle-level involute collision freedom. Keep visual and owner acceptance separate.
- Check typecheck, focused tests, production build, fresh preview telemetry, protected hashes and final critical review. Record actual results below; preparation is not acceptance.

## Results

- Initial parent integration: typecheck passed; shaftRuntime.test.ts passed 23/23, including AST allocation, stable telemetry arrays, transform conjugacy, material isolation, disposal and private context retirement.
- Lane A: schedule/progression/kinematics focused checks passed 68/68. The 80 µm settle uses squared sine to keep velocity continuous at seating, rather than the draft's velocity-discontinuous sine.
- Lane B: literal post-35 optical values failed four CPU framing checks; lens/distance/targets are being tuned under Task 5's explicit safe-frame requirement. All pre-35 anchors remain protected.
- Narrative: script/component focused checks passed 35/35; registry assertion updated for the new chapter ID.
- A stationary 18% housing witness supplies the fixed ring-gear context during ignition, independently of the later shell slide.
- Actual-vertex projection is now exposed on demand through `__torqueWorld.inspection().cascadeRects`, supplementing CPU framing proxies. This does not run in the render loop.
- Existing `ROTATION_TURNS` and main-world explosion ladders are unchanged. Both repository READMEs and the measured animation spec now distinguish the private finale from the main-world display-turn sweep. External rig-skill files were read as references, not rewritten as part of this checkout.

### Integrated evidence

- `npm run typecheck`: PASS.
- `npx vitest run src/scene/inspection/ src/scene/torque-wrench/ src/components/ --maxWorkers=2`: 65 files, 582 tests PASS.
- `npm run build`: PASS, including the six generated fallback stills. Preview restarted after the build at `http://localhost:5281/torque-wrench/`.
- `node scripts/verify-stage1-cascade.mjs --url=http://localhost:5281/torque-wrench/ --out=output/playwright/stage1-cascade`: PASS, both 1440×900 and 390×844, 72 observed samples per viewport, all ten gates plus seven additional checks per viewport.
- [Machine report](../../output/playwright/stage1-cascade/report.json), fourteen checkpoint PNGs in the same folder, six generated WebPs in `public/inspection/shaft/`.
- Observed GPU backend: ANGLE / AMD Radeon 780M Graphics / Direct3D11. No console errors, page errors or WebGL context losses. All three protected hashes match the recorded baseline.
- Maximum observed seek-time error: desktop 0.003695 s, narrow 0.003931 s. Largest absolute CAD vertex NDC at the three measured checkpoints: desktop 0.612257, narrow 0.650779, both below 0.84.
- Camera tuning preserves all sixteen anchors through 35 s, authored post-35 azimuth/elevation and FOV values. Greater desktop/narrow distances and recentered targets keep the moving shaft, supports, witness and arriving units visible; exact deviations are documented beside the anchor table. CPU moving-envelope checks cover 35.8–43 s. The first 0.8 s transition retains some entry cropping from the protected card view.
- First independent critical review: FIX; see [review record](49-stage1-critical-review.md). The first mechanical report is historical, not final visual acceptance.

### Critical review corrections

- Restored a rear-oblique pitch-point macro: 43.5°→61.5° azimuth, 40°→55° elevation, target `[4.108, 6.2, 3.333]` shaft-local mm; stand-off 0.220 m desktop / 0.320 m narrow. Added a wide 41 s crane anchor. Pre-35 s anchors remain byte-identical; R9 remains settled at 42.6–43 s.
- Macro acceptance now measures the contact band, rather than requiring the long shaft and entire housing to fit. Full cascade containment remains required at 41 and 42.5 s. This resolves the plan's conflicting whole-assembly/macro demands explicitly.
- Added actual front-facing finished-sun flank projection, 64 first-hit visibility rays against opaque installed CAD, and rendered glint A/B pixel counts. These are diagnostic calls, not render-loop work.
- New caption CSS accounts for the body portal, keeps the full paragraph available to screen readers while visually replacing it during the cascade, and places the narrow caption above the subject. Visible chapter summary shortened; disclosure/transcript retain the detailed story.
- Clean fallback captures hide page UI and crop the contact/cascade region at 8:5 desktop and 1:1 narrow; debug PNGs remain full-view evidence only.
- Corrected-run source checks: 580/581 tests passed in the broad run, with one 15 s cold scene-import timeout. Focused `cadGate.test.ts --maxWorkers=1 --testTimeout=30000` rerun passed 2/2 (the import completed in 4.94 s). Build/typecheck passed. No source change was made to accommodate the timeout.
- Intermediate live report `output/playwright/stage1-cascade-r2/report.json` confirmed mechanical gates, contact size, ray visibility and visible glint pixels (441–500 desktop, 54–58 narrow). It correctly failed DOM overlap checks and a glint helper/schema mismatch. Those integration issues were corrected; final report/review pending.

### Final corrected runtime proof

[`output/playwright/stage1-cascade-r3/report.json`](../../output/playwright/stage1-cascade-r3/report.json) passed on both viewports: 72 observed samples, all ten mechanical gates and all fourteen additional checks per viewport. Completed 2026-10-25 at 10:05:01 UTC. No runtime errors or context losses; protected asset hashes remain intact.

The contact macro measures approximately 335 pixels on desktop and 117 pixels on narrow at 39.4 s. Real flank visibility rays, rendered glint pixel A/B, eight-pixel DOM clearance, full cascade framing, reversible seeks and live clocks all pass. Six clean UI-free, cropped stills were regenerated only after those gates passed. The original and intermediate reports remain historical evidence.

Final asset-inclusive `npm run build`: PASS. All six clean WebPs match between public and dist byte-for-byte. Preview restarted after this build at `http://localhost:5281/torque-wrench/`; `git diff --check` passed with line-ending warnings only.

Independent Astra/medium round-two verdict: **PASS — ready for owner visual review**; all three prior critical findings resolved. Full record: [review 49](49-stage1-critical-review.md). Implementation and local verification are complete; owner visual acceptance and broader JG-038 gates remain open. No commit, push or deployment performed.
