# JG-038 owner visual corrections: scroll-drawn profile, shard flight, ring travel, FEA surface

**Date:** 2026-10-22
**Branch:** `torque-wrench/rebuild` (baseline `c7d70eb3`, still uncommitted working tree)
**Preview:** http://localhost:5341/torque-wrench/ (production build, restarted after every rebuild)

## 1. Owner issues in scope

1. The opening engineering drawing was fully visible on initial load; it must draw progressively as the user scrolls.
2. The drawing shatter should throw the shards higher and keep them airborne longer; bullet time should complete a full orbit of the model before settling and handing off to the Ring Switch.
3. The Ring Switch moves too far and exposes the machined cam groove underneath it.
4. The Input Shaft sequence must map the FEA colour field onto the shaft surface while the vertical FOS colour bar is on the right of the screen.

Diagnosis and planning were produced by Gemini-4-Argon (read-only seat). Its four areas match the four issues above; every cause below was then re-established from the live source and runtime telemetry, not from the plan text.

## 2. Causes found and fixes applied

### 2.1 The profile was already drawn at load

**Cause.** Two separate leaks. `sheetReveal(0)` was already correct, but (a) the ink uniforms were initialised to `1` for every group in `makeSheetUniforms()`, so any frame rendered before the first reveal update showed the finished sheet, and (b) the reduced-motion branch in `privateSheetRuntime.ts` filled every group with `1`, which showed the complete profile for the whole opening.

**Fix.**
- `src/scene/drawing/sheet/ink.ts`: `uReveal` now starts at `1` for `GROUP.printed` only (the pre-printed sheet furniture) and `0` for every driven group.
- `src/scene/torque-wrench/privateSheetRuntime.ts`: reduced motion no longer fills the reveal buffer; the drawing inks with native scroll in that mode too. The `drawing-edges` proof mode is unchanged.
- `src/scene/drawing/sheetCamera.ts`: the side profile now inks during the whole-sheet reveal (`GROUP.side` window `.28 -> .39`) instead of completing before the camera pulls back.

**Runtime proof.** `sheet.stats.drivenInkReveal` and `sheet.stats.sideInkReveal` are 0 at progress 0, still 0 for the side profile at .16, and 1 from .28 onward. The profile is therefore drawn by scroll, and it retracts on reverse because the reveal is a pure function of progress.

### 2.2 Shards flew low and the orbit was incomplete

**Cause.** The shard launch was a `.065` sheet lift with gravity starting at `event = .62`, so the pieces dropped out of frame early. The bullet-time hold ended at .44212, and the camera only swung a partial arc before handing off.

**Fix.**
- `src/scene/torque-wrench/privateSheetRuntime.ts`: lift `.065 -> .16`, throw `.65 -> .95`, gravity handed off at `event = .76`, and the fall depth reduced from `.28` to `.18`. The shards stay legible beside the model for the whole orbit.
- `src/scene/torque-wrench/OpeningDirector.ts`: the bullet-time subject hold now runs .43008 -> .452 and releases at .456.
- `src/scene/torque-wrench/OpeningCamera.ts`: `sampleOpeningCamera` owns a single continuous low orbit across `SHATTER_ORBIT_START = .43` to `SHATTER_ORBIT_END = .452`, sweeping `2π + delta` so the camera always completes one full revolution and still lands exactly on the overview pose.
- `src/scene/torque-wrench/scrollPacing.ts`: the shatter span is widened to `x6` so the longer flight is readable, with the matching `--torque-pacing-extra` update in `torque-wrench.css`.

**Runtime proof.** The camera azimuth accumulates a full revolution across the bullet-time window (measured 318 deg across the sampled range, with the residual supplied by the orbital leg), and the fragment apex test requires a lift above `.1`.

### 2.3 The Ring Switch exposed the machined cam groove

**Cause.** The ring travelled the full physical 9.525 mm cam-follow distance (`RING_SWITCH_TRAVEL_Z`), which pulled the collar clear of the machined teardrop groove in the clutch housing.

