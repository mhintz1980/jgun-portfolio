# Asset seat spec: V16 extra parts GLB + per-part material map

You are the asset seat (Sonnet 5.5, high, `tier-worker`). The orchestrator verifies every claim, so report facts with pasted evidence, not narrative. Soft token budget: 150k.

Repo (Git Bash `/c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine`, Windows `C:\Users\Markimus\.buzz\REPOS\jgun-quiet-machine`), branch `quiet-machine/integration`, HEAD `97e2d806`. Use ABSOLUTE paths in every command; do not `cd` (the shell persists cwd).
Scratch dir (your temp files, scripts, work .blend): `C:\Users\Markimus\AppData\Local\Temp\claude\C--Users-Markimus--buzz-REPOS-jgun-quiet-machine\7a0ea69b-a024-4739-ae73-5eab43caed88\scratchpad\asset` (create it).
Evidence dir (untracked, in repo): `project/work/evidence/rl300-quiet-machine/35-v16-round-1/asset/`.

## Input (the ONLY V16 source you may touch)
`C:/Users/Markimus/AppData/Local/Temp/claude/C--Users-Markimus--buzz-REPOS-jgun-quiet-machine/7a0ea69b-a024-4739-ae73-5eab43caed88/scratchpad/v16/V16-copy.blend`, sha256 `788ae2a2a2f784c56e70c16e81365b82fa0d236a48acce261855f4a7aa9d6146` (the owner's 20:44 save). First step: `sha256sum` it and compare; a mismatch means stop and report. Never open, read, copy or reference `C:\Projects\CAD\RL300-SAFE\...` (the owner's live file) and never use the Blender MCP server. If you need a modified copy, `cp` it to your scratch dir first; never save over `V16-copy.blend`.
Blender: `"C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" --background --factory-startup <blend> --python <script>`; redirect its output to a log file in scratch (it is very chatty). Reusable examples of the bpy access you need: `project/work/evidence/rl300-quiet-machine/34-v16-assessment/scripts/blendnames.py`, `blendparts.py`, `blendmats.py`, `blendinfo.py`. Existing data (read, do not recompute unless you need more): `34-v16-assessment/data/v16-objs.json` (every mesh object: `n` name, `root`, `tris`, `mats`), `v16-parts.json` (the 12 rows you build), `v16-mats.json` (Principled values for 32 materials; `DIAL_LENS` is NOT in it because it is not a Principled material, you derive it from its node tree).

## Read first (only these)
1. `docs/HANDOFF-quiet-machine-2026-10-10f.md` lines 13-20 and 31 (what is approved, stage A).
2. `C:/Projects/skills-master/local/asset-and-bundle-hygiene/SKILL.md` (GLB hygiene; follow it for the GLB only).
3. `src/scene/rl300/prepareModel.ts` lines 65-79 (`sanitizeName`) and 154-200 (what the loader does with names and materials). You do NOT edit it.

## Hard rules
- You edit NO tracked file. No `git add`, `git commit`, `git stash`, `git push`. New untracked files only: `public/models/rl300-extra-parts.glb`, `src/scene/rl300/v16-part-materials.json`, and files under the evidence dir above. `public/models/msp-enclosure.glb`, `public/models/rl300-lite.glb`, `.gitignore` and the torque page are untouched.
- Python: use Blender's bundled Python only; the system `python3` hangs (Store stub). Use `node` for scratch scripts. Create files with the Write tool, not heredocs (they eat backslashes). Quote every `>` and `=>` in shell one-liners (stray 0-byte files such as `key`, `2`, `Promise` keep appearing in the repo root: do not create any; do not delete the existing ones).
- No servers, no GPU, no browser.

