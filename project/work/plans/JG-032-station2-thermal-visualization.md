---
id: JG-032
title: Station-2 thermal visualization, owner-approved dark-blue recolor, and progress-gated JGUN visual polish
status: in-progress
created: 2026-09-08
owner: Mark (visual ruling)
todo: TODO.md#active
source:
  - docs/kimi-visual-enhancement-brief.md (audited vs main@0ddd8cd; owner rulings 2026-09-08 embedded)
skills:
  - cad-scene-graph-rigging (P2: airway resolution, per-mesh part-number allow-list)
  - glsl-transition-shader-pipeline (P2: AirflowField shader strings, uAirwayMin/uAirwayMax pattern)
  - r3f-scroll-performance-guard (P2: every useFrame touched — zero allocation, 60 FPS budget)
  - webgl-telemetry-verifier (P4: probe authoring and every ruling)
  - spatial-hotspot-a11y (P3: only if cutaway/recolor shifts hotspot projection)
  - asset-and-bundle-hygiene (P4/P5: pre-ship build audit)
implementation_scope:
  - src/scene/stages/AirflowField.tsx
  - src/scene/stages/AcousticBaffleField.tsx
  - src/scene/stages/Station2_AcousticEnclosure.tsx
  - src/scene/stages/airflowRoute.ts (new — pure route/box derivation, unit-testable)
  - src/scene/stages/recolorAllowList.ts (new — pure per-mesh predicate, unit-testable)
  - src/scene/stages/*.test.ts (new unit tests)
  - src/scene/SceneCanvas.tsx (progress-gated JGUN lighting/shadow only)
  - src/scene/TorqueWrenchHero.tsx (blueprintMaterial.opacity retune only)
  - src/scene/drawing/DrawingLinework.tsx, src/scene/drawing/drawingGeometry.ts (grain + registration crosses)
  - scripts/verify-jg032-station2-thermal.mjs (new)
  - TODO.md, project/work/INDEX.md, project/work/evidence/JG-032-station2-thermal-verification.md
acceptance:
  - Airflow enters +Z, crosses DUCT_INTAKE_AIRWAY plenum box (uAirwayMin/uAirwayMax), picks up heat at PUMP_HOUSING, deflects around ACOUSTIC_BAFFLES, exits −Z; null-safe legacy-arc fallback
  - Ring split exactly 6 acoustic (unchanged behavior) / 5 thermal (converted exhaust pool); −43 dBA story legible
  - Recolor via per-mesh part-number allow-list; black/rubber, MSP_YELLOW_PAINT (incl. G2RL300-SAF-1003-2), PUMP_HOUSING, ISOLATION_MOUNTS, MSP_AIRWAY_VOLUME untouched
  - Three revertible commits (airflow / recolor / PANELS_OPAQUE flip), each with A/B census
  - All JGUN additions progress-gated, provably inert at CH.04 progress values; CH.04 telemetry byte-identical to baseline
  - Bloom threshold 0.6 unchanged; JGUN sequencing/timing untouched; 7 GLB roots untouched
verification: ../evidence/JG-032-station2-thermal-verification.md
commits: [477c9c3, 3edecce, 7f7a0c2, abae74c, 15dc719]
replaces: null
---

# JG-032 — Station-2 Thermal Visualization & Gated JGUN Visual Polish

## Outcome

CH.03 (RL300 / MSP SAFE) reads as a thermal-management cutaway / CFD-inspired diagnostic
instead of decorative particles: cool air enters the +Z intake, traverses the measured
`DUCT_INTAKE_AIRWAY` plenum, visibly picks up heat around `PUMP_HOUSING`, deflects around
`ACOUSTIC_BAFFLES`, and exits the −Z exhaust as a rising hot plume — alongside the retained
−43 dBA acoustic story (6 acoustic rings) and 5 new thermal boundary shells. The enclosure
receives the owner-approved (2026-09-08) dark-blue treatment via a per-mesh part-number
allow-list, superseding the JG-021 round-3 "retain baked palette" ruling. JGUN gets four
narrowly progress-gated visual upgrades (explode shadow, rim nudge, LCD micro-rim, drawing
grain/crosses) with zero effect at CH.04 progress values. M249 is untouched.

## Scope

Stable keys and measured values this plan relies on (part numbers are the stable key per
AGENTS.md; stage names are not):

| Fact | Value | Source |
|---|---|---|
| Airway node | `DUCT_INTAKE_AIRWAY`, child of `DUCT_INTAKE`, material `MSP_AIRWAY_VOLUME` (translucent cyan α0.22, rendered — not hidden) | GLB / brief audit |
| Airway mesh | 48 verts, 1 primitive — a coarse volume block; **no centerline spline exists** | brief audit |
| Airway world AABB | x [−0.600, 0.600], y [1.200, 1.855], z [0.431, 1.300] (+Z intake plenum only) | brief audit |
| Flow direction | intake `ductIntake` [0.0, 1.158, 0.893] **+Z** → exhaust `ductExhaust` [−0.101, 1.282, −1.225] **−Z** | `stageWindows.ts` anchors |
| Ring pools | `RING_COUNT = 6` acoustic (keep as-is) / `EXHAUST_RING_COUNT = 5` → thermal shells (owner ruling 2026-09-08; no third pool) | `AcousticBaffleField.tsx:32-33` |
| Recolor matrix (starting, A/B'd) | chassis `#0a1a3a` r0.42/m0.50/env0.75; panels `#132a4a` r0.48/m0.40/env0.70 — deliberately below the draft's 0.78/1.05 "milky grey" band | owner ruling 2026-09-08 |
| Never touch | black/rubber/anodized materials; `MSP_YELLOW_PAINT` meshes incl. `G2RL300-SAF-1003-2` intake grille; `PUMP_HOUSING` (orange/steel heat source); `ISOLATION_MOUNTS`; `MSP_AIRWAY_VOLUME` | JG-021 failure catalogue |
| Protected yellow grille | `G2RL300-SAF-1003-2`, sibling of the airway under `DUCT_INTAKE` | brief audit |
| Panel choreography | assembled ≤0.585 → lift 0.585–0.645 (y 0→0.55 m) → hold 0.645–0.700 → restore 0.700–0.715; internals visible [0.610, 0.700] | `Station2_AcousticEnclosure.tsx` |
| Global-leak surfaces | `ContactShadows` at `SceneCanvas.tsx:265`, `StudioRig`, `LcdFillLight` render for ALL stations → every JGUN lighting change carries its own progress gate | brief audit |
| Blueprint lever | `blueprintMaterial.opacity` = `lerp(0.08, 0.35, chapterProgress)` (`TorqueWrenchHero.tsx:409`); ghost writes are no-ops in blueprint mode | brief audit |
| Telemetry slot | no free `telemetry.stage` slot — thermal intensity rides `acousticWave`/`flow`; `scrollStore.ts` is out of scope | brief audit |

**Non-goals (regression boundaries that stay unchanged):**

- CH.04 / `M249Stage.tsx` and all M249 behavior — byte-identical telemetry at CH.04 stops.
- JGUN beats (ring shift → gear sweep/ghost → rear extraction → rear-LCD orbit), the drawing
  handoff at p = 0.120, `LCD_REVEAL_WINDOW` 0.420→0.525, `enclosureIn` [0.525, 0.565],
  `enclosureOut` [0.720, 0.760], panel choreography windows.
- `PostProcessingComposer.tsx` (bloom `luminanceThreshold: 0.6`, global — off-limits;
  Station-2 bloom response is solved with local material emissive only).
- `scrollStore.ts`, `caseStudies.ts`, `stageEnvelope()`, `airflowIntensity()`,
  `SpatialWorld` mount strings (`<AcousticBaffleField />` / `<AirflowField />` — passing
  props breaks `check:station2`), the 7 GLB roots, both protected GLBs.
- No new npm dependencies. No HUD/typography additions.
- Hex-lattice snap: hexagonal perforations are **unverified** — the aperture lattice is
  derived from the inspected grille geometry (slot/rect array from its AABB if no hexes),
  never an invented hex pattern.

## Dependencies and Required Reading

| Type | Link or requirement |
|---|---|
| Context | `docs/kimi-visual-enhancement-brief.md` (source, audited); `AGENTS.md`; `project/context/architecture/animation-spec.md` §5–§5.4; `scripts/check-station2-contract.mjs` (string-match contract); JG-021 evidence §10–§13 (failure catalogue); JG-028/029/030 A/B census pattern |
| Skills | `cad-scene-graph-rigging` — read in **P2 before** resolving `DUCT_INTAKE_AIRWAY` / traversing the clone / writing the allow-list (GLTFLoader uniquified-name trap, JG-029). `glsl-transition-shader-pipeline` — read in **P2 before** editing `AirflowField.tsx` shader strings (bbox-uniform pattern). `r3f-scroll-performance-guard` — read in **P2 before** any `useFrame` change. `webgl-telemetry-verifier` — read in **P4 before** writing the probe and before each ruling. `spatial-hotspot-a11y` — **P3, conditional**: only if hotspot projection/callout anchors shift. `asset-and-bundle-hygiene` — **P4/P5 before** the final `npm run build`. Skill paths resolved via `project/context/agent-skills.md` (Claude Code column). |
| Prerequisite | JG-015 (asset, 7 roots), JG-018 (fields), JG-021 (visual baseline + failure catalogue), JG-023 X2 (CH.03 backdrop armed) — all closed. `public/draco/` present; loader points at `/draco/`. |

## Implementation Steps

Each step is independently reviewable; commits are sequenced so any one is revertible.

**Commit 0 — plan (this file) + TODO/INDEX registration.** No code.

**Commit 1 — Airflow thermal visualization + 6/5 ring split.**
1. Extract pure functions into `src/scene/stages/airflowRoute.ts`: airway-box → route
   parameter derivation (entry plane z = box.max.z ≈ +1.300, exit plane z = box.min.z
   ≈ +0.431, constrained to y [1.200, 1.855], x ±0.600), heat-accumulator ramp stops, and
   the null-airway legacy-arc fallback. Unit-testable, no three.js scene dependency beyond
   `Box3`/`Vector3` math.
2. `AirflowField.tsx`: resolve `DUCT_INTAKE_AIRWAY` once inside the component (never via a
   prop — the contract string-matches the mounts), `new Box3().setFromObject(airway)` in
   world space → `uAirwayMin`/`uAirwayMax` (`Vector3` uniforms; whole geometry budget — no
   64-point array, no DataTexture). Null → keep legacy guessed arc.
3. Vertex shader `route()`: **intake aperture** (t < 0.20, spawn at +Z face, snap to the
   verified aperture lattice — inspect `G2RL300-SAF-1003-2` grille geometry first; no
   assumed hexes), **plenum transit** (0.20 ≤ t < 0.45 through the airway box, mild
   turbulence), **engine heat pickup** (0.45 ≤ t < 0.75, swirl around `uPump` with heat
   accumulator localizing on distance to the airway exit plane + `uPump`), **exhaust**
   (0.75 ≤ t < 1.0, −Z exit, thermal buoyancy with exponential spread).
4. Fragment shader: cool→hot ramp `#00e5ff` → `#38bdf8`/`#7dd3fc` → `#fbbf24` → `#f97316`
   → `#ef4444` fade; Option-A CFD layer (`vHeat` varying, slightly larger `gl_PointSize`,
   velocity-oriented streak instead of round point — zero extra draw calls).
5. Baffle interaction via existing `uBaffles`: particles within 0.25 m deflect and lose
   velocity (readable streamlines bending around the baffles).
6. Pump heat emphasis: low-opacity (0.08–0.12) emissive additive wireframe clone of
   `PUMP_HOUSING` pulsing `sin(uTime * 1.5)` in the `#f97316` range, mounted only inside
   the [0.610, 0.700] internals window. No global orange wash.
7. `AcousticBaffleField.tsx`: keep the 6-ring acoustic pool byte-identical in behavior;
   convert the 5-ring exhaust pool into thermal boundary shells — 3–4 nested shells around
   `PUMP_HOUSING` at radii 0.25 / 0.45 / 0.65 m, `#fbbf24` → `#f97316` → `#ea580c`,
   opacity 0.06–0.10, additive, `BackSide`, gentle scale/opacity undulation. Reuse existing
   pools/`useFrame`/`dispose()`; counts unchanged (6/5); reduced-motion static fallback
   updated to match.
8. Unit tests: airway-box derivation (entry/exit planes on expected z; null → legacy arc,
   not origin-collapse); ring split (`RING_COUNT === 6` acoustic / 5 thermal guard).

**Commit 2 — Dark-blue recolor (owner-approved 2026-09-08).**
9. New `src/scene/stages/recolorAllowList.ts`: explicit part-number allow-list + pure
   per-mesh predicate (positive AND negative unit tests — `MSP_YELLOW_PAINT`,
   `G2RL300-SAF-1003-2`, `PUMP_HOUSING` children, `ISOLATION_MOUNTS`, `MSP_AIRWAY_VOLUME`
   all explicitly rejected).
10. `Station2_AcousticEnclosure.tsx`: evaluate the predicate per mesh inside the existing
    `root.traverse` in `cloneMaterials` (never on `root.name` — that repaints all 191
    chassis children). Apply the starting matrix; tune upward only if the A/B census reads
    flat rather than milky. Preserve the `#00e5ff` hover emissive. Re-check bloom response
    against the unchanged 0.6 threshold (raise local emissive if hot-spots stop blooming).
11. Update the JG-021 comment block (`Station2_AcousticEnclosure.tsx:136-153`) in the same
    commit: record the 2026-09-08 owner approval and what it supersedes.

**Commit 3 — `PANELS_OPAQUE` flip (isolated, revert-gated).**
12. Flip `PANELS_OPAQUE` to `false`, restoring the owner-approved 0.35/0.18 translucent
    treatment. A/B census + glow-regression check. If clipping/sorting artifacts appear,
    revert the flip and instead fade panel opacity to 0.15 during the hold window (recorded
    in the change log either way). `COMPOSITE_PANELS` `renderOrder = 10` / `DoubleSide`
    untouched.

**Commit 4 — JGUN progress-gated visual polish.**
13. `SceneCanvas.tsx`: secondary wider `ContactShadows` (scale 1.6, blur 4, opacity ≤0.12,
    y −0.18) under the existing one, opacity scaled by `telemetry.rig.explodeFactor`, gated
    0.47–0.97 (zero outside); `StudioRig` spot +0.3 intensity / +0.1 Y gated 0.47–0.97
    (resting values unchanged); micro-rim `pointLight` [−0.30, 0.12, 0.50] `#c8e6ff` 0.8
    active only within `LCD_REVEAL_WINDOW` (0.420–0.525), alongside `LcdFillLight`.
14. `TorqueWrenchHero.tsx`: retune `blueprintMaterial.opacity` ramp (the corrected lever —
    ghost writes are no-ops in blueprint mode) for housing readability; A/B'd, dropped if
    it reads milky.
15. `drawingGeometry.ts` + `DrawingLinework.tsx`: procedural 256×256 noise `CanvasTexture`
    as `uGrain` mixed at 0.06; faint cyan registration crosses (0.4 px, 6 mm inset from
    sheet corners). Intro-only; no GSAP timing changes (if intro timing seems implicated,
    stop — that is out of scope).
16. Unit tests: each new light/shadow/gate returns zero contribution outside its window,
    asserted at CH.04 progress values specifically.

**Commit 5 — probe + evidence + docs.**
17. `scripts/verify-jg032-station2-thermal.mjs` modeled on `verify-jg031-gear-rotation.mjs`
    (+ `verify-jg028` material-census pattern). Assertions in "Required Proof" below.
18. Evidence file from the template, exact commands + measured outputs, `status:` set.
19. `TODO.md` + `project/work/INDEX.md` updated in the same commit as the behavior change.

## Acceptance Criteria

- [ ] Airflow enters at +Z, crosses the plenum box, cools `PUMP_HOUSING`, deflects around
      `ACOUSTIC_BAFFLES` (0.25 m deflection), exits at −Z; color/density communicate
      cool→hot pickup; aperture lattice matches inspected panel geometry (no assumed hex).
- [ ] `uAirwayMin`/`uAirwayMax` resolve to the real AABB (not degenerate); null-airway
      falls back to the legacy arc.
- [ ] Ring split exactly 6 acoustic (unchanged behavior) / 5 thermal (converted exhaust
      pool); −43 dBA story legible; `dispose()` cleanup intact.
- [ ] Recolor delta set (A/B census vs pre-change HEAD) = exactly the allow-listed meshes;
      no black/rubber part, no `MSP_YELLOW_PAINT` mesh, `G2RL300-SAF-1003-2`,
      `PUMP_HOUSING`, `ISOLATION_MOUNTS`, `MSP_AIRWAY_VOLUME` unchanged; hover `#00e5ff`
      emissive and callouts still work.
- [ ] Three revertible commits (airflow / recolor / `PANELS_OPAQUE` flip), each with an
      A/B census; the JG-021 comment block updated in the recolor commit.
- [ ] All JGUN lighting/shadow additions progress-gated; zero contribution at CH.04
      progress values; CH.04 telemetry byte-identical to baseline at the same stops.
- [ ] Bloom threshold 0.6 unchanged; no z-fighting/clipping/bloom washout in the cutaway.
- [ ] Reduced motion, lite tier, poster tier preserved; no allocation in `useFrame`;
      draw-call budget unchanged for the airflow (one `points` draw call; 12,000 full /
      3,600 lite).
- [ ] Unit tests: airway derivation, 6/5 ring split, allow-list positives + negatives,
      JGUN progress gates — all PASS.
- [ ] `npm run check:station2`, `npm run typecheck`, `npm test`, `npm run build` PASS;
      `:4173` restarted after every rebuild; zero console errors.
- [ ] Probe captured at all six windows: JGUN intro, JGUN explode, LCD orbit, RL300
      assembled, RL300 cutaway hold (p ≈ 0.65), RL300 → M249 handoff (p ≈ 0.74).
- [ ] Final diff limited to the implementation_scope files plus plan/evidence/TODO/INDEX.
- [ ] Handed off for owner visual ruling. **`CLOSED VERIFIED` only after explicit owner
      approval, quoted.**

## Required Proof

- `node scripts/verify-jg032-station2-thermal.mjs` PASS against a fresh `:4173` preview:
  - `uAirwayMin`/`uAirwayMax` resolved to the real AABB (x [−0.6, 0.6], y [1.2, 1.855],
    z [0.431, 1.3] ± tolerance), not a degenerate box.
  - Particle color ramp sampled at representative `t` values matches the cool→hot spec.
  - Acoustic pool 6 rings; thermal shells 5.
  - **A/B material census vs pre-change HEAD** — recolor delta set = exactly the
    allow-listed meshes; yellow grille / pump housing / isolation mounts / airway unchanged.
  - CH.04 telemetry byte-identical to baseline at the same progress stops.
  - Zero console errors.
- Unit tests (`npm test`), `npm run typecheck`, `npm run check:station2`, `npm run build`.
- Owner visual ruling at `:4173` (CH.03 cutaway hold p ≈ 0.65; JGUN explode + LCD dwell).

## Verification Record

[`../evidence/JG-032-station2-thermal-verification.md`](../evidence/JG-032-station2-thermal-verification.md) — machine gates green 2026-09-08; owner visual ruling pending (TODO stays unchecked until then).

## Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-09-08 | Created | Accepted scope from `docs/kimi-visual-enhancement-brief.md` (audited vs `main@0ddd8cd`), incl. owner rulings 2026-09-08: 6/5 ring split; dark-blue recolor supersedes JG-021 round 3; three revertible commits. |
| 2026-09-08 | Explode-shadow / spot-nudge gate clamped to 0.47→0.565 (wrench-sink boundary) instead of the brief's 0.47–0.97 | CH.04 owns the canvas from 0.72 (`pointCloudIn`) and the StudioRig crossfades back to full for Station 3 — a 0.97 tail would leak into CH.04, violating the CH.04-inert acceptance criterion. Full gate 0.49–0.525, faded out by 0.565. |
| 2026-09-08 | Blueprint-opacity item DROPPED | The corrected lever (`blueprintMaterial.opacity = lerp(0.08, 0.35, chapterProgress)`, `TorqueWrenchHero.tsx:409`) is the **lite-tier CH.04 fade ramp** (`wantLiteFade` = chapter 3 && progress ≥ 0.755) — retuning it would alter CH.04, the protected boundary. The brief explicitly permits dropping the item ("Either retune that value or drop this item"). |
| 2026-09-08 | Aperture lattice = 8×4 slot array from the `G2RL300-SAF-1003-2` AABB | Ray-grid probe (`.scratch/probe-jg032-grille-rays.mjs`, 64×64 −Z rays through the grille volume): the plate is a closed-manifold solid with **no hex perforations** — per the brief, the lattice derives from the grille AABB, never an invented hex pattern. |
| 2026-09-08 | Ring constants live in `airflowRoute.ts` (not a separate `thermalShells.ts`) | One pure module for the Station-2 thermal constants keeps the test surface small; no scope drift (both are new `src/scene/stages/` modules as scoped). |
| 2026-09-08 | Secondary explode shadow implemented as a baked radial-gradient plane instead of a second drei `ContactShadows` | drei ContactShadows re-renders the whole scene into its RT every frame regardless of visibility — the second pass cost +2.2 ms p95. The gradient bakes the "scale 1.6, blur 4" softness once; zero per-frame cost, zero leak risk. Same visual spec. |
| 2026-09-08 | Probe runs headed at 1280×720 (`--disable-backgrounding-occluded-windows`) | At 1920×1080 under the probe browser the sweep sustains <45 FPS and the one-way quality ladder legitimately escalates to poster mid-run (canvas unmounts) — the ladder working as designed. Blank-page rAF control: p50 16.7 ms. |
| 2026-09-08 | **REV2 (owner ruling, same day): the panel-lift cutaway is REPLACED by an animated cross-section** — a world-space clipping plane (normal −X) sweeps the enclosure shell (ENCLOSURE_CHASSIS + COMPOSITE_PANELS only; pump/engine/skid/baffles/ducts never clipped) open 0.585–0.645, holds to 0.700, closes by 0.715 (same windows as the retired lift; panels fade 0.35→0.18 with the cut). The vertical enclosure animation is removed. The brief's "keep the owner-approved panel lift" and its MSP_YELLOW_PAINT-protection guardrail misrepresented the owner's intent; the live ruling supersedes. | Owner review of rev1: "the enclosure is still yellow… I asked for a cross-section instead… I can't even see inside because the insulation wasn't made transparent." |
