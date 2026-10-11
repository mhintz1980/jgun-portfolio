# Runtime seat notes: V16 materials + extras + FFM-1001-1 keep (2026-10-11)

Numbers come from the real `prepareModel` run in node over the shipped GLBs (esbuild-bundled driver, one three instance, draco3d).
HEAD run first reproduced full cap 154554, lite cap 165216, removed 460, source-kept 596 / 592, so the later numbers are trustworthy.

## Loader evidence (msp-enclosure.glb, rl300-lite.glb)
- Single-primitive part = one Mesh named after the node (the JSON key). Multi-primitive part = a non-Mesh group carrying the
  node name (the JSON key) with Mesh children `Mesh_422`, `Mesh_422_1`, ... in primitive order (MESH-def names, not `name_1`).
  Pinned by test: `RL200-SIF-1005-1` -> children `['Mesh_422','Mesh_422_1']`.
- Slot count is what the loader delivered (full 34 multi-primitive groups, lite 22), never `glbPrims`.
- All materials are MeshStandardMaterial (no transmission/clearcoat). Extras node names are sanitized (`BREP1001`); JSON keys match.
- Slot order: 21 multi-equal parts printed; where base names are distinguishable, zero permutations.

## Decisions (spec open, or two rules met)
1. Bucket key = the material whose values the bucket carries: V16 name when V16 values apply, else the GLB name. In V16 mode an
   unrepainted GLB-look bucket reads `<GLB name>~glb` (V16 reuses MSP_STAINLESS/PLASTIC/... with other values; merging lets the first
   part win). Repainted buckets keep the GLB name: all `-SIF-` parts map to MSP_INSULATION_FOAM from three base materials with
   different clamped r/m, so keying on the V16 name would mix protected looks. They still count as mapped.
2. Protected looks: where `finishFor` returns a colour, r/m are the old code's exactly (226 primitives, counter `protectedPrimitives`
   added). V16 values: colour via `setRGB` (linear), no `.28/.8` clamps (they erase lacquer .16 and brass 1.0).
3. One V16 slot on two GLB primitives (1 part) covers both; multi-slot maps only when `v16.length === delivered count`.
4. MeshPhysicalMaterial only when `physical && clearcoat > 0` (6 buckets full, 0 lite). Lite: same map, `physical:false`, no extras.
5. Lens: JSON opacity 0.033736 exactly, `transparent`, `depthWrite=false`, renderOrder 2, own bucket. Beyond the spec: `castShadow=false`
   (shadow pass ignores opacity) and `forceSinglePass=true` (three draws transparent DoubleSide twice; both faces identical, saves 1 draw).
   The lens still writes the equipment stencil like its dial.
6. Extras ingest in the SAME `prepareModel` call (`options.extras`) after the main roots: shared buckets, caps, disposal.
   `EXTRAS_POLICY = { GAUGE_DIALS: keep, EXHAUST_CONNECTOR_PIPE: section }`; no finishFor, no clamps, not in `parts`.
7. Scene: both GLBs load in parallel, extras resolve null on error, one `prepareModel`, then `configureEquipmentStencil`
   (now `max(renderOrder,1)`), both sources disposed in `finally`. Not fetched when `lite`.

## Re-pinned numbers
- `preview.test.ts` keep entries 3 -> 4; `RULING.keep` gains `RL300-P-FFM-1001-1` (674 tris, xMin .3887 xMax .468, both tiers).
- `KNOWN_STALE_LITE.cap` 165216 -> 164542 = 165216 - 674 (FFM leaves the cut caps).
- `KNOWN_STALE_LITE.fullCap` 154554 -> 156052 = 154554 - 674 + 2172 (closed connector pipe, capped; lite never loads it).
- Unchanged and still true: source-kept = 108 + airway + 460: full 447916-447320=596, lite 245092-244500=592; airway 24 lite;
  removed 460; lite kept 244500 < 248000. Full source/kept each +7248 (11 extras meshes). keptWhole 9136 -> 9810 (not pinned).

## Mapping stats (v16 run)
| tier | mappedParts | multi mapped | unmappedMultiSlot | not in JSON | mappedPrim | batches (HEAD) | physical | extras |
| full | 513 (502+11 extras) | 21 | 36 | 11 | 541 | 50 (31) | 6 | 11 parts, 7248 tris |
| lite | 490 | 9 | 47 | 9 | 500 | 43 (30) | 0 | 0 |
Full 10 largest unmapped (tris): coupling_8_bolt-1 800, -1001 800 (not in JSON), push-on seal 460 (not in JSON, ruled out), then
7 `2751-10282-S1-Allegis-*` at 200 (3 slots vs 2 delivered). Lite top (2 slots vs 1 delivered, lite merged them): 6013677_REV04_PART-1
3447, RM100-PX1029008D-1 1199, 5495457_REV09_PART-1 916, then 7 at 799 (4987944_VG01..., 5236568_REV08..., 5257943..., 5488492...,
5488512..., 5488818..., 5488968...). `unmappedMultiSlot` = unique parts; `materials` = unique materials in the group (== batches).

## Bundle
Scene chunk `QuietMachineScene-*.js` 30,953 B (gzip 12,232) -> 82,099 B (gzip 18,908): +51,146 B raw, +6,676 gzip (JSON 49,408 B).
Eager graph untouched: `index-fDwt6Stp.js` identical (194,384 B); `quiet-machine-*.js` entry 277 B.

## Open / risk
- KNIFE-EDGE at the GPU seat: draw calls cannot be measured here. HEAD max: full 112, lite 75 vs `< 150` / `< 90`. Full = lite-like
  draws + one shadow draw per cast mesh, so a batch costs 2 on full: 112 + 2*18 + 1 (lens: one main draw, no shadow) = 149 < 150 by
  one (150, a strict FAIL, without forceSinglePass); lite 75 + 13 = 88 < 90. Not touched: the `< 150` pin; options are raising it or
  merging value-identical V16 materials (27 -> 23 tuples, at most 4 batches, changes key naming): orchestrator's call.
- `public/models/rl300-extra-parts.glb` is gitignored (`public/models/*.glb`): needs `git add -f`.
- U.1 prints only the pre-existing stray 0-byte root file `Promise` (untouched).
