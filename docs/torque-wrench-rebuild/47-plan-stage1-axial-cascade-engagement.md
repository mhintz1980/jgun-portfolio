# Implementation Plan: Stage 1 Planetary Mesh & Axial Driveline Cascade

**Target Workspace:** `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench` (with parity references in `jgun-portfolio`)
**Feature Branch:** `torque-wrench/rebuild`
**Task ID:** `JG-038-C1-STAGE1` (supersedes `supports` and `finale` in doc26/doc29/doc46)
**Status:** ADVERSARIALLY REVIEWED & UPGRADED — READY FOR IMPLEMENTATION (PLAN ONLY; DO NOT AUTO-EXECUTE)

---

## 0. Multi-Agent Adversarial Critique of Draft v1 (Why Draft v1 Would Have Failed or Looked Generic)

Before locking this plan for implementation, a multi-agent technical and visual audit (`doubt-driven-development`, `code-review-and-quality`, `cad-scene-graph-rigging`, `r3f-cad-cinematography`, and `codebase-memory` on `jgun-torque-wrench-rebuild`) uncovered **eight critical architectural, mathematical, and visual defects** in Draft v1 that have been corrected in this specification:

1. **Reversed Axial Slide Direction (Would Park Stage 1 Inside the Solid Rear Shaft Shoulder):**
   - **Draft v1 Bug:** Task 2 parked Stage 1 at `Z = Z_rest - 0.040 m` and translated `+0.040 m` into mesh.
   - **Measured CAD Reality:** In study space (`shaftLocalToStudy` in `src/scene/inspection/shaft/frame.ts:9`, where shaft-local `+Y` maps to study `-Z`), the Input Shaft (`P001835-2`) spans `study Z in [-0.07152, 0.00000] m` (`shaft Y in [0.00, 71.52] mm`). Its pilot tip sits at `study Z = 0.00000 m`, its 10 sun-gear teeth sit at `study Z in [-0.00952, -0.00318] m` (`shaft Y in [3.18, 9.52] mm`), and the thick rear bearing/spline body (`r = 8.86 mm`) extends toward `-Z` (`-0.07152 m`). Meanwhile, Stage 1 (`A000591` / `P001836`) sits on the **front snout (`+Z`) side** at `study Z in [-0.00940, +0.01118] m` (`shaft Y in [-11.18, +9.40] mm`).
   - **Correction:** Parking Stage 1 at `Z_rest - 0.040 m` embeds it inside the solid rear shaft body and slides it *off* the tip. Stage 1 must start retracted on the open snout side at **`Z = Z_rest + 0.028 m`** (`study Z in [+0.0186, +0.0392] m`, `shaft Y in [-39.18, -18.60] mm`, clearing the `Z = 0` pilot tip by `18.6 mm`) and glide **`-0.028 m` along study `-Z`** (`+Y` in shaft-local mm) onto the sun gear teeth.

2. **Broken Sun-to-Planet Meshing Ratio & Post-Hobbing Phase Offset (`-3.6°` Tooth Collision + Stationary Sun):**
   - **Draft v1 Bug:** Draft v1 assumed `θ_sun = 0` at `t = 35.0s` and kept `shaftRuntime.ts:403` (`approvedAngle = kinematics.hobWorkPhi + schedule.finaleAngle`), which rotates `approvedshaft` at `1.0 × finaleAngle`—the **exact same angular velocity** as the Stage 1 carrier (`ratio = 1.0`). Relative to the Stage 1 carrier, the sun gear was completely stationary while the 4 planets spun through its teeth! Furthermore, at the end of rotary hobbing (`t = 31.8s`), `hobPhiAt(31.8)` completes `2.9` hob turns (`HOB_REV_RATE = 0.5 × 5.8s`), leaving `hobWorkPhi = -0.29 × 2π` (`-104.4° = -3 × 36° + 3.6°`), which is `3.6°` off the rest-pose tooth pitch (`36°`).
   - **Correction:**
     - **Post-Hobbing Spindle Home Indexing (`31.8s -> 32.8s`):** Mirroring `legacyShaftAngle` (`shaftRuntime.ts:127`), index `approvedshaft` forward by the remaining `+0.01` revolution (`+3.6°`, from `-0.29` turns to `-0.30` turns = exactly `3` whole sun-gear tooth pitches) across `31.8s -> 32.8s` so at `t >= 32.8s` its 10 teeth match the rest-pose `Default.glb` clocking to `< 1e-12 rad`.
     - **Exact Conjugate Rolling Law (`SUN_TO_STAGE1_CARRIER_RATIO = 5.2`):** `P001835-2` has `N_s = 10` teeth (`36°` pitch) and each Stage 1 planet `P000247` has `N_p = 12` teeth (`30°` pitch, pin radius `r_pin = 11.641 mm`, pin azimuths `39.06°, 129.06°, -140.94°, -50.94°`). Because each planet counter-rotates on its pin relative to the Stage 1 carrier by `θ_planet_local = -3.5 × θ_c1`, zero-slip pitch-circle rolling requires `N_s × (θ_sun - θ_c1) = -N_p × θ_planet_local => 10 × (θ_sun - θ_c1) = 12 × 3.5 × θ_c1 = 42 × θ_c1`, giving **`θ_sun = 5.2 × θ_c1`**. Every sun tooth crest stays locked in its mating planet valley throughout rotation.

3. **Coordinate-System Mismatch in `camera.ts` (Cartesian Metres vs. Spherical Anchors):**
   - **Draft v1 Bug:** Tasks 3 and 5 specified Cartesian camera coordinates (`[0.025, 0.015, -0.010]`, FOV `28°–38°`).
   - **Codebase Reality:** `src/scene/inspection/shaft/camera.ts:53–115` uses spherical `CameraAnchor` rows (`az` in deg minus `FOLLOW_AZIMUTH_MOD / DEG`, `el` in deg, `dist` in metres, telephoto `fovDesktop`/`fovNarrow`, and `tgt` in **shaft-local millimetres** where `+Y` is the shaft axis). Placing a `28°` camera at `25 mm` distance breaks the spherical interpolator and causes severe wide-angle distortion.
   - **Correction:** Author all `35.0s -> 43.0s` camera keyframes as spherical `CameraAnchor` rows in `camera.ts` with telephoto focal lengths (`fovDesktop: 8.8° -> 22°`, `fovNarrow: 16.5° -> 28°`) and `C1` continuity across `t = 35.0s`.

4. **Crushed Scroll Budget & Frozen Camera in `InspectionDirector.ts` and `JourneyDirector.ts`:**
   - **Draft v1 Bug:** Draft v1 did not touch `src/scene/torque-wrench/InspectionDirector.ts`. Currently, `SUBJECT_KNOTS` (`InspectionDirector.ts:20–36`) crushes the entire 11-second window `t = 32.0s -> 43.0s` into `0.035` of progress (`0.905 -> 0.940`), and `CAMERA_KNOTS` (`InspectionDirector.ts:42–53`) crushes `t = 32.0s -> 43.0s` into `0.905 -> 0.925` and **freezes the camera at `43.0s` from `0.925` to `0.940`**.
   - **Correction:** Re-author `SUBJECT_KNOTS` and `CAMERA_KNOTS` in `InspectionDirector.ts` so `t = 32.0s -> 43.0s` has a generous, synchronized scroll span with a dedicated **10% Bullet-Time Torque Ignition window** (`t = 38.5s -> 40.2s`) and continuous camera motion all the way to `0.940`.

