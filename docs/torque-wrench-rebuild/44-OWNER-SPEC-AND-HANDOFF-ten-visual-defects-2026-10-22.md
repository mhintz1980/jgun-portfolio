# 44 — Owner Specification & Next-Session Handoff: Ten Visual Defects (2026-10-22)

**Workspace:** `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`
**Branch:** `torque-wrench/rebuild` (HEAD `43ad0648` — doc39 + doc42 work committed and pushed)
**Preview:** `http://localhost:5341/torque-wrench/` (production build; restart after every rebuild)

After live visual review of `43ad0648`, Mark identified ten remaining visual and choreography defects. **This session is handoff-only** — no code changes for these ten items have been made yet. Every item below has its exact root cause traced to the current source and line numbers so the receiving session can go straight to implementation.

---

## 1. Profile View Linework Still Visible at the Start of the Scroll Bar

### What Mark sees
At the very top of the page (`scrollY = 0`, `progress = 0`), part of the profile / handle silhouette in the upper-left of the viewport is already visible on the vellum. It must be drawn progressively as the user scrolls.

### Root Cause in Source (Two Mechanisms)
1. **`uFragmentPrint` on the 99 `paper-fragment-*` meshes paints the entire finished drawing onto the vellum from `progress = 0` (`src/scene/torque-wrench/privateSheetRuntime.ts:230–233, 475–482, 727–743`):**
   - In `makeFragmentPrint` (`src/scene/drawing/sheet/breakthrough.ts:62–100`), a static 2048×1280 canvas texture is baked once at load with **all segments and fills unconditionally drawn onto it**, ignoring `uReveal`.
   - The 99 Voronoi `paper-fragment-*` meshes tile the entire side-view profile hole and sit at `z = 0.00002` (above `paper` at `z = 0`) with `mesh.visible = stockVisible` (`true` from `t = 0`) and `uFragment = 1`.
   - In `paperFragment` (`privateSheetRuntime.ts:230–233`), `if (uFragment > 0.5)` samples `uFragmentPrint` and mixes navy ink (`vec3(.06, .09, .18)`) onto the fragment faces at every frame, even when `uFracture == 0`! Whenever the camera looks across the side-view region (or during the whole-sheet reveal at `t = 0.28..0.38`), the fragments display the complete pre-baked side profile before `uReveal[GROUP.side]` has drawn it.
2. **Detail D / early groups at `t = 0` (`src/scene/drawing/sheetCamera.ts:74, 158`):**
   - At `t = 0.0`, the camera opens tight on `DETAIL D` (`[0.085, -0.165]`, a 2:1 cutaway of the handle/trigger profile) and `WINDOWS` has `[GROUP.detailD, 0.0, 0.1]`.
   - Even at `t = 0`, any stroke in `GROUP.detailD` (or `GROUP.titleBlock`) with `key = 0` starts drawing immediately on the first tiny scroll tick, and the side profile `GROUP.side` (`[0.28, 0.39]`) finishes 91% of its window before the camera even settles square-on to the side elevation at `t = 0.38`.

### Required Fix (Item 1)
- In `src/scene/torque-wrench/privateSheetRuntime.ts`:
  - Gate `fragments` visibility (or gate the `uFragmentPrint` ink mix in `paperFragment` by `smoothstep(0.0, 0.02, uFracture)`) so intact stock before fracture (`intro.fracture <= 0`, i.e., `t < 0.84`) shows **only** the `uReveal`-driven instanced `lines` and `fills` meshes, never the static `uFragmentPrint` texture.
- In `src/scene/drawing/sheetCamera.ts`:
  - Start `GROUP.detailD` slightly above zero (e.g., `[GROUP.detailD, 0.008, 0.10]`) so `t = 0` is clean vellum + border.
  - Shift `GROUP.side` (and `sideDims`, `sideLabels`, `gdt`) so the 1:1 side profile visibly draws across the sheet while the camera frames it (`t ≈ 0.29..0.41`).

