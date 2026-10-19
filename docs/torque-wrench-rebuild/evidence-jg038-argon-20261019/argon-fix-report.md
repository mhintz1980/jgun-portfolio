# JG-038 Argon Implementation & Self-Check Report (2026-10-18)

Author: Gemini-4-Argon (`google/gemini-4-argon`)
Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench` (branch `torque-wrench/rebuild`)
Preview Server: `http://localhost:5321/torque-wrench/` (open session; port 5281 untouched)

## 1. Summary of Applied Fixes (In Order)

### Fix A (incl. Fix D) — Cavern, Stratified Rock Ledges, Branching Fissure Bolts, and Torn Vellum Lip (`R4`)
- **Removed 226 `IcosahedronGeometry(1, 1)` pebbles** in `src/scene/torque-wrench/PitGeometry.ts` (`makePrivatePitRockGeometry`), which previously rendered as low-poly coal lumps on the right and were pushed behind `portal.walls` on the horizontal left gearbox wall.
- **Built a 14-ring fold-free stratified cliff-shelf, overhang, and vertical-shear-plane mesh** (`ROCK_STRATA_RINGS`, 33,376 live vertices / 61,984 indexed triangles across the 2,384-point live contour; 3,360 vertices / 6,240 triangles on the 240-point test contour) spanning 100% of the bore from `depth = 0.0005 m` down to `0.38 m`. Inward shelf reach adapts to the local opposite-wall chord distance (`oppDist[i]`) so wide cavities (left gearbox tunnel, clutch housing, trigger throat, handle gorge) project bold asymmetric rock promontories and stepped benches while narrow slots (trigger finger slot, spindle tip, air fitting) remain unobstructed.
- **Fixed the left-gearbox normal inversion and polar stretching** in `src/scene/torque-wrench/privatePitMaterial.ts`:
  - Replaced `if (dot(n, outward) < 0.0) n = -n;` (which forced left-gearbox normals into the key lamp and crushed right-handle normals to black) with true `vRockNormal`-aligned facet normals (`if (dot(n, vRockNormal) < 0.0) n = -n;`).
  - Replaced polar-only `sector` block coordinates with metric sheet-space coordinates (`metricWall`) warped by 3D crag fields (`fbm3`) and darkened the rock palette (`uPortalRockDark = (0.018, 0.022, 0.030)`, `uPortalRockLight = (0.135, 0.156, 0.184)`, `uPortalRockExtinction = 0.28`, `uPortalHaze = (0.008, 0.014, 0.024)`). Unlit recesses and deep chasms fall to near-black while upper shelf terraces catch warm raking light (`vec3(0.23, 0.15, 0.082)`) from the mouth; the 3.2 m closure plane is completely invisible.
- **Replaced isotropic noise squiggle veins** with screen-space derivative-stabilized (`fwidth`) ~2 px branching blue fissure bolts (`trunk -> fork -> twig` in the visible `0.006..0.14 m` cliff range, plus metric horizontal-wall gearbox bolts) with core ceiling `(0.475, 0.757, 0.918)` (`0.82 * uPortalFissure`) and crevice halo `(0.22, 0.41, 0.58)`.
- **Replaced the periodic sine-scalloped tan lip and eliminated the `.310` lip pop-on / z-fighting speckles** (`Fix D`):
  - `makePrivatePitLipGeometry` now uses a multi-scale non-periodic tear envelope (`flap + sharpNotch + tuft`) and exports `aLipRoot` and `aLipProfile` (7,152 live vertices).
  - In `privateSheetRuntime.ts`, the lip stays hidden (`lip.visible = false`) and zero-width (`mix(aLipRoot, position.xy, open)` where `open = smoothstep(0.02, 0.22, uFracture)`) through scroll `.310` (`uFracture ~ 0.0014`), then progressively widens and curls upward as shards separate, shaded as warm delaminated vellum with a root shadow crease and cyan under-bleed.
  - Set `rocks.renderOrder = 2` (matching `portal.walls`, strictly before intact `fragments` at `renderOrder = 3`), gated `rocks.visible` on `intro.fracture > 0.02`, and added a `+12 mm` micro-lift to `PRIVATE_WEB_VERTEX` during initial fracture (`uFracture in [0.001, 0.06]`) so the earliest `delay = 0` shard never punches a dark hole in the web at `.310`.