5. **Shared Material Clones & Missing Cascade Units in `cloneNeighbours()`:**
   - **Draft v1 Bug:** Task 5 assumed `cloneNeighbours()` in `shaftRuntime.ts:273–311` could independently fade and slide Stage 1..5, `K000004`, `P000095`, and `P000245`. In reality, `cloneNeighbours()` only loops over `STAGE_IDS` (`stage1..stage5`), omits `rig.bearing` (`K000004`), `rig.outputShaft` (`P000095`), and `rig.housing` (`P000245`), and shares a **single `materialClones` Map across all 5 stages**—so setting opacity on Stage 2 would overwrite Stage 1's opacity!
   - **Correction:** Expand `cloneNeighbours()` into a deterministic 8-unit driveline cascade pool (`stage1`, `stage2`, `stage5`, `bearing`, `stage3`, `stage4`, `output`, `outerHousing`) where **each unit owns its own isolated cloned `Material[]` array** and records its rest `baseZ` in `modelFrame` (`gearboxLocal`).

6. **AST Zero-Allocation Guard Violation in `shaftRuntime.test.ts`:**
   - **Draft v1 Bug:** Section 2.4 proposed `cascadeAlpha: number[]` and `cascadeOffsetZ: number[]` on telemetry without noting the AST test in `src/scene/inspection/shaft/shaftRuntime.test.ts:238–260`, which parses the TypeScript AST of `sample`, `apply`, `telemetry`, `sampleShaftSchedule`, `sampleShaftCamera`, and `sampleShaftKinematics` and **fails the test suite if any `new`, `{...}`, `[...]`, or arrow function appears inside those functions**.
   - **Correction:** Pre-allocate fixed-length tuples/arrays on `schedule` and `probe` inside `createShaftSchedule()` and `createShaftRuntime()`, and mutate elements exclusively by index (`out.cascadeAlpha[i] = ...`) inside the per-frame samplers.

7. **Violation of the Owner's Move-During-Fades Law (Doc 39 §0) & C3 Bullet-Time Ethos (Doc 26 / Doc 39 §7):**
   - **Draft v1 Bug:** Task 2 faded Stage 1 in while parked stationary for a full second (`35.0s–36.0s`) before moving, and Task 4 spun the gears immediately to full speed where the 10 sun teeth blur into strobing aliasing.
   - **Correction:** Overlap fade-in with axial glide (`35.0s–38.2s`), and apply the **10% (`0.10×`) Bullet-Time Slowdown Law** during initial torque ignition (`38.5s–40.2s`) while the camera executes a live `18°` macro azimuth swing across the pitch point so the viewer sees individual involute teeth pushing planet flanks before ramping to full cascade speed (`40.2s–43.0s`).

8. **Wrong DOM Target (`Story.tsx` vs. `ShaftStoryLayer.tsx` & `StaticShaftStory.tsx`):**
   - **Draft v1 Bug:** Task 6 targeted only `src/scene/torque-wrench/Story.tsx` (which holds the 5 top-level page chapters) and Task 7 targeted `src/shared/PosterImage.tsx`.
   - **Correction:** Update `src/components/ShaftStoryLayer.tsx`, `src/scene/inspection/shaft/script.ts`, `src/components/StaticShaftStory.tsx`, AND `src/scene/torque-wrench/Story.tsx` so live HUD telemetry cards, screen-reader transcripts, and reduced-motion static inspection views all stay in 100% parity.

---

## 1. Executive Summary & Visual Direction

### 1.1 Aesthetic & Engineering North Star
> **Visual Standard:** Awwwards Site-of-the-Year / Mastercraft industrial cinematography (`build-awwwards-quality-sites`, `r3f-cad-cinematography`). Grazing directional PBR lighting across ground AISI 4340 gear flanks, travelling anisotropic pitch-line contact glint, shallow macro depth-of-field, 0.10× bullet-time tooth-push ignition, and a rapid, physically ordered epicyclic cascade culminating in the R9 three-quarter composition inside a 28% ghosted satin black oxide housing.

### 1.2 Timeline Architecture (`32.0s – 43.0s` Master Clock)

```
32.0s          35.0s                  38.2s 38.5s            40.2s                        43.0s
  |-- Runout ----|-- Phase 1: Stage 1 --|-1C-|-- Phase 2A ----|------ Phase 2B: Cascade ----|
  |   Hold &     |   Simultaneous Fade  |Seat| 0.10x Bullet   | Stage 2 -> Stage 5 ->       |
  |   Home Index |   + Axial Slide (-Z) |Ring| Time Tooth     | K000004 -> Stage 3 ->       |
  |   (31.8-32.8)|   + Flank Glint      |    | Push & Orbit   | Stage 4 -> P000095 -> R9    |
```

1. **Runout Hold & Invisible Spindle Indexing (`32.0s – 35.0s`, `runout-hold`):**
   - As the rotary hob withdraws (`31.8s – 32.8s`), `approvedShaftAngle` smoothly advances the finished `P001835-2` shaft by `+0.01` turn (`+3.6°`, completing the 3rd whole tooth pitch at `-0.30 × 2π`) so its 10 involute teeth sit at exact rest-pose registration with `Default.glb`.
   - The cool blue FEA Factor-of-Safety field (`FOS >= 1.85`) and `AISI 4340 (H.T. 48-50 HRC)` card complete their hold and fade cleanly by `35.0s`.
2. **Phase 1 — Stage 1 Planetary Approach, Axial Slide & Flank Glint (`35.0s – 38.5s`, `stage1-mesh`):**
   - **Simultaneous Move-During-Fade (`35.0s – 38.2s`):** The camera sweeps from the side runout framing into a tight telephoto oblique macro (`fovDesktop: 9.2°`) aimed at the sun gear's upper-right pitch circle (`r = 5.29 mm`). Simultaneously, the Stage 1 assembly (`A000591`: carrier `P001836` + 4× `P000247` 12-tooth planets) materializes (`opacity: 0 -> 1` over `35.0s – 35.8s`) while gliding axially `-28.0 mm` along study `-Z` (`from Z_rest + 0.028 m to Z_rest`).
   - **Traveling Involute Contact Glint (`36.0s – 38.2s`):** As the 4 planet gears slide over the `6.35 mm` sun gear face width (`shaft Y = 3.175 mm -> 9.525 mm`), the `graze` directional light orbits `+28°` to rake across the `20°` pressure-angle flanks, and a zero-allocation shader uniform (`uAxialContactY`) sweeps a crisp `0.35 mm` specular oil-film contact highlight down the engaging tooth flanks.
   - **Critically Damped Datum Seat (`38.2s – 38.5s`):** At `t = 38.2s`, Stage 1 seats with a `0.08 mm` critically damped oil-film compression settle and a brief cyan pitch-circle datum pulse (`r = 11.641 mm`, opacity bell `0 -> 0.55 -> 0`), confirming full `6.35 mm` axial face engagement.
3. **Phase 2A — 0.10× Bullet-Time Torque Ignition & Epicyclic Proof (`38.5s – 40.2s`, `cascade-finale` Part A):**
   - **Backlash Take-Up & Tooth Push:** At `t = 38.5s`, motor torque ignites under the **0.10× Bullet-Time Slowdown Law** while the camera executes a live `18°` azimuth swing (`az: 42° -> 60°`, `el: -14° -> +8°`) around the meshing gears.
   - **Exact Conjugate Rolling:** The viewer sees the 10-tooth `P001835-2` sun gear rotate at `θ_sun = 5.2 × θ_c1`, its involute flanks pushing the four 12-tooth `P000247` planets (`θ_planet_local = -3.5 × θ_c1`), which walk inside a faint `18%` ghost witness of the stationary housing ring gear (`P000245`) and drive the `P001836` Stage 1 carrier + its forward sun snout in the same direction as the input shaft at stepped-down speed.
