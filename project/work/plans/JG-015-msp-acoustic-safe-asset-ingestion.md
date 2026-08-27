---
id: JG-015
title: RL-300 / MSP Acoustic SAFE asset ingestion
status: ready
created: 2026-08-26
owner: unassigned
last_audited: 2026-08-27
readiness: ready-asset-delivered-2026-08-27
todo: TODO.md#queued
source:
  - ../../context/references/source-register.md
  - ../../context/agent-skills.md
skills:
  - cad-scene-graph-rigging
  - asset-and-bundle-hygiene
  - r3f-scroll-performance-guard
  - webgl-telemetry-verifier
implementation_scope:
  - public/models/msp-enclosure.glb
  - src/scene/stages/Station2_AcousticEnclosure.tsx
  - src/scene/StageManager.tsx
acceptance:
  - Asset is web-ready, named, measured, and source-registered.
  - PBR role mapping and compression are validated without breaking medium/poster tiers.
  - The real asset replaces the procedural Stage 2 placeholder.
verification: null
commits: []
---

# JG-015 — RL-300 / MSP Acoustic SAFE Asset Ingestion

## Outcome

Replace the procedural Stage 2 enclosure placeholder with a named, measured, web-ready RL-300/MSP Acoustic SAFE asset that can support real engineering storytelling.

## Asset Delivered — 2026-08-27 (unblocks the 2026-08-27 readiness gate)

The authoritative MSP/RL-300 enclosure export has been delivered and committed:

- **`public/models/msp-enclosure.glb`** — 2,380,776 bytes, committed directly
  (force-added past the `public/models/*.glb` ignore, like `m249-transformed.glb`).
- Source of truth: `C:\Projects\CAD\RL300-SAFE\msp-enclosure-draco.glb`
  (Blender glTF I/O v5.1.19 + `KHR_draco_mesh_compression`). Working file
  `RL300-SAFE-webexport-v3.blend`. **Never re-run `gltfjsx --transform` on it** —
  that destroys the named-root contract (tested: collapses 7 roots to 2 meshes).
- Single combined GLB. The `rl300-skid.glb` second path has been **removed** from
  `implementation_scope` — the skid is part of `ENCLOSURE_CHASSIS`, not a separate asset.

### Node-name contract — updated to the 7 as-built roots

The export ships **7 named root nodes**, verified by reading the GLB binary:

`ENCLOSURE_CHASSIS` · `COMPOSITE_PANELS` · `PUMP_HOUSING` · `ACOUSTIC_BAFFLES` ·
`ISOLATION_MOUNTS` · `DUCT_INTAKE` · `DUCT_EXHAUST`

This supersedes the earlier 6-name spec. `DUCT_LABYRINTH` was never modelled —
the as-built enclosure has no labyrinth (see the vault note
`rl300-safe-intake-acoustic-labyrinth.md`); intake geometry lives under
`DUCT_INTAKE`, exhaust under `DUCT_EXHAUST`, and `COMPOSITE_PANELS` is a distinct
7th root the original spec omitted.

**Pending re-export (do not block on it):** a node-rename pass is in progress on
`C:\Projects\CAD\RL300-SAFE\RL300-SAFE-webexport-v4-node-rename.blend`
(`DUCT_INTAKE` → `DUCT_LABYRINTH`, `DUCT_EXHAUST` → `EXHAUST_PORT`). If/when it
lands, `msp-enclosure.glb` is re-committed with the renamed roots and this section
plus `Station2_AcousticEnclosure.tsx` are updated. Until then, resolve the 7 names
above.

### Provenance gaps still owed by Mark

The source-register row (`context/references/source-register.md`) records what is
verified — units (metric, 1 unit = 1 m), bbox (1.600 × 3.366 × 2.107 m), export
method, 293,239 unique tris / 415,900 drawn, 9 Principled BSDF materials. Still
**unverified, pending Mark**: originating CAD authority + revision, and the usage
restriction (Myers-Seth Pumps internal / client-confidential?). Fill these before
JG-015 closes.

## Single-Session Execution Plan

