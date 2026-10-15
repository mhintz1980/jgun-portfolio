# Stage 4 — opening/pit recovery evidence

Current integration frontier: read [JG-038-LEAN-V1 checklist](lean-verification-checklist-20261014-V1.md) first. This chat owns integration/runtime after explicit release. Production u2 supersedes t for private cutter framing: D/N full/lite clearance each16/16PASS. Reviewed dev census V4 is10PASS/0FAIL/3UNVERIFIED. Order-balanced observer diagnostic V2 is2/2comparable with explicit non-acceptance limits. Required Astra Stage4 technical/effects review isSHIP in its bounded frozen-s/current-effects scope; full input/whole-path C1 and owner decisions remain open. Lean amendment is recorded in plan13/contract18/task-localGATES. Original s/t reports and failures below remain historical, not relabeled. No Stage4 exit, Stage5 implementation, G0–G9 or owner acceptance is inferred.

Latest t runtime: timeline D9/9+N8/8PASS. Corrected [D/full continuous clearance](continuous-clearance-20261014-t-D-full/report.json)14/16:601forward/601reverse/151hold, zero errors, all liveness/contact/clearance gates clean, but12disc-framing/DOM-overflow rows per traversal at arc transitions and3active paint ambiguities per traversal remain. [Performance pilot](performance-pilot-20261014-t-D-full/) measures60.706s with valid sentinel/hold/served identity; p95=33.4ms,p99=33.5ms,tail=13.5275%,maximum34ms fails desktop budget. AC, memory completeness and overhead UNVERIFIED. Neither report closes acceptance.

Repaired-build continuation2026-10-14: current preview serves `.scratch/jg038-functional-20261014-t`. Renderer construction failure now enters terminal poster fallback; independent two-round source review, helper/page tests and TypeScript/build checks passed. [Full lifecycle t](lifecycle-functional-20261014-t-D.json) records3PASS/0FAIL/1UNVERIFIED: init fallback, same-beat DOM churn proxy and controlled-rate continuity pass; real hidden-tab resume could not be observed. Frozen s records below remain historical after the Scene repair. New source binding is [t build record](source-functional-20261014-t-build.json); corrected clearance/performance verifiers await independent review and fresh t runs. All formal gates and owner acceptance remain open.

Functional continuation2026-10-14: [new wave ledger](wave-ledger-20261014-functional.md) records disjoint lifecycle/performance/continuous-clearance preparation and serialized checks on unchanged build s. Fresh narrow timeline8/8 PASS completes the current D/N timeline17/17. All-viewports/all-tiers mechanical parity returned13275 PASS/16 FAIL/16 UNVERIFIED: desktop full/lite clean; narrow render-buffer mismatches prevent matched comparisons, with no mechanical defect inferred. [Real context loss](context-loss-20261014-s-D.json) passed terminal poster fallback with zero canvases and intact story. [BFCache attempt](bfcache-20261014-s-E.json) remains UNVERIFIED (persisted=false/reload). [Provenance](functional-provenance-20261014.json) verifies347 frozen source inputs,5 protected files,122 frozen review items and32 served manifest assets/HTML. New verifiers are preparation until reviewed and run; all formal gates/visual acceptance remain open.

Documentation closeout2026-10-14: start future sessions from [parallel-functional handoff](../../../../../docs/torque-wrench-rebuild/HANDOFF-2026-10-14-parallel-functional.md). [Audit](documentation-audit-20261014.md) records stale status corrections and previously unreported completed checks. [Documentation provenance](doc-refresh-provenance-20261014.json) isolates the authorized TODO JG038 status edit from the original capture-time preserved hashes. Read-only check: `node project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/verify-doc-refresh-20261014.mjs` from repo root;347 source inputs and5 other protected files remain unchanged. Original frozen manifests are not rewritten.

Opened 2026-10-13 immediately after the Stage 3 leaf exit (`../07-autonomous-2026-10-12/stage3-exit-2026-10-13.md`). Stage 4 is **in progress**. Nothing here closes G4, G5, G6, G9, Astra effects review, or owner acceptance.

## Step 1 — controlled camera/remap A/B (measured)

Harness: `scripts/verify-torque-opening-ab.mjs` (new, task-owned). Two matched-input measurements in one run:

1. **Camera-law A/B (offline, isolated).** The working-tree `src/scene/drawing/sheetCamera.ts` and the recovered pre-close-reading-rework version (`git show 8988c2da^:src/scene/drawing/sheetCamera.ts`) are each bundled with the *current* sibling modules and evaluated over one shared layout, at both viewports' aspects, across twelve intro times. Because only the sheetCamera law differs, this separates the camera/remap change from pit-geometry changes before any cause is attributed.
2. **Live runtime capture.** The real private page is walked across the drafting → pressure → rupture → emergence → close handoff, recording canonical opening telemetry and capturing unaltered PNGs.

