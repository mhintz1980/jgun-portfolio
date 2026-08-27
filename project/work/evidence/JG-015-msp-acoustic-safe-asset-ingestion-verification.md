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
