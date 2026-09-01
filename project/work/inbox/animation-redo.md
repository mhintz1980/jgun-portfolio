# INBOX — Animation redo — consolidated owner spec (CH.01 + CH.02)

**Owner:** Mark Hintz, dictated 2026-08-31, cleaned by agent. Consolidated 2026-09-01 from the
five-plan review (`C:\Projects\five-plans\Plan4.md` full draft + `Plan5.md` condensed filing spec).
This file replaces the 2026-08-30 unscoped stub (the "i want to redo the animation later" intake).

**Status:** untriaged. Assign JG-### at triage per `project/README.md`; likely split into
sequenced work items (see Triage notes). No code has been written against this spec.

**Scope:** owner CH.01 + CH.02 only. The M249 chapter is explicitly deferred
("we'll talk about that later").

## Chapter-number map (read this first)

The owner spec and the repo use different chapter numbering. Every downstream document must
use the repo numbering; owner labels are kept in brackets where they originated.

| Owner spec | Repo chapter (`src/data/caseStudies.ts`) | Station / asset |
|---|---|---|
| CH.01 — JGun drawing-to-3D (B1–B5) | **CH.01** "The Full-Stack Physical & Digital Systems Architect" + **CH.02** "Inside the Reduction Train" | Station 1, `Default.glb` |
| CH.02 — RL-300 enclosure airflow story (C1–C6) | **CH.03** "Airflow Against the Noise Floor" | Station 2, `msp-enclosure.glb` |
| deferred | **CH.04** "From Point Cloud to Production Code" | Station 3, `m249-transformed.glb` |

## Standing owner rulings carried into this spec

- **Backgrounds are critical** (2026-08-31): they move with the model and add to the
  experience — significant, not just black. Full background layout happens at Mark's upcoming
  **round-table session**; this spec deliberately does NOT finalize backgrounds. It flags every
  beat where background choreography interacts (drawing sheet, ripple, inspection table,
  cross-section backdrop, plume exit).
- **No exit button, ever.** Scroll past the inspection orbit's bound exits; Escape = a11y
  parity only (verbatim task-spec ruling, preserved in B4).
- Measured reality wins: `project/context/architecture/animation-spec.md` §5–§5.4 is canon;
  owner prose ±Z labels are flipped vs measured reality.
- Panels stay opaque + current material look is owner-approved; C1's dark-blue **paint
  recolor** supersedes the JG-021 "retain colors" ruling **for paint only** (owner-ruled
  2026-08-31) — it does not reopen panel opacity or lighting.

## CH.01 — JGun: drawing-to-3D [owner CH.01; repo CH.01–CH.02]

- **B1 — Blur-focus intro.** Page opens out of focus; focus racks onto a large engineering
  drawing of the JGun filling ~90% of the viewport — orthographic views plus a cross-section,
  dimensions with tolerances, GD&T datum symbols and feature control frames referencing those
  datums. **Source ruled by owner: in-app render** (hidden-line/wireframe views of
  `Default.glb`) **+ SVG overlay** (reuse `GdtSymbols`; new dimension-line component).
- **B2 — Rise-from-drawing.** The lines of one view glow (emissive pulse); the 3D model rises
  into 3D space aligned identically to that drawing view; a pond-ripple screen distortion
  spreads once and quickly dissipates (new tier-gated post pass).
- **B3 — Retained middle.** Existing ring-switch shift zoom, epicyclic spin, ghost fade, and
  axial explode beats carry over, re-windowed after the new intro; wrench rig and part-number
  canon untouched.
- **B4 — Clickable subassemblies.** Each animation unit (handle, output, clutch, ring switch,
  five planetary stages) is clickable; camera dollies in (extends `HOTSPOT_INSPECT_FRAMES`);
  slight scroll partially orbits the subassembly; continued scroll in EITHER direction releases
  back to the main timeline. Standing ruling applies: no exit button; Escape = a11y parity only.
- **B5 — Scene close.** Camera moves to a side view of the assembly; the background morphs
  into an inspection table — micrometers, gauge blocks, sine plate, height gauge with dial
  indicator, mechanical pencils, and the same JGun drawing from B1 (props ruled: in-app
  stylized 3D) — then transitions to CH.03 [owner CH.02].

## CH.03 — RL-300 enclosure: the airflow story [owner CH.02; repo CH.03]

