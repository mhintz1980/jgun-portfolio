# JGUN Torque Wrench Rebuild — Owner Camera Path, Bullet-Time & HUD Specification

**Date:** 2026-10-21  
**Workspace:** `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`  
**Branch:** `torque-wrench/rebuild`  
**Status:** Owner rulings locked (2026-10-21); ready for execution in next session (see `40-HANDOFF-camera-paths-bullet-time-and-hud-2026-10-21.md`).

---

## 0. General Cinematography Rule & Reference Skills (`C:\Projects\skills-master`)

### General Camera-During-Fade Rule (Owner Ruling, 2026-10-21)
- **Move During Fades:** Camera movements must happen *during* gearbox/context fade-outs and fade-ins rather than waiting for fades to finish before moving or freezing before fades start.
- **Ring Switch Fade-Out (`0.460 -> 0.4725`):** The camera moves smoothly during the gearbox fade-out and settles into its knurling entry framing as the gearbox finishes fading out.
- **Ring Switch Fade-In (`0.495 -> 0.505`):** Do **not** pull back to the full-wrench overview between knurling and the two-speed clutch shift. Instead, begin moving the camera smoothly during the gearbox fade-in toward the Ring Switch Twist viewing angle (the camera does not need to stop at the exact instant the fade completes; keep the motion fluid into the Twist).

### Recommended Entry vs. Twist Camera Choreography (Owner Question 1)
- **Entry into Knurling (Gearbox Fade-Out):** Approach from the **snout / front-three-quarter side** at a medium-close distance centered on `P003068`. This frames the entire Ring Switch and the snout-side **OSHA Blue** paint stripe without sweeping near or clipping the handle/trigger.
- **Transition into Ring Switch Twist (Gearbox Fade-In -> Shift):** As the gearbox fades back in around the finished Ring Switch, glide continuously from the snout-side three-quarter view across toward the **handle / trigger-side three-quarter angle** (staying at a clean medium-close radius so it never crowds the trigger like `ringSwitch-2.png` did). Because shifting into High Torque slides the Ring Switch forward over the snout-side OSHA Blue stripe and **uncovers the OSHA Red stripe on the rear (handle) edge of the ring**, arriving on the handle-side three-quarter angle guarantees the newly revealed OSHA Red groove is completely unobstructed by the ring's lip.

### Authoritative Skill References in `C:\Projects\skills-master`
1. `C:\Projects\skills-master\local\build-threejs-scroll-worlds\SKILL.md` and `C:\Projects\skills-master\local\build-threejs-scroll-worlds\references\realtime-architecture.md` (§6 *Camera rig*):
   - Centripetal `CatmullRomCurve3` position and target splines parameterized per beat/chapter, separating `pathRig` (authored scroll trajectory) from `inputRig` (`SecondOrderDynamics` pointer/free-look offset), plus offline ray/sphere clearance checks so no camera arc passes inside the handle/trigger margin.
2. `C:\Projects\skills-master\local\cinematic-gsap-lenis-motion-system\SKILL.md`:
   - Connected motion tokens, easing curves, and HUD/text reveal choreography.
3. `C:\Projects\skills-master\local\spatial-hotspot-a11y\SKILL.md`:
   - 3D CAD anchor projection, leader lines, and accessible click-to-focus/zoom interaction for the GD&T stations.
4. `C:\Projects\skills-master\local\r3f-scroll-performance-guard\SKILL.md` & `C:\Projects\skills-master\local\webgl-telemetry-verifier\SKILL.md`:
   - Zero-allocation frame loops and programmatic browser telemetry gates.

---

## 1. Ring Switch Entry & Gearbox Fade-Out (`p = 0.460 – 0.4725`, `inspection-ring` entry)

### Where and When (1a)
- **Beat:** `breakthrough-emergence` (`0.435 – 0.460`) into `inspection-ring` (`0.460 – 0.4725`), as the wrench finishes rising above the torn drawing and the surrounding gearbox fades out (`0.469 – 0.4725`), leaving the Ring Switch (`P003068`).
- **Current Code:**
  - `src/scene/torque-wrench/RuntimeWorld.tsx` (`RING_WINDOW_START = 0.46`, `RING_CAMERA_ENTRY_END = 0.4655`, `RING_ACTIVE_START = 0.469`).
  - `src/scene/torque-wrench/InspectionDirector.ts` (`RING_GROOVE_VIEW.blue` at `0.4655` and `RING_GROOVE_VIEW.red` at `0.469 – 0.4725` with `distanceScale: 0.62`, `fov: 30`, `targetZ: ±0.012`).
