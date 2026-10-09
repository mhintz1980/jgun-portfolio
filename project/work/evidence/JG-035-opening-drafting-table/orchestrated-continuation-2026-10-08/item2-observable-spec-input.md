# JG-035 item2 — current observables vs missing (spec input, 2026-10-08)

Read-only inventory from handoff item2 (handwriting-reference-2026-10-08/handoff.md) + docs/jgun-owner-animation-revision-plan-2026-10-07.md. No source edits, no runs. Graph use: one search_code result identified DrawingLinework/DrawingProofRenderer; the follow-up check_index_coverage failed (MCP transport closed), so every relied-on declaration below was read directly from source — treat locations as verified by direct read, not graph coverage.

## Runtime proof APIs (exact)

| Surface | API / fields | Source |
|---|---|---|
| Drawing proof | `window.__drawingProof`: `ready`, `captureNextFrame()` (resolves {cameraGoal, cameraUp, drawing, rig, actualCamera}), `setTier('lite'|'poster')`, `setMode(mode)`, `setProgress(p)` (pins scroll), `scrollToProgress(p) -> {raw, expected}`, `captureRegistration()` (projectedFeatures[].errorPixels), `captureContact(t)`, `captureBreakthrough()` (crossingVertices, outsideOpening, openingClear, minZ/maxZ, fragments[]) | src/scene/drawing/DrawingLinework.tsx:477-663 |
| Electrical score | `sampleElectrical(t, out, anticipationStart=0.66)`, `newElectricalSample()`, `electricalElapsed(t)=100*(t*0.5-0.3825)`, `electricalTimeAt(s)`, `BRANCH_START_T/BRANCH_END_T/ELECTRICAL_END_T`, `BURST_KEYS`, `branchWindow(t)` | src/scene/drawing/electricalScore.ts:22-103 |
| Intro telemetry | `drawing.pulseHead` (outline), `drawing.crackGrowth` (branch), `drawing.sparkAnticipation`, `drawing.crackWeb`, `drawing.phase`, `drawing.poseT` | src/scene/drawing/introTimeline.ts:286-361 |
| Ring proof + store | `window.__inspectionProof.seek(time, entryElapsed=2) / mask(bool) / progress(p|null)` (ringRuntime.ts:207-211); store fields `holePlugBlend, holePatchOpacity, holePatches, holeApertures, holePatchesVisible, toolVisible, aluminiumBlend, ringAngle, odKnurlProgress, maskSamples.{bore,shoulder,odStart,odEnd}` (ringRuntime.ts:181-191; src/state/inspectionStore.ts:28-32) |
| Ring mask fn | `odMask(radius, z, normalZ, od, halfWidth, progress)` | src/scene/inspection/timeline.ts:150 |
| Tunnel geometry | `portalSightlineDepthM(extentM, offNormalDeg)`; `PortalOcclusionGuarantee {offNormalDeg, requiredDepthM, availableDepthM, margin, closureOccluded}` | src/scene/drawing/sheet/portalGeometry.ts:269-289 |
| Shaft probe | `window.__inspection.shaft.cutter.stroke`, `.shaft.stress.mix`; `window.__shaftProgression[kind].uniforms.{uSpaceDepth, uEngagedSpace, uEngagedPreviousDepth, uEdgeY, uProgressionMode, uShaftKind}` | verify-shaft-inspection.mjs:232-254; src/scene/inspection/shaft/progression.ts |

## Observable rows: have vs missing

