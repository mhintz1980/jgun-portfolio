# JGUN Durable Constraints

This document records enduring project constraints. [`../../AGENTS.md`](../../AGENTS.md) remains the short mandatory entry point; this file supplies the stable context behind those rules.

## Rig and Mechanical Identity

Part numbers are the stable identity key. Do not reorder the D1-AP explosion ladder based on a stage name alone. Changes to ladder behavior require synchronized updates to the canonical animation spec, README ladder references, and the relevant rig-skill tables.

## Validation

WebGL claims require a fresh `:4173` preview after the current build and runtime telemetry evidence. Screenshots may provide supporting context, but do not prove a rig, camera, material, or timing result by themselves.

## Protected Assets

Never regenerate `public/models/m249-transformed.glb` with bare `npx gltfjsx --transform`. The asset’s required normal-map post-processing is documented in the generated `C:\Projects\CAD\M249.jsx` header and the `glb-web-export-triage` skill. Do not add the committed textured M249 asset to `sync-assets.ps1`.

## Parallel Work

Do not move, delete, commit, or build on `.scratch/`, `docs/orzo-style-portfolio-implemetation-roadmap.md`, or any subsequently identified parallel-session material without the owning session’s explicit release.

## Work Completion

For work accepted after this knowledge system was established, an unchecked task in `TODO.md` must link to an accepted `JG-###` plan. It may become checked only after linked evidence records the relevant build, telemetry, accessibility, and asset checks.