### Fix E — Lightning Timing: Shortened Lights-Out Wait & 4-Burst Sequence (`R10`)
- Added `PRIVATE_BURST_KEYS` (4 fast bursts: `0 -> 0.24 -> 0.52 -> 0.82 -> 1.00` with progressively shortening holds `0.26 -> 0.18 -> 0.12` calibration seconds), `privateElectricalClock(t)`, `holdAfterglow(seconds)`, and `samplePrivateElectricalScore(t)` in `src/scene/torque-wrench/ElectricalDirector.ts`.
- Wired `sampleOpening` in `src/scene/torque-wrench/OpeningDirector.ts` to overwrite `pulseHead`, `crackGrowth`, `sparkAnticipation`, `crackGlow`, `crackWeb`, and `pulse` after `drawingIntroState` without touching `INTRO_KNOTS`, `openingTimeAt`, camera trajectory, lamp flicker, or shared `src/scene/drawing/*` files.

#### Measured Before / After Timing Table (`1440x900`, document scroll `62,911 px`, `timing-argon-after-E.json`)

| Event | Baseline Scroll | Baseline Span (px / viewports) | After Fix E Scroll | After Fix E Span (px / viewports) | Target / Gate |
|---|---|---|---|---|---|
| Lamp flicker begins | `.1700` | — | `.1700` | — | Unchanged |
| Last flicker peak (`lamp .777`) | `.2075` | — | `.2075` | — | Unchanged |
| Lamp out for good (`lampPower <= .03`) | `.2150` (`.013`) / `.2175` (`.000`) | — | `.2150` (`.013`) / `.2175` (`.000`) | — | Unchanged |
| Total darkness, nothing visible | `.2175 - .2275` | `.0100` (~630 px / 0.70 vp) | **None (`0.0000`)** | **~0 px (0.00 vp)** | `<= ~100 px` (**PASS**) |
| Spark anticipation at origin (`R10`) | `.2275 - .2515` | `.0240` (~1,510 px / 1.68 vp) | **`.2150 - .2180`** | **`.0030` (~189 px / 0.21 vp)** | `<= ~200 px` (**PASS**) |
| Lights-out -> first burst start | `.2175 -> .2515` | `.0340` (~2,140 px / 2.38 vp) | **`.2150 -> .2180`** (sampled at `.2200`) | **`.0030` (~189 px / 0.21 vp)** (`.0050` / 314 px on grid) | `<= .008` / `<= 500 px` (**PASS**) |
| Profile trace bursts (`pulseHead 0 -> 1`) | 6 bursts: `.2515 - .2675` | `.0160` (~1,000 px / 1.11 vp) | **4 bursts: `.2180 - .2475`** | **`.0295` (~1,856 px / 2.06 vp)** | 3–4 bursts, `.020 - .032` / `1,260 - 2,000 px` (**PASS**) |
| — Hold 1 (`pulseHead = 0.240`) | — | — | **`.2220 - .2285`** | **`.0065` (~409 px)** | `>= ~120 px` (**PASS**) |
| — Hold 2 (`pulseHead = 0.520`) | — | — | **`.2330 - .2375`** | **`.0045` (~283 px)** | `>= ~120 px`, shorter than Hold 1 (**PASS**) |
| — Hold 3 (`pulseHead = 0.820`) | — | — | **`.2412 - .2440`** | **`.0028` (~176 px)** | Shorter than Hold 2 (**PASS**) |
| Last outline burst -> web start | — | — | **`.2475 -> .2475`** | **`.0000` (0 px)** | `<= ~100 px` (**PASS**) |
| Interior web growth (`crackGrowth 0 -> 1`) | `.2650 - .2900` | `.0250` (~1,573 px / 1.75 vp) | **4 bursts: `.2475 - .2900`** | **`.0425` (~2,674 px / 2.97 vp)** | Same 4-burst/hold rhythm (**PASS**) |
| Post-web hold until shatter | `.2900 - .3075` | `.0175` (~1,100 px / 1.22 vp) | **`.2900 - .3075`** | **`.0175` (~1,100 px / 1.22 vp)** | Must not grow (**PASS**) |
| Fracture (shatter) | `.3100 - .3275` | `.0175` (~1,100 px / 1.22 vp) | **`.3100 - .3275`** | **`.0175` (~1,100 px / 1.22 vp)** | Unchanged (**PASS**) |
| Lamp returns | ~`.3325` | — | **~`.3325`** | — | Unchanged (**PASS**) |