- **C1 — Recolor.** Baked yellow paint (`#ffc500` grille + accents) → dark blue on painted
  roots only. Single choke point = `cloneMaterials` in `Station2_AcousticEnclosure.tsx`.
- **C2 — Intake highlight.** Camera emphasizes the hexagon cutouts on the end face where air
  first enters (`DUCT_INTAKE`).
- **C3 — Cross-section.** Pull back to side view, then animate into a cross-section showing
  ONLY the custom-chamber geometry that creates the S-shaped flow; engine/pump end and
  internals deliberately vague (silhouettes), never detailed.
- **C4 — Flow visualization.** Partially-isometric cross-section view for depth while showing
  the entire skid length; particles trace the S-path — in the hex face, down the full length,
  out the opposite side. Route re-pathed in AirflowField's GLSL `route()`.
  **Input needed from Mark:** hand-drawn flow overlays on screenshots of the assembly.
- **C5 — Follow cam.** Camera moves in close at the hex face and tracks the particle stream
  sideways down the length, out the backside, past the radiator, through the other openings,
  out the external hood.
- **C6 — Exit.** Cross-section transitions back to full assembly as the camera pulls away and
  focuses on the particle plume rising up and away → transition toward CH.04 (M249 material
  itself is deferred).

## Agent elaborations from the same dictation session — NOT owner-ruled

`Plan4.md` expanded the dictation into a cinematic direction. These additions are recorded so
they are not lost, but none is owner-approved. Each needs an explicit Mark yes/no at triage:

| # | Elaboration (Plan4) | Note / tension |
|---|---|---|
| 1 | B4 "inspection theater": global time dilation to 0.15x on click | Not dictated; new global timescale system |
| 2 | B4 orbit range ±120° | Conflicts with "slight scroll partially orbits" (dictated); Plan3 suggests 45–75° as a starting point (the filed camera intake leaves the range open) |
| 3 | B4 heatmap/thermal flash on the inspected part | Only surviving heatmap candidate anywhere; new shader |
| 4 | B1 drawing as a physical 3D sheet with 3D-geometry dimension lines | Owner ruled B1 = in-app render + SVG overlay |
| 5 | C3 "clamshell peel" hinge-open of the shell | Differs from dictated "cross-section showing ONLY the chamber geometry, internals vague" — clamshell reveals everything |
| 6 | C1 paint-strip narrative + falling flake particles | Dictated beat is a recolor at the choke point |
| 7 | 3D text replaces DOM headlines (drei `<Text>`) | A11y/SEO tradeoff; contradicts text-restraint direction |
| 8 | Per-beat post-processing value table (bloom/CA/grain/vignette) | Pre-optimizes values against a look that is owner-locked; grain/vignette/DOF passes don't exist yet |
| 9 | Cursor state system (custom DOM cursor) | Not dictated; a11y implications |
| 10 | Sound design layer | Plan4 itself defers to post-CH.03; Web Audio absent from repo |
| 11 | C6 point-cloud freeze → dissolve into M249 | Out of scope (CH.04 deferred) |
| 12 | Camera shake on B2, orbital drift, DOF rack-focus passes | New post/DOF stack on a ~vsync-quantum frame budget; DOF absent today |
| 13 | B3 scanline ghost sweep (inverted CAD-dissolve sweep instead of opacity fade) | Interacts with the open ghost regression (`animation-spec.md` §5.2); replaces the measured §5.2 mechanism |
| 14 | B3 metal-shaving particles at gear contact points | New particle system; CH.01/02 has none today |
| 15 | B3 explosion lines (origin → exploded position traces) | New line-render pass over the existing ladder |
| 16 | B3 ring-switch axial pre-translate (2 mm) before rotation | Secondary motion on a measured beat (§5.4 windows) |
| 17 | B4 3D-geometry HUD materialization (torus reticle, orbiting 3D part name, anchored data plane) | Replaces/extends the DOM badge + HUD card system |
| 18 | B5→C1 transition grammar: drawing page-turn reveals RL-300 spec sheet; table morphs into mounting skid | Cross-chapter shared-element mechanic; background layout is round-table territory |
| 19 | C2 hex-pulse sequence, intake vortex, first-person pull-through the duct | Sub-beat expansion of the dictated intake highlight |
| 20 | C4 capsule tracers + ribbon trails + curl-noise turbulence + density encoding | Replaces the existing single-draw shader points approach with a richer particle model |
| 21 | C6 plume smoke physics + heat-shimmer refraction pass | New particle physics + new post pass |
| 22 | B2 drawing-sheet bulge (vertex displacement as the model emerges) | Part of the dictated rise beat — the embellishment is the sheet deformation mechanic |

