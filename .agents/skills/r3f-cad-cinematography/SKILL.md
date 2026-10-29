---
name: r3f-cad-cinematography
description: Canonical authority for 3D mechanical CAD cinematography, deterministic bullet-time time-dilation, spherical camera orbits, C1 handoffs, HUD-safe framing, GLSL machining cutaways, and Vitest/Playwright verification in React 19.2, Three.js 0.185, R3F 9.7, Drei 10.7.8, Postprocessing 3.1, GSAP 3.13, and Lenis 1.3.
---

# R3F Mechanical CAD Cinematography & Deterministic Camera TD Skill

## 1. Hard Stack & Asset Guardrails (NON-NEGOTIABLE)
- **Framework:** React 19.2, Vite 7, TypeScript 5.9 (`npm run typecheck` must pass with zero implicit `any` or Three.js r185 type mismatches).
- **WebGL Core:** `three@0.185`, `@react-three/fiber@9.7`, `@react-three/drei@10.7.8`, `postprocessing@6.39`, `@react-three/postprocessing@3.1`, `troika-three-text`.
- **Motion:** `gsap@3.13` (`gsap.context()`), `lenis@1.3` (synced via `gsap.ticker` with `gsap.ticker.lagSmoothing(0)`).
- **PROTECTED ASSETS RULE:** NEVER run `gltfjsx --transform` on `public/models/m249-transformed.glb`, `public/models/msp-enclosure.glb`, or `public/models/Default.glb`. Always load via `useGLTF` / `GLTFLoader` and clone/modify materials in-memory at runtime so shared material references never bleed across sub-assemblies.
- **ZERO-ALLOCATION & DETERMINISM RULE (`r3f-scroll-performance-guard`):**
  - Never mutate React `useState` inside `ScrollTrigger.onUpdate` or `useFrame`.
  - Pre-allocate all scratch `Vector3`, `Matrix4`, `Quaternion`, and pose structs at module or factory scope (`create*Sampler()`). Mutate `out` in place and return it. Never call `new` or `.clone()` inside hot frame loops.
  - Production narrative samplers (`src/scene/torque-wrench/*`, `src/scene/drawing/*`, `src/scene/inspection/*`) MUST be pure, closed-form, history-independent functions of `(progress, aspect, registrationMatrix, out)` so forward scrub, reverse scrub, and arbitrary random seeks reproduce bit-identical state.

---

## 2. Six Laws of Mechanical Camera Choreography

### Law 1: Never Watch Axial Mechanics Dead-On (The Parallax Mandate)
- When components translate along an explosion, collapse, or machining axis (e.g., planetary stages along `Z` or shaft along `Y`), NEVER place the camera within `30 deg` of the motion axis (`|viewDir.dot(motionAxis)| < 0.6`).
- Always frame axial translations from an **elevated side three-quarter** (`azimuth = 45 deg .. 75 deg` off-axis, `elevation = 18 deg .. 30 deg`) so axial separation reads as diagonal screen-space parallax with foreground/background depth overlap.

### Law 2: Monotonic Azimuth Direction (No Counter-Swings)
- Across adjoining camera legs (e.g., rupture rake -> shatter orbit, or collapse -> LCD readout), the azimuthal derivative `d(azimuth)/dp` MUST preserve sign.
- Use explicit signed azimuth unwrapping (`signedAzimuthDelta(azA, azB, sign)`) or match entry velocity via one-sided Hermite slope probing so the camera never swings `70 deg` one way only to reverse `360 deg` the other way.

### Law 3: Minimum 45-Degree Sweep on Isolation Fades
- Whenever a housing or surrounding assembly fades out (`surroundingsOpacity: 1 -> 0`) to isolate an internal sub-assembly (e.g., Ring Switch -> Input Shaft), enforce a minimum `45 deg` azimuthal sweep and an elevation shift during the fade window.

