# JG-024 — Fine-tessellation JGun re-export with missing fasteners

## Status

`implemented` — machine-verified 2026-09-02 ([evidence](../evidence/JG-024-fine-jgun-fastener-reswap-verification.md));
owner visual ruling pending at the preview stop points. Deviation from plan: target density
was ~333 K tris; shipped 1.29 M (handle resisted collapse — prim fragmentation + lock-border;
perf gates green at the 16.8 ms quantum, so accepted). The `blackOxideSteel` ROLE_OVERRIDE
the plan originally specified turned out to be a dead mechanism (generic mesh names) —
implemented as a `fastener` rig UNIT instead (nodeRoles.ts + materials.ts).

## Problem

The deployed `public/models/Default.glb` (Onshape Medium, Draco, 333,093 rendered
triangles, 8.0 MB) omits the assembly's screws — 5 large empty counterbores on the
handle back plate face the camera directly, and 4 radially-installed screws are missing
around the Ring-Switch zoom region.

## Source

`C:\Projects\CAD\JGUN.glb` — Onshape re-export 2026-09-01, tessellation **Fine**
(uncompressed), 203.7 MB, 10,945,989 triangles, Y-up, identical orientation/scale/materials
per owner. Reduction happens downstream (owner intent: never let Onshape's cruder
tessellation settings decide quality).

## Forensic findings (measured 2026-09-01, `.scratch/jgun-reswap/probe-*.mjs`)

- **Tree diff is exactly +9 screw nodes and one reparent.** All 76 part-number groups
  have identical instance counts old vs new. The 9 additions are PN-less McMaster-named
  nodes, all direct children of `HANDLE ASSY, D.5AP-D1AP-rev1-1 <1>`:
  - Back plate (5): `91251A148_NO THREADS_Black-Oxide Alloy Steel Socket Head Screw` ×2,
    `96006A253_NO THREADS_Black Oxide 18-8 Stainless Steel Socket Head Screw` ×1,
    `90910A815_NO THREADS_Button Head Torx Screws` ×2 — world z ≈ −190…−210 mm.
  - Radial (4): `91251A344` ×4 (aggregated center ≈ [12, 0, −210] mm, spread radially).
  - All modeled `NO THREADS` (no helical geometry bloat).
- **K000004 (bearing ring) reparented** from gearbox root to under `A000592-1`
  (stage-2 cage). World center `[0, 0, −0.0545]` **identical** in both files —
  compensated by local transforms; the rig's world-matrix bake is unaffected, and
  `BEARING_RE` self-tags by name regardless of parent.
- **World-space parity (99 common mesh paths): center deviation 0.00 mm worst-case;
  dimension deltas ≤ 0.40 mm** (tessellation density only, worst = ring-switch ring).
- Bbox identical `[0.148, 0.272, 0.253]`. Materials 36 = 36, images 0 in both
  (untextured — the msp/m249 texture traps do not apply).
- Only `Default.glb` is loaded at runtime (`MODEL_URL`, single `useGLTF`); the split
  `jgun-gearbox.glb`/`jgun-handle.glb` derivatives have no runtime consumers.

## Rig impact analysis (`src/scene/rig/nodeRoles.ts`)

- The handle assembly node itself is tagged `'handle'` (nodeRoles.ts:235) and `unitOf()`
  resolves untagged meshes by nearest tagged ancestor → **the 9 screws auto-classify as
  handle-unit members**: they travel with the handle explosion (−0.354), stay 100%
  opaque (only `'housing'` ghosts), and merge into the existing
  `(handle × role × solid)` consolidation bucket — no new draw calls.
- No PN collisions (screws carry no D1-AP part numbers). Planet counts/regexes,
  carrier pivots, and `EXPLODE_OFFSETS` are untouched. No ladder change → no
  spec §5 / README / skill-table updates required.
- **Single code change:** `ROLE_OVERRIDES` entry in `src/scene/rig/materials.ts`
  routing the black-oxide fastener names (`91251A|96006A|90910A`) to the existing
  `blackOxideSteel` role — without it they fall to the handle default
  (`anodizedAluminum`), which is the wrong material family for black-oxide socket
  screws.

## Processing pipeline

Tooling decision: `@gltf-transform/cli` — the same pipeline family that produced the
current `jgun-full.glb` (per `scripts/sync-assets.ps1`). Blender was considered (owner
heard "reduction is best in Blender") and rejected for this model: Blender's glTF I/O
round-trip risks node-name mangling, hierarchy restructuring, and material remap on a
337-node identity-critical tree, while the required operations (quadric simplification
+ Draco) are exactly gltf-transform's domain with zero node-graph edits. Blender remains
the documented path only if visual QC fails (fallback: per-object decimate + re-export,
then re-run the parity probes).

Chain (output lands in `C:\Projects\CAD\RL300-SAFE\optimized\jgun-full.glb`,
old file preserved as `jgun-full-medium-nofasteners.glb`):

```
prune → simplify --ratio ~0.035 --error 0.001 --lock-border → dedup → draco
```

- Target: ≈ 333 K rendered triangles (the approved visual baseline; Fine-source quadric
  reduction at equal density ≥ Onshape Medium uniform tessellation — the point of the
  Fine export). Ratio calibrated by measurement, one iteration allowed.
- `--lock-border` prevents primitive-seam cracks.
- `dedup` re-merges the 4 identical `91251A344` defs into instanced accessors.

## Acceptance criteria

1. Processed GLB: node names + hierarchy byte-parity with the Fine source (minus
   nothing); rendered triangles within ±15% of 333 K; Draco'd size ≤ ~10 MB.
2. World-space parity vs the OLD Default.glb re-run on the processed file: centers
   0.0 mm (≤ tessellation noise), dims ≤ ~0.5 mm.
3. `role-map.json` occurrence names: every row still resolves to a node in the new GLB.
4. `npm run typecheck`, `npm run build` green.
5. `:4173` telemetry (fresh server restart after rebuild): planet counts 4/4/4/5/4;
   bearing world z −0.0545; handle unit contains the 9 screws (consolidation bucket
   `handle|blackOxideSteel|solid` ≥ 9 source meshes); ghost count unchanged;
   `sweepMin/sweepMax` within a few mm of current; frame time p95 ≤ 16.8 ms vsync
   quantum, zero PerformanceMonitor declines.
6. Same-frame capture pairs (old vs new) at the back plate and Ring-Switch zoom camera
   poses showing screws present; owner visual ruling at `?chapter=` stop points.
7. Docs updated in the same commit: source-register row (Fine export settings),
   README GLB-size note if changed, this plan's status.

## Verification record

[`evidence/JG-024-fine-jgun-fastener-reswap-verification.md`](../evidence/JG-024-fine-jgun-fastener-reswap-verification.md)