| Row (handoff item2) | Proven today (field → source/command) | Missing | Cheapest extension |
|---|---|---|---|
| Electrical timing/branches/score at fixed scroll rate | Static oracle + pinned-scroll checkpoints: `sampleElectrical` vs measured `pulseHead/crackGrowth/sparkAnticipation` at pinned `scrollToProgress` samples, epsilon-gated (verify-jgun-opening.mjs:252-274, 417-427); burst/hold keys electricalSamples:123-137 | No constant scroll-RATE sweep: score vs elapsed seconds is never sampled; forward/reverse rate frames absent | Verifier-only: timer stepping `scrollToProgress` at constant raw px/s, sample drawing.* each frame vs `electricalElapsed` mapping; no source change |
| Title frames t .065-.10 | Reveal-score window group 1 = [0.015, 0.095] asserted at checkpoints (verify-jgun-opening.mjs:143, 731-735) | No rendered capture/pixel assert inside .065-.10; capture tool default times omit them | `node scripts/capture-owner-revisions.mjs --only=opening --times=0.065,0.08,0.10` — CLI exists today (capture-owner-revisions.mjs:101-120), zero code |
| Tablet 768x1024 (opening) | Opening verifier roster: desktop/narrow x normal/reduced/lite only, 1600x900 + 390x844 (verify-jgun-opening.mjs:40-48) — no tablet case | Tablet opening case + reduced/poster 768x1024 roster rows (plan P5) | Same capture tool: `--viewports=desktop,tablet` (768x1024 defined :101); verifier roster row is a small cases[] addition |
| Tunnel desk/far closure sightlines | Geometry exists: jagged walls (portalGeometry.ts:66), `portalSightlineDepthM` + `PortalOcclusionGuarantee.closureOccluded` | Zero probes/asserts in verify-jgun-opening.mjs (grep desk/far/sightline: no hits); nothing in __drawingProof api | Verifier-only raycast through live `__threeScene`/`__threeCamera` from aperture pixels (desk/far-wall hit test), or one api capture closure reusing portalSightlineDepthM |
| Ring hole closure/reopen | R1 schedule (close 1.2-2.4, tool 2.8, open 8.2-8.95, black 9.3) sampled at 19 times incl. 2.4/8.6/8.95/9.3 vs `holePlugBlend/holePatchesVisible/holePatchOpacity` (verify-ring-inspection.mjs:33-73); beauty captures at 8/8.575 via capture tool | Verifier lacks midpoint 8.575 sample; no hole state in lifecycle digest (plan P2 unticked) | Add 8.575 to holeOracle times array (one line) |
| Ring sectors/seam coverage | Seam image-ROI band profile, sampled in plugged window 2.4-2.79 s or t=0.6 fallback, `--seam-threshold=` (verify-ring-inspection.mjs:11-13, 77-130); mask overlay capture at t=8 (`--only=ringmask`); only 4 fixed odMask samples (bore/shoulder/odStart/odEnd) | No per-sector circumference coverage at t=8 during forming; seam ROI never evaluated at 8 | Extend probe.maskSamples with azimuth sweep at od radius (1-2 source lines, ringRuntime.ts:188) + verifier band profile at t=8 with tool-occlusion exclusion |
| Cutter engagement/occlusion/equal depth | `cutterComposition(page,t) -> {cutterNdcX, axisNdcX, cutterNdcY, depthDiffMm, shaperVisible, stroke, aspect}`, asserts dx>0.1 & depthDiffMm<=1.55 at 3/4/6/8.4/10.5 s (verify-shaft-inspection.mjs:506-517, 599-608); S2 depth/engagement guards :552-582 | Engagement-ROI/occlusion rendered crops (plan P3 unticked: center equality alone insufficient); hob-band ROI at 23.4-32 s | Crop existing same-session screenshot tuples using cutterComposition NDC rect — verifier-only |
| Shaft artifacts 1.3/10.9/25.4 ±.05 s | Exact-time captures already default: `--only=shaft` times include 1.3, 10.9, 25.4, settled to 1e-6 via `#inspection-seek` step=any (capture-owner-revisions.mjs:86-97) | ±.05 neighbor captures; verifier visible-state asserts at exact ±.05 with reverse/seek equality (plan P4 unticked); verify-shaft shotTimes (:688) lack these times | `node scripts/capture-owner-revisions.mjs --only=shaft --times=1.25,1.3,1.35,10.85,10.9,10.95,25.35,25.4,25.45` — CLI exists today; verifier assertion set is new |

## Existing runnable commands proving current rows

```powershell
node scripts/verify-jgun-opening.mjs --url=http://localhost:5199 --quick          # pinned electrical oracle + reveal windows
node scripts/verify-ring-inspection.mjs --url=http://localhost:5199 --out=<dir> --focused   # R1 schedule + seam ROI (2.4-2.79 s)
node scripts/verify-shaft-inspection.mjs --url=http://localhost:5199 --out=<dir>  # S1 composition + engagement guards
node scripts/capture-owner-revisions.mjs --url=http://localhost:5199 --out=<dir> [--only=...] [--times=...] [--viewports=...] [--nogate]
```

Shaft/ring verifiers accept --url/--out only (ring adds --seam-threshold/--focused); opening adds --quick/--case/--label. Dev URL must be localhost:5199.