### Law 4: Assembly-Local Spherical Interpolation (Never Slice Chords)
- Never linearly `lerp` camera positions across large angular changes—linear chords slice through CAD meshes and collapse camera-to-target distance at `u = 0.5`.
- Transform endpoint offsets `(position - target)` into the assembly's local registration frame (`inv.copy(h).invert()`), interpolate azimuth `theta`, elevation `phi`, and radius `rho` (using log-space `Math.exp(lerp(Math.log(rA), Math.log(rB), k))` for macro-to-overview zooms), and transform back via `h`.

### Law 5: C1-Continuous Seams & Harmonic Hermite Joins
- Never chain independent `smoothstep` legs back-to-back across a pass-through pose (which forces velocity to `0` at the midpoint). Use **Harmonic-Mean Hermite Splines** (`entryChannel`):
  ```ts
  function entryChannel(a: number, i: number, e: number, p: number, tA: number, tI: number, tE: number): number {
    const dt1 = tI - tA, dt2 = tE - tI
    const incoming = (i - a) / dt1, outgoing = (e - i) / dt2
    const slope = incoming * outgoing > 0 ? (2 * incoming * outgoing) / (incoming + outgoing) : 0
    const first = p < tI, duration = first ? dt1 : dt2
    const u = first ? (p - tA) / dt1 : (p - tI) / dt2
    const start = first ? a : i, end = first ? i : e
    const m0 = first ? 0 : slope * duration, m1 = first ? slope * duration : 0
    return start + (end - start) * u * u * (3 - 2 * u) + m0 * u * (1 - u) * (1 - u) - m1 * u * u * (1 - u)
  }
  ```
- For cross-domain camera handoffs, use quintic weight `w = u * u * u * (10 + u * (-15 + 6 * u))` with `Quaternion.slerpQuaternions` on the `lookAt` rotation matrices (`createCameraHandoff`) so endpoint position, target, orientation, and FOV derivatives all vanish (`C1 = 0`).

### Law 6: Up-Vector Horizon & Pole Protection
- Keep `|up.normalize().dot(viewDir)| < 0.98` everywhere on the timeline to prevent gimbal roll snaps near poles, and guard against antipodal up-vector collapse (`if (out.up.lengthSq() < 1e-6) out.up.copy(w < 0.5 ? a.up : b.up)`).

---

## 3. Canonical "Bullet-Time" Time-Dilation Contract

Bullet-time is a **visceral divergence between Camera Time (`t_cam`) and Subject Time (`t_subj`)**: mechanical motion decelerates dramatically (to near-freeze or micro-crawl) at the exact moment the camera accelerates into a high-parallax 3D orbital sweep around the active contact zone.

### 3.1 Dual-Clock Architecture (Deterministic vs. Sandbox)
1. **Production Narrative & Inspection Scenes (`src/scene/torque-wrench/*`, `src/scene/inspection/*`):**
   - **NEVER** use wall-clock `delta` accumulation (`simTime += delta * timeScale`) in scroll-driven scenes; it breaks reverse-scroll and seek determinism.
   - Author two independent, closed-form monotonic functions of narrative progress `p`:
     - **Camera Clock `u_cam(p)`:** Drives high-angular-velocity orbital sweep ($\Delta\theta \ge 60^\circ\text{..}360^\circ$) across the bullet-time window $[p_{\text{start}}, p_{\text{end}}]$.
     - **Subject Clock `t_subj(p)`:** Piecewise $C^1$-continuous time warp integrated from a rate envelope $r(p) = \frac{dt_{\text{subj}}}{dt_{\text{cam}}}$.
2. **Standalone Sandbox (`ProductStage.tsx` / `?rig=cinematic` only):**
   - May use `rigState.simTime += Math.min(delta, 0.1) * rigState.timeScale` for ambient free-running turntable previews.