### Measured result (build `.scratch/jg038-stage4-20261013-j`)

- Camera-law differences between current and recovered law: max **0.490962 m** position, **0.217352 m** look-target, **2.0560°** FOV. The two laws are not identical, so the close-reading rework did change the authored opening camera and remains a live contributor.
- Current sheetCamera SHA-256 `2ea85552d011926f…`; candidate SHA-256 `cbf7cd4edf97df81…` at revision `8988c2da^`.
- Historical live captures were labeled desktop/narrow and passed 11/11, but both actually used Playwright's default 1280×720 viewport. They cannot establish two-viewport coverage. The offline camera-law measurements remain usable. Corrected observed-viewport captures are recorded below.
- Reports: `ab-20261013-j2/opening-ab-report.json` (desktop), `ab-20261013-j2-narrow/opening-ab-report.json` (narrow).

### Live opening telemetry actually observed (desktop)

| Canonical progress | intro t | pressure | fracture | openingClear |
| --- | --- | --- | --- | --- |
| 0.15 | 0.227 | 0 | 0 | 0 |
| 0.395 | 0.790 | 0 | 0 | 0 |
| 0.408 | 0.817 | 0.546 | 0 | 0 |
| 0.415 | 0.835 | 0.970 | 0 | 0 |
| 0.420 | 0.840 | ~1.0 | 0 | 0 |
| 0.428 | 0.873 | 1 | 0.919 | 0 |
| 0.435 | 0.900 | 1 | 1 | 1 |
| 0.460 | 1 | 1 | 1 | 1 |

The solved bake crossing installed at `0.73`. Paper stays opaque (`openingClear === 0`) part-way through the bulge, the opening completes at the emergence handoff, and pressure is monotone non-decreasing across the walk.

## Defect found and fixed during this step

The new opening telemetry initially reported `bakeInstalled: false` and `crossing: null` at every sample. Cause: the world probe's `snapshot` closure is created in an effect that does not depend on the bake state, so it captured a permanently-null `sheetBake` binding. It now reads the existing `bakedSheet` ref. This was a defect in the telemetry added here, not in the opening behaviour.

## Continuation — isolated geometry and private effects

Pit-only attribution is complete: `pit-ab-20261013-m2-D/pit-ab-report.json` and `pit-ab-20261013-m2-N/pit-ab-report.json` each pass **15/15** at observed 1440×900/DPR1 and 390×844/DPR3. Only historical sine versus triangle wall vertex positions are swapped; camera/remap, contour, topology, depths, shaders and lighting stay fixed. Maximum vertex difference is **6.153404 mm**. Changed pixels at progress .428/.435/.46 are **162/475/1117** desktop and **243/963/3312** narrow, with zero unchanged/restored control noise. See `attribution-20261013.md`. Geometry and camera laws both contribute; this does not identify a dominant aesthetic cause.

Private `PitGeometry`/`PitDirector` preserve the torn lip, 11 rings and 3.2 m depth, with broader deterministic relief, varying ring heights and matched deep closure. Unified private electricity separates accumulating fracture growth from intermittent emission, including pit bursts and dark holds. `OpeningCamera` preserves the drafting/rake law through .435 and blends to the exact overview at .46. Unit/source review does not establish final visual quality.

Build `.scratch/jg038-stage4-20261013-p` is frozen in `source-20261013-p.json`: 347 source/public/script inputs, aggregate SHA-256 `898faa787daf55937a95724da4a96bdc9a687212251c5126da808bb99618caa1`. Production build succeeded; preview restarted at localhost:5288. `effects-20261013-p-D/stage4-effects-report.json` and `effects-20261013-p-N/stage4-effects-report.json` each pass **69/69**, with one explicit continuity limitation. Actual viewports: 1440×900/DPR1 and 390×844/DPR3; narrow renderer DPR is capped at1.5 (585×1266 buffer). All 29 served JS/CSS assets and HTML byte-match the build. Build byte aggregate: `74532980351801e9722355ce2bfb8fd649206543fe38e333f2f7d4300924087d`. All108 unaltered PNG byte hashes and dimensions verified (54 at1440×900 and54 at1170×2532); source/public/script inputs and preserved TODO/root GATES/REA hashes match.

GPU null renders at .428/.435/.46 prove active wall contribution, zero desk exposure inside the sampled displaced-stock aperture, zero visible far closure, and lit-metal pixels during rupture. Profile/interior/pit emissions contribute pixels during bursts and zero during the sampled .424 dark hold; emission channels are zero after emergence. Camera and restoration controls stay fixed. These are sampled pixel/telemetry proofs, not continuous clearance or aesthetic approval.

Opening motion diagnostics add native-scroll frame observations and PNG pairs at .434/.436 and .459/.461. The first desktop cold sweep exposed a1084ms RAF gap near first rupture, followed by a canonical progress skip .420→.438. Time-driven input advanced during the stall, so this is a frame-gap finding rather than proof of a sampler discontinuity. Cold/warm reports retain these observations without an invented C1 threshold. Full G5 input/pacing/stress and frame-time performance acceptance remain open.