1. **Validate the delivered asset.** `public/models/msp-enclosure.glb` is already
   committed (see "Asset Delivered" above). Re-inspect it and record file size,
   bounds, units, texture formats, compression result, and exact node names in
   the verification record. Stop rather than infer a role if any of
   `ENCLOSURE_CHASSIS`, `COMPOSITE_PANELS`, `PUMP_HOUSING`, `ACOUSTIC_BAFFLES`,
   `ISOLATION_MOUNTS`, `DUCT_INTAKE`, or `DUCT_EXHAUST` is absent.
2. **Register provenance.** The `source-register.md` row exists; fill the two
   fields still owed by Mark (CAD authority + revision, usage restriction) before
   closing. The register entry must stay distinct from the D1-AP JGun source.
3. **Confirm the asset is installed.** `public/models/msp-enclosure.glb` (single
   combined GLB — no `rl300-skid.glb`). Do not modify the protected JGun or M249
   assets. Re-inspect and compare source vs destination size and node-name set.
4. **Establish the integration regression check first.** Add a focused,
   automated check that proves the Stage 2 component loads only
   `public/models/msp-enclosure.glb`, requires all 7 stable nodes, and keeps the
   procedural enclosure placeholder out of the Stage 2 render tree. Run it once
   while it fails for the missing component before adding production integration code.
5. **Create `src/scene/stages/Station2_AcousticEnclosure.tsx`.** Load the
   asset through the project's local Draco path, resolve only the 7
   stable names, map pump/core, composite panel, foam/damping, and hardware
   materials without mutating cached GLTF materials, and dispose any
   component-owned resources on unmount. Full tier may use the complete
   material treatment; lite tier must retain one visible asset representation
   without the richer effects; poster tier must continue to mount no canvas.
6. **Replace Stage 2 serially in `src/scene/StageManager.tsx`.** Remove the
   five-layer placeholder geometry and materials only after the new component
   is proven to load. Keep `AirflowField`, the existing `stageEnvelope` window,
   imperative `useFrame` scroll reads, reduced-motion behavior, and CH.01/02
   and CH.04 stages unchanged. Do not mount both the placeholder and the real
   enclosure at once.
7. **Verify and document before closure.** Run the new regression check,
   `npm run typecheck`, and `npm run build`; restart the `:4173` preview after
   the build. Capture fresh full, lite, reduced-motion, and poster telemetry;
   confirm the CH.03 window reports Stage 2 as dominant while JGun and M249
   telemetry remain valid. Record the measurements, commands, asset audit, and
   telemetry in `project/work/evidence/JG-015-msp-acoustic-safe-asset-ingestion-verification.md`,
   then update `project/work/INDEX.md` and `TODO.md` together only if every
   acceptance criterion passes.

## Implementation Steps

1. Record CAD source, usage restriction, units, bounding dimensions, authoring revision, and export method in `context/references/source-register.md` (row exists; CAD authority/revision + restriction still owed by Mark).
2. Validate the delivered `public/models/msp-enclosure.glb` — discrete named subassemblies: `ENCLOSURE_CHASSIS`, `COMPOSITE_PANELS`, `PUMP_HOUSING`, `ACOUSTIC_BAFFLES`, `ISOLATION_MOUNTS`, `DUCT_INTAKE`, `DUCT_EXHAUST`.
3. Measure asset geometry (bbox 1.600 × 3.366 × 2.107 m, Y-up, base at Z=0) and choose the Stage 2 camera/framing from the real dimensions.
4. Build `Station2_AcousticEnclosure.tsx` and replace the procedural placeholder through `StageManager` without mounting duplicate high-cost geometry.
5. Define full, medium, and poster-tier behavior before enabling richer airflow or post-processing effects.

## Acceptance Criteria

- [ ] GLB source, size, dimensions, texture formats, and compression result are registered.
- [ ] Discrete named assemblies are resolved by stable node names.
- [ ] PBR materials distinguish pump core, composite panels, foam/damping material, and hardware.
- [ ] Real Stage 2 asset replaces the placeholder without reducing JGun/M249 behavior.
- [ ] Asset/bundle and runtime telemetry evidence pass on full and medium tiers.

## Verification Record

Create `../evidence/JG-015-msp-acoustic-safe-asset-ingestion-verification.md` before checking off the TODO entry.