### 3.2 The Dual-Bounded Rate & Readability Law (Resolving Doc 39 vs. Doc 44)
A single fixed percentage fails when applied blindly to both slow linear actuators and high-RPM rotary cutters. Every bullet-time beat must obey **both** bounds:
1. **Baseline Time-Dilation Ratio (`BULLET_TIME_RATE = 0.10`):**
   - By default (`src/scene/torque-wrench/bulletTime.ts`), actual mechanical speed during the bullet-time interior plateau is **10% (`0.10x`)** of normal camera-time speed:
     $$\left.\frac{dt_{\text{subj}}}{dt_{\text{cam}}}\right|_{\text{interior}} = \text{BULLET\_TIME\_RATE} = 0.10$$
   - Importantly, if the underlying mechanical curve $f(t_{\text{subj}})$ already has an easing curve applied, the **actual physical displacement derivative** $\frac{d\text{Pose}}{dp}$ must equal `0.10x` of the un-dilated physical speed—never stack an ease-stop on top of `0.10x` to accidentally freeze the part at `0.00x`.
2. **Shot-Specific Feature-Readability Override (High-Frequency Tooth/Die Cap):**
   - When inspecting fine cyclic geometry (knurling dies, gear teeth, hob flutes), human vision cannot read teeth if they blur past the contact zone.
   - Override `BULLET_TIME_RATE` with an explicit **Total Angular Displacement Budget** $\Delta\phi_{\text{shot}}$ over the close-up window:
     - **Ring Switch Knurling (`RingInspection.ts`):** `0.10` to `0.20` die revolutions (**target `0.15 rev = 54 deg`**) across the entire close-up, maintaining continuous positive motion (`d(theta)/dp > 0`) and visible tooth-to-workpiece engagement.
     - **Gear / Cutter Tooth Engagement (`InspectionDirector.ts`, Stage 1 Ignition):** `1.0` to `2.5` tooth pitches of rotation across the macro orbit so the viewer watches a single tooth flank enter and seat into the mating root.

### 3.3 The 4 Visual Pillars of Cinematic Bullet-Time (Why It Feels Like *The Matrix*)
To make bullet-time visually unmistakable, every bullet-time beat MUST combine these 4 elements:
1. **Pre-Entry Normal-Speed Contrast ("The Speed Ramp Knee"):**
   - The viewer cannot perceive slow-motion unless they see **100% normal speed (`1.0x`)** immediately prior to the bullet-time window (or upon exit).
   - Transition from `rate = 1.0` to `rate = 0.10` over a tight, $C^1$-smooth trapezoidal or Hermite knee ($10\%\text{–}15\%$ of the beat duration).
2. **Inverse Camera-to-Subject Velocity Ratio (No Scroll-Molasses):**
   - During the `0.10x` subject plateau, the camera's azimuthal angular velocity $\left|\frac{d\theta_{\text{cam}}}{d\text{vp}}\right|$ MUST peak (**target $\ge 35^\circ\text{–}90^\circ$ per native viewport scrolled**).
   - **CRITICAL `scrollPacing.ts` RULE:** Do NOT apply massive scroll-pacing multipliers (`> 6x`) to a bullet-time window without compensating camera sweep angle! Stretching scroll distance slows the *camera* down per wheel tick, killing the bullet-time whip. Keep bullet-time scroll spans compact (`2.0` to `4.5` native viewports) so a single decisive wheel flick whips the camera around the frozen subject.
3. **Multi-Plane Radial Dip & Foreground Parallax:**
   - A camera orbiting a small part in empty space lacks parallax cues.
   - Route the camera orbit so that **near-field reference geometry** (suspended blueprint shards via `ORBIT_SHRAPNEL_DIP = 0.35`, semi-transparent ghosted housing walls at `opacity = 0.08..0.18`, or stationary mating gears) passes between the camera and the background, creating rapid foreground/background counter-motion around the locked focal point.
4. **Dynamic Radial Pull-In (The "Shrapnel / Macro Dip"):**
   - Modulate orbital radius $\rho(u)$ during the sweep using a $C^1$-continuous $\sin^2(\pi u)$ dip:
     $$\rho(u) = \rho_{\text{base}}(u) \cdot \left(1 - k_{\text{dip}} \sin^2(\pi u)\right)$$
     Since $\frac{d}{du}\sin^2(\pi u) = 0$ at $u = 0$ and $u = 1$, the camera dives in close to the action mid-orbit and pulls back out without breaking $C^1$ seam continuity at either endpoint.

