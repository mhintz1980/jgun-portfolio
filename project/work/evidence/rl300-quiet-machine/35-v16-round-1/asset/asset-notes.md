# Asset seat notes (V16 extras GLB + per-part material map)

Source: scratch copy `V16-copy.blend`, sha256 `788ae2a2...d6146`, never saved. Blender 5.1.1 headless. Data: `report.json`.

## Outputs
- `public/models/rl300-extra-parts.glb` 258,624 B, 13 nodes, 7,248 tris, no extensions, Y-up, identity transforms. Ignored by `.gitignore` (`public/models/*.glb`): needs `git add -f`.
- `src/scene/rl300/v16-part-materials.json` 22,296 B (compact), 27 materials, 231 parts.

## Decimation (what was done, and where it departs from the spec method)
- bezel/marks/ring: weld 1 um, planar dissolve 1 deg (six per-axis extreme vertices excluded so the bbox survives), triangulate, split into welded islands, Decimate-collapse each island with its own target (weight `sqrt(tris) * (1 + size_mm/12)`, floor 8) and the extreme vertices pinned via an inverted vertex group. Spec said "collapse only if still above budget": every sub-object was above budget.
- face plate (departure): the plate is a disc with 31 holes. A collapse shrank the 54 mm rim by 2-3 mm and stalled at 160-170 tris on one dial. Instead: the 18 holes that the marks' +x faces cover (ratio 0.95-1.10) were left out of the plate outline, the remaining 13 holes (2 needle pivot holes, 10 digit holes that are only 48-65 % covered, one 3.7x5 mm cutout) are kept, outlines are Douglas-Peucker simplified (rim 0.05 mm tolerance) and re-triangulated. Rim stays within 0.05 mm of V16.
- dial 2 is dial 1 translated by 0.11432 m in y (verified vertex by vertex, max deviation 3e-8 m): decimated once, copied.
- Marks welded islands 30 -> 30 on both dials (unwelded V16 count is 400; bezel 22 -> 27, ring 2 -> 2, face 1 -> 1). Bezel island count rises: the collapse tore five small decal islands (not a spec requirement, reported).
- Worst one-sided surface deviations (V16 vertex to result surface): bezel flat 13.9 mm ring decal 3.9 mm, marks arc sheet 41x35 mm 2.35 mm, bezel body 0.93 mm, digits 0.1-0.7 mm. No bbox moved more than 0.02 mm.

## Materials
- DIAL_LENS is Mix Shader(Fac=Fresnel IOR 1.45, Shader=Transparent, Shader_001=Glossy 0.8 grey, roughness 0.02). Fac is linked (socket default 0.5 inert). Exported alpha = F0 = 0.0337 (glossy weight at normal incidence), BLEND, metallic 0. The real opacity rises towards 1 at grazing angles; a constant alpha cannot do that. Runtime choice, not made here.
- MSP_STAINLESS_FASTENER: Map Range fed by Object Info Random, from 0..1 to 0.30..0.42; GLB uses midpoint 0.36, D2 uses the socket default 0.40 (per spec) with the range in `notes`.
- 8 materials carry a linked roughness (Map Range); D2 stores the socket default and `procedural: true`, with range and midpoint in `notes`.
- `MSP_INSULATION_FOAM__SECTION` is the only section twin whose value differs (base colour 0.022 -> 0.040); recorded in `sectionVariantOf`.

## Mapping
- 614 V16 mesh objects; 220 have a sanitized name present in `msp-enclosure.glb` (219 also in `rl300-lite.glb`); 11 extras (all absent from the main GLB, so `glbPrims: null`); 383 dropped (V16-only names, different export lineage).
- 212 single-slot; 18 multi-slot with slots == glbPrims; 1 multi-slot with slots != glbPrims; 0 null slots.

## Pipe bbox
`v16-parts.json` bbox for `EXHAUST_CONNECTOR_PIPE` is the AABB of the rotated object's `bound_box` corners and is 2.44 mm looser than the real vertices. The GLB matches the tight vertex AABB at 0.000 mm; against the file it is 2.44 mm (spec asked < 1 mm). Everything else is within 0.05 mm.