### Fix B — Fracture-Web Topology (`R3 / R7 / R8`)
- Updated `src/scene/torque-wrench/privateFractureWeb.ts`:
  - **Subordinated & jittered Level-0 shard seams**: `jitterSeamChain` subdivides and multi-octave-jitters Level-0 Voronoi chains while keeping endpoints and monotone `arcLength` intact; stopped seeding `cells` with Level-0 seams before Level-1 tracing so primary radials are no longer trapped inside small Voronoi polygons.
  - **Extended Level-1 primaries across the full profile**: placed 3–4 separated impact hubs spanning gearbox, clutch/body, and handle, deferred per-hub `cells.add` until each hub's radial fan finishes so sibling radials do not self-truncate near the hub, added 16 distributed perimeter-inward primary lightning trunks (`R3`), and enforced strict T-junction termination (`passProb = 0`) on Level-1/2/3 branches so cracks form a connected cellular web (`R7/R8`) without random `X`-crossings.
  - Replaced tight `r = 0.014` polygon rings with wider (`r >= 0.026`), angularly stepped partial linking arcs.
  - Live build budget (`argon-final-index.json`): `privateWebVertices = 26,602` (<= 78,000 cap), `privateWebTriangles = 25,534`, ~62 ms CPU build time (< 250 ms target).

### Fix C — Lightning Energy, Afterglow, and Colour (`R3`)
- **Decaying hold afterglow**: `burstEnergy` retains exact zero during holds while `holdAfterglow` in `ElectricalDirector.ts` decays from `0.68` to `0.46` across each hold, wired into `visibleEnergy` in `privateSheetRuntime.ts` alongside per-branch phase flicker (`crawl`).
- **Colour & hierarchy (`R3`)**: `privateWebFragment` renders an ice-cyan core (`vec3(0.45, 0.82, 1.0)` at `core^2`, never flat white) with a deep royal-blue additive halo (`vec3(0.02, 0.26, 0.98)`, `uHaloScale = 4.5`) and clear level hierarchy (Level-1 primaries dominant at `1.0`, Level-2/3 stepping down to `0.48`, Level-0 seams subordinated to `0.15` core / `0.05` halo).
- **Perimeter trace**: restored tight vertex miter (`LIGHTNING_VERTEX`) and removed periodic `sin(vArc * 593.0)` / `sin(vArc * 1371.0)` saw-teeth in `PRIVATE_LIGHTNING_FRAGMENT`.

## 2. Changed Files & Before/After Evidence Frames

### Owned Files Modified
- `src/scene/torque-wrench/PitGeometry.ts`
- `src/scene/torque-wrench/PitGeometry.test.ts`
- `src/scene/torque-wrench/privatePitMaterial.ts`
- `src/scene/torque-wrench/privatePitMaterial.test.ts`
- `src/scene/torque-wrench/privateFractureWeb.ts`
- `src/scene/torque-wrench/privateFractureWeb.test.ts`
- `src/scene/torque-wrench/ElectricalDirector.ts`
- `src/scene/torque-wrench/ElectricalDirector.test.ts`
- `src/scene/torque-wrench/OpeningDirector.ts`
- `src/scene/torque-wrench/OpeningDirector.test.ts`
- `src/scene/torque-wrench/privateSheetRuntime.ts`

### Before / After Frame Mapping (`output/playwright/jg038-lightning-20261017/`)
- **Fix E (Spark & 4-burst outline trace)**:
  - Before: `astra-final-265.png`
  - After: `argon-final-218.png` (spark anticipation, `R10`), `argon-final-225.png` (Hold 1 at 24%), `argon-final-235.png` (Hold 2 at 52%), `argon-final-245.png` (Burst 4 closing loop)
- **Fix B & Fix C (Interior fracture web topology, colour, and hold afterglow)**:
  - Before: `astra-final-285.png`, `astra-final-295.png`, `astra-final-305.png`
  - After: `argon-final-255.png` (Web Hold 1), `argon-final-265.png` (Web Burst 2), `argon-final-278.png` (Web Burst 3), `argon-final-285.png`, `argon-final-288.png` (Web Burst 4), `argon-final-295.png`, `argon-final-305.png` (Full web hold)
- **Fix D (Shatter onset continuity, `.310` lip pop-on and z-fighting elimination)**:
  - Before: `astra-final-310.png`, `astra-final-320.png`
  - After: `argon-final-308.png`, `argon-final-309.png`, `argon-final-310.png`, `argon-final-311.png`, `argon-final-320.png`