---

## 2. Bullet-Time Orbit Reverses Direction (~70° Clockwise, Then 360° Counter-Clockwise)

### What Mark sees
When the model breaks through the drawing and the bullet-time sequence starts, the camera moves in a clockwise orbit for about 70° before reversing its path and doing a 360° orbit in the opposite direction (counter-clockwise). The bullet-time sequence must orbit in **one continuous direction** the entire time.

### Root Cause in Source
Compare the two camera stages that meet at `SHATTER_ORBIT_START = 0.430`:
1. **Before `p = 0.430` (`src/scene/drawing/sheetCamera.ts:100–103`, `shots()`):**
   - `t = 0.79 -> 0.84 -> 0.90 -> 1.0` sweeps `head` from `-20° -> 0° -> +65° -> +150°`.
   - Up to `p = 0.430` (`openingTimeAt(0.430) ≈ 0.881`, `head ≈ +50°`), `sampleOpeningCamera` delegates to `introCameraPose`, where increasing `head` from `-20°` to `+50°` rotates the camera in the **clockwise** direction (~70° total).
2. **At `p = 0.430` (`src/scene/torque-wrench/OpeningCamera.ts:24–41`):**
   - `sampleOpeningCamera` switches to its own spherical formula:
     `const azimuth = startAzimuth + (Math.PI * 2 + endDelta) * u`
   - Adding `+2 * Math.PI` sweeps `azimuth` in the **counter-clockwise** direction — the exact opposite sense of `sheetCamera.ts`!

### Required Fix (Item 2)
- Unify the rotational direction across `sheetCamera.ts` (`t >= 0.72`) and `OpeningCamera.ts` (`p in [0.42, 0.452]`) so the azimuth angle moves **monotonically in one single direction** from the start of the camera rake through the full 360° bullet-time orbit into the overview handoff, with C1 angular-velocity continuity at the join.
- Add a unit test in `OpeningCamera.test.ts` verifying that `unwrap(az[i] - az[i - 1])` never changes sign across `p in [0.38, 0.452]`.

---

## 3. Shards Fly at Uniform Height; Need a Spherical / Dome Explosion & Camera Orbiting Through the Shrapnel

### What Mark sees
The shards that fly into the air when the model breaks through the drawing all float at the same flat height above the desk. Mark wants:
- A **spherical / dome explosion pattern**: shards from the **center of the profile view** launch **higher**, while shards near the **edges** fly outward on a **flatter trajectory**.
- The camera should feel like it is **orbiting right through the chaos and shrapnel**.

### Root Cause in Source
In `src/scene/torque-wrench/privateSheetRuntime.ts:730–739`:
1. `const lift = .16 * Math.sin(Math.PI * event)` gives every shard the exact same vertical arch.
2. In `breakthroughGeometry.ts:1106`, `f.velocity.z` is positive (`0.7 .. 1.0`), so `Math.min(0, f.velocity.z)` in `privateSheetRuntime.ts:739` evaluates to **`0` for every single shard**! That completely erased per-shard vertical velocity variation.
3. Neither `breakthroughGeometry.ts` nor `privateSheetRuntime.ts` weights vertical lift vs. outward radial throw by the shard's distance from the profile center.

### Required Fix (Item 3)
- In `src/scene/torque-wrench/privateSheetRuntime.ts` (and/or `breakthroughGeometry.ts`):
  - Compute each shard's normalized radial distance `rNorm in [0, 1]` from the profile center `layout.primaryCenter` (using the profile half-extents `rx ≈ 0.18 m`, `ry ≈ 0.11 m`).
  - **Center shards (`rNorm -> 0`)**: launch high (`z` apex `0.22–0.34 m`, with per-shard `f.velocity.z` variation restored so they fill a 3D dome volume) and moderate lateral spread.
  - **Edge shards (`rNorm -> 1`)**: launch on a flatter trajectory (`z` apex `0.03–0.09 m`) with stronger outward XY radial velocity directed away from `layout.primaryCenter`.
  - Tune the bullet-time camera elevation/distance so the low 360° orbit passes right through the mid-altitude shrapnel ring while keeping the rising wrench unoccluded at the center.

