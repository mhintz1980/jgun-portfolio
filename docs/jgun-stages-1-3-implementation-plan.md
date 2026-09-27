# J-GUN opening and extraction implementation plan

Scope: sections 1–3 of `jgun-animation-improvements.md`, authorized 2026-09-26. The 2026-09-25c handoff is historical context only. Work in `C:/Projects/jgun-portfolio`; preserve subsequent stations, CAD relationships, and downstream progress windows.

## 1. Drafting-Sheet Opening
- [x] Read the owner brief and historical handoff; inspect current checkout (only the owner brief was untracked).
- [x] Correct side-profile pulse registration using the same sheet coordinates as the primary drawing. Pulse max 8.8e-5 m (gate 1e-3) in all 6 cases; registered hold .06/.072 <= 4.3e-11 px (gate 0.1 px), .048 recorded ~2e-7 px (`project/work/evidence/JG-035-opening-drafting-table/stages-1-3-2026-09-26/final-2026-09-26T20-22-45-312Z`).
- [x] Keep title-block lettering within its cells. `captureTextBounds`/`captureTitleBounds`: 125 items, 0 violations, all cases. 0.7 em fit factor left as is (no violations, no undersizing flagged).
- [x] Precompute/cache stable drawing work with a validated fallback; measure startup behavior. Loader sniffs gzip magic (hosts send `.gz` with `Content-Encoding: gzip`). Evidence `public/drawing/jgun-sheet-v1.evidence.json` `verified`, exact roundtrip. One sample on real-GPU Chrome, first sheet-stats publication: cold live 10.95 s, cold precomputed 12.47 s, warm reload 7.55 s. On the dev server the 25 MB (6.1 MB gz) payload is not a cold-start win: fetch + parse compete with module compile. Needs a production-preview measurement before the asset is kept.
- [x] Simplify camera to detail → cross-sheet move → complete sheet → square-on side-view hold (desktop/narrow exact-hold tests pass).

## 2. Paper Flex Before Extraction
- [x] Add restrained, deterministic displacement to a subdivided sheet using the J-GUN profile and centerline. Peak displacement at p=.066: full 1.253e-3 m, lite 5.64e-4 m (gate (0, 3e-3]); forward = reverse.
- [x] Apply the same displacement to ink, fills, pulse, and lettering. Fills subdivided to PAPER_FLEX_STEP (sheetInkRuntime.test.js).
- [x] Build pressure before metal appears, add soft local shading, and settle the paper as the tool separates. Pressure from t≈.51, metal from t=.54 (`INTRO_PHASES.metalStart`), flat at solved separation; slope/pressure shade in `paperFragment`.
- [x] Preserve flat proof mode and reduced-motion behavior; expose flex telemetry and test boundaries/reverse scrubbing. Reduced cases: flex 0, phase .4, focus 1. Forced-lite cases added to harness.

## 3. Drawing-to-Metal Signature Shot
- [x] Hold registration through excitation and pressure; reveal metal before lift, then settle paper. Registration at peak flex (.066) 0 px; metal pbr .028 at .066 with poseT .367 (< lift), >.5 by riseStart (`quick-gaps-2026-09-26T21-47-11-555Z`).
- [x] Use controlled contact separation and one restrained metal light sweep; suppress competing shockwave effects. `paperContactShadow`: 0.16 tight (3 mm) while touching, widens to 30 mm and fades to 0 by pose end; shockwave `uWaveEnabled=0`; single sweep light. Quick harness 2/2 PASS; full 6-case run still owed.
- [x] Delay camera departure until metal emergence, then pull back to the physical tool (perspective blend starts at intro .72; downstream windows unchanged).
- [x] Suppress unrelated HUD/text throughout the extraction and retain downstream timing (HUD starts after progress .12; opening titles already finish before pulse).

## Verification and completion
- [x] Focused tests, TypeScript, production build, drawing contract, station-2 regression check. 2026-09-26: 120/120 tests, typecheck 0, build PASS, contract 24/24, station2 PASS.
- [x] Browser verification on desktop and narrow viewport, including reverse scroll and reduced motion; capture telemetry and representative frames. 6/6 PASS (desktop, narrow, both reduced, both forced-lite) in `project/work/evidence/JG-035-opening-drafting-table/stages-1-3-2026-09-26/final-2026-09-26T20-22-45-312Z`.
- [ ] Independent review and fixes; record measured outcomes and remaining limitations here.

Completed means implemented and checked. Visual owner acceptance is separate. No deployment is part of this plan.