- **Reference Screenshots:**
  - Start: `C:\Users\Markimus\Pictures\Screenshots\ringSwitch-1.png`
  - Middle (too close to handle/trigger, wrong pivot): `C:\Users\Markimus\Pictures\Screenshots\ringSwitch-2.png`
  - End (cropped macro on ring switch): `C:\Users\Markimus\Pictures\Screenshots\ringSwitch-3.png`

### What Is Wrong & Required Fix (1b)
- **Current Defect:** `blendCamera` interpolates from the overview target `(0, 0, 0)` to `ringAnchor` while dropping `distanceScale` to `0.62` and `fov` to `30°`. The camera swings around the wrong focal point, passes far too close to the handle/trigger housing (`ringSwitch-2.png`), and lands in an overly tight macro (`ringSwitch-3.png`) that crops the top and bottom of the ring switch.
- **Required Behavior:** Keep the camera pulled back on a clean arc anchored on the ring switch / clutch interface so that at the gearbox fade-out (`0.469 – 0.4725`), the **entire Ring Switch (`P003068`)** AND the **OSHA Blue paint stripe** on the clutch housing (`P000420`) are clearly framed together.

---

## 2. Ring Switch Knurling Camera Swing Limit (`p = 0.4725 – 0.4945`, `inspection-ring`)

### Where and When (2a)
- **Beat:** `inspection-ring` (`0.4725 – 0.4945`, display time `0 s – 28 s`) while the brass knurling wheel forms the knurl on the aluminum `P003068` blank.
- **Current Code:** `src/scene/torque-wrench/InspectionDirector.ts` (`RING_CAMERA_KNOTS` lines 295–307, where `azimuth` sweeps from `RING_BASE_AZIMUTH (~2.49 rad)` all the way to `3.35`, `4.0`, and `4.55 rad`).
- **Reference Screenshots:**
  - Maximum allowed camera swing angle: `C:\Users\Markimus\Pictures\Screenshots\ringSwitch-knurlView-camAngleLimit.png` (and `Screenshot 2026-10-21 135136.png`).
  - Current over-rotated angle (too far down axis/side): `C:\Users\Markimus\Pictures\Screenshots\Screenshot 2026-10-21 135151.png`.

### What Is Wrong & Required Fix (2b)
- **Current Defect:** Sweeping `azimuth` to `4.0 – 4.55 rad` rotates the camera until it looks nearly down the gearbox/ring-switch axis (or edge-on), hiding the knurl pattern forming on the ring switch OD.
- **Required Behavior:** Clamp the maximum azimuth excursion during the knurling pass to the three-quarter framing shown in `ringSwitch-knurlView-camAngleLimit.png` so both the brass knurling roller contact and the newly formed diamond knurl band remain clearly visible throughout.

---

## 3. Ring Switch Finish Restore & Gearbox Fade-In (`p = 0.4905 – 0.505`, `inspection-ring` exit)

### Where and When (3a)
- **Beat:** End of `inspection-ring` (`p = 0.4905 – 0.505`, display time `26 s – 28 s`), when the face holes and black anodized finish reappear on `P003068` and the surrounding gearbox fades back in (`0.495 – 0.503`).
- **Current Code:** `src/scene/torque-wrench/InspectionDirector.ts` (`RING_CAMERA_KNOTS` at `0.4872 – 0.4945`) and `RuntimeWorld.tsx` (`RING_CAMERA_EXIT_START = 0.498` to `RING_WINDOW_END = 0.505`).

### What Is Wrong & Required Fix (3b)
- **Current Defect:** The camera is looking nearly down the gearbox axis when the black finish returns and the gearbox fades in, hiding most of the ring switch and failing to establish its mechanical role in the assembly.
- **Required Behavior:** As the holes and black anodize reappear and the gearbox fades back in, pivot the camera into a clear three-quarter / side-oblique position that shows **why** the ring switch is knurled: so the operator can grip and twist/shift it between **Rundown** and **High Torque**, covering and revealing the **OSHA Blue** and **OSHA Red** indicator stripes on the Clutch Housing underneath.

---

