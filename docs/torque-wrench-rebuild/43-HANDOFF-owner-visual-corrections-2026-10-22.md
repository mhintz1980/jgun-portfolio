# 43 — Handoff: owner visual corrections (2026-10-22)

**Workspace:** `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`
**Branch:** `torque-wrench/rebuild` (HEAD `c7d70eb3`; all work below is uncommitted)
**Preview:** http://localhost:5341/torque-wrench/ — production build, restart after every rebuild
**Execution record:** [doc42](42-EXECUTION-owner-visual-corrections-2026-10-22.md)

## What was implemented

The four owner comments, diagnosed and built against live source and runtime telemetry:

1. **The opening profile now draws with scroll.** The leaks were the ink uniform seed (every group started at `1`) and the reduced-motion branch (which filled the whole reveal buffer). The side profile inks during the whole-sheet reveal.
2. **Shards fly higher and stay airborne; bullet time completes a full orbit.** Lift `.065 -> .16`, throw `.65 -> .95`, late gravity handoff; the camera owns one continuous 2π low orbit from `.43` to `.452`, then lands exactly on the overview pose.
3. **The Ring Switch keeps the machined groove covered.** Axial travel is 62 percent of the physical 9.525 mm cam travel; the 120-degree rotation and the mode change are unchanged. The shift window tightened to `.520 -> .545` so the OSHA Red stripe is uncovered for the red view.
4. **The FEA field is on the shaft surface.** A dedicated transparent overlay pass shares the stress uniforms and FOS stops, rides the shaft's own progression transform, and measures from the shaft axis (`uShaftAxis`) rather than the local origin. 11,983 coloured pixels measured during the materials beat, with the vertical FOS bar on the right.

## Verification state

- Typecheck and production build: pass.
- Unit suite: 1,111 passed, 4 skipped, 1 inherited failure (`portalGeometry.test.ts` cavern ring-5 fold; reproduces with this work stashed).
- Runtime telemetry on the same rebuilt build: 19/19 gates desktop (1025x613) and 19/19 narrow (390x844), zero browser errors.
- Reverse scrolling retraces camera and subject exactly.

## Open gates

- **Owner visual acceptance is still open.** Nothing here is an owner ruling.
- The inherited cavern ring-5 fold is unchanged.
- No commit, push or deployment. The doc39 camera/HUD batch is still uncommitted in the same tree.

## Files touched in this round

- `src/scene/drawing/sheet/ink.ts`
- `src/scene/drawing/sheetCamera.ts` (+ test)
- `src/scene/torque-wrench/privateSheetRuntime.ts` (+ test)
- `src/scene/torque-wrench/OpeningDirector.ts` (+ test)
- `src/scene/torque-wrench/OpeningCamera.ts` (+ test)
- `src/scene/torque-wrench/scrollPacing.ts` (+ test), `torque-wrench.css`
- `src/scene/rig/wrenchMechanics.ts` (+ test)
- `src/scene/torque-wrench/MechanismDirector.ts` (+ test)
- `src/scene/inspection/shaft/progression.ts` (+ test), `shaftRuntime.ts`, `src/scene/inspection/story.ts`
- `docs/torque-wrench-rebuild/42-EXECUTION-owner-visual-corrections-2026-10-22.md`, `TODO.md`, `project/README.md`

## Ready-to-paste continuation prompt

> Resume in `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench` on `torque-wrench/rebuild`. Preserve all uncommitted doc39 camera/HUD changes and the doc42 owner-correction work documented in `docs\torque-wrench-rebuild\42-EXECUTION-owner-visual-corrections-2026-10-22.md`. The four owner corrections are implemented and verified: scroll-driven profile ink, higher and longer shard flight with a full 360-degree bullet-time orbit, Ring Switch travel limited to 62 percent so the machined groove stays covered while the OSHA Red stripe reveals by .545, and the FEA field mapped onto the shaft surface (11,983 coloured pixels). Typecheck and build pass; the unit suite is 1,111 passed / 4 skipped / 1 inherited cavern ring-5 fold failure; runtime telemetry is 19/19 gates desktop and 19/19 narrow with zero browser errors. Owner visual acceptance is still OPEN. Review the doc42 evidence and the captures under `output\playwright\torque-camera-hud-2026-10-21\` (including `ring-exposure\`) before repeating the work. Do not commit, push or deploy.