The initial `effects-20261013-o-D` report remains preserved: 66/69, with early reverse/seek mismatch. A focused replay did not reproduce it. The verifier now requires native scroll and live world progress to reach the requested pixel before settling and records observed forward/reverse/seek progress. No product state or tolerance was weakened; the original failure's precise timing cause is not proven.

TypeScript, import boundary (one lazy cadGate→Scene edge), and 79 files/961 tests pass with maxWorkers=2; four existing skips. Default concurrency produced four timeout-only failures, retained in scratch logs. GLM-5.3 independent source review found no remaining effects-source blockers after two rounds; DeepSeek reviewer failed with provider429. Review preparation is not Astra or owner acceptance.

## Still open in Stage 4

- Recover the September 27 camera-rake intent; confirm the October 1 printed shatter and October 2 model-driven pressure/continuous emergence still read correctly, without reverting approved handwriting or annotations.
- Full G5 input/pacing/stress and continuous-clearance acceptance remain open; opening observations do not replace that roster.
- Review the implemented relief balance and unified electricity against the actual unaltered PNGs and full motion.
- Prepare Astra effects review and owner unaltered-PNG / full-motion packets; neither acceptance is claimed.

## Final review build — s

Checkpoint2026-10-14: final opening capture preparation is complete on unchanged build s. `continuity-20261014-s3-D/N` each contain1083 frame observations, zero console/page errors, zero failed/HTTP-error requests, and no interval>100ms; maximum intervals17.1ms desktop/16.9ms narrow. Earlier desktop timeout and `continuity-20261013-s2-D` three Failed to fetch errors remain preserved as intermittent failures with unresolved cause; clean reruns do not diagnose them. `review-manifest-20261013-s.json` is generated and checks347 frozen inputs,6 preserved files,4 reports and116 unaltered PNGs. Full G5, continuous clearance, Astra and owner acceptance remain open. Parallel compatibility and lifecycle/performance preparation is tracked in `parallel-wave-20261014.md`.

Review packet: `review-packet-20261013.md`; final binding: `review-manifest-20261013-s.json`. Source/public/script aggregate `8a7ef37cc4fbcf99c392409e4dcf28becccbabfb7c77b920c325811e33b31390`,347 inputs, in `source-20261013-s.json`. Fresh production build `.scratch/jg038-stage4-20261013-s`, preview restarted at localhost:5288. Both `effects-20261013-s-D` and `-N` pass **70/70** with zero errors and one explicitly unverified full camera-handoff continuity item. **71/71 served assets** match each report, including42 public files/CAD/drawing inputs plus JS/CSS; HTML also matches. Verifier revision and source manifest hashes are directly recorded. Required changed-source/verifier entries are enforced by the final review-manifest integrity check.

Functional-readiness checkpoint2026-10-14: `functional-cutter-20261014-s/report.json` passes desktop/narrow full/lite four cases each258/258, zero errors/unmapped responses. Fresh static/fallback reports `../05-stage1-integration/runtime/functional-20261014-s-D.json` and `-N.json` each7/7 pass. These supplement the frozen Stage4 review manifest; they do not close full G3/G7 (continuous clearance, final art, initialization failure and complete visible-focus roster remain open). Source-preparation outputs and exact ownership are indexed in `parallel-wave-20261014.md`.

S adds synchronous shader precompilation during private sheet setup, restoring visibility in finally and collecting attached scene lights once. q cold/warm native sweeps at both viewports removed the p first-rupture frame gap (q largest observed interval17.6ms); see `precompile-20261013.md`. Final s cold-forward/warm-reverse/warm-forward reports and .434/.436/.459/.461 unaltered PNGs are in `continuity-20261014-s3-D` and `-N`. The motion reports re-check all built/served bytes and bind their effects/source/verifier/harness hashes. They record frame observations without inventing a C1 or universal-performance PASS. Copy `continuity-harness-20261014.mjs` to repository `.scratch/stage4-continuity.mjs` to run its relative browser-launch import; executed-harness digest is retained in each report. `review-manifest-recorder-20261014.mjs` retains the manifest integrity recorder.

r-D passed70/70 runtime but failed two served gzip byte digests because Fetch transparently decoded .gz response bodies. s uses raw http/https response bytes; r stays preserved. Final TypeScript passes; focused private effects/geometry/camera suite6 files/45 tests passes after precompile. Earlier full suite79 files/961 tests/four existing skips and import-boundary PASS remain historical evidence for the earlier integrated effects source. GLM source delta review has no precompile/raw-response blocker; Astra and owner reviews are prepared only.

## Boundaries

No commit, push, publication, cutover, archive, or protected-sibling access. Heavy jobs were serialized; the preview was restarted after every rebuild. All figures above come from the recorded reports in this folder.