## Reuse vs new build (verified against repo 2026-09-01)

**Reuse:**
- Rig unit groups + `EXPLODE_OFFSETS` (`src/data/caseStudies.ts:143`) and `ROTATION_TURNS`
  (`:184`) — untouched by B1/B2 intro.
- GSAP proxy pattern (`TorqueWrenchHero.tsx:73`) — the intro re-windows the existing timeline.
- `stageEnvelope` gating (`src/scene/stages/stageWindows.ts:73-85`) — window shifts.
- `HotspotButton` / `SpatialHotspotAnchor` / `GdtSymbols` (`src/components/GdtSymbols.tsx`) —
  B4 click targets and B1 GD&T overlay; both hotspot components already carry the `tone`
  dim/full prop.
- `HOTSPOT_INSPECT_FRAMES` (`src/scene/CameraRig.tsx:36`) + the damped camera pipeline
  (`CameraRig.tsx:397-400`) — B4 dolly; the LCD-orbit block is the template for orbit/follow
  shots; FOV is already animated per goal (`CameraRig.tsx:405`).
- AirflowField single-draw shader points + GLSL `route()`
  (`src/scene/stages/AirflowField.tsx:41`, one draw call `:268`) — C4 re-path.
- `cloneMaterials` choke point (`Station2_AcousticEnclosure.tsx`, `useLoader` `:233`) — C1.
- JG-023 backdrop rig (`src/scene/backgrounds/`, `SCRUBBED_BACKGROUNDS`
  `backdropConfig.ts:4`) — background choreography substrate (layout at round-table).

**New build:**
- Drawing intro component + SVG dimension lines (B1); ripple post pass (B2, tier-gated);
  per-subassembly scroll orbit with two-directional release (B4); cross-section rendering
  (C3 — clipping-plane first per Plan3 recommendation); follow-cam override needing a TS port
  of the GLSL route (C5); stylized metrology props (B5); dark-blue paint override (C1);
  background system pieces (deferred to round-table).

## Hard constraints carried

- Never bare-regenerate `msp-enclosure.glb` or `m249-transformed.glb` with `npx gltfjsx
  --transform` (AGENTS.md).
- Part numbers (A000606, K000004, P000725…) are identity; stage names are not.
- Explosion-ladder / sync rule: spec §5 tables, project README ladder, and both rig skills'
  tables update in the SAME commit as any behavior change.
- `scripts/check-station2-contract.mjs` must stay green (asserts `AirflowField` +
  `AcousticBaffleField` mounted and the 7 STATION2_CAD_ANCHORS keys, `:49-60`).
- Re-windowing CH.01 shifts every downstream 0.xxx beat (2020vh document — stageWindows /
  PATH_SEGMENTS / hero windows all remeasure together).
- Every new effect needs tier fallbacks (full/lite/poster + reduced-motion boolean;
  `qualityStore.ts:19,23`). Verification: fresh `:4173` telemetry + same-frame before/after
  pairs at identical frames; perf gate p95 ≤ 16.7 ms / max ≤ 50 ms / zero declines.
- Known defect dependency: the housing ghost regression (`animation-spec.md` §5.2 —
  `ghostCount` reads 0 at repo head, fade loop no-ops) degrades B3's ghost beat; fix or
  explicitly accept before B3 re-windowing.

## Inputs needed from owner

1. Annotated flow-path screenshots (C4 spline control points) — **blocking for C4**.
2. Drawing-sheet style references (title block, dimension style, GD&T placement) — B1.
3. Inspection-table style references — B5.
4. Round-table session scheduling — gates background layout for B1/B2/B5/C3/C6.
5. Rulings on the Plan4 elaboration table above (one yes/no each).
6. At triage: JG-021 disposition (baseline record vs superseded) and the JG-### split.

## Triage notes

- Sequence the B/C beats AFTER the camera-rail work item (see
  `five-plans-synthesis.md`): beats should be authored on the final camera path, or the
  re-windowing happens twice.
- Suggested split: (1) B1+B2 intro, (2) B3 re-window, (3) B4 inspection orbit, (4) B5 table
  close, (5) C1 recolor, (6) C2+C3 intake/cross-section, (7) C4+C5 flow/follow-cam,
  (8) C6 exit. C4/C5 additionally gate on Mark's overlays.
