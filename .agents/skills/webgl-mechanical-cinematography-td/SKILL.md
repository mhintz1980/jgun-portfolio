---
name: webgl-mechanical-cinematography-td
description: Principal WebGL Camera Systems Architect & Real-Time Mechanical Cinematographer for React Three Fiber (R3F), Three.js, and deterministic scroll-driven CAD storytelling. Activate whenever authoring, refactoring, or debugging camera paths, spherical orbits, camera handoffs, scroll pacing spans, HUD safe-frame clearance, or Vitest camera continuity proofs.
---

# WebGL Mechanical Cinematography & Deterministic Camera TD Protocol

You are operating in a precision CAD storytelling codebase where camera choreography is a pure, deterministic mathematical function of scroll/narrative progress `p` (or subject time `t`) and viewport `aspect`. Never introduce stateful frame-accumulated camera drift inside narrative samplers, never animate raw Euler rotations, and never guess coordinates without verifying screen-space NDC projection against HUD rectangles.

## 1. Deterministic Purity & Zero-Allocation Law
- **Pure Function of `(progress, aspect, registrationMatrix, outPose)`:** Every camera sampler MUST be history-independent and reversible (`sample(p)` produces bit-identical output whether scrubbing forward, backward, or random-seeking).
- **Zero Per-Frame Heap Allocation (`r3f-scroll-performance-guard`):** Pre-allocate all scratch `Vector3`, `Matrix4`, `Quaternion`, and pose structs at module or factory scope (`create*Sampler()`). Mutate `out` in place and return it. Never call `new Vector3()` or `.clone()` inside `useFrame` or hot sample functions.
- **Damping Separation:** Only apply time-dependent spring/damping inside interactive user-override controllers (e.g., `SecondOrderDynamics` in `stopAndAppreciate.ts`). Narrative camera samplers must remain closed-form.

## 2. Six Laws of Mechanical Framing & Motion Choreography

### Law 1: Never Watch Axial Mechanics Dead-On (The Parallax Mandate)
- When components translate along an explosion, collapse, or machining axis (e.g., planetary stages along `Z` or shaft along `Y`), NEVER place the camera within `30 deg` of the motion axis (`|viewDir.dot(motionAxis)| < 0.6`).
- Always frame axial translations from an **elevated side three-quarter** (`azimuth = 45 deg .. 75 deg` off-axis, `elevation = 18 deg .. 30 deg`) so axial separation reads as diagonal screen-space parallax with foreground/background depth overlap.

### Law 2: Monotonic Azimuth Direction (No Counter-Swings)
- Across adjoining camera legs (e.g., rupture rake -> shatter orbit, or collapse -> LCD readout), the azimuthal derivative `d(azimuth)/dp` MUST keep the same sign.
- Use explicit signed azimuth unwrapping (`signedAzimuthDelta(azA, azB, sign)`) or match entry velocity via one-sided Hermite slope probing so the camera never swings `70 deg` clockwise only to reverse `360 deg` counter-clockwise.

### Law 3: Minimum 45-Degree Sweep on Isolation Fades
- Whenever a housing or surrounding assembly fades out (`surroundingsOpacity: 1 -> 0`) to isolate an internal sub-assembly (e.g., Ring Switch -> Input Shaft), enforce a minimum `45 deg` azimuthal sweep and an elevation shift during the fade window. A fade on a stationary camera reads as a cheap 2D cross-dissolve rather than a 3D spatial transition.

### Law 4: Assembly-Local Spherical Interpolation (Never Slice Chords)
- Never linearly `lerp` camera positions across large angular changes—linear chords cut through the CAD mesh and collapse camera-to-target distance at `u = 0.5`.
- Transform endpoint offsets `(position - target)` into the assembly's local registration frame (`inv.copy(h).invert()`), interpolate azimuth `theta`, elevation `phi`, and radius `rho` (using log-space `Math.exp(lerp(Math.log(rA), Math.log(rB), k))` for large zoom ratios from macro to overview), and transform back via `h`.

### Law 5: C1-Continuous Seams & Harmonic Hermite Joins
- Never chain independent `smoothstep` legs back-to-back if the camera is supposed to pass *through* a middle keyframe (like an isolation profile)—two independent smoothsteps force velocity to `0` at the seam, causing a visible stall.
- Use **Harmonic-Mean Hermite Splines** (`entryChannel`) across 3-point pass-throughs:
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
- For cross-domain camera handoffs (e.g., World Narrative <-> Local Inspection Study), use quintic weight `w = u * u * u * (10 + u * (-15 + 6 * u))` with `Quaternion.slerpQuaternions` on the `lookAt` rotation matrices (`createCameraHandoff`) so endpoint position, target, orientation, and FOV derivatives all vanish (`C1 = 0`).

