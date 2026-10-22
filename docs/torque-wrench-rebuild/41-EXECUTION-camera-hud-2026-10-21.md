# JG-038 camera, clocks and HUD execution

Controlling requirements: doc39 owner specification and doc40 handoff. Baseline checkout: `c7d70eb329afe4100e3474e5cda9009abf358e21`, clean `torque-wrench/rebuild`, matching origin at session start. Before captures used the production build already present at resume, before source edits; that baseline build was not rebuilt or independently re-attested against every source byte. Its served HTML hash is retained with the raw capture record.

## Ownership and interface revision 1

| Lane | Configured seat | Exclusive ownership | State |
| --- | --- | --- | --- |
| P1 material and clocks | Luna High | materials.ts, OpeningDirector.ts, RingInspection.ts, bulletTime.ts and focused tests | Integrated; parent corrected measured OD threshold after review |
| P2 camera choreography | Fixed tier-worker Sol High | InspectionDirector, JourneyCamera/Director, OpeningCamera, sheetCamera, MechanismDirector and focused tests | Integrated; parent owns final framing refinements |
| P3 HUD/copy | Fixed tier-worker Sol High | Scene.tsx, Story.tsx, TorqueInspectionOverlay.tsx, torque-inspection-overlay.css, hotspotData.ts | Integrated |
| Integration | Parent | RuntimeWorld.tsx, verification harness and this evidence index | Final desktop 20/20 and narrow 20/20 runtime gates verified on the same build |
| Independent important-change review | GLM-5.3 High | Read-only integrated diff | Two source rounds complete; OD finding fixed, two debug/evidence findings fixed |

Luna exports `BULLET_TIME_RATE` from `bulletTime.ts` for camera worker consumption. Parent owns all RuntimeWorld changes. DOM overlay consumes read-only `window.__torqueWorld.overlaySample()` and dispatches `torque-part-focus` with `{id: string | null}`. Runtime sample has progress, subjectTime, studyVisible, manual, focusId and projected anchors `{id,x,y,visible}` in CSS viewport pixels. Camera and DOM integration wait for producer handover; only parent runs builds/browser and uses port 5341.

## Verification and boundaries

- [x] Canonical documents read; branch, HEAD and clean state confirmed.
- [x] Baseline production captures and runtime telemetry (19 desktop + 19 narrow; full tier, zero browser errors).
- [x] Priority 1 fixes integrated and tested.
- [x] Priority 2 choreography integrated and tested; final owner framing judgment remains open.
- [x] Priority 3 HUD/callouts integrated and exercised; all four controls and Escape focus return verified on final desktop build.
- [x] `npm test` executed on final source: 1,109 passed, 4 skipped, 1 inherited failure; see below. Typecheck and production build pass.
- [x] Production preview restarted on localhost:5341 after every rebuild.
- [x] Final runtime telemetry and before/after captures: 23 desktop + 23 narrow checkpoints, 40/40 gates, zero browser errors; all four Escape focus returns and final control separation verified.
- [x] Independent review of important changes; see coverage boundary below.
- [ ] Owner visual acceptance (separate owner gate).

Evidence target: `output/playwright/torque-camera-hud-2026-10-21/`. Captures and bulk JSON are ignored evidence; do not commit `.scratch/`. No commit, push or deployment requested. Stage-2 planet fly-out animation remains the explicitly recorded follow-on in doc39 section 8. No inherited project gate is closed by this execution record.

Review gallery: `output/playwright/torque-camera-hud-2026-10-21/review.html`. Machine summary: `summary.json`; raw evidence: `before/runtime.json`, `before-narrow/runtime.json`, `after/runtime.json`, `after-narrow/runtime.json`; full unit result: `unit-tests.json`. `scripts/verify-torque-camera-hud.mjs` reproduces native-scroll captures and controls on localhost:5341; `scripts/summarize-torque-camera-hud.mjs` builds the local gallery and records analysis separately from raw observations. The shift-boundary tolerance is 1e-6 because integer native-scroll pixels may land a few millionths of progress after .520; the pure sampler tests still enforce exactly zero through the boundary.

