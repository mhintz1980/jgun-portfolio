# 40 — Handoff: Camera Path Overhaul, 10% Bullet-Time, Ring OD Mask & Shaft FEA / GD&T HUD (2026-10-21)

**Date:** 2026-10-21  
**Workspace:** `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`  
**Branch:** `torque-wrench/rebuild`  
**Companion Spec:** `docs/torque-wrench-rebuild/39-OWNER-CAMERA-PATH-AND-HUD-SPEC-2026-10-21.md`  
**Ready-to-Paste Prompt:** `docs/torque-wrench-rebuild/40-START-PROMPT-2026-10-21.txt`

---

## 1. Completed & Verified in This Session

1. **Flat-Top Trapezoidal Pacing Kernel (`src/scene/torque-wrench/scrollPacing.ts`)**:
   - Replaced the raised-cosine weight integral with `torquePacingKernel(u, TORQUE_PACING_RAMP = 0.15)`, maintaining a constant plateau derivative `1 / (1 - r) ≈ 1.176` across the central 70% of each span and eliminating both the `(2m - 1)` midpoint slog spike and negative derivatives on compression spans (`m = 0.45`).
2. **Scroll Budget Reallocation (`scrollPacing.ts`, `beats.ts`, `torque-wrench.css`)**:
   - Compressed the static drafting hold (`0.265 – 0.395`) at `0.45x` (from `7.1 vp` / `8.2 vp` dead zone down to `2.5 vp` / `3.3 vp`).
   - Reduced `inspection-ring` (`0.460 – 0.505`) from `18x` (`35.5 vp`) to `4.5x` (`8.9 vp`).
   - Expanded rushed collision beats: `mechanism-switch` (`2.1x`, `5.0 vp`, `63.0°/vp`), `inspection-isolation` (`2.1x`, `5.6 vp`, `93.2°/vp`), `inspection-materials` (`2.2x`, `5.2 vp`), `inspection-return` (`2.0x`, `2.6 vp`, `73.4°/vp`), `mechanism-extraction` (`2.0x`, `6.6 vp`, `52.4°/vp`), and `mechanism-exploded-hold` (`8.0x`, `3.5 vp`).
3. **"Stop and Appreciate" Camera Controller (`src/scene/torque-wrench/stopAndAppreciate.ts`, `RuntimeWorld.tsx`)**:
   - **Mode A (Passive Pointer Look):** `SecondOrderDynamics(1.35, 0.5, 1.25)` with `±25°` spherical deflection cone when scroll is stationary (outside the `0.265 – 0.32` orthographic registration hold), decaying smoothly to `0°` during scroll and staying `0°` when the pointer has not moved.
   - **Mode B (Active Free Look & 0.6s Quintic Whip-Back):** Floating HUD button (`.torque-freelook-toggle`, shortcut `F`, exit `F` / `Escape`), immediate inspection camera nudge, grab cursor with text-selection suppression (`data-torque-freelook="true"`), pointer-move + click-drag + WASD/Arrow 360° orbit while freezing narrative progress `p*`, and automatic `0.6 s` quintic quaternion slerp whip-back on wheel scroll resume (`|Δy| > 80 px`).
4. **Verification Completed**:
   - `npm run typecheck` (`tsc --noEmit`): 0 errors.
   - `npx vitest run src/scene/torque-wrench/ src/scene/inspection/shaft/camera.test.ts`: 41 test files, 277 tests passed.
   - `npm run build`: clean production build served on `http://localhost:5341/torque-wrench/`.
   - Headless Playwright pacing census (`node .scratch/pacing-census/census.mjs --origin=http://localhost:5341 --force=1` + `analyze.mjs`): 805 samples across `80.48 vp`, 0 errors, 100% `full` tier.

---

## 2. Next Session Execution Queue (10 Owner-Ruled Items in `doc39`)

Read `docs/torque-wrench-rebuild/39-OWNER-CAMERA-PATH-AND-HUD-SPEC-2026-10-21.md` and the camera architecture guidance in `C:\Projects\skills-master\local\build-threejs-scroll-worlds\SKILL.md` + `references\realtime-architecture.md` before modifying camera paths.

### Priority 1: Fast Surgical Fixes (Items 9, 10, and 7)
1. **Fix Item 9 — Ring Switch (`P003068`) Internal Bore Knurl Defect**:
   - In `src/scene/torque-wrench/RuntimeWorld.tsx` (`cloneMaterialShape`), copy `onBeforeCompile` and `customProgramCacheKey` onto cloned materials so `sourceRingMaterials` never strips `applyRingSwitchOdKnurlMask`.
   - In `src/scene/rig/materials.ts` (`applyRingSwitchOdKnurlMask`), mask by **both** axial normal (`abs(normal.z) < 0.20`) **and** outward radial normal / outer radius so the internal cylindrical bore (ID) and end faces stay smooth anodized aluminum and **only the OD** is knurled (ref: `C:\Users\Markimus\Pictures\Screenshots\Screenshot 2026-10-21 154101.png`).
