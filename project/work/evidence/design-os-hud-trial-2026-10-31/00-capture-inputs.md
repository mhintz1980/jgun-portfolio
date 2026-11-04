# HUD trial capture inputs

Read-only reconnaissance, 2026-10-31. This records available inputs and interfaces; it does not claim that clean captures or trial concepts have been made.

Workspace: `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`.

## Available evidence

- Publication identity: `project/work/evidence/torque-wrench-rebuild/74-work-in-progress-publication-2026-10-31/SUMMARY.md`, especially lines 5 and 54–63. Deployment `6ea9c78a` was built from `ccb215b2` plus intentional dirty continuation and WIP labels. Recorded bundle fingerprint: `3585205b145f73daff2354bb2ce9fbc19efb47c875c1ceed9c77e997027d3a6b`. Use the recorded fingerprint algorithm; do not describe a clean commit build as this deployment.
- Small runtime map: `project/work/evidence/torque-wrench-rebuild/73-verification-reconciliation-2026-10-30/runtime-summary.json`. Evidence 73 and evidence 74 have separate build provenance; don't merge them under one identity.
- Existing desktop input: `output/playwright/torque-camera-hud-73-final/desktop/`.
- Existing narrow input: `output/playwright/torque-camera-hud-73-final/narrow/`.
- Each input directory contains `p-0.4180.png` (drawing/electrical opening), `p-0.7350.png` (shaft inspection/FEA), `p-0.9400.png` (exploded drivetrain), and `runtime.json`. Existing files were confirmed by the scout; recheck availability next session. Viewports are 1440×900 and 390×844, DPR 1. Requested points are not exact achieved points; read each report's actual progress. Desktop values are approximately .4180034138, .7349970882 and .9399886494.
- `output/playwright/studiomark-wip-2026-10-31/production/` contains publication smoke images and report. The smoke script returns to the top before its single screenshot, so those screenshots are publication/opening context, not a three-state capture packet.

## Capture caveats

All inspected existing PNGs have production UI flattened into their pixels. The shaft inspection frame has narrative and material/FOS overlays. Do not add a proposed HUD over these and call the result clean or fair.

The cinematography verifier's beauty screenshots do not suppress HUD (`scripts/verify-page-cinematography.mjs`, around lines 351–367). The existing camera/HUD verifier exposes no clean-HUD flag in its inspected declarations.

A capture-only helper in the trial scratch subtree can use browser-local DOM overlay suppression to capture clean scene pixels. Measure and record selectors, original styles, viewport, quality and narrative snapshot; restore styles after capture and keep the model/camera/rendering untouched. Hide only overlay elements verified by live inspection. Reproduce the same progress and scene for control and clean versions.

`window.__torqueWorld.grooveCapture().beauty` is a DOM-free scene render, but its direct `gl.render` path has unproved postprocessing parity. It is unsuitable as an assumed pixel-equivalent replacement for a browser canvas capture.

## Existing capture interfaces

Read `scripts/verify-torque-camera-hud.mjs`, declarations around lines 86–119, before running it. Inspected options include `--url`, `--out`, `--width`, `--height`, `--points`, `--phase`, `--quick`, `--seek-timeout`, and `--shot-timeout`. It seeks using `window.__torqueNarrative.scrollFraction(p)` and records snapshots. A known point list is `--points=0.418,0.735,0.94`.

Use this interface for preview capture or adapt its documented behavior inside the trial-owned helper. `--quick` is capture-only and cannot establish camera/HUD PASS. Inspect the server/build actually served before capturing. Prefer an immutable deployment URL only if the needed runtime interface is present; otherwise freeze and name a current local baseline. Do not launch the whole cinematic proof roster for concept images.

Opening is available as a supplementary state, not a substitute for a clean assembled overview. The executor must choose an actual assembled view from current scene/capture metadata and confirm its subject at native size. Avoid substituting an invented progress value.

## Isolated Design OS state

Pinned upstream source inspected: `369b04155c7e1b8503b8a0ef676ce168d81e5a2e`.

`src/core/memory-store.ts` lines 29–31 resolves the tool home from `EASE_DESIGN_HOME`, otherwise `~/.ease-design`. Use a process-scoped value under the disposable trial directory and restore the previous value afterward. Do not repurpose `HOME`, `CODEX_HOME` or other system paths.

`src/core/memory-autorecord.ts` documents automatic recording based on the input artifact's nearest owning `design/`, not simply process cwd. Keep CLI input artifacts inside the disposable project as well as setting its cwd/home. Confirm behavior against the actual installed package before execution; source and package parity is unverified. Normal npm caching is acceptable.

Sources: [memory store](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/src/core/memory-store.ts#L29), [auto-record ownership](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/src/core/memory-autorecord.ts#L10).