## 4. Two-Speed Clutch Shift & OSHA Blue / Red Groove Synchronization (`p = 0.505 – 0.560`, `mechanism-switch`)

### Where and When (4a)
- **Beat:** `mechanism-switch` (`p = 0.505 – 0.560`), immediately after exiting the knurling sequence.
- **Current Code:**
  - `src/scene/torque-wrench/MechanismDirector.ts`: `out.shift = smooth((q - 0.46) / 0.055)` starts moving the ring switch at `p = 0.505` immediately.
  - `src/scene/torque-wrench/LegacyMechanismCamera.ts`: `bell = smooth((legacy - 0.13167) / 0.00667)` does not finish zooming in until `p ≈ 0.523`, when `shift` is already halfway complete, and views the ring from the snout side so the ring overhangs and hides the OSHA Red groove.
- **Reference Screenshots:**
  - Far view at start of shift: `C:\Users\Markimus\Pictures\Screenshots\ringSwitch-1.png`
  - Zoomed-in view where red groove is obstructed by the ring lip: `C:\Users\Markimus\Pictures\Screenshots\Screenshot 2026-10-21 140303.png` and `C:\Users\Markimus\Pictures\Screenshots\ringSwitch-oshaRedPaintGroove.png`

### What Is Wrong & Required Fix (4b)
- **Current Defect:**
  1. The ring switch starts shifting while the camera is still far away at the overview pose, so the viewer only sees the OSHA Blue stripe from afar.
  2. By the time the camera zooms in, the shift is nearly finished, and the camera angle stays on the snout side of the ring so the ring switch body obstructs almost the entire OSHA Red paint groove (`ringSwitch-oshaRedPaintGroove.png`).
- **Required Behavior:**
  1. **Settle Camera First (or stay close from Step 3b):** Hold `shift = 0` until the camera is settled on the ring switch with the **OSHA Blue** paint stripe clearly visible.
  2. **Shift + Camera Swing:** Animate the ring switch translating/twisting along the gearbox (`shift: 0 -> 1`) while swinging the camera slightly toward the **handle side** so the newly uncovered **OSHA Red** paint stripe is unobstructed and clearly legible.

---

## 5. Input Shaft (`P001835`) Isolation & Machining Entry (`p = 0.560 – 0.620`, `inspection-isolation`)

### Where and When (5a)
- **Beat:** `inspection-isolation` (`p = 0.560 – 0.620`), transitioning from the two-speed clutch into the Input Shaft (`P001835`) machining sequence.
- **Current Code:** `src/scene/torque-wrench/JourneyCamera.ts` (`isolationCamera` at lines 9–15 sets `position = (0, 0.24*sin(12°), -0.035762 - 0.24*cos(12°))`, looking almost straight down the `-Z` shaft axis during the `0.585 – 0.600` gearbox fade-out).

### What Is Wrong & Required Fix (5b)
- **Current Defect:** `isolationCamera` looks nearly straight down the longitudinal axis of the wrench when the gearbox fades out, foreshortening the input shaft and hiding how `P001835` mates with the surrounding planetary gears, bearing, and clutch components.
- **Required Behavior:**
  1. Glide the camera during the approach into a **profile / side-three-quarter view** of the gearbox as the fade begins (`p = 0.585`).
  2. **25–30% Opacity Pause on Mating Parts (Owner Ruling):** Pause/plateau the surrounding gearbox and mating planetary/clutch components at **25–30% ghost opacity** during the profile view so the viewer clearly sees how the Input Shaft (`P001835`) sits inside the gearbox and meshes with its mating parts before fading them completely to `0%`.
  3. Only *after* the mating parts finish fading out (`p >= 0.600`), transition the camera into the initial shaping/relief-groove machining view.

---

## 6. Matrix-Style Low Orbit During Drawing Shatter (`p = 0.360 – 0.460`, `breakthrough-*`)

### Where and When (6a)
- **Beat:** `breakthrough-trace` / `breakthrough-pressure` / `breakthrough-rupture` / `breakthrough-emergence` (`p = 0.360 – 0.460`).
- **Current Code:** `src/scene/drawing/sheetCamera.ts` (`shots` at lines 89–95 keeps `head = 0°` and `elev = 90°` all the way to `t = 0.79` / `p = 0.395`, then only lowers `elev` to `58°` with zero azimuth swing) and `src/scene/torque-wrench/OpeningDirector.ts` (`SHATTER_SUBJECT_KNOTS`).
- **Reference Screenshot:** `C:\Users\Markimus\Pictures\Screenshots\start-orbiting-bullet-time-here.png`