---

## 4. Missing Camera Swing Close-Up on the Knurling Die + Bullet-Time Needs 10–20% Die Rotation

### What Mark sees
During the Ring Switch knurling sequence, the camera stays zoomed out. Mark wants:
1. A **camera swing close-up** when the knurling tool is laying down the pattern, showing the **knurling die rolling the diamond pattern into the part**.
2. A **faster bullet-time rate** during the knurling bullet-time window so the viewer sees **about 10–20% of a rotation of the knurling die** while in bullet time.

### Root Cause in Source
1. **No close-up zoom (`src/scene/torque-wrench/InspectionDirector.ts:435–444`, `RING_CAMERA_KNOTS`):**
   Every knot has `distanceScale: 1` and `fov: 32` with `target = (0, 0, 0)` because the `ring contained` gate in `verify-torque-camera-hud.mjs` demanded that the entire ring bounding box stay inside the viewport at `0.4805`.
2. **Die rotation in bullet time (`src/scene/torque-wrench/RingInspection.ts:8–15` & `src/scene/inspection/timeline.ts`):**
   Check how `samplePrivateRing` and `ringRuntimeCore.ts` drive the roller wheel rotation during the bullet-time window (`t = 8..18 s`, `p ≈ 0.4768 – 0.492`) and calibrate the bullet-time rate so the knurling die visibly rolls **10–20% of a full revolution (36°–72°)** with crisp, un-blurred teeth pressing into the OD.

### Required Fix (Item 4)
- In `src/scene/torque-wrench/InspectionDirector.ts` (`RING_CAMERA_KNOTS` and `samplePrivateRingCamera`):
  - Add a close-up camera swing during `p in [0.4768, 0.4905]` that dollies in (`distanceScale ≈ 0.48–0.58` or tighter `fov ≈ 22–25°`) and targets the active knurling die / ring OD contact nip while respecting the azimuth limit (`azimuth <= 2.95 rad` per `ringSwitch-knurlView-camAngleLimit.png`), then pulls back smoothly to whole-ring framing by `p = 0.4945`.
  - Update `verify-torque-camera-hud.mjs` so `0.4805` verifies the close-up on the knurling die contact zone while the entry/exit checkpoints (`0.469, 0.4725, 0.4945, 0.500, 0.505, 0.520, 0.545`) verify whole-ring containment.
- In `src/scene/torque-wrench/RingInspection.ts` (and `ringRuntimeCore.ts`):
  - Adjust the bullet-time rate during `8..18 s` so the knurling die visibly completes **10–20% of a revolution** across the bullet-time close-up.

---

## 5. Ring Switch Should Move Slightly Further to Show More OSHA Red (Without Exposing the Cam Groove)

### What Mark sees
At `RING_SWITCH_TRAVEL_SCALE = 0.62`, the ring switch stops a hair too early, showing only a thin edge of the red painted groove. Mark wants it to move **just a little bit further down the gearbox** to show more of the red painted groove, without exposing the machined teardrop cam groove underneath.

### Root Cause in Source
In `src/scene/rig/wrenchMechanics.ts:44–45`, `RING_SWITCH_TRAVEL_SCALE = 0.62` (`5.91 mm` of the `9.525 mm` stroke) barely clears the leading edge of `P000420 Speed Indicator (Red)` (`z = -0.10715 m`, width `1.5 mm`).

### Required Fix (Item 5)
- In `src/scene/rig/wrenchMechanics.ts`, increase `RING_SWITCH_TRAVEL_SCALE` from `0.62` to **`0.74 – 0.78`** (`7.05 – 7.43 mm`).
- Verify with close-up captures at `p = 0.545` and `p = 0.560` that the full `1.5 mm` red painted band is clearly visible while the machined teardrop cam pocket on `P000420` remains 100% covered by the collar skirt.

