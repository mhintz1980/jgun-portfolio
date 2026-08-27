---
id: JG-015
title: RL-300 / MSP Acoustic SAFE asset ingestion
status: queued
created: 2026-08-26
owner: unassigned
last_audited: 2026-08-27
readiness: blocked-awaiting-authoritative-msp-rl300-cad-export
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
  - public/models/rl300-skid.glb
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

## Readiness Gate — 2026-08-27

JG-015 cannot begin asset integration until an authoritative MSP/RL-300
enclosure export is available. The inspected folder
`C:\Projects\CAD\RL300-SAFE\optimized\` contains only the existing D1-AP
JGun files: `jgun-full.glb`, `jgun-gearbox.glb`, `jgun-handle.glb`, and their
JGun role map. That role map resolves **zero** occurrences of the required
Stage 2 assemblies and identifies the source as `D1-AP Gearbox Assy-rev2-1`.

Do not rename, copy, or register those JGun files as an MSP/RL-300 enclosure.
Doing so would replace one placeholder with a misleading duplicate of Chapter
01/02 geometry and would invalidate the provenance and engineering-storytelling
acceptance criteria below.

To unblock this plan, provide the MSP/RL-300 source export(s) that correspond
to the two approved runtime paths in `implementation_scope`, plus the source
authority, revision, authoring units, usage restriction, and export method.
The export must preserve the six stable node names named in this plan. No
source-register row is added until that provenance can be recorded truthfully.

## Single-Session Execution Plan

1. **Validate the supplied source before copying it.** Inspect both source
   exports and record their file sizes, bounds, units, texture formats,
   compression result, and exact node names. Stop rather than infer a role if
   any of `PUMP_HOUSING`, `ENCLOSURE_CHASSIS`, `ACOUSTIC_BAFFLES`,
   `ISOLATION_MOUNTS`, `DUCT_LABYRINTH`, or `EXHAUST_PORT` is absent.
2. **Register provenance.** Add the inspected source path, revision, intended
   use, restriction, and review date to
   `project/context/references/source-register.md`. The register entry must
   distinguish the MSP/RL-300 source from the existing D1-AP JGun source.
3. **Install the approved runtime assets.** Place the validated exports at
   `public/models/msp-enclosure.glb` and `public/models/rl300-skid.glb` without
   modifying the protected JGun or M249 assets. Re-inspect the copied files and
   compare their source and destination sizes and node-name sets.
4. **Establish the integration regression check first.** Add a focused,
   automated check that proves the Stage 2 component loads only the two MSP
   paths, requires all six stable nodes, and keeps the procedural enclosure
   placeholder out of the Stage 2 render tree. Run it once while it fails for
   the missing component before adding production integration code.
5. **Create `src/scene/stages/Station2_AcousticEnclosure.tsx`.** Load the
   validated assets through the project's local Draco path, resolve only the
   six stable names, map pump/core, composite panel, foam/damping, and hardware
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

1. Record CAD source, usage restriction, units, bounding dimensions, authoring revision, and export method in `context/references/source-register.md`.
2. Export and validate the Draco-compressed GLB with discrete named subassemblies: `PUMP_HOUSING`, `ENCLOSURE_CHASSIS`, `ACOUSTIC_BAFFLES`, `ISOLATION_MOUNTS`, `DUCT_LABYRINTH`, and `EXHAUST_PORT`.
3. Measure asset geometry and choose the Stage 2 camera/framing only after the real dimensions are known.
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
