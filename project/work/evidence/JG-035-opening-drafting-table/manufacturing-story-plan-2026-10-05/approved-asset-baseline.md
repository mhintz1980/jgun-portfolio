# Approved asset baseline — read-only snapshot, 2026-10-05

JG-035 planning evidence. Mark approved these modified shapes and placements after Blender review; runtime integration remains unimplemented. Source directory: `C:/Projects/CAD/jgun-input-shaft-hobbed/shifted/`. Hashes below were read from the live files in this planning session.

| File | Bytes | SHA-256 |
|---|---:|---|
| input-shaft-assembly-parts-v1.blend | 6,485,113 | 88d1ce4ac7ca112adcd370e77852cfb9977dfec81b4bfcb61ee1872895574a89 |
| p001835-hobbed.glb | 10,846,592 | 043c9628336589c9ba0fdaa9bac1c7b240598a99dd449eb8df3da1a64ee9a428 |
| k000210-k000211-moved.glb | 71,288 | 17569c9a52bf662b599774ba81e2f7dc0d84e2b805707aa8ad09fff6ed454dc9 |
| p000725-modified.glb | 641,292 | cc6edfefbe83e4a1ab0c55d98b80a93d588ef46debf4ec774d6881fc1660abc4 |
| shaft_world_matrix.json | 282 | c89849870eb656b6930276bfb0611ee09f7133088f0e5630acc932c2ea813195 |
| build-report.json | 2,485 | 76fa39ccefcb67dce44a4b78a12ce2b051c84a2169422adfc55c3e1307b9c265 |

Legacy isolated grooved source `C:/Projects/CAD/jgun-input-shaft-hobbed/p001835-source-extract.glb` and its `shifted/` copy both read 8,627,448 bytes, SHA-256 `3903bcae3570e3cc9b225989a6fb2ebd8ec80e1298ac77c0250f50103a13fb47`. G0 must still compare the extracted occurrence against the live narrative `Default.glb` and record its occurrence path/datum; matching extract hashes do not authenticate a failed historical revision.

The existing report records a 6.35 mm functional face, 2.75 mm journal shift, 6.0 mm authored hob radius, 125,906 faces and one non-manifold edge in the hobbed result. These are source-report facts, not new geometry certification. The report's `leadout_end_y_mm = 14.0639481319` differs from the handoff's informal 13.79 mm floor-exit figure. They may describe different features; measure the actual mesh and swept tool before deriving a clearance claim. Astra's concept review correctly treats the handoff-derived 0.14 mm nominal separation as unverified.

Before a runtime export, verify all neighbours (including K000180-1 spring), resolve the non-manifold edge and cosmetic normals in a derived copy, and preserve the accepted silhouette/fit. Avoid loading the 10.85 MB source shaft into the normal narrative. Bearing/ring exports already contain their final placement; never add 2.75 mm a second time.

## Mechanical reference sources consulted

Primary manufacturer pages opened 2026-10-05. They establish tooling/process families and machine axes; they do not establish this shaft's particular tool, speeds, production history, or machining clearance.

- [Gleason shaping tools](https://www.gleason.com/en/products/tools/cylindrical/shaping/shaping-tools): shaper cutter designs vary with the machining task and access constraints.
- [Liebherr gear shaping machines](https://www.liebherr.com/en-us/gear-technology-and-automation-systems/lvt/gear-technique/gear-cutting-machines/gear-shaping-machines/vta_gear_shaping_machines-6442289): shaping heads and axial slide arrangements, including high stroke rates.
- [Liebherr LC 180–280 hobbing axes](https://www.liebherr.com/en-in/gear-technology-and-automation-systems/gear-technique/gear-cutting-machines/gear-hobbing-machines/pdpe/lc-180-280-4142861): separate radial feed, tool rotation, workpiece rotation, axial cutter travel and tool swivel.
- [Gleason hobs and milling cutters](https://www.gleason.com/en/products/tools/cylindrical/hobbing-and-milling/hobs-and-milling-cutters): distinct hob and milling cutter families. The accepted lead-out construction alone is insufficient to select a real tooling envelope.

Implementation must pin a compatible shaping cutter and rotary-hob representation with reference-backed generating ratios, setting angle, cutting/return motion and swept envelope. The quarter-orbit cinematic effect can be produced by the camera without moving a shaper incorrectly around a fixed shaft.