- **Fix A (Cavern stratified ledges, dark basalt palette, ~2px branching fissure bolts, curled vellum lip)**:
  - Before: `astra-final-330.png`, `astra-final-340.png`, `astra-final-350.png`, `astra-final-360.png`
  - After: `argon-final-330.png`, `argon-final-340.png`, `argon-final-350.png`, `argon-final-360.png`

## 3. Verification Gates, Live Geometry Counts, Reduced Motion & Reverse Seek

- **Typecheck**: `npx tsc --noEmit` — **PASS** (0 errors).
- **Unit tests**: `npx vitest run` on all 8 focused test files — **PASS** (8 files / 47 tests).
- **Production build**: `npm run build` — **PASS**.
- **Frame capture**: 20 frames written (`argon-final-index.json` reports `"files": 20, "errors": []`).
- **Live geometry & renderer counts (`argon-final-index.json`)**:
  - `privateWebVertices`: 26,602 (<= 78,000 budget); `privateWebTriangles`: 25,534.
  - `privateRockVertices`: 33,376 (14 fold-free strata rings × 2,384 contour points).
  - `privatePitVertices`: 69,136 (29 shaft rings × 2,384 contour points); `privatePitTriangles`: 133,504.
  - `privateLipVertices`: 7,152 (3 rows × 2,384 contour points).
  - WebGL renderer (`1440x900`, `effectiveDpr: 1`): `calls: 158..169`, `triangles: 1,507,617..1,646,735`, `geometries: 179..185`, `textures: 18`.
- **Reverse-seek determinism**: verified in `OpeningDirector.test.ts`, `ElectricalDirector.test.ts`, and `privateSheetRuntime.test.ts`; pure functions of scroll progress retrace forward and reverse identically.
- **Reduced motion**: verified in `privateSheetRuntime.test.ts` (`reducedMotion: true` forces `uFlexAmplitude = 0`, `uPulse = 0`, `uCrackWeb = 0`, `uFracture = 0`, `uLampPower = 1`, `portalLight = 0`, fragments stationary at `z = 0.00002`, lip and cracks hidden).

## 4. Honest Self-Check Rubric Scores (vs `R3, R4, R7, R8, R10`)

| Axis | Score (1–5) | Assessment & Residual Gaps |
|---|---|---|
| 1. Outline trace & timing (`R3, R10`) | **4.5 / 5** | Lights-out to first burst reduced from 2,140 px to ~189 px; 4 distinct bursts with shortening pauses (409 -> 283 -> 176 px); diagonal saw-teeth removed. |
| 2. Interior fracture web topology (`R3, R7, R8`) | **4.3 / 5** | Primaries now span spindle, gearbox, clutch, body, and handle with T-junction termination and subordinated Level-0 seams. Residual gap: procedural 2D ribbon topology is slightly more uniform in branch width than `R7`'s photographed glass micro-splinters. |
| 3. Electrical energy, afterglow & colour (`R3`) | **4.5 / 5** | Ice-cyan core `(.45, .82, 1.0)` and royal-blue additive halo `(.02, .26, .98)` with `.68 -> .46` hold afterglow keep the web luminous across holds without white blowout. |
| 4. Shatter continuity & paper shards (`Fix D`) | **4.6 / 5** | `.308 -> .309 -> .310 -> .311` is free of the tan lip pop-on, rock z-fighting speckles, and early shard depth-hole occlusion; paper shards and `714/718` depth barrier preserved. |
| 5. Cavern rock structure & depth (`R4`) | **4.2 / 5** | Coal-lump icosahedra replaced by 14-ring fold-free stratified cliff shelves and vertical shear canyons across the full bore (including the left gearbox tunnel); closure plane is completely hidden in near-black extinction. Residual gap: procedurally displaced contour rings still have slightly more regular strata horizons than `R4`'s hand-painted overhang blocks. |
| 6. Torn paper lip & rock fissure bolts (`R4`) | **4.3 / 5** | Lip curls and widens progressively with warm vellum lighting and cyan rim bleed; rock fissures are now ~2 px branching blue bolts. Residual gap: lip silhouette is a 3-row ribbon strip rather than volumetric multi-layer paper fibers. |
| **Mean** | **4.40 / 5** | Self-check only; formal review belongs to the independent reviewers (GPT-6.1-Sol/High and Claude Opus 5.5/High), and visual acceptance belongs exclusively to the owner at `localhost:5281`. |
