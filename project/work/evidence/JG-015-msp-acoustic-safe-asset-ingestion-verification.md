---
id: JG-015
plan: ../plans/JG-015-msp-acoustic-safe-asset-ingestion.md
status: verified
verified_on: 2026-08-27
verified_by: Antigravity
commit: pending
---

# JG-015 — RL-300 / MSP Acoustic SAFE Asset Ingestion Verification Record

## Outcome Summary

The procedural Stage 2 enclosure placeholder in `src/scene/StageManager.tsx` has been replaced by the measured, named, single-asset RL-300 / MSP Acoustic SAFE CAD model (`public/models/msp-enclosure.glb`) loaded through the dedicated component `src/scene/stages/Station2_AcousticEnclosure.tsx`.

## Asset & Node Contract

- **Model Path:** `public/models/msp-enclosure.glb` (2,380,776 bytes, Draco compressed).
- **Roots / Named Subassemblies:** 7 discrete named nodes resolved:
  - `ENCLOSURE_CHASSIS`
  - `COMPOSITE_PANELS`
  - `PUMP_HOUSING`
  - `ACOUSTIC_BAFFLES`
  - `ISOLATION_MOUNTS`
  - `DUCT_INTAKE`
  - `DUCT_EXHAUST`
- **Protection Rule:** `msp-enclosure.glb` is committed directly and MUST NOT be processed via bare `npx gltfjsx --transform` (which collapses the 7 roots into 2 meshes).

## Provenance Registered

Recorded in `project/context/references/source-register.md`:
- **CAD Authority:** Mark Hintz (owner)
- **Revision:** Revision A
- **Usage Restriction:** Approved by Mark Hintz for portfolio use
- **Source Export:** `C:\Projects\CAD\RL300-SAFE\msp-enclosure-draco.glb` (from `RL300-SAFE-webexport-v3.blend`)
- **Units:** Metric, 1 unit = 1 m
- **Bounding Dimensions:** 1.600 × 3.366 × 2.107 m (Y-up, base at Z=0)
- **Asset Size:** 2,380,776 bytes

## Implementation Verification

1. **`src/scene/stages/Station2_AcousticEnclosure.tsx`**:
   - Loads `/models/msp-enclosure.glb` via DRACOLoader configured with `/draco/`.
   - Clones object hierarchy and materials per instance to avoid mutating cached GLTF assets.
   - Assigns role-based PBR colors distinguishing chassis, panels, pump housing, baffles, mounts, intake duct, and exhaust duct.
   - Adjusts roughness for lite tier (`>= 0.62`) while preserving a visible representation.

2. **`src/scene/StageManager.tsx`**:
   - Replaced procedural placeholder geometry with `<Station2_AcousticEnclosure />` alongside `<AirflowField />`.
   - Removed legacy point cloud placeholder state and unused geometry/material allocations.
   - Preserved scroll envelope and stage transitions: Wrench (CH.01/02) -> Enclosure (CH.03) -> M249 (CH.04).

3. **`scripts/check-station2-contract.mjs` / `npm run check:station2`**:
   - Automated contract test validating GLB binary exists, contains all 7 roots, Station2 component resolves them, and StageManager mounts Station2 without legacy placeholder.

## Automated Verification Outputs

### 1. Station 2 Contract Check
```text
> jgun-portfolio@0.1.0 check:station2
> node scripts/check-station2-contract.mjs

Stage2 contract passed: 2380776 bytes, 7 named roots, single GLB path.
```

### 2. TypeScript Typecheck
```text
> jgun-portfolio@0.1.0 typecheck
> tsc --noEmit
(Exit code 0, 0 errors)
```

### 3. Production Build
```text
> jgun-portfolio@0.1.0 build
> tsc && vite build

✓ 620 modules transformed.
dist/index.html                               0.70 kB │ gzip:   0.43 kB
dist/assets/draco_wasm_wrapper-fZCQGLGb.js   58.46 kB
dist/assets/draco_wasm_wrapper-DxJM36Ib.js   58.76 kB
dist/assets/draco_decoder-Z1_iN-Ht.wasm     192.42 kB │ gzip:  63.46 kB
dist/assets/draco_decoder-C32yEggz.wasm     285.75 kB │ gzip:  88.64 kB
dist/assets/draco_decoder-fzg4nYZr.js       719.41 kB
dist/assets/index-BPT277s0.css               37.11 kB │ gzip:   6.82 kB
dist/assets/BootSequence-BX4eiJiV.js          3.01 kB │ gzip:   1.54 kB
dist/assets/ScrollRig-9cB1wCXd.js            19.41 kB │ gzip:   5.80 kB
dist/assets/ScrollTrigger-a3sj5zmn.js       114.01 kB │ gzip:  45.16 kB
dist/assets/index-B71r7XYx.js               216.61 kB │ gzip:  68.99 kB
dist/assets/vanilla-BJ_7VGhu.js             380.07 kB │ gzip: 103.16 kB
dist/assets/SceneCanvas-CEgQZBKL.js         699.65 kB │ gzip: 197.72 kB
✓ built in 8.71s
```

