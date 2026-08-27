---
id: JG-015
title: RL-300 / MSP Acoustic SAFE asset ingestion
status: queued
created: 2026-08-26
owner: unassigned
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