2. **Fix Item 10 — Mount Missing Input Shaft FEA / Material Attempts HUD (`ShaftStoryLayer`)**:
   - Mount `src/components/ShaftStoryLayer.tsx` inside the live `/torque-wrench/` overlay when `studyVisible` is true (`p in [0.62, 0.845]` or manual playback), passing `inspection.subjectTime` so the `4140`, `4340`, and `C300` material cards, `FAILED` stamps, left FEA model block, and right `FOS` color bar render in sync with the 3D stress plot.
3. **Fix Item 7 — 10% Bullet-Time Slowdown Law (`0.10x`)**:
   - Update the bullet-time subject clocks in `OpeningDirector.ts` (`SHATTER_SUBJECT_KNOTS`), `RingInspection.ts` (`KNOTS` `8 s – 18 s`), and `InspectionDirector.ts` so bullet-time windows run at **10% of normal speed (`0.10x`)** instead of freezing to ~0%.

### Priority 2: Camera Path & Fade Choreography Overhaul (Items 1–6)
Apply the owner's general rule: **camera movements happen during fade-outs and fade-ins**.
1. **Items 1a/1b — Ring Switch Entry & Gearbox Fade-Out (`p = 0.460 – 0.4725`)**:
   - Move the camera smoothly *during* the gearbox fade-out along a clean snout-side three-quarter arc centered on `P003068` (never swinging near the trigger/handle as in `ringSwitch-2.png`), settling as the fade completes into a framing that shows the **entire Ring Switch** and the **OSHA Blue** paint stripe on `P000420` (fixing `ringSwitch-3.png`).
2. **Items 2a/2b — Ring Switch Knurling Swing Limit (`p = 0.4725 – 0.4945`)**:
   - Clamp the maximum azimuth swing in `RING_CAMERA_KNOTS` (`InspectionDirector.ts`) to the three-quarter framing in `C:\Users\Markimus\Pictures\Screenshots\ringSwitch-knurlView-camAngleLimit.png` so the camera never looks down the gearbox axis (`Screenshot 2026-10-21 135151.png`).
3. **Items 3a/3b & 4a/4b — Continuous Gearbox Fade-In into Two-Speed Clutch Twist & OSHA Blue/Red Sync (`p = 0.4905 – 0.560`)**:
   - Eliminate the pullback to the full-wrench overview between knurling and `mechanism-switch`.
   - As the holes and black finish return and the gearbox fades in (`0.495 – 0.505`), glide the camera continuously toward a handle-side three-quarter close-up that frames `P003068` and the **OSHA Blue** stripe while holding `shift = 0`.
   - Once the camera is settled on the OSHA Blue stripe, animate `shift: 0 -> 1` (twisting/translating `P003068`) while swinging the camera slightly toward the handle so the newly uncovered **OSHA Red** groove is completely unobstructed (fixing `ringSwitch-oshaRedPaintGroove.png`).
4. **Items 5a/5b — Input Shaft (`P001835`) Profile Isolation & 25–30% Opacity Pause (`p = 0.560 – 0.620`)**:
   - Replace the axial `-Z` `isolationCamera` in `JourneyCamera.ts` with a profile / side-three-quarter view.
   - Move into that profile view during the initial fade and hold the surrounding gearbox / mating parts at a **25–30% ghost opacity plateau** so the viewer sees how `P001835` meshes with its neighbors before they fade to `0%` at `p = 0.600`, then move into the shaping cutter camera.
5. **Items 6a/6b — Matrix-Style Low Orbit During Drawing Shatter (`p = 0.360 – 0.460`)**:
   - Reclaim scroll distance from the pre-rupture lull and add a low-elevation Matrix-style azimuth orbit in `sheetCamera.ts` / `OpeningCamera.ts` starting at the rupture state (`C:\Users\Markimus\Pictures\Screenshots\start-orbiting-bullet-time-here.png`) while the shards drift at 10% bullet-time speed.

### Priority 3: HUD, Clickable GD&T Callouts & Stage-2 Planet Feature (Item 8)
1. Port the 3D-tracked GD&T callout & leader system (`ToleranceStations.tsx` / `stationData.ts` + `spatial-hotspot-a11y`), remove Air Motor (`rotor-note`), and configure clickable callouts for:
   - **Clutch Housing** (`P000420`)
   - **Ring Switch** (`P003068`)
   - **LCD Manometer** (`P002115` / `BK11356`)
   - **Second-Stage Planet Gear** (`P000247` in cage `A000592`, shown in exploded view)
2. Replace the meta build-note copy in `Story.tsx` with viewer-facing engineering and design-phase narrative.
3. Follow-on exploded-view animation (documented in `doc39` §8): slow rotating drivetrain to a stop, fly one `P000247` planet out perpendicular to the axis spinning slowly with its Total Runout FCF callout, then spin it up to full speed and whip it back into `A000592` to jumpstart the assembly rotation.