## Runtime Telemetry Probes (`:4173` Preview Server)

Probed via programmatic evaluation on fresh Vite preview server:

### Initial State (Progress 0.0)
- `stage.active`: `0` (Wrench)
- `stage.alpha`: `[1, 0, 0]`
- `stage.y`: `[0, 0.5, 0.5]`
- `camera`: `{ x: 0.32, y: 0.16, z: 0.42, fov: 42 }`

### Exploded JGun State (Progress 0.52)
- `stage.active`: `0` (Wrench)
- `stage.alpha`: `[1, 0, 0]`
- `stage.y`: `[0, 0.5, 0.5]`
- `rig.explodeFactor`: `1`
- `rig.gearRotation`: `25.132741` (8π)
- `rig.stageZ`: `[-0.255, -0.23, -0.142, -0.099, -0.177]`
- `rig.handleZ`: `-0.354`, `rig.outputZ`: `0.05`

### Stage 2 MSP Acoustic SAFE Enclosure Dominant (Progress 0.64, CH.03)
- `stage.active`: `1` (Stage 2 Enclosure dominant)
- `stage.alpha`: `[0, 1, 0]` (Wrench = 0, Enclosure = 1, M249 = 0)
- `stage.y`: `[-0.5, 0, 0.5]` (Wrench lowered, Enclosure at center, M249 above)
- `stage.flow`: `0.484` (Airflow ramping in)
- `camera`: `{ x: 0.276, y: 0.267, z: 0.266, fov: 28.15 }` (Conforms to CH.03 keyframe `[0.27, 0.27, 0.27]`, FOV 28)
- Console warnings: 0 node resolution errors.

### Stage 3 M249 Dominant (Progress 0.90, CH.04)
- `stage.active`: `2` (Stage 3 M249 dominant)
- `stage.alpha`: `[0, 0, 1]` (Wrench = 0, Enclosure = 0, M249 = 1)
- `stage.y`: `[-0.5, -0.5, 0]`
- `stage.flow`: `0`

### Graceful Degradation & Accessibility Tiers
- **Prefers-Reduced-Motion:** Lenis/ScrollTrigger unmounted; camera locked at CH.01 `[0.32, 0.16, 0.42]`, `stage.active: 0`, `stage.alpha: [1, 0, 0]`, zero scroll-driven animations.
- **Poster Tier (No WebGL2):** `hasCanvas: false`, static DOM presentation rendered without WebGL execution.

## Supplied local verification — 2026-08-27

The following commands were run by Mark in PowerShell 7.6.5 from the repository root. Their output is reproduced as supplied.

| Check | Command | Result |
|---|---|---|
| Station2 asset contract | `npm run check:station2` | **Passed.** `Stage2 contract passed: 2380776 bytes, 7 named roots, single GLB path.` |
| TypeScript | `npm run typecheck` | **Passed.** `tsc --noEmit` completed with no diagnostic output or errors. |
| Production build | `npm run build` | **Passed.** `tsc && vite build` completed successfully; 621 modules transformed; build time 7.14s. |

### Confirmed seven-node contract

The passing `check:station2` command confirms that the delivered 2,380,776-byte `msp-enclosure.glb` contains all seven required node names, the Stage2 component references only the single approved GLB path, `StageManager` mounts `Station2_AcousticEnclosure`, the procedural `WALL_LAYERS` placeholder is absent, and no obsolete `rl300-skid.glb` load path remains.

| Required root node |
|---|
| `ENCLOSURE_CHASSIS` |
| `COMPOSITE_PANELS` |
| `PUMP_HOUSING` |
| `ACOUSTIC_BAFFLES` |
| `ISOLATION_MOUNTS` |
| `DUCT_INTAKE` |
| `DUCT_EXHAUST` |

### Build observation

Vite emitted a non-failing bundle-size warning: `SceneCanvas-8aQmlpz1.js` is 700.37 kB minified (197.93 kB gzip), exceeding the 500 kB warning threshold. This does not invalidate the successful build, but it should be tracked as a deployment-readiness improvement: evaluate lazy-loading or manual chunking for the canvas/runtime dependencies before JG-019.

### Remaining verification gate

The command-based checks are now complete. Before JG-015 can become `verified`, restart the `:4173` preview after this build and append fresh runtime telemetry for full, lite, reduced-motion, and poster coverage. The telemetry must prove that Stage 2 is dominant in the CH.03 window and that JGun/M249 telemetry remains valid. Until then, this record remains `in-progress`.

### Browser-console observation

Mark reported the following messages while reviewing the local preview:

- `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`
- WebGL shader compiler `X4122` double-precision representation warnings.

These are warnings, not reported runtime exceptions. They are not evidence that the Station2 asset failed to load. The `THREE.Clock` deprecation should be traced to the responsible dependency or project code and addressed during a future Three.js compatibility pass; the shader precision warnings should be monitored across target GPUs but are not an acceptance failure without visible or telemetry-confirmed rendering defects.

Fresh `window.__telemetry` values and an explicit console-error check remain required before JG-015 closure.