---

## 4. Dual-Aspect Layout & Automated DOM HUD Clearance
Every camera anchor must simultaneously satisfy Desktop (`1440x900`, `aspect = 1.6`) and Narrow (`390x844`, `aspect ≈ 0.462`):
1. **Continuous Aspect Blend:** `const layout = clamp01((aspect - 0.62) / 0.4)`. Interpolate `fovDesktop`/`fovNarrow`, `dist`/`distNarrow`, and `tgt`/`tgtNarrow` using `layout`.
2. **Telephoto Lens Discipline:**
   - Machining / Tooth Contact Macro: `fovDesktop = 6.3 deg .. 11.4 deg` (`200mm–350mm` equivalent) to eliminate perspective distortion on precision datum faces.
   - Sub-Assembly Isolation / Readout: `fovDesktop = 22 deg .. 36 deg`.
   - Full Assembly Overview: `fovDesktop = 36 deg .. 42 deg` (`50 deg .. 58 deg` narrow).
3. **Automated HUD-Safe Framing Solver (`scripts/solveHudSafeFraming.ts`):**
   - Project extremal 3D CAD bounding vertices (witness points) through `PerspectiveCamera(fov, aspect, near, far)`.
   - All active subject witnesses must stay within `|ndc.x| <= 0.84` and `|ndc.y| <= 0.84` AND clear all active DOM HUD rectangles by `>= 8 px` on both `1440x900` and `390x844`.

---

## 5. Sub-Assembly Isolation & GLSL Machining Cutaways
- **Zero Z-Fighting Isolation Fade:** Clone materials per sub-assembly node on mount. When fading housings, set `material.transparent = true` and `material.depthWrite = opacity > 0.95`.
- **GLSL Section Cutaways:** Enable `gl.localClippingEnabled = true`. Inject glowing kerf edges in `onBeforeCompile` via `1.0 - smoothstep(0.0, 0.025, abs(dot(vWorldPosition, uClipPlane.xyz) + uClipPlane.w))`.

---

## 6. Canonical Verification & CI Gate Matrix (NON-NEGOTIABLE)
Every camera or bullet-time change MUST pass all four verification tiers before completion:
1. **Unit Math Gate (`npm test` / Vitest):**
   - `C0` / `C1` continuity across all beat seams (`epsilon = 1e-7`: position step `< 1e-4`, angular view/up step `< 0.2 deg`, derivative mismatch `< 0.1`).
   - Exact forward, reverse, and prime-stride random-seek (`(n * 613) % N`) bit-identity on both `camera` and `subjectTime` / mechanical pose channels.
   - Bullet-time interior rate assertion: assert physical subject displacement rate equals `BULLET_TIME_RATE` (`0.10 ± 0.005`) of normal speed (or exact shot-specific revolution budget such as `0.15 rev` for `RingInspection`) while camera azimuthal rate exceeds `>= 35 deg/vp`.
2. **HUD & Safe-Frame Projection Gate (`camera.test.ts`):**
   - Decoded GLB extremal witness points clear all measured desktop (`1440x900`) and narrow (`390x844`) DOM HUD rects by `>= 8 px` and stay within `<= 0.84` NDC.
3. **Browser Runtime & Reverse-Replay Gate (`verify-torque-camera-hud.mjs` & `verify-torque-cutter.mjs`):**
   - Must run in full assertion mode (**NEVER pass `--quick` as a completion proof**).
   - Must gate **both** `reverseCameraError < 1e-5` AND `reverseSubjectError < 1e-5` (do not log subject error without asserting it).
   - Must assert installed WebGL mesh world-matrix movement matches the bullet-time ratio and beauty-frame hashes match across forward/reverse replay.