---

## 6. Missing Camera Swing (>= 45°) When Starting the Input Shaft Sequence

### What Mark sees
When the Ring Switch animation ends and the red groove is shown (`p = 0.560`), the gearbox fades away leaving the input shaft at almost the exact same camera angle that the Ring Switch sequence ended on. Mark wants the camera to **swing around 45° or more into a different position** before fading the gearbox out completely.

### Root Cause in Source
Compare the two poses in `InspectionDirector.ts` and `JourneyCamera.ts`:
- At `p = 0.560`, `ringExitPose` (`RING_GROOVE_VIEW.red`) is at `azimuth = 3.55 rad` (`203.4°`), `elevation = 0.2 rad` (`11.5°`).
- At `p = 0.590`, `isolationCamera` (`src/scene/torque-wrench/JourneyCamera.ts:9–15`) has offset `(-0.235, +0.050, -0.055)` from `target`, which is `azimuth ≈ 193°`, `elevation = 12°`.
- Because `203.4°` and `193°` are only **~10° apart**, `shortOrbit(ringExitPose, isolationCamera, ...)` over `p = 0.560 -> 0.590` barely moves the camera!

### Required Fix (Item 6)
- In `src/scene/torque-wrench/JourneyCamera.ts` (`isolationCamera`):
  - Move `isolationCamera` to an orientation at least **45°–70° away** from `ringExitPose` (e.g., swinging from the rear/handle-side `-Z` quarter around to a forward/snout-side three-quarter or elevated cutaway profile with `+Z` offset and `22°–28°` elevation) during `p = 0.560 -> 0.590` while the gearbox fades to the 27.5% ghost plateau, before fading completely to 0% at `p = 0.600`.
  - Add a unit test in `JourneyCamera.test.ts` asserting that the angular separation between `ringExitPose` (`p = 0.560`) and `isolationCamera` (`p = 0.590`) around the target is `>= 45°`.

---

## 7. Unwanted Camera Shift When Scrolling Stops (Disable Automatic Passive Pointer-Hover Deflection)

### What Mark sees
Whenever the user stops scrolling, the camera view automatically shifts to a higher/different location. Mark states: *"I dont want that effect. Keep the camera where it was when scrolling stopped unless the user chooses to enter free mode or partial orbit view with there mouse."*

### Root Cause in Source
In `src/scene/torque-wrench/stopAndAppreciate.ts:325–353` ("Mode A: Passive SecondOrderDynamics pointer look"):
- Whenever `pointerMoved` is true (the cursor has touched the window), stopping scroll for `SCROLL_STATIONARY_DELAY_SEC = 0.12 s` ramps `passiveWeight` from `0 -> 1` and deflects the camera by up to **±25° (`PASSIVE_LOOK_MAX_DEG`)** toward the cursor position (`yaw = -dyn.x * PASSIVE_LOOK_MAX_RAD * passiveWeight`, `pitch = dyn.y * PASSIVE_LOOK_MAX_RAD * passiveWeight`).
- If the cursor rests in the upper half of the viewport while wheel-scrolling, stopping scroll pitches the camera upward every time.

### Required Fix (Item 7)
- In `src/scene/torque-wrench/stopAndAppreciate.ts` (and `RuntimeWorld.tsx`):
  - Disable automatic passive pointer-hover camera deflection when scrolling stops (`passiveWeight = 0` in Mode A). When scrolling stops, the camera must stay **100% locked at the authored scroll pose**.
  - Only deflect or orbit the camera when the user explicitly enters **Free Look / Inspect mode** (`F` key or clicking `Free Look / Inspect (F)`) or actively **drags with the mouse**.
  - Update `stopAndAppreciate.test.ts` accordingly.

---

## 8, 9 & 10. Input Shaft Coordinate-Frame Bug: FEA Mapped on Wrong Section (Both Shafts) & Hobbed Shaft Starts With Teeth Already Cut