4. **Phase 2B — Time-Ramp Release, Driveline Axial Cascade & R9 Composition (`40.2s – 43.0s`, `cascade-finale` Part B):**
   - **Crane Pull-Back & Time Release:** From `40.2s -> 40.6s`, rotational speed ramps smoothly (`C1`) from `0.10×` bullet-time to `1.0×` display cascade rate while the camera pulls back on a centripetal crane arc along the driveline toward the **R9 three-quarter perspective**.
   - **Staggered Driveline Cascade:** Following the exact physical driveline order from motor to snout, each downstream unit fades in while gliding axially (`-Z` onto the preceding carrier's integral sun snout) and immediately locks into the **monotonic 65% speed reduction ladder**:
     - `40.2s – 40.9s`: **Stage 2 (`A000592` / `P001837` + 4× `P000247`)** slides onto Stage 1's nose sun gear (`5.20` turns = `0.65×` Stage 1).
     - `40.6s – 41.3s`: **Stage 5 (`A000606` / `P001849` + 4× `P000248`, 3rd physical cage)** slides onto Stage 2's nose sun gear (`3.38` turns = `0.65×` Stage 2).
     - `40.9s – 41.5s`: **Thrust Bearing Ring (`K000004`)** and **Approved Shaft Supports (`K000210` / `K000211`)** seat into their final axial shoulders (`0.00` turns, static races).
     - `41.2s – 41.9s`: **Stage 3 (`A000860` / `P003045` + 4× `P000069`)** slides onto Stage 5's nose sun gear (`2.20` turns = `0.65×` Stage 5).
     - `41.5s – 42.2s`: **Stage 4 (`A000861` / `P003047` + 5× `P003046`)** slides onto Stage 3's nose sun gear (`1.43` turns = `0.65×` Stage 3).
     - `41.8s – 42.5s`: **Output Spindle Cluster (`P000095` + `P000207` + `K000001` + `K000074`)** locks over Stage 4's carrier pins at the front snout (`0.93` turns = `0.65×` Stage 4).
     - `42.1s – 42.9s`: **Outer Gearbox Housing (`P000245`) & Clutch Housing (`P000725`)** sweep over the active gear train in smooth satin black oxide (`#040404`, zero lathe stripes per Doc 46), pausing at a **28% ghost opacity plateau (`42.3s – 42.7s`)** so the entire 5-stage monotonic speed ladder remains visible spinning inside the shell before settling at `43.0s` for the seamless main-world handoff.

---

## 2. Measured CAD Coordinates, Kinematics & Shader Specifications

### 2.1 Measured Study-Space Coordinates (Verified Against `Default.glb` & `manufacturing-core-full.glb`)

In `shaftRuntime.ts`, `modelFrame` (`study-narrative-rest-registration`) applies `narrativeModelToStudy(matrix).multiply(gearboxLocal)`. In this frame, the gear-train centerline is `(X = 0, Y = 0)`, the snout points toward **`+Z`** (which equals shaft-local `-Y`), and the motor/handle points toward **`-Z`** (which equals shaft-local `+Y`):

| Cascade Index | Unit Key | D1-AP Part Numbers | Rest Study Z Span (m) | Rest Shaft-Local Y Span (mm) | Axial Approach Offset `ΔZ_start` (m) | Entry Window (s) | Display Speed Ratio (rel. Stage 1) |
|---|---|---|---|---|---|---|---|
| **0 (Driver)** | `approvedshaft` | `P001835-2` (10T Sun) | `[-0.07152, 0.00000]` (Teeth: `[-0.00952, -0.00318]`) | `[0.00, +71.52]` (Teeth: `[3.18, 9.52]`) | `0.000` (Fixed datum) | `0.0 – 43.0` | **`5.200×`** (`1 + (12/10)×3.5`) |
| **1** | `stage1` | `A000591`: cage `P001836` + 4× `P000247` (12T) | `[-0.00940, +0.01118]` (Pins: `Z = -0.00622`, `r = 11.641 mm`) | `[-11.18, +9.40]` | **`+0.028`** (Clears `Z = 0` tip by `18.6 mm`) | `35.0 – 38.2` | **`1.000×`** (`8.00` turns) |
| **2** | `stage2` | `A000592`: cage `P001837` + 4× `P000247` (12T) | `[+0.00190, +0.02829]` | `[-28.29, -1.90]` | **`+0.042`** | `40.2 – 40.9` | **`0.650×`** (`5.20` turns) |
| **3** | `stage5` | `A000606`: cage `P001849` + 4× `P000248` (3rd cage) | `[+0.01351, +0.04618]` | `[-46.18, -13.51]` | **`+0.048`** | `40.6 – 41.3` | **`0.4225×`** (`3.38` turns) |
| **4** | `bearing` | `K000004` thrust ring + `K000210`/`K000211` supports | `[+0.01117, +0.01817]` (`K000210`: `[-0.01962, -0.01565]`) | `[-18.17, -11.17]` | **`+0.035`** | `40.9 – 41.5` | **`0.000×`** (Static race; `K000211` spins with shaft) |
| **5** | `stage3` | `A000860`: cage `P003045` + 4× `P000069` (4th cage) | `[+0.02764, +0.06871]` | `[-68.71, -27.64]` | **`+0.052`** | `41.2 – 41.9` | **`0.275×`** (`2.20` turns) |
| **6** | `stage4` | `A000861`: cage `P003047` + 5× `P003046` (5th cage) | `[+0.04118, +0.07998]` | `[-79.98, -41.18]` | **`+0.056`** | `41.5 – 42.2` | **`0.17875×`** (`1.43` turns) |
| **7** | `output` | `P000095` + `P000207` + `K000001` + `K000074` | `[+0.06257, +0.12097]` | `[-120.97, -62.57]` | **`+0.060`** | `41.8 – 42.5` | **`0.11625×`** (`0.93` turns) |
| **8** | `housing` | `P000245` outer shell + `P000725` clutch housing | `[-0.00484, +0.09974]` | `[-99.74, +4.84]` | **`+0.065`** (`P000245`) / `0.000` (`P000725`) | `42.1 – 42.9` | **`0.000×`** (28% ghost plateau `42.3–42.7s`) |

### 2.2 Closed-Form Mathematical Laws (Zero Per-Frame Allocations)

1. **Approved Shaft Home Indexing (`approvedShaftHomeAngle(time, hobWorkPhi)` in `shaftRuntime.ts`):**
   - At `t = 31.8s`, `hobWorkPhi = -0.29 × 2π rad`.
   - Over `APPROVED_INDEX_WINDOW = { start: 31.8, end: 32.8 }`, blend `hobWorkPhi` forward (in the same negative-angle direction as hobbing) to `home = -0.30 × 2π rad` (`-3 × 2π / 10`, an exact integer multiple of `SPACE_PITCH_RAD = 2π / 10`):
     ```ts
     export const APPROVED_INDEX_WINDOW = Object.freeze({ start: 31.8, end: 32.8 })
     export const SUN_TO_STAGE1_CARRIER_RATIO = 5.2 // 1 + (12 / 10) * 3.5

     export function approvedShaftBaseAngle(time: number, hobWorkPhi: number): number {
       const { start, end } = APPROVED_INDEX_WINDOW
       if (!(time > start)) return hobWorkPhi
       const pitch = (2 * Math.PI) / 10
       const home = Math.floor(hobWorkPhi / pitch) * pitch // -3 * pitch = -0.30 * 2π
       const x = time >= end ? 1 : (time - start) / (end - start)
       const k = x * x * x * (x * (x * 6 - 15) + 10)
       return hobWorkPhi + (home - hobWorkPhi) * k
     }
     ```
   - During `t >= 38.5s`, total shaft rotation is `approvedAngle = approvedShaftBaseAngle(t, kinematics.hobWorkPhi) + schedule.finaleAngle * SUN_TO_STAGE1_CARRIER_RATIO`.

2. **Two-Slope Bullet-Time & Cascade Angular Integral (`finaleAngle` in `schedule.ts`):**
   - Ignition starts at `T_SPIN_START = 38.5s`.
   - **Bullet-Time Ignition Window (`38.5s – 40.2s`):** Carrier angular rate ramps over `38.5s – 38.8s` (backlash take-up) from `0` to `ω_bullet = 0.10 × ω_cascade` (`0.025 rev/s` carrier = `0.130 rev/s` sun gear), holding `0.10×` bullet-time through `40.2s` so the viewer sees `~0.22` sun-gear revolutions (`2.2` tooth pitches) pushing the 4 planets in crystal-clear macro slow motion.
   - **Cascade Speed Ramp (`40.2s – 43.0s`):** Between `40.2s` and `40.6s`, angular rate ramps smoothly (`C1` cubic Hermite integral) from `ω_bullet` to `ω_cascade = 0.25 rev/s` carrier (`1.30 rev/s` sun gear), holding through `43.0s`.

3. **Critically Damped Axial Slide Curve (`axialSlideProgress(t, tStart, tSeat)` in `schedule.ts`):**
   - For Stage 1 (`tStart = 35.0s`, `tSeat = 38.2s`), translation begins immediately at `35.0s` (overlapping with opacity ramp `35.0s – 35.8s` per Doc 39 §0):
     - Over `u = clamp01((t - tStart) / (tSeat - tStart))`, primary travel follows quintic smoothstep `q(u) = u^3 (10 - 15u + 6u^2)`.
     - Over the settle window `t in [38.2s, 38.45s]`, a critically damped oil-film micro-compression adds `-0.00008 m × sin(π × (t - 38.2) / 0.25) × (1 - (t - 38.2) / 0.25)^2` before locking at `0.000 m` for `t >= 38.45s`.

4. **Traveling Involute Flank Glint Uniform (`uAxialContactY` & `uAxialContactMix` in `progression.ts`):**
   - Reuse the existing `ProgressionUniforms` on `approvedshaft` (zero new shader programs or draw calls!).
   - Add two scalar uniforms to `ProgressionUniforms`: `uAxialContactY` (shaft-local mm, sweeping `3.175 -> 9.525 mm` as `slideProgress` advances from `0.65 -> 1.0`) and `uAxialContactMix` (`0 -> 1 -> 0` over `36.0s – 40.2s`).
   - In the fragment shader of `applyProgression`, compute an anisotropic specular-cyan highlight band `smoothstep(0.45, 0.0, abs(vShaftPos.y - uAxialContactY)) * uAxialContactMix` weighted by tooth-flank radial normal, illuminating the exact line of action where the 4 planet gears slide and push against the 10 sun teeth.

### 2.3 Spherical Camera Choreography (`src/scene/inspection/shaft/camera.ts`)

Replace the legacy `35.8s – 43.0s` anchors in `camera.ts` with these exact spherical `CameraAnchor` rows (all `az` values expressed as `machineAzimuthDeg - FOLLOW_AZIMUTH_MOD / DEG`, `tgt` in shaft-local mm where `y in [3.18, 9.52]` is the sun gear face and `y < 0` extends forward into the planetary stages toward the snout):

| Time `t` (s) | Machine `az` (deg) | `el` (deg) | `dist` (m) | `fovDesktop` (deg) | `fovNarrow` (deg) | `tgt` Desktop `[x, y, z]` (mm) | `tgtNarrow` `[x, y, z]` (mm) | Visual Beat & Framing Purpose |
|---|---|---|---|---|---|---|---|---|
| **33.2 – 35.0** | `24.2` | `4.2` | `0.200` | `13.0` | `32.6` | `[0, 17.5, -4.0]` | `[0, 8.0, 5.5]` | Existing card-safe runout hold (unchanged for C1 continuity at 35.0s) |
| **36.2** | `38.0` | `-11.5` | `0.188` | `9.4` | `17.5` | `[0, 4.5, 3.2]` | `[0, 4.5, 2.0]` | Oblique front-quarter macro looking slightly up the pilot tip as Stage 1 glides in from `y = -28 mm` |
| **38.2** | `42.0` | `-8.0` | `0.182` | `8.8` | `16.2` | `[0, 6.2, 3.8]` | `[0, 6.2, 2.4]` | Tight telephoto lock on the upper-right sun/planet pitch circle (`r = 5.29..11.64 mm`) at full `6.35 mm` seating |
| **38.5** | `43.5` | `-6.5` | `0.182` | `8.8` | `16.2` | `[0, 6.2, 3.8]` | `[0, 6.2, 2.4]` | Settle hold & datum ring pulse before torque ignition |
| **40.2** | `61.5` | `+7.5` | `0.195` | `9.8` | `18.0` | `[0, 5.0, 2.5]` | `[0, 5.0, 1.5]` | **18° Bullet-Time Orbit Swing** across the meshing teeth during `0.10×` slow-motion tooth push |
| **41.6** | `32.0` | `+14.0` | `0.310` | `16.5` | `25.0` | `[0, -24.0, 0.0]` | `[0, -24.0, 0.0]` | Mid-crane pullback tracking along the snout axis (`-Y` shaft-local = `+Z` study) as Stages 2, 5, `K000004`, 3, 4 cascade |
| **42.6** | `16.0` | `+11.0` | `0.380` | `20.5` | `28.5` | `[0, -38.0, 0.0]` | `[0, -38.0, 0.0]` | **R9 Three-Quarter Establishing Framing** as `P000245` sweeps over at 28% ghost plateau |
| **43.0** | `16.0` | `+11.0` | `0.380` | `20.5` | `28.5` | `[0, -38.0, 0.0]` | `[0, -38.0, 0.0]` | Settled R9 hold (`0.4s` C1 shoulder) ready for `JourneyCamera.ts` return/explode handoff |

---

## 3. Comprehensive Skill, Plugin, MCP & CLI Routing Matrix

Implementing sessions **must** follow the repository's phase-scoped skill loading policy (`project/context/agent-skills.md`): load only the phase-relevant `SKILL.md` or MCP tool when entering that phase rather than pre-loading all skills at once.

| Phase / Gate | Task Scope | Required Skill / Plugin / MCP / CLI | Exact Path / Command & When to Use |
|---|---|---|---|
| **Phase 0: Structural Graph & Blast-Radius Audit** | Verify all callers of `sampleShaftSchedule`, `sampleShaftCamera`, `samplePrivateInspection`, and `SHAFT_BEAT_LABELS` before editing. | **MCP:** `mcp__codebase_memory_mcp`<br>**Skill:** `codebase-memory` | **Skill:** `C:/Users/Markimus/.codex/skills/codebase-memory/SKILL.md`<br>**MCP Calls:** `index_status`, `trace_path`, `detect_changes`, `check_index_coverage` on project `jgun-torque-wrench-rebuild`. Use before Task 1 and after Task 5. |
| **Phase 0.5: Offline Lookdev, Reference Plates & Pre-Viz (Optional / Asset Prep)** | Generate high-contrast involute flank grazing reference plates, cascade timing pre-viz, or static reduced-motion cutaway renders without adding runtime GLB bytes. | **Skill:** `higgsfield-generate`<br>**CLI:** `higgsfield` (`C:\nvm4w\nodejs\higgsfield.ps1`)<br>**MCP:** `mcp__Blender` | **Skill:** `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/.agents/skills/higgsfield-generate/SKILL.md`<br>**Commands:**<br>• Lookdev reference: `higgsfield generate create gpt_image_2_5 --prompt "macro studio product shot of precision ground AISI 4340 involute sun gear meshing with 4 planetary gears inside a satin black oxide housing, raking blue-steel rim light and warm specular flank highlight on #05070a background" --aspect_ratio 16:9 --resolution 2k --wait`<br>• Cascade motion pre-viz: `higgsfield generate create seedance_2_5 --mode omni_reference --start-image <frame.png> --prompt "macro crane pullback as 5 planetary gear stages slide axially into mesh along a central shaft" --duration 5 --resolution 1080p --wait`<br>• Optional micro-acoustics: `higgsfield generate create seed_audio --prompt "precision oiled steel planetary gear teeth meshing click followed by low turbine reduction hum" --wait`<br>• **Blender MCP:** `mcp__Blender__execute_blender_code` for offline vertex clearance verification if CAD assets are open. |
| **Phase 1: Rigging, Multi-Unit Clone Pool & Schedule Refactor** | Refactor `story.ts` & `schedule.ts`; expand `cloneNeighbours()` in `shaftRuntime.ts` to clone `stage1..5`, `K000004`, `P000095`, and `P000245` with isolated per-unit material arrays. | **Skill:** `cad-scene-graph-rigging`<br>**Skill:** `planning-and-task-breakdown` | **Skills:**<br>• `C:/Users/Markimus/.codex/skills/cad-scene-graph-rigging/SKILL.md`<br>• `C:/Users/Markimus/.agents/skills/planning-and-task-breakdown/SKILL.md`<br>**When:** Read before Task 1 & Task 2. Enforce D1-AP part numbers (`P001836`, `P000247`, `K000004`, `P000095`, `P000245`), union AABB bounds, and per-unit material clone isolation. |
| **Phase 2: Involute Kinematics, 0.10× Bullet-Time & Flank Glint Shader** | Implement `approvedShaftBaseAngle`, `SUN_TO_STAGE1_CARRIER_RATIO = 5.2`, `0.10×` bullet-time ignition, datum pulse ring, and `uAxialContactY` shader glint. | **Skill:** `r3f-cad-cinematography`<br>**Skill:** `threejs-shaders`<br>**Skill:** `glsl-transition-shader-pipeline` | **Skills:**<br>• `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/.agents/skills/r3f-cad-cinematography/SKILL.md`<br>• `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/.agents/skills/threejs-shaders/SKILL.md`<br>• `C:/Users/Markimus/.codex/skills/glsl-transition-shader-pipeline/SKILL.md`<br>**When:** Read before Task 2 & Task 4. Enforce zero per-frame allocations (AST-tested in `shaftRuntime.test.ts`) and pure closed-form functions of `time`. |
| **Phase 3: Spherical Camera Choreography & Scroll Knot Re-Allocation** | Author spherical `CameraAnchor` rows in `camera.ts` and re-balance `SUBJECT_KNOTS` / `CAMERA_KNOTS` in `InspectionDirector.ts`. | **Skill:** `build-threejs-scroll-worlds`<br>**Skill:** `scroll-scrubbed-visual-sequence`<br>**Skill:** `r3f-scroll-performance-guard` | **Skills:**<br>• `C:/Users/Markimus/.agents/skills/build-threejs-scroll-worlds/SKILL.md`<br>• `C:/Users/Markimus/.agents/skills/scroll-scrubbed-visual-sequence/SKILL.md`<br>• `C:/Users/Markimus/.codex/skills/r3f-scroll-performance-guard/SKILL.md`<br>**When:** Read before Task 3 & Task 5. Enforce `C1` continuity across `35.0s` and `43.0s`, desktop/narrow safe-frame bounds, and move-during-fade compliance. |
| **Phase 4: HUD Narrative, Transcripts & Reduced-Motion Parity** | Update `ShaftStoryLayer.tsx`, `script.ts`, `StaticShaftStory.tsx`, and `Story.tsx`. | **Skill:** `spatial-hotspot-a11y`<br>**Skill:** `cinematic-gsap-lenis-motion-system`<br>**Skill:** `build-awwwards-quality-sites` | **Skills:**<br>• `C:/Users/Markimus/.codex/skills/spatial-hotspot-a11y/SKILL.md`<br>• `C:/Users/Markimus/.agents/skills/cinematic-gsap-lenis-motion-system/SKILL.md`<br>• `C:/Users/Markimus/.agents/skills/build-awwwards-quality-sites/SKILL.md`<br>**When:** Read before Task 6 & Task 7. Ensure WCAG polite live-region announcements and static reduced-motion parity. |
| **Phase 5: Bundle Hygiene, Typecheck & Unit Suite** | Verify TypeScript, Vitest unit suites (including AST zero-allocation test), and Vite production build. | **Skill:** `asset-and-bundle-hygiene`<br>**CLI:** `npm`, `npx vitest` | **Skill:** `C:/Users/Markimus/.codex/skills/asset-and-bundle-hygiene/SKILL.md`<br>**Commands:**<br>• `npm run typecheck`<br>• `npx vitest run src/scene/inspection/shaft/ src/scene/torque-wrench/ --maxWorkers=4`<br>• `npm run build` |
| **Phase 6: Live WebGL Telemetry & Multi-Axis Adversarial Review** | Restart preview server, run Playwright telemetry verifier (`scripts/verify-stage1-cascade.mjs`), and perform fresh-context adversarial review. | **Skill:** `webgl-telemetry-verifier`<br>**Skill:** `playwright`<br>**Skill:** `doubt-driven-development`<br>**Skill:** `code-review-and-quality`<br>**MCP:** `mcp__cua_repl__js` | **Skills:**<br>• `C:/Users/Markimus/.codex/skills/webgl-telemetry-verifier/SKILL.md`<br>• `C:/Users/Markimus/.agents/skills/doubt-driven-development/SKILL.md`<br>• `C:/Users/Markimus/.agents/skills/code-review-and-quality/SKILL.md`<br>**When:** After every `npm run build` and fresh preview server restart (`http://localhost:5281/torque-wrench/`). Never rely on vision alone. |

---

## 4. Detailed, Ordered Task Breakdown

### Phase 1: Foundation, Story Metadata & Scroll-Clock Allocation

#### Task 1: Refactor Story Metadata, Beat Labels, and Cascade Schedule Tuple
- **Skills to Read First:** `cad-scene-graph-rigging`, `r3f-scroll-performance-guard`
- **Description:** Update `src/scene/inspection/shaft/story.ts` and `src/scene/inspection/shaft/schedule.ts` to replace `supports` (`35–39s`) and `finale` (`39–43s`) with `stage1-mesh` (`35.0–38.5s`) and `cascade-finale` (`38.5–43.0s`), while preserving deterministic, zero-allocation state mutation.
- **Implementation Details:**
  1. In `src/scene/inspection/shaft/story.ts`:
     - Update `ShaftBeatId`: replace `'supports' | 'finale'` with `'stage1-mesh' | 'cascade-finale'` (or retain aliases in type unions only if external consumers require them; check via `mcp__codebase_memory_mcp__search_code`).
     - Update `shaftBeats`:
       - `beat('runout-hold', 32, 35)`
       - `beat('stage1-mesh', 35, 38.5)`
       - `beat('cascade-finale', 38.5, 43)`
     - Update `shaftStory.chapters[3]` to `{ id: 'stage1-cascade', label: 'Planetary mesh and driveline cascade', start: 35, end: 43 }`.
  2. In `src/scene/inspection/shaft/schedule.ts`:
     - Define `export const CASCADE_UNIT_COUNT = 8` corresponding to `[stage1, stage2, stage5, bearing, stage3, stage4, output, outerHousing]`.
     - Extend `ShaftSchedule` with pre-allocated fixed-length arrays created once inside `createShaftSchedule()`:
       - `stage1SlideProgress: number` (`0 -> 1` across `35.0s – 38.2s` with critically damped micro-settle over `38.2s – 38.45s`)
       - `datumPulseAlpha: number` (bell curve `0 -> 0.55 -> 0` over `38.15s – 38.50s`)
       - `contactGlintMix: number` (`0 -> 1 -> 0` over `36.0s – 40.2s`)
       - `contactGlintYmm: number` (sweeping `3.175 -> 9.525 mm` as Stage 1 slides onto the sun teeth)
       - `bulletTimeActive: boolean` (`true` during `38.5s <= t < 40.2s`)
       - `cascadeAlpha: number[]` (length 8, mutated in-place by index `0..7` inside `sampleShaftSchedule`)
       - `cascadeOffsetZ: number[]` (length 8, mutated in-place by index `0..7`, starting at `[+0.028, +0.042, +0.048, +0.035, +0.052, +0.056, +0.060, +0.065]` metres and gliding to `0.000` across each unit's entry window)
       - `housingGhostAlpha: number` (ramps `0 -> 0.28` over `42.1s – 42.3s`, holds the **28% ghost plateau** over `42.3s – 42.7s`, then ramps `0.28 -> 1.0` over `42.7s – 43.0s`)
     - Compute `out.finaleAngle` as a `C1` piecewise closed-form integral starting at `t = 38.5s`:
       - `38.5s – 38.8s`: smoothstep acceleration from `0` to `ω_bullet = 0.05 * Math.PI` rad/s (`0.025 rev/s` Stage 1 carrier = `0.130 rev/s` sun gear, 10% bullet-time speed).
       - `38.8s – 40.2s`: constant bullet-time rate `ω_bullet` so the viewer clearly sees teeth pushing teeth.
       - `40.2s – 40.6s`: smoothstep ramp from `ω_bullet` to `ω_cascade = 0.50 * Math.PI` rad/s (`0.25 rev/s` Stage 1 carrier = `1.30 rev/s` sun gear).
       - `40.6s – 43.0s`: constant cascade rate `ω_cascade`.
     - **Zero-Allocation Invariant:** Do **not** use `new`, array literals `[...]`, object literals `{...}`, or arrow functions inside `sampleShaftSchedule()`.
- **Verification:**
  - Update `src/scene/inspection/shaft/schedule.test.ts` to verify beat boundaries, shuffled-seek determinism, monotonic `stage1SlideProgress`, `C1` continuity of `finaleAngle` across `38.5s`, `38.8s`, `40.2s`, and `40.6s`, staggered cascade arrivals, and the `0.28` housing ghost plateau.
- **Dependencies:** None
- **Files Touched:**
  - `src/scene/inspection/shaft/story.ts`
  - `src/scene/inspection/shaft/schedule.ts`
  - `src/scene/inspection/shaft/schedule.test.ts`
- **Scope:** Medium (3 files)

#### Task 2: Re-Balance Scroll Knots in `InspectionDirector.ts` & `beats.ts`
- **Skills to Read First:** `scroll-scrubbed-visual-sequence`, `r3f-scroll-performance-guard`
- **Description:** Re-allocate the `t = 32.0s – 43.0s` scroll progress knots in `src/scene/torque-wrench/InspectionDirector.ts` so the Stage 1 axial slide, `0.10×` bullet-time torque ignition, and driveline cascade receive proper scroll resolution and continuous camera motion through `p = 0.940`.
- **Implementation Details:**
  1. In `src/scene/torque-wrench/InspectionDirector.ts`:
     - Update `SUBJECT_KNOTS` after `{ progress: 0.905, time: 32 }`:
       - `{ progress: 0.912, time: 35.0 }` (end of runout hold / start of Stage 1 axial slide)
       - `{ progress: 0.922, time: 38.5 }` (Stage 1 seated + datum pulse complete / start of 0.10× bullet-time ignition)
       - `{ progress: 0.930, time: 40.2 }` (end of 0.10× bullet-time tooth-push / start of driveline cascade)
       - `{ progress: 0.940, time: 43.0 }` (cascade complete + R9 settle)
     - Update `CAMERA_KNOTS` after `{ progress: 0.905, time: 32 }`:
       - `{ progress: 0.912, time: 35.0 }`
       - `{ progress: 0.922, time: 38.5 }`
       - `{ progress: 0.930, time: 40.2 }`
       - `{ progress: 0.940, time: 43.0 }` (removes the dead `0.925 -> 0.940` camera freeze so the crane pullback and R9 settle stay alive through the entire cascade).
  2. In `src/scene/torque-wrench/beats.ts`:
     - Update the `inspection-runout` beat copy (`0.79 – 0.825`) to: `'Verify runout on the hobbed sun gear, slide Stage 1 into mesh, and cascade the planetary driveline.'`
- **Verification:**
  - Run `npx vitest run src/scene/torque-wrench/` to confirm all inspection director and journey continuity tests pass.
- **Dependencies:** Task 1
- **Files Touched:**
  - `src/scene/torque-wrench/InspectionDirector.ts`
  - `src/scene/torque-wrench/beats.ts`
- **Scope:** Small (2 files)

---

### Phase 2: Exact Involute Clocking, Multi-Unit Cascade Pool & Flank Glint Shader

#### Task 3: Implement Post-Hobbing Home Indexing, Conjugate Rolling (`5.2×`), and Flank Glint Uniforms
- **Skills to Read First:** `cad-scene-graph-rigging`, `threejs-shaders`, `glsl-transition-shader-pipeline`
- **Description:** Ensure zero-interference tooth alignment during Stage 1's `-28 mm` axial entry, exact `5.2 : 1 : -3.5` sun/carrier/planet conjugate rolling during spin-up, and a traveling involute flank contact highlight in `progression.ts`.
- **Implementation Details:**
  1. In `src/scene/inspection/shaft/progression.ts`:
     - Add `uAxialContactY: { value: 0 }` and `uAxialContactMix: { value: 0 }` to `ProgressionUniforms` and `createProgressionUniforms()`.
     - Update `writeProgressionUniforms(uniforms, state, kind, contactYmm = 0, contactMix = 0)` (with default parameters so existing callers remain backwards-compatible and allocation-free).
     - In `applyProgression` fragment shader injection, add a clean specular-cyan flank contact line along `vShaftPos.y ≈ uAxialContactY` (`width = 0.40 mm`, color `vec3(0.72, 0.91, 1.0)`, gated to the tooth band `vShaftPos.y in [3.15, 9.55]` and involute flank radial zone `r in [4.45, 5.95] mm`).
  2. In `src/scene/inspection/shaft/shaftRuntime.ts`:
     - Export `APPROVED_INDEX_WINDOW = Object.freeze({ start: 31.8, end: 32.8 })` and `SUN_TO_STAGE1_CARRIER_RATIO = 5.2`.
     - Implement `approvedShaftBaseAngle(time, hobWorkPhi)` to index `approvedshaft` from `-0.29 × 2π` at `t = 31.8s` to `-0.30 × 2π` (`-3` whole tooth pitches) by `t = 32.8s`.
     - Compute `approvedAngle = approvedShaftBaseAngle(frame.time, kinematics.hobWorkPhi) + schedule.finaleAngle * SUN_TO_STAGE1_CARRIER_RATIO` so the 10-tooth sun gear drives the four 12-tooth Stage 1 planets with zero pitch-circle slip.
- **Verification:**
  - Add unit tests in `src/scene/inspection/shaft/kinematics.test.ts` and `shaftRuntime.test.ts` asserting:
    - `approvedShaftBaseAngle(32.8, hobWorkPhi)` is an exact integer multiple of `SPACE_PITCH_RAD` (`2π / 10`) within `1e-12 rad`.
    - For all `t in [38.5, 43.0]`, the relative tooth phase `10 * (θ_sun - θ_c1) + 12 * θ_planet_local === 0` within `1e-12 rad`.
- **Dependencies:** Task 1
- **Files Touched:**
  - `src/scene/inspection/shaft/progression.ts`
  - `src/scene/inspection/shaft/shaftRuntime.ts`
  - `src/scene/inspection/shaft/kinematics.test.ts`
- **Scope:** Medium (3 files)

#### Task 4: Expand `cloneNeighbours()` to the 8-Unit Driveline Cascade with Per-Unit Material Isolation
- **Skills to Read First:** `cad-scene-graph-rigging`, `r3f-cad-cinematography`
- **Description:** Upgrade `cloneNeighbours()` and `apply()` in `src/scene/inspection/shaft/shaftRuntime.ts` so all 8 driveline units (`stage1`, `stage2`, `stage5`, `bearing`, `stage3`, `stage4`, `output`, `outerHousing`) clone with isolated per-unit material arrays, individual axial slide offsets along `modelFrame` `Z`, dynamic grazing light tracking, and the datum seating ring.
- **Implementation Details:**
  1. **Per-Unit Material Isolation in `cloneNeighbours()`:**
     - Instead of a single shared `materialClones` Map across all units, instantiate a fresh `unitMaterialClones = new Map<Material, Material>()` inside each unit's clone helper so fading Stage 2 never mutates Stage 1's material opacity.
     - Clone in physical driveline order (`DRIVELINE_CASCADE_ORDER`):
       - Index `0`: `rig.stages.stage1` (`A000591`, `ratio = 1.0`, `baseZ` from `rig.basePositions`)
       - Index `1`: `rig.stages.stage2` (`A000592`, `ratio = 5.2 / 8.0 = 0.65`)
       - Index `2`: `rig.stages.stage5` (`A000606`, `ratio = 3.38 / 8.0 = 0.4225`)
       - Index `3`: `rig.bearing` (`K000004`, `ratio = 0`, static thrust ring; paired with `parts.approvedbearing` and `parts.approvedring` in study space)
       - Index `4`: `rig.stages.stage3` (`A000860`, `ratio = 2.20 / 8.0 = 0.275`)
       - Index `5`: `rig.stages.stage4` (`A000861`, `ratio = 1.43 / 8.0 = 0.17875`)
       - Index `6`: `rig.outputShaft` (`P000095` cluster, `ratio = 0.93 / 8.0 = 0.11625`)
       - Index `7`: `rig.housing` (`P000245` satin black oxide outer housing, `ratio = 0`; paired with `parts.housing` `P000725`).
     - Fallback gracefully when a minimal unit-test mock rig only supplies `rig.stages` (so existing unit tests in `shaftRuntime.test.ts` that pass a 5-stage mock `rig` continue to work without throwing).
  2. **Pitch-Circle Datum Witness Ring:**
     - At `createShaftRuntime` initialization, create a lightweight `datumRing = new Mesh(new TorusGeometry(0.011641, 0.00008, 8, 48), datumRingMaterial)` (`color: '#38bdf8'`, `emissive: '#38bdf8'`, `emissiveIntensity: 0.8`), positioned at `study Z = -0.00318 m` (the leading sun-gear face `shaft Y = 3.18 mm`), registered in `ownedGeometry` and `ownedMaterials`.
     - In `apply()`, drive `datumRing.visible = schedule.datumPulseAlpha > 0` and `materialOpacity(datumRingMaterial, schedule.datumPulseAlpha)`.
  3. **Dynamic Grazing Light Follow (`35.0s – 43.0s`):**
     - In `apply()`, during `t >= 35.0s`, smoothly rotate the `graze` light azimuth by `+0.48 rad` (`+27.5°`) across `35.0s – 38.5s` and translate `key.target` / `graze.target` axially along the cascade (`shaft Y = 6.2 mm -> -25.0 mm`) across `40.2s – 43.0s` so the specular highlights track Stage 1's tooth engagement and then illuminate the full cascading gear train.
  4. **Retire Legacy Section & Support Slide:**
     - Keep `measureSupportDelta` exported for bundle-integrity tests, but in `apply()` hold `supportPair.position.set(0, 0, 0)` (already seated at the approved `+2.75 mm` position) and fade `approvedbearing` + `approvedring` in with Cascade Unit 3 (`t = 40.9s – 41.5s`), with `section = false` and `legacyhousing`/`legacybearing`/`legacyring` opacity fixed at `0`.
- **Verification:**
  - `npx vitest run src/scene/inspection/shaft/shaftRuntime.test.ts` passes 100%, including the AST zero-allocation test and resource disposal census tests.
- **Dependencies:** Tasks 1 & 3
- **Files Touched:**
  - `src/scene/inspection/shaft/shaftRuntime.ts`
  - `src/scene/inspection/shaft/shaftRuntime.test.ts`
- **Scope:** Large (2 files)

---

### Checkpoint 1: Core Kinematics, Multi-Unit Cloning & AST Allocation Gate
- [ ] `npm run typecheck` passes with 0 errors.
- [ ] `npx vitest run src/scene/inspection/shaft/schedule.test.ts src/scene/inspection/shaft/kinematics.test.ts src/scene/inspection/shaft/shaftRuntime.test.ts` passes 100% (including the AST zero-allocation check).
- [ ] Stage 1 translates from `Z_rest + 0.028 m -> Z_rest` along `-Z` (`35.0s – 38.2s`), `approvedshaft` indexes home by `32.8s` and rolls at `5.2×` Stage 1 carrier speed after `38.5s`.

---

### Phase 3: Spherical Camera Path & DOM Clearance Verification

#### Task 5: Author Spherical Macro & Crane-Pullback Anchors in `camera.ts`
- **Skills to Read First:** `build-threejs-scroll-worlds`, `r3f-cad-cinematography`
- **Description:** Update the `t >= 35.0s` rows of `ANCHORS` in `src/scene/inspection/shaft/camera.ts` to execute the oblique pitch-circle sweep (`35.0s – 38.5s`), the `18°` bullet-time tooth-push orbit (`38.5s – 40.2s`), and the centripetal crane pullback to the R9 three-quarter framing (`40.2s – 43.0s`).
- **Implementation Details:**
  1. In `src/scene/inspection/shaft/camera.ts`:
     - Keep all anchors up to and including `{ t: 35, az: 24.2 - FOLLOW_AZIMUTH_MOD / DEG, el: 4.2, dist: 0.2, fovDesktop: 13, fovNarrow: 32.6, tgt: [0, 17.5, -4], tgtNarrow: [0, 8, 5.5] }` byte-identical so every pre-35s test (shaper, slow-exit, recap, materials, hobbing, runout card hold, DOM clearance) remains 100% untouched.
     - Replace the post-35s rows (`35.8, 38.2, 39.4, 41.2, 43`) with the spherical anchors from Section 2.3 (`36.2, 38.2, 38.5, 40.2, 41.6, 42.6, 43.0`), tuned so that at `t = 37.0s` and `t = 41.0s` the shaft and cascading stages project strictly inside the `±0.84` NDC safe frame on both desktop (`1440×900`) and narrow (`390×844`) viewports.
  2. In `src/scene/inspection/shaft/camera.test.ts`:
     - Verify `C0` and `C1` continuity across `0..43s`, safe-frame projection at `t = 37s` and `t = 41s`, and the settled R9 hold at `42.6s – 43.0s`.
- **Verification:**
  - `npx vitest run src/scene/inspection/shaft/camera.test.ts` passes 100%.
- **Dependencies:** Task 1
- **Files Touched:**
  - `src/scene/inspection/shaft/camera.ts`
  - `src/scene/inspection/shaft/camera.test.ts`
- **Scope:** Small (2 files)

---

### Phase 4: Narrative HUD, Transcripts, Reduced-Motion Parity & Live Telemetry Verifier

#### Task 6: Synchronize HUD Captions, Screen-Reader Transcripts, and Story Copy
- **Skills to Read First:** `spatial-hotspot-a11y`, `build-awwwards-quality-sites`
- **Description:** Update the live HUD caption sampler (`script.ts`), DOM overlay (`ShaftStoryLayer.tsx`), static fallback (`StaticShaftStory.tsx`), and page chapter copy (`Story.tsx`) to narrate the Stage 1 planetary mesh, 0.10× bullet-time tooth push, and 5-stage driveline cascade.
- **Implementation Details:**
  1. In `src/scene/inspection/shaft/shaftRuntime.ts`:
     - Update `SHAFT_BEAT_LABELS`:
       - `'stage1-mesh': 'Stage 1 planetary tooth engagement'`
       - `'cascade-finale': 'Epicyclic spin-up and driveline cascade'`
  2. In `src/components/ShaftStoryLayer.tsx` and `src/components/StaticShaftStory.tsx`:
     - Update `SHAFT_TRANSCRIPT[3]` heading to `'Stage 1 engagement and driveline cascade'` and body to:
       `'With the ten sun teeth hobbed in one chucking, the Stage 1 carrier (A000591) and its four twelve-tooth planet gears (P000247) slide axially into full 6.35-millimetre face engagement. As input torque turns the sun gear, the planets counter-rotate on their pins and walk inside the stationary ring gear, driving the five-stage planetary reduction cascade (8.0 to 1.43 display turns) to the output square drive inside the satin black oxide housing.'`
  3. In `src/scene/torque-wrench/Story.tsx`:
     - Update `CHAPTER_COPY.inspection.body` and the `InspectionControl` detail paragraph to describe the Stage 1 axial tooth engagement and five-stage planetary driveline cascade following the runout hold.
- **Verification:**
  - Run `npx vitest run src/scene/inspection/shaft/script.test.ts src/components/` and verify all DOM and accessibility assertions pass.
- **Dependencies:** Tasks 1 & 4
- **Files Touched:**
  - `src/scene/inspection/shaft/shaftRuntime.ts`
  - `src/components/ShaftStoryLayer.tsx`
  - `src/components/StaticShaftStory.tsx`
  - `src/scene/torque-wrench/Story.tsx`
- **Scope:** Small (4 files)

#### Task 7: Author Automated Playwright Telemetry Verifier (`scripts/verify-stage1-cascade.mjs`)
- **Skills to Read First:** `webgl-telemetry-verifier`, `playwright`
- **Description:** Create a deterministic headless browser verifier `scripts/verify-stage1-cascade.mjs` that boots the built preview server, seeks across the `32.0s – 43.0s` (`p = 0.790 – 0.855`) window, and verifies 10 programmatic telemetry gates plus captured PNG evidence frames.
- **Telemetry Surface on `probe.shaft` (`shaftRuntime.ts`):**
  ```ts
  // Pre-allocated on probe inside createShaftRuntime (zero per-frame allocations):
  stage1: {
    slideProgress: 0,      // 0.0 at 35.0s -> 1.0 at 38.2s..43.0s
    carrierZ: 0,           // modelFrame Z position of Stage 1 carrier (m)
    carrierRotZ: 0,        // Stage 1 carrier rotation.z (rad)
    planetRotZ: 0,         // Stage 1 planet[0] rotation.z (rad)
    sunRotZ: 0,            // approvedshaft rotation.z (rad)
    bulletTimeActive: false,
    gearMeshClean: false,  // true when sun/planet conjugate rolling error < 1e-4 rad
    housingGhostAlpha: 0,  // 0.28 plateau at 42.3..42.7s -> 1.0 at 43.0s
    cascadeAlpha: [0, 0, 0, 0, 0, 0, 0, 0],
    cascadeOffsetZ: [0, 0, 0, 0, 0, 0, 0, 0],
  }
  ```
- **10 Automated Verification Gates in `scripts/verify-stage1-cascade.mjs`:**
  - **Gate 1 (Legacy Section Excised):** Across `t = 35.0s – 43.0s`, `section === false` and `legacyhousing`/`legacybearing`/`legacyring` opacity `=== 0`.
  - **Gate 2 (Spindle Home Indexing):** At `t = 35.0s`, `sunRotZ` is an exact multiple of `2π / 10` within `1e-4 rad`.
  - **Gate 3 (Simultaneous Fade & Snout-Side Axial Slide):** At `t = 35.4s`, `cascadeAlpha[0] > 0.3` AND `0.015 < cascadeOffsetZ[0] < 0.027` (moving during fade from the `+Z` snout side, never parked stationary).
  - **Gate 4 (Full Axial Seating & Datum Pulse):** At `t = 38.25s`, `slideProgress >= 0.999`, `Math.abs(cascadeOffsetZ[0]) <= 0.0001`, and `datumPulseAlpha > 0.25`.
  - **Gate 5 (0.10× Bullet-Time Torque Ignition):** Over `t = 38.8s – 40.0s`, `bulletTimeActive === true` and Stage 1 carrier angular rate equals `0.10×` the cascade rate (`±5%`).
  - **Gate 6 (Exact Conjugate Meshing Ratio):** Across `t = 38.8s – 43.0s`, `planetRotZ / carrierRotZ === -3.5 ± 1e-4` AND `ΔsunRotZ / ΔcarrierRotZ === 5.2 ± 1e-4` (`gearMeshClean === true`).
  - **Gate 7 (Physical Driveline Cascade Order):** Arrival timestamps where `cascadeAlpha[k] >= 0.5` strictly obey `t_stage1 < t_stage2 < t_stage5 < t_bearing < t_stage3 < t_stage4 < t_output < t_housing`.
  - **Gate 8 (Monotonic 65% Speed Reduction Ladder):** At `t = 42.8s`, active carrier angular speeds strictly obey `|ω_stage1| > |ω_stage2| > |ω_stage5| > |ω_stage3| > |ω_stage4| > |ω_output|`.
  - **Gate 9 (28% Housing Ghost Plateau & R9 Endpoint):** At `t = 42.5s`, `housingGhostAlpha` is in `[0.25, 0.31]` while internal carriers remain visible; at `t = 43.0s`, all 8 cascade units sit at `cascadeOffsetZ[k] === 0` and `cascadeAlpha[k] === 1`.
  - **Gate 10 (Zero Runtime Errors & Protected Assets Intact):** `0` browser console errors, `0` uncaught page errors, `0` WebGL context losses, and SHA-256 hashes of `Default.glb`, `m249-transformed.glb`, and `msp-enclosure.glb` unchanged.
- **Dependencies:** Tasks 1–6
- **Files Touched:**
  - `scripts/verify-stage1-cascade.mjs`
- **Scope:** Medium (1 new script file)

---

## 5. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy |
|---|---|---|---|
| **AST allocation test failure in `shaftRuntime.test.ts`** | High (blocks CI/test suite) | High if unguarded | Pre-allocate `cascadeAlpha`, `cascadeOffsetZ`, and `probe.stage1` arrays once in `createShaftSchedule()` and `createShaftRuntime()`. Mutate only by index (`arr[i] = v`) inside `sample`, `apply`, and `telemetry`. |
| **Shared material opacity bleed across cloned stages** | High (all stages fade together) | Certain if unguarded | Create a separate `Map<Material, Material>()` per cascade unit inside `cloneNeighbours()` so each unit's `materials[]` array is 100% isolated. |
| **Tooth interpenetration during axial entry or spin-up** | High (visual defect) | Low with exact math | Index `approvedshaft` by `+0.01` turn (`+3.6°`) over `31.8s–32.8s` to `0 mod 36°`, slide Stage 1 from `+0.028 m` (snout side), and drive `approvedshaft` at `5.2×` Stage 1 carrier angle. |
| **Scroll handoff pop between `43.0s` (`p = 0.825`) and `retire-context` (`p = 0.825–0.845`)** | Medium | Low | Preserve `options.presentation.contextOpacity` multiplication on all cascade unit opacities and `options.presentation.phaseCorrection` on `approvedshaft.root.rotation.z` so `JourneyDirector.ts` smoothly retires context and unwinds shaft phase over `p = 0.825–0.845`. |

---

## 6. Subagent Execution & Review Protocol for Implementing Session

When executing this plan in the implementation session:
1. **Parallel Worker Dispatch (`multi_agent_v1__spawn_agent` / `orchestration`):**
   - **Worker A (Kinematics & Schedule):** Owns `story.ts`, `schedule.ts`, `schedule.test.ts`, `progression.ts`, and `kinematics.test.ts` (Tasks 1 & 3).
   - **Worker B (Camera & Scroll Director):** Owns `camera.ts`, `camera.test.ts`, `InspectionDirector.ts`, and `beats.ts` (Tasks 2 & 5).
   - **Parent / Lead Integrator:** Owns `shaftRuntime.ts`, `shaftRuntime.test.ts`, DOM story files (`ShaftStoryLayer.tsx`, `StaticShaftStory.tsx`, `Story.tsx`), and `scripts/verify-stage1-cascade.mjs` (Tasks 4, 6, 7).
2. **Fresh-Context Adversarial Review Gate (`doubt-driven-development` + `code-review-and-quality`):**
   - After all 10 telemetry gates in `scripts/verify-stage1-cascade.mjs` pass on a freshly restarted preview server, spawn a read-only reviewer subagent to audit the git diff and rendered PNG frames (`35.4s`, `37.0s`, `38.25s`, `39.4s`, `41.2s`, `42.5s`, `43.0s`) before presenting to Mark.