### What Is Wrong & Required Fix (6b)
- **Current Defect:** There is still a lull right before the sheet fractures where the camera sits static above the paper, and when the sheet shatters, the camera never orbits low around the flying shards.
- **Required Behavior:**
  1. Reclaim scroll budget from the pre-shatter lull (before rupture) and allocate it to the shatter window.
  2. As the sheet fractures and the shards lift above the pit (around the state shown in `start-orbiting-bullet-time-here.png`), drop the camera **low to the paper/desk** and execute a **cinematic Matrix-style azimuth orbit** around the suspended shards and rising wrench before handing off to the post-emergence view.

---

## 7. Bullet-Time Slowdown Law: 10% Speed Instead of Frozen Standstill

### Where and When
- **All Bullet-Time Windows:**
  1. **Drawing Shatter Hold** (`OpeningDirector.ts`, `SHATTER_SUBJECT_KNOTS` around `p = 0.43008 – 0.44212`, currently `t: 0.855 -> 0.8558`, ~1.6% speed).
  2. **Ring Switch Knurling Bullet-Time** (`RingInspection.ts`, `KNOTS` at display time `8 s – 18 s`, specifically `[9, 4.365] -> [17, 4.375]`, currently `0.00125x` speed — effectively frozen).
  3. **Input Shaft Cutter & Hobbing Bullet-Time** (`InspectionDirector.ts` / `kinematics.ts`, `inspection-bullet-time` `p = 0.68 – 0.72` and `hobSwing` `p = 0.776 – 0.784`).

### What Is Wrong & Required Fix
- **Current Defect:** During bullet time, the parts (shattered paper shards flying away, brass knurling wheel + ring switch rotation) drop so close to zero velocity that they look completely frozen/paused rather than slowed down in time.
- **Required Behavior:** Set the baseline bullet-time slowdown ratio to **10% of normal speed (`0.10x`)** across the bullet-time windows so the shattered pieces visibly drift outward and the knurling tool / workpieces visibly rotate slowly while the camera sweeps around them at full speed. Expose this ratio cleanly so Mark can dial the percentage up or down after visual review.

---

## 8. Portfolio HUD, Clickable GD&T Part Callouts with Leaders & Educational Design Copy

### Where and When
- Across the live `/torque-wrench/` experience (`Story.tsx`, `Scene.tsx`, and ported overlay components from `src/components/ToleranceStations.tsx` + `src/scene/stations/stationData.ts`).

### What Is Wrong & Required Fix
- **Current Defect:**
  1. `Story.tsx` currently displays internal/meta build notes (e.g., *"Slow the subject, keep the camera alive"*, *"Give the second owner annotation its own reading hold"*) instead of viewer-facing engineering storytelling about what is happening on screen and Mark's design/manufacturing decisions.
  2. The rich HUD and GD&T leader callouts from the original JGun portfolio animation (`ToleranceStations.tsx` / `stationData.ts`) are not yet integrated into the `/torque-wrench/` rebuild.
- **Required Behavior:**
  1. Bring over the HUD and **GD&T callouts with 3D-tracked leaders** from the original JGun animation, making them **clickable to zoom/focus on the referenced part**.
  2. **Approved GD&T Callout Roster (Owner Ruling, 2026-10-21):**
     - **Remove** the Air Motor (`rotor-note`).
     - **Include:**
       - **Clutch Housing** (`P000420 -> P000245`, `⌀2.525 H7/k6`, finished after heat treat)
       - **Ring Switch** (`P003068`, two-speed mode selector, OD diamond knurl & detent grooves)
       - **LCD Manometer** (rear handle digital pressure/torque readout cluster `P002115` / `BK11356`)
       - **Second-Stage Planet Gear (`P000247` in cage assembly `A000592`)** shown in the exploded view with its Total Runout feature control frame (`< .001" TIR`, ISO 1328 Grade A6).
     - **Future Stage-2 Planet (`P000247` / `A000592`) Exploded-View Feature Animation (Recorded for Follow-On Implementation):**
       During the exploded view, all rotating drivetrain parts slow to a stop; one of the `P000247` second-stage planet gears flies out perpendicular to the exploded axis and spins slowly on its own axis while the GD&T callout displays its Total Runout feature control frame. The planet gear then accelerates back up to full speed and whips back into place inside the `A000592` carrier cage, jumpstarting the entire planetary assembly back into full-speed rotation.
  3. Replace the meta build-note copy in `Story.tsx` / HUD overlays with **viewer-facing engineering and design-phase narrative** explaining what the viewer is seeing on screen, why each part was designed/toleranced/machined that way, and Mark's role as the designer.