Final served HTML SHA-256 for both viewport runs: `2d172557247aa5ad1faebf3f3a4c5d4a528d4143823e03d3e4e5e0ce72d5968b`. Preview remains on `http://localhost:5341/torque-wrench/`. HEAD/origin remain c7d70eb3; all implementation changes are uncommitted. Final status is implemented and runtime verified for this owner batch, with the inherited unit failure and owner visual acceptance explicitly open.

## Implementation and numerical evidence

- Shared `BULLET_TIME_RATE = 0.1` is the owner-adjustable dial. Ring baseline is 0.5 mechanical seconds/display second, slow rate 0.05. Measured start/interior/end rates: 0.05000010 / 0.05000000 / 0.05000004. Shatter derivative is exactly 0.10 of its unslowed opening-clock reference. Shaper physical machining and hob angular rates compensate the inherited spindle laws; focused derivative and seam tests cover the ratios.
- OD threshold uses measured radius 0.037722 m, with transition 0.036922–0.037322 m. Actual source mesh proof: 488/488 OD vertices knurled, 0/1,026 bore vertices and 0/2,442 face vertices knurled. Both shader hooks survive source-ring/fade clones; installed cache key includes `ring-switch-od-knurl-v3`.
- Camera entry uses a ring-centered arc during the fade. Ring framing has a 0.28 m minimum radius with portrait compensation, restrained knurl azimuth, no overview detour, and a handle-side shift from .520 to .560. The .560 world pose feeds the journey entry directly.
- Input-shaft isolation holds mating context at 0.275 opacity, then reaches zero by .600. Shatter camera descends and orbits before the final emergence handoff. Hob catch-up pacing increased from 5.2 to 6.5 (below the existing x8 cap) to preserve the tested speed ceiling with the new 10% law; scale and CSS reserve updated together.
- The owner-requested pre-shatter budget transfer lowers the cracks span from 2.0 to 1.5 and raises shatter from 3.5 to 4.0. This transfers 0.02 physical-scroll units into the orbit while keeping total page length and every downstream join from .460 onward unchanged. A direct before/after integral regression verifies the transfer.
- Shaft HUD consumes the exact installed subject clock, with DOM presentation capped at 15 Hz. Four approved callouts use matrix projection, real mesh occlusion and keyboard controls. P000247 anchor candidates come only from stage2/A000592 and use actual tooth-surface extrema because the carrier obscures the pin center.
- Portrait visibility refinement: the exploded overview uses a side profile and a responsive pullback; the rear-facing LCD gets a short continuous view during assembly restore (.940–.995). A selected or keyboard-focused callout card survives temporary camera occlusion; its leader/reticle remain geometrically gated. Escape closes selection and preserves the native trigger focus. This keeps a camera transition from cancelling its own accessible control.

## Known inherited test failure

`src/scene/drawing/sheet/portalGeometry.test.ts` — “private cavern keeps the real tracked contour fold-free at every ring”: ring 5 segments [2365,2367] genuinely intersect. Float64 diagnosis confirms intersection t=0.56955/u=0.02530 at identical Z. The geometry, tracked contour and test match baseline c7d70eb3; none were modified or waived. Smoothing the discontinuous angular hash would require a separate cavern-shape change and reconciliation with its relief gate. Generated `output/**` test snapshots are now excluded from Vitest discovery; source tests remain active. The CAD import test passed with bounded concurrency (`--maxWorkers=2`).

## Review coverage

Sonnet camera seat was stopped after producing no edits or integration replies; its scope was reassigned to the user-authorized fixed Sol/High seat. DeepSeek reviewer failed with HTTP 429 and provided no review. GLM-5.3/High completed two independent source rounds. Its material-radius finding and final debug/cache-version findings were fixed. Subsequent portrait focus-distance and overview-composition tuning is parent-owned and verified with runtime checks, not presented as a fresh independent approval. Configured models/efforts are recorded; provider backend identity is not independently attested by model prose.
