# 34 V16 assessment (read-only, 2026-10-10)

Assessment of `C:\Projects\CAD\RL300-SAFE\RL300-SAFE-photoreal-V16-review.blend` against the shipped `public/models/msp-enclosure.glb`. Nothing here modified the blend or any tracked asset.

**Snapshot caveat.** `data/*.json` were produced from a scratch copy of V16 as saved **2026-10-10 19:44** (216,743,950 bytes). The original was saved again at **20:44** (216,764,054 bytes, sha256 `788ae2a2a2f784c56e70c16e81365b82fa0d236a48acce261855f4a7aa9d6146`). Re-run the scripts below on a fresh scratch copy before relying on any number.

## Re-run
Blender: `C:\Program Files\Blender Foundation\Blender 5.1\blender.exe` (5.1.1 opens the file). Work on a COPY, never the original (the owner edits it and may have it open):
```
cp "C:/Projects/CAD/RL300-SAFE/RL300-SAFE-photoreal-V16-review.blend" <scratch>/V16-copy.blend
OUT_JSON=<scratch>/v16-summary.json blender --background --factory-startup <scratch>/V16-copy.blend --python scripts/blendinfo.py
```
Same pattern: `blendnames.py` -> per-mesh-object name/root/tris/materials (`v16-objs.json`); `blendparts.py` -> the 3 requested part groups with world bboxes (`v16-parts.json`); `blendmats.py` -> Principled values per material (`v16-mats.json`). Then `node scripts/namediff.mjs` (needs `blend/v16-objs.json` beside it; adjust the path), `node scripts/glbinfo.mjs public/models/msp-enclosure.glb`, `node scripts/glbbox.mjs`.

## Files
| Path | What |
|---|---|
| `data/v16-summary.json` | counts: 3.44M raw tris, 614 mesh objects, 154 Decimate modifiers, 32 used materials (3 glTF-clean, 12 procedural noise, 8 non-Principled), 0 image textures |
| `data/v16-objs.json` | every mesh object: name, root, tris, hidden, first-3 material names, decimate ratio. **This is the per-part material map source** (strip the `__SECTION` suffix) |
| `data/v16-parts.json` | `EXHAUST_CONNECTOR_PIPE`, `RL300-P-FFM-1001-1`, `BREP1.*`, `DIAL_LENS_1/2`: world bboxes, tris, materials, parents |
| `data/v16-mats.json` | base/metal/rough/coat/bump/noise per material |
| `scripts/` | the Blender and node scripts that made the above, plus `litediff.mjs` (full-vs-lite difference map), `trim.mjs` (white lead-in trim for MP4s), `verify-evidence.mjs` (static gate for evidence sets) |
| `lite-diff/` | magenta = pixel changed >8/255 between full and lite at the same u and viewport |
| `specs/` | the GPU-seat specs and static gate files used for GPU-2/GPU-3 (reusable) |
| `gpu-seat-scripts/` | the GPU seat's capture scripts (phase-a: sheets/holds/intake/endcard, phase-b: reservoir/chevrons/panel/lite-vs-full, phase-c: videos, `common.mjs`, hash and PID helpers) |

## Findings (measured on the 19:44 copy)
- V16 is a render scene (Workbench engine set, 28 cameras, 15 actions, HDRI + 4 area lights + sun). Frames and units match the shipped GLB (Blender Z-up to glTF Y-up: x, z, -y; same metres, positions agree within about 0.01 m).
- 540 of 551 shipped mesh names exist in V16; 74 V16-only objects (170k raw tris); 11 shipped-only (`ISO_MOUNT_1..6`, `PROPOSED_COLLECTOR_DUCT_OUTLET`, `V2RL300-SAF-1047-5_PROPOSED_LOUVERS`, couplings, seal). V16 has no `PROPOSED_LOWER_INTAKE` root.
- For the 8 material names V16 shares with the GLB the Principled values are equal or within a few percent. The new look is finer material assignment (lacquer / gloss / pop / brass / polished / enamel, several with clearcoat), procedural micro-bump (noise scale 380-700), Cycles bevel edges, and lighting.
- `RL300-P-FFM-1001-1` is ALREADY in the shipped GLB (bbox x .389..468, y .613..994, z -1.134..-.982); it has no `PART_POLICY` entry, so the default `section` policy lets the cut clip it.
- `EXHAUST_CONNECTOR_PIPE` (2,172 tris, parent `DUCT_EXHAUST`, MSP_STAINLESS_FASTENER) is not in the GLB. Dials: `BREP1.001` (bezel 21,623 + face 4,750 + marks 9,431 + `BREP1` 1,020 yellow), `BREP1.007` (same, `.006/.005/.008`), `DIAL_LENS_1/2` (380 each, DIAL_LENS glossy+transparent); about 74k raw tris, each dial ~78 mm, interior at x ~0.55 facing +x.
- Full vs lite (earlier GPU-2 capture): 245,092 vs 440,668 source tris; 6-11 % of pixels differ, median shift 12-18/255, lite slightly brighter; shadows off and 2 textures vs 4 in lite.