---

## 9. Defect: Ring Switch (`P003068`) Internal Bore & Faces Incorrectly Shown as Knurled

### Where and When
- **Beat:** `inspection-ring` entry/exit and assembled wrench views whenever the source Ring Switch (`P003068`) is visible at close range.
- **Reference Screenshot:** `C:\Users\Markimus\Pictures\Screenshots\Screenshot 2026-10-21 154101.png`

### Root Cause & Required Fix
- **Root Cause 1 (`src/scene/torque-wrench/RuntimeWorld.tsx` line 84):** `cloneMaterialShape` calls `source.clone()` when creating `sourceRingMaterials`. In Three.js, `Material.prototype.clone()` does **not** copy `onBeforeCompile` or `customProgramCacheKey` unless explicitly copied (as `cloneRoleMaterial` in `materials.ts` or the `knurl` loop in `RuntimeWorld.tsx` lines 541–543 does). As a result, as soon as `sourceRingMaterials` is installed at `p >= 0.44`, the source Ring Switch loses `applyRingSwitchOdKnurlMask` and applies the diamond-knurl normal map across 100% of its surfaces (end faces and internal bore).
- **Root Cause 2 (`src/scene/rig/materials.ts` lines 225–241):** Even when `applyRingSwitchOdKnurlMask` runs, it only masks out `abs(normalize(vRingSwitchObjectNormal).z)` (planar axial end faces). On the **cylindrical internal bore (ID)** of `P003068`, `normal.z` is also `0`, so the internal bore still receives full knurl perturbation!
- **Required Fix:**
  1. In `RuntimeWorld.tsx` `cloneMaterialShape`, preserve `clone.onBeforeCompile = source.onBeforeCompile` and `clone.customProgramCacheKey = source.customProgramCacheKey.bind(source)`.
  2. In `src/scene/rig/materials.ts` `applyRingSwitchOdKnurlMask`, pass the mesh-local radial position/normal and gate the knurl mask by **both** `abs(normal.z) < 0.20` **and** outward radial normal + outer radius (`dot(normalize(vRingSwitchObjectPos.xy), normalize(vRingSwitchObjectNormal.xy)) > 0.5 && length(vRingSwitchObjectPos.xy) > odThreshold`), so **only the outer diameter (OD)** is knurled and all internal bore and axial faces remain smooth anodized aluminum.

---

## 10. Defect: Missing Input Shaft FEA Stress & Failed Material Attempts HUD (`ShaftStoryLayer`)

### Where and When
- **Beat:** `inspection-shaping` through `inspection-runout` (`p = 0.620 – 0.825`), especially `inspection-materials` (`p = 0.720 – 0.755`, master time `15.0 s – 22.6 s`) and `inspection-runout` (`33.2 s – 35.0 s`).

### Root Cause & Required Fix
- **Root Cause:** `src/components/ShaftStoryLayer.tsx` (which renders the `AISI 4140 (40-45 HRC)`, `AISI 4340 (48-50 HRC)`, and `C300 (56-58 HRC)` material attempt cards, the red `FAILED` stamp, the left `Model Name / Study / Plot type / Material / Min FOS` block, and the right `FOS` color-gradient bar synced to `sampleShaftScript` and `sampleFosPresentation`) has the comment `Not mounted anywhere in the app` and was never mounted inside `src/scene/torque-wrench/Scene.tsx` or `TorqueWrenchPage.tsx`!
- **Required Fix:** Mount `<ShaftStoryLayer time={subjectTime} reducedMotion={false} />` inside the live `/torque-wrench/` scene overlay when `studyVisible` is active (`p in [0.62, 0.845]` or manual playback open), driven by `inspection.subjectTime`, so the FEA Factor-of-Safety legend, model metadata block, alloy cards, and `FAILED` stamps appear in lockstep with the 3D stress shader on `P001835`.