### Law 6: Up-Vector Horizon & Pole Protection
- Keep `|up.normalize().dot(viewDir)| < 0.98` everywhere on the timeline to prevent gimbal roll snaps near the zenith/nadir poles.
- When transitioning between a vertical machining datum (`up = +Y`) and a horizontal side study (`up = +Z`), blend the up-vector angle smoothly (`up = [0, sin(angle), cos(angle)]`) during a wide pull-back turn where the view ray is orthogonal to both axes, and guard against antipodal collapse (`if (out.up.lengthSq() < 1e-6) out.up.copy(w < 0.5 ? a.up : b.up)`).

## 3. Dual-Aspect Layout & DOM HUD Clearance Protocol
Every camera anchor must simultaneously satisfy Desktop (`1440x900`, `aspect = 1.6`) and Narrow (`390x844`, `aspect ≈ 0.462`):
1. **Continuous Aspect Blend:** Compute `const layout = clamp01((aspect - 0.62) / 0.4)` (`0` = narrow portrait, `1` = desktop widescreen). Interpolate `fovDesktop`/`fovNarrow`, `dist`/`distNarrow`, and `tgt`/`tgtNarrow` using `layout`.
2. **Telephoto Compression for Precision CAD:**
   - Micro/Machining Callouts (cutter relief groove, gear pitch contact, hobbing): `fovDesktop = 6.3 deg .. 11.4 deg` (`200mm–350mm` lens equivalent) to flatten perspective distortion and keep gear teeth and datum faces orthographic-feeling.
   - Sub-Assembly Isolation / Readout: `fovDesktop = 22 deg .. 36 deg`.
   - Full Assembly Overview: `fovDesktop = 36 deg .. 42 deg` (`50 deg .. 58 deg` on narrow).
3. **CAD Witness NDC & Pixel Clearance:**
   - Do not frame solely by analytic center points. Project the extremal 3D CAD bounding vertices (witness points) through `PerspectiveCamera(fov, aspect, near, far)`.
   - Assert that all active subject witnesses stay within `|ndc.x| <= 0.84` and `|ndc.y| <= 0.84` (8% safe margin) AND clear all active DOM HUD rectangles (header, narrative cards, FOS bars, footer) by `>= 8 px` in screen space.
4. **Automated Anchor Solving (`scripts/solveHudSafeFraming.ts`):**
   - Never guess `tgt`, `tgtNarrow`, `fovDesktop`, or `fovNarrow` by trial-and-error. Feed the active beat's 3D CAD witness points, desired `azimuthDeg`, `elevationDeg`, `distM`, and measured DOM HUD rects into `solveViewportFraming()` to analytically compute the exact millimeter target offset and FOV for both `1440x900` and `390x844`.

## 4. Scroll Pacing & Angular Velocity Budgeting (`scrollPacing.ts`)
- Camera motion is perceived in **channel units per native viewport scrolled (`vp`)**, not raw progress `p`.
- When adding a tight camera swing (e.g., `>= 60 deg` orbit) or high-RPM gear/hob rotation over a narrow progress window, allocate a flat-top trapezoidal pacing span in `TORQUE_PACING_SPANS` (`torquePacingKernel`) so that:
  - Camera target pan rate stays `<= 0.0625 m/vp`.
  - Rotating tooling/gears stay `<= 3 rev/vp` (`<= 18 deg/frame` at `1 vp/s`, `60 fps`) to prevent stroboscopic wagon-wheel aliasing.
  - Major camera orbits receive `>= 2.0 native viewports` of scroll travel.

## 5. Mandatory Vitest Verification Checklist
Whenever creating or modifying a camera module, always write or update its companion `.test.ts` file to assert:
1. **Endpoint & Seam Continuity (`C0` / `C1`):** Probe `seam - 1e-7`, `seam`, and `seam + 1e-7`. Position step `< 1e-4`, angular view/up step `< 0.2 deg`, and one-sided derivative mismatch `< 0.1`.
2. **Reverse-Scrub & Random-Seek Determinism:** Sample `N` points forward, backward, and in prime-stride random order (`(n * 613) % N`); assert exact array equality.
3. **Rigid Registration Commutativity:** Assert `sample(p, aspect, identity).applyMatrix4(H)` equals `sample(p, aspect, H)` to `< 1e-12` across arbitrary rotation/translation matrices `H`.
4. **Safe-Frame & DOM Rect Separation:** Project extremal CAD witness points at both `1440x900` and `390x844` and assert `>= 8 px` separation from every visible HUD card.