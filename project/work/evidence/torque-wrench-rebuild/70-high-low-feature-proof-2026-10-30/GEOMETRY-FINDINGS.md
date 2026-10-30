# High/low feature geometry findings — 2026-10-30

## Scope and result

This is an offline, read-only geometry investigation of the candidate clone at `C:/Users/Markimus/AppData/Local/Temp/jgun-camera-preview-20261029`. It decoded every POSITION point and triangle of the relevant Draco primitives, hashed both GLBs before and after, and wrote only this directory. This investigation changed no renderer, browser, build, protected asset, product source, stage/commit, or authoritative-checkout file; other agents may own concurrent candidate changes.

| Feature | Shaft-local CAD +Y band (mm) | Status |
|---|---:|---|
| `inputSunTeeth`, shared functional identity | **3.174827 .. 9.524858** | Authenticated in both source and study |
| Source-only shaped-material exit | 9.524858 .. 9.789711 | Variant coverage only |
| Study-only hob lead-out | 9.524858 .. 13.938684 | Variant coverage only |
| `inputSixfold`, distinct far-end six-flat feature | **61.109647 .. 71.523950** | Authenticated in both source and study |
| Strong six-flat sub-band | 61.109647 .. 71.120672 | Six normal clusters in both assets |

The shared tooth band deliberately ends at the functional face rather than stretching to the study lead-out. Source `P001835-2` and study `approvedshaft` are not interchangeable meshes: the source has 11,347 decoded vertices / 12,754 triangles, while the study has 32,275 / 47,976. At y 13.5 mm, source dominant count is 14 with variance fraction 0.000904; study dominant count is 10 with variance fraction 0.687220. A full lead-out proof therefore requires variant-selected bands. A strict source/study identity comparison can use the common functional band above.

## Why these bounds are complete

The script decodes all relevant triangles, transforms them into shaft-local CAD millimetres, intersects complete triangle cross-sections, and evaluates an angle-uniform outer profile with 1,440 rays. The ray grid is offset by half a sample to avoid CAD seams. Raw and five-bin circular-median Fourier analyses must agree. Representative planes were re-cast at +0.037° and +0.061° phase offsets; all raw/filtered counts remained 10 or 6 as expected, with zero missing rays.

- Ten teeth: y 3.15 is negative (count 5); y 3.2 enters the feature (count 10). Both assets report count 10 at y 6 (variance fraction about 0.9476) and at y 9.5. Source tooth material exits at decoded plane y 9.789711 (62 vertex uses); study lead-out continues to decoded plane y 13.938684 (5 vertex uses) before the y 14.180012 shoulder.
- Sixfold: y 61.10 is only the weak approach (variance fraction 0.034–0.037). At y 61.15 and y 66 both assets report count 6 with variance fraction about 0.9076. Independent normal topology finds exactly six modulo-60° orientation clusters in each asset, and every strong flat triangle lies inside 61.109647..71.120672. The 60.703546..61.109647 approach is excluded deliberately; it lacks the strong six-flat section/normal clusters. The upper bound is the decoded shaft tip y 71.523950, so the end lead-out is included.
- Selected endpoint planes are recorded with vertex-use counts and radii in `geometry-report.json`; the bounds are not selected from a handful of extreme vertices. Triangle coverage tables count intersecting, fully inside, and boundary-straddling triangles for every proposed band.

## Source/study mapping and occurrences

`Default.glb` contains exactly two named `P001835` occurrences: node 71 `occurrence of P001835-2` and node 72 `P001835-2`. Only node 72 carries a mesh (mesh 16), and no other node reuses that mesh. It has 131 Draco primitives. The study bundle contains one `approvedshaft` occurrence, node 1 / mesh 1, with one Draco primitive.

Static decoding used the G0 matrix `shaft_local_to_gltf_world` from the tracked source registry:

- Source mesh-local frame: `scale(1000) * inverse(shaft_local_to_gltf_world) * nodeWorld`. This reduces to metre-to-millimetre scaling plus glTF −Z to CAD +Y; maximum unexpected matrix component is 0.0000222.
- Study mesh-local frame: the runtime-compatible inverse of CAD mm → study m `(x,y,z) -> (x,z,-y)`, giving the recorded diagonal/permutation `objectToShaft` matrix.

These are static decoded-mesh matrices. Runtime source meshes are consolidated/baked and then posed by `shaftTakeover`, so the pixel worker must recompute `objectToShaft` from each live `mesh.matrixWorld` and the proof-scene registration. Do not copy the raw Default.glb node transform onto a rig mesh. Approved study materials already have `vShaftLocal` from `applyProgression`; unpatched source-rig materials do not, so the worker must inject the same uniform/varying path there.

## Worker contract

The proposed axial-band plus per-mesh `objectToShaft` Matrix4 interface is sufficient for the shared alias-identity bands. Keep the existing `.35` and exact-zero gates unchanged. For a full lead-out/surface-coverage proof, extend the descriptor with a mesh variant (`sourceP001835` or `studyApproved`) and select:

- source full shaped feature: 3.174827..9.789711;
- study full hob feature: 3.174827..13.938684;
- shared strict tooth identity: 3.174827..9.524858;
- shared sixfold: 61.109647..71.523950.

Do not use one common 3.174827..13.938684 tooth band: it would falsely label source journal body as tooth feature. Geometry bounds do not replace positive/negative pixel controls, depth/alpha handling, source takeover, reverse seeks, or visibility acceptance.

## Authentication and reproduction

Commands, from the candidate root:

```powershell
node --check output/high-low-feature-proof/geometry/analyze-geometry.mjs
node output/high-low-feature-proof/geometry/analyze-geometry.mjs
```

Observed final stdout:

```json
{"sourceOccurrences":2,"sourceMeshes":1,"studyMeshes":1,"sourceTriangles":12754,"studyTriangles":47976,"sourceBounds":{"min":[-8.864600409246117,-0.00011161318981578461,-8.864578056545144],"max":[8.864619965746742,71.5239495038986,8.864619966043497]},"studyBounds":{"min":[-8.864600211381912,-0.00011175870895385744,-8.864577859640121],"max":[8.864594623446465,71.52394950389862,8.864207193255424]},"assetsUnchanged":true}
```

SHA-256 before/after:

- `public/models/Default.glb`: `8b07246cf857aca29d1832815d8d183e0a1fd8ef06da5a7a089019706a57a257` (unchanged)
- `public/models/manufacturing-core-full.glb`: `17f90d73a8312bb9b91b3e4468ea3a598e046df0897714091243fed6722183be` (unchanged)

Final evidence hashes:

- `analyze-geometry.mjs`: `1a044272f0cf4067d2904d4f23515ec9b0834e77326d5e405edb7d34a4e50b6b`
- `geometry-report.json`: `5a4dca0940687dafe6d1d4613831bee160dc7296b23c418eb18020c0fa49b5a5`

The complete evidence, matrices, phase checks, controls, triangle counts, selected endpoint planes, and limitations is in `geometry-report.json`. The analysis script is `analyze-geometry.mjs`. This document and those two files are the geometry handoff; pixel/runtime acceptance remains open.