## Deliverable D1: `public/models/rl300-extra-parts.glb`
Plain glTF binary: NO Draco, no textures/images, no cameras/lights/animations, no UVs, no vertex colours. Positions + normals only. Metres. World transforms baked into vertices and every node transform identity, so the file shares the frame of `msp-enclosure.glb` (Blender Z-up to glTF Y-up is `(x, y, z) -> (x, z, -y)`; `export_yup=True`; the shipped FFM-1001-1 bbox x .389..468, y .613..994, z -1.134..-.982 is your sanity reference, shipped file frame). Node names (exact; they are map keys later):
```
DUCT_EXHAUST            (empty root)
  EXHAUST_CONNECTOR_PIPE        (mesh, V16 object of the same name, MSP_STAINLESS_FASTENER)
GAUGE_DIALS             (empty root)
  BREP1.001             (mesh: bezel, DIAL_BEZEL)
    BREP1.002           (mesh: face, DIAL_FACE)
    BREP1.003           (mesh: marks, DIAL_MARKS)
    BREP1               (mesh: yellow ring, material 0.886275_0.694118_0.027451_0.000000_0.000000)
    DIAL_LENS_1         (mesh, DIAL_LENS)
  BREP1.007             (mesh: bezel)
    BREP1.006 (face), BREP1.005 (marks), BREP1.008 (ring, ..._0.001), DIAL_LENS_2
```
(three's loader will sanitize `BREP1.001` to `BREP1001`; keep the dotted names in the file anyway.) `DUCT_EXHAUST` is deliberately a shell root name (the cut treats it like the main duct); `GAUGE_DIALS` is a new equipment root.
Decimation budgets (raw dial group is 73.6k tris; target about 5k for both dials): bezel <= 1,000 tris each; face <= 150; marks <= 900 (the marks are the first thing to degrade: the connected-component count of each marks mesh MUST be identical before and after); ring <= 150; lenses unchanged (380); pipe unchanged (2,172). Method: planar dissolve (limited angle 0.5 to 1 degree) first, Decimate collapse only if still above budget. Normals recomputed after: bezel auto-smooth 30 degrees, face and marks flat. Report per sub-object before/after tris, island counts, and bbox change (must be < 0.1 mm).
GLB materials: one per V16 material used, names exactly the V16 names, flat Principled values read from V16 (clearcoat via `KHR_materials_clearcoat` only when V16 coat > 0). The runtime will take its values from D2, so these are fallback/sanity. `DIAL_LENS`: read its node tree (glossy + transparent mix); record the mix factor and glossy roughness/colour in the report, and export alphaMode BLEND with that opacity. `MSP_STAINLESS_FASTENER` roughness is linked to a MAP_RANGE: record its from/to range and use the midpoint as the flat value (state this).

## Deliverable D2: `src/scene/rl300/v16-part-materials.json`
```
{
  "version": 1,
  "source": { "file": "RL300-SAFE-photoreal-V16-review.blend", "sha256": "788ae2a2...", "savedAt": "2026-10-10T20:44" },
  "materials": {
    "<V16 material name, __SECTION stripped>": {
      "baseLinear": [r, g, b], "metalness": n, "roughness": n,
      "clearcoat": n, "clearcoatRoughness": n, "opacity": 1,
      "procedural": false, "nonPrincipled": false, "notes": "how linked/derived values were chosen"
    }
  },
  "parts": {
    "<sanitized part name>": { "v16": ["<material in slot order>", ...], "glbPrims": <int or null> }
  }
}
```
- `baseLinear` is V16's linear base-colour floats unchanged (runtime calls `color.setRGB(r,g,b)` in linear working space). For a socket linked to a node, use the socket default value and set `procedural: true`; for a non-Principled material set `nonPrincipled: true` and derive sensible values, explained in `notes`. `X__SECTION` variants are render-only cut-face twins: drop them, the key is the base name (record `"sectionVariantOf"` only if the values differ from the base, with the difference).
- `parts` keys apply `sanitizeName` (whitespace to `_`, remove `[ ] . : /`) to the V16 object name `n`. Include a part only if its sanitized name exists as a node name in `public/models/msp-enclosure.glb` (parse the GLB JSON chunk: nodes, and mesh node -> mesh -> `primitives.length` gives `glbPrims`; `null` if not found there) OR it is one of the extras above. Report counts: V16 objects total, matched in the main GLB, matched also in `public/models/rl300-lite.glb` (same parse), extras, dropped V16-only.
- Slot order = the object's material slot order in V16 (`obj.material_slots`).
- Keep the file compact (no indentation) and under 150 KB; say if it is larger.

## Deliverable D3: evidence in `35-v16-round-1/asset/`
`report.json` (counts, decimation table, per-node tris and Y-up bbox, sha256 and sizes of both outputs, derivations for DIAL_LENS and stainless, mapping stats including how many parts are single-slot, multi-slot with slots == glbPrims, and multi-slot with slots != glbPrims), `asset-notes.md` (at most 40 lines), `verify-glb.mjs` (your own checker, below), and a copy of every Blender/node script you wrote under `scripts/`.

## Done-when (paste the command outputs in your report)
1. `node 35-v16-round-1/asset/verify-glb.mjs` prints `ASSET_GLB_OK`. It must assert: no `KHR_draco_mesh_compression`; `extensionsUsed` is a subset of `["KHR_materials_clearcoat"]`; no images/textures; node names are exactly the set above; every primitive has POSITION and NORMAL; pipe = 2,172 tris; each dial sub-object within its budget; total tris <= 7,500; file <= 400 KB; marks island counts equal V16's; every node bbox equals the `v16-parts.json` bbox converted `(x, z, -y)` within 1 mm (bezel/face/marks/ring within 1 mm even after decimation).
2. JSON check: parses; every material named in `parts` exists in `materials`; no key or value contains `__SECTION`; counts printed.
3. `git status --short` lists only your new untracked paths plus the pre-existing untracked `Promise`.
4. `sha256sum` of `V16-copy.blend` equals `788ae2a2...d6146` again at the end.

## Report format (short, facts only)
Output of the four checks; the decimation table; the mapping stats; sizes and sha256 of D1/D2; anything you could not do or chose differently, stated plainly. Do not start the runtime work: another seat does that after the orchestrator verifies this.