### What Mark sees (Images #1 and #2)
- **Item 8 (Image #2 — Legacy grooved shaft FEA):** The blue FEA band is painted way up on the large upper collar/drive-tang body, while the **area just below the gear (the cutter relief groove)** is bare silver metal. Mark states: *"the FEA color mapping is incorrect (see attached image). it should be yellow and red in the area just below the gear. see images."*
- **Item 9 (Hobbed input shaft teeth):** *"The input shaft (hobb version) starts with all of the gear teeth already cut BEFORE the hobb cutter even appears. It should appear as the teeth get cut (if possible)."*
- **Item 10 (Image #1 — Hobbed shaft FEA):** *"the hobb version also has the FEA colormapping on the wrong section of the part geometry. see image"* — the blue FEA band is painted on the middle collar instead of the gear-tooth runout / lead-out section highlighted in yellow by Mark.

### Root Cause in Source (ONE Shared Bug Causes All Three!)
Look at `attachPart` in `src/scene/inspection/shaft/shaftRuntime.ts:294–315` and `RuntimeWorld.tsx:867, 909`:
1. When `createShaftRuntime` is called in `RuntimeWorld.tsx:859`, `scene.add(runtime.root)` runs immediately (`line 867`).
2. On the very next frame — **while `manufacturing-core-full.glb` is still fetching/parsing asynchronously** — `RuntimeWorld`'s `useFrame` loop (`line 909`) copies the world `registration` matrix onto `runtime.root.matrix`:
   `runtime.root.matrix.copy(registration)`
   where `registration` translates by `[-0.07752 m, 0, +0.02143 m]` (`[-77.52 mm, +21.43 mm, 0]` in shaft space)!
3. When the GLB finishes loading and `attachPart` runs (`shaftRuntime.ts:294`):
   ```ts
   root.updateWorldMatrix(true, true)
   ...
   matrix.multiplyMatrices(toShaft, mesh.matrixWorld)
   setShaftTransform(uniforms, matrix)
   ```
   Because `root.matrix` is already `registration` (NOT identity!), `mesh.matrixWorld` includes `root.matrixWorld` (`registration`)!
4. Multiplying `toShaft * mesh.matrixWorld` therefore bakes the world `registration` offset `(-77.52 mm, -21.43 mm, 0)` into `uShaftMatrix`! As a result, for every vertex on the shaft:
   - `vShaftLocal.y = y_true - 21.432 mm` (spanning `[-21.43 mm, +50.09 mm]` instead of `[0 mm, +71.52 mm]`)!
   - Look at what that `-21.432 mm` axial shift did:
     - **Why Defect 9 happened (hobbed teeth already cut before hob appears):**
       In `progression.ts:310`, `jgProgressedRadius` only inflates the cut gear teeth back to the uncut blank OD (`uShaftOD`) when `jgLocal.y >= uFaceStart (3.1749 mm) && jgLocal.y <= uFaceEnd (13.78 mm)`.
       Because the actual gear teeth (`y_true in [3.175, 13.78] mm`) had `jgLocal.y = y_true - 21.432 in [-18.26, -7.65] mm`, they **failed `jgLocal.y >= uFaceStart`**! So the shader never inflated the gear teeth to the uncut blank OD, and `approvedshaft` rendered with all 10 teeth already cut from the start!
     - **Why Defects 8 & 10 happened (FEA painted on the middle collar instead of below the gear, and missing yellow/red):**
       In `shaftRuntime.ts:631`, `stress.yMin = 0; stress.yMax = 16;` gates the FEA band by `step(0.0, vShaftLocal.y) * (1.0 - step(16.0, vShaftLocal.y))`.
       Because `vShaftLocal.y = y_true - 21.432`, `vShaftLocal.y in [0, 16]` selected **`y_true in [21.43 mm, 37.43 mm]`** — the big middle collar of the shaft! Meanwhile, the actual gear teeth, relief groove (`y_true = 10.41 mm`), and hob lead-out (`y_true = 13.4 mm`) had `vShaftLocal.y in [-21.43, -7.43] mm < 0`, so `step(0.0, vShaftLocal.y)` was **`0` (completely clipped out)**! And because `stress.centerY` was at `vShaftLocal.y = -11.02 mm`, only the far-field blue tail (`FOS = 3.0`) reached `vShaftLocal.y in [0, 16]`!

### Required Fix (Items 8, 9 & 10)
1. **Fix `attachPart` in `src/scene/inspection/shaft/shaftRuntime.ts` (`lines 293–315`):**
   - Compute each mesh's transform **relative to `root` (study-local space)**, never including `root.matrixWorld` (`registration`)!
   - Specifically, either premultiply by `root.matrixWorld.clone().invert()` (`matrix.copy(root.matrixWorld).invert().premultiply(toShaft).multiply(mesh.matrixWorld)`) or save `root.matrix`, reset `root.matrix.identity()`, call `root.updateWorldMatrix(true, true)`, compute `matrix.multiplyMatrices(toShaft, mesh.matrixWorld)`, and restore `root.matrix`.
   - Also in `makeStressOverlayMaterial` (`src/scene/inspection/shaft/progression.ts`), remove the `uShaftAxis` / `bindingAxisOffset` workaround once `uShaftMatrix` is purely study-local (`vShaftLocal.xz` is then naturally centered on `(0, 0)` with radius `<= 8.865 mm`, and `vShaftLocal.y` is in true CAD millimetres `[0, 71.524]` with `y = 0` at the pilot tip, `y = 3.175..9.875` on shaped teeth, `y = 10.41` at the relief groove floor, and `y = 13.4` at the hobbed lead-out).
2. **Verify Item 9 (Hobbed shaft starts as smooth uncut blank and cuts teeth progressively):**
   - With `uShaftMatrix` in true CAD millimetres, at `t = 22.6..25.0 s` (`revised-blank`), `approvedState.mode = 'hobbing'` and `uHobYc = -4.195 mm < uFaceStart`, so `jgProgressedRadius` clamps all tooth vertices in `y in [3.175, 13.78]` to `uShaftOD` (a smooth cylindrical blank). As the TiN hob cutter feeds from `t = 25..32 s`, the gear teeth are cut progressively right behind the hob!
   - Note: Also make sure `makeStressOverlayMaterial` vertex shader uses `VERTEX_CHUNK` with the corrected `uShaftMatrix` so the FEA overlay mesh matches the progressed geometry.
3. **Tune Item 8 (Legacy grooved shaft FEA, Image #2) and Item 10 (Hobbed shaft FEA, Image #1):**
   - **Legacy shaft (`stress = 'warm'`, `t = 15..22.6 s`, Image #2):**
     - Hotspot center is `FOS_CENTER_Y.attempt = 10.41 mm` (the cutter relief groove right below the gear teeth).
     - Set `stress.yMin = 2.5; stress.yMax = 18.0; stress.rMax = 9.0;` (or cover the gear + relief groove + adjacent shoulder) and tune `jgCore` / `jgSkirt` in `progression.ts` so the **cutter relief groove and base of the gear teeth (`y ≈ 8.5..12.5 mm`, highlighted in yellow by Mark in Image #2) glow vividly in red, orange, and yellow (`FOS = 0.55 / 0.72 / 0.90`)** with blue on the adjacent lower-stressed shaft section.
   - **Hobbed shaft (`stress = 'cool'`, `t = 32.8..35.0 s`, Image #1):**
     - Hotspot center is `FOS_CENTER_Y.revised = 13.4 mm` (the smooth hobbed tooth runout / lead-out zone just below the gear teeth, highlighted in yellow by Mark in Image #1).
     - Set `stress.yMin = 2.5; stress.yMax = 18.0; stress.rMax = 9.0;` so the FEA color maps directly onto the gear-tooth runout / lead-out transition section instead of the middle collar.

---

## Ready-to-Paste Continuation Prompt for Next Session

```text
Resume on branch torque-wrench/rebuild (repo mhintz1980/jgun-portfolio; local checkout C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench if running locally).

1. Read the canonical 10-defect specification and handoff first:
   - docs/torque-wrench-rebuild/44-OWNER-SPEC-AND-HANDOFF-ten-visual-defects-2026-10-22.md
   - TODO.md
   - View the two committed owner reference images:
     * docs/torque-wrench-rebuild/44-ref-item8-legacy-shaft-fea.png (Item 8: Legacy grooved shaft — yellow/red FEA required in the cutter relief groove just below the gear)
     * docs/torque-wrench-rebuild/44-ref-item10-hobbed-shaft-fea.png (Item 10: Hobbed shaft — FEA required on the tooth runout / lead-out section just below the gear teeth)

2. Implement all 10 fixes documented with exact root causes in doc44:
   - Item 1 (Profile blank at scroll 0): Gate uFragmentPrint / paper-fragment-* meshes in privateSheetRuntime.ts so the static pre-baked fragment print never renders while intro.fracture == 0, and tune sheetCamera.ts WINDOWS so the profile draws progressively as the user scrolls.
   - Item 2 (Unidirectional bullet-time orbit): Align sheetCamera.ts pre-rupture rake and OpeningCamera.ts 360-deg bullet-time orbit so the camera orbits in one continuous direction without the 70-deg clockwise -> 360-deg counter-clockwise reversal at p = 0.430.
   - Item 3 (Spherical / dome shard explosion): Fix Math.min(0, f.velocity.z) zeroing out velocity.z in privateSheetRuntime.ts and weight shard trajectory by radial distance from layout.primaryCenter so center shards fly high (0.22-0.34 m) and edge shards fly out flatter, with the camera orbiting through the shrapnel cloud.
   - Item 4 (Knurling die close-up swing + 10-20% die rotation in bullet time): Add a close-up camera swing onto the knurling die / OD contact zone during p = 0.4768-0.4905 in InspectionDirector.ts and calibrate the bullet-time rate in RingInspection.ts / ringRuntimeCore.ts so the knurling die visibly rotates 10-20% of a turn during bullet time.
   - Item 5 (Ring switch slightly further travel): Increase RING_SWITCH_TRAVEL_SCALE in wrenchMechanics.ts from 0.62 to ~0.74-0.78 so the full OSHA Red groove width is shown without exposing the machined cam slot underneath.
   - Item 6 (>= 45-deg camera swing into Input Shaft sequence): Reposition isolationCamera in JourneyCamera.ts so the camera swings >= 45 deg from ringExitPose during p = 0.560-0.590 before fading the gearbox out completely at p = 0.600.
   - Item 7 (No camera shift when scrolling stops): Disable automatic passive pointer-hover camera deflection on scroll stop in stopAndAppreciate.ts so the camera stays locked where scrolling stopped unless the user enters Free Look or drags with the mouse.
   - Items 8, 9 & 10 (Input Shaft root-local uShaftMatrix fix): Fix attachPart in shaftRuntime.ts so uShaftMatrix is computed in study-root-local space (excluding RuntimeWorld registration), restoring true CAD millimetre coordinates (y = 0 at pilot tip, y = 3.175..13.78 on gear teeth, y = 10.41 at relief groove, y = 13.4 at hob lead-out). Verify that: (9) approvedshaft starts as a smooth uncut blank and cuts teeth progressively as the hob feeds; (8) legacyshaft warm FEA shows vivid yellow/red in the relief groove just below the gear; and (10) approvedshaft cool FEA maps onto the gear-tooth runout section just below the gear.

3. Run npm run typecheck, npm test, npm run build, restart the preview server on http://localhost:5341/torque-wrench/, verify all 10 items with runtime telemetry and screenshots, and present the results for owner visual review.
```