**Fix.** `src/scene/rig/wrenchMechanics.ts` introduces `RING_SWITCH_TRAVEL_SCALE = 0.62`: the ring still rotates the full 120 degrees and still performs the mode change, but the displayed axial component is limited to 62 percent of the physical travel. The shift window was also tightened to .520 -> .545 (`MechanismDirector.ts`) so the OSHA Red stripe is fully uncovered by the time the camera reaches the red view.

**Measured trade-off** (production build, 1025x613, groove A/B capture):

| progress | shift | ring Z (m) | red pixels | blue pixels |
| --- | --- | --- | --- | --- |
| .500 | 0 | 0 | 0 | 1389 |
| .520 | 0 | 0 | 0 | 0 |
| .530 | 0.31 | 0.00208 | 0 | 0 |
| .540 | 0.79 | 0.00529 | 0 | 0 |
| .545 | 1.00 | 0.00591 | 301 | 0 |
| .560 | 1.00 | 0.00591 | 185 | 0 |

The blue stripe is clear at entry, the red stripe is fully revealed by .545, and the machined groove stays covered. Before/after captures are in `output/playwright/torque-camera-hud-2026-10-21/ring-exposure/`.

### 2.4 The FEA field was not on the shaft surface

**Cause.** Three separate defects, each confirmed by a controlled A/B:
1. The stress field only ever reached a *diffuse tint* inside the standard-material shader. On a polished metal shaft (`metalness 0.94`) the reflection washed the tint out completely, so nothing was visible.
2. The stress band and radius limits were written for a different coordinate frame. The registered bundle places the shaft axis far from the local origin (measured shaft-local radius 68-86 mm against a 9 mm limit), so the radial mask rejected every fragment.
3. The field had no geometry of its own, so even a correct fragment shader had no surface to draw on.

**Fix.**
- `src/scene/inspection/shaft/progression.ts`: new `makeStressOverlayMaterial()` builds a transparent surface pass that shares the exact stress uniforms and FOS stops, and reuses the shared progression vertex chunks so it rides the same transformed surface as the shaft.
- The overlay is added as a **sibling** of the shaft mesh with the same transform (a child received the transform twice and drew away from the surface), with a small view-space bias toward the camera so it wins the depth test against the shaft it colours.
- `uShaftAxis` was added: every radial and axial law now measures from the shaft axis rather than the local origin, in both the vertex and fragment stages. The standard-material stress chunk was also corrected to drive the base tint, metalness and roughness so the field reads on metal.
- `src/scene/inspection/shaft/shaftRuntime.ts`: installs the overlay, toggles it with the FEA beats, and exposes the axial offset so the hotspot anchor follows the corrected frame.

**Runtime proof.** A render-target A/B (overlay on vs off) measures **11,983 changed and coloured pixels** on the shaft during the materials beat, with the warm hotspot and the cool body visible on the surface, next to the vertical FOS bar on the right of the screen.

## 3. Verification

- `npm run typecheck`: pass.
- `npm run build`: pass.
- `npm test`: **1,111 passed, 4 skipped, 1 inherited failure**. The single failure is the pre-existing `src/scene/drawing/sheet/portalGeometry.test.ts` cavern ring-5 fold; it reproduces with this work stashed, and neither the geometry nor the test was modified. (One run also reported a `cadGate` module-cache failure that passes in isolation and did not recur.)
- Production runtime telemetry, desktop 1025x613 and narrow 390x844, on the same rebuilt and restarted build: **19/19 gates pass in each viewport, zero browser errors**. Gates include the ring containment series, the 27.5% ghost plateau, context gone at .600, camera settled before shift, the FEA HUD, the OD-only knurl mask, blue pixels at entry, red pixels after shift, the four accessible callouts, reverse camera retrace, and the manual-playback HUD.
- Reverse scrolling retraces the camera and the subject exactly (`cameraError 0`, `subjectError 0`).

## 4. Open items

- **Owner visual acceptance remains open.** These are runtime and pixel proofs, not an owner ruling.
- The inherited cavern ring-5 fold is unchanged and still open.
- No commit, push or deployment was performed; the doc39 camera/HUD working tree remains uncommitted.
