# Asset seat, round 2: MAN extras, frame offsets, audit (keep it lean)

You are the asset seat (Sonnet 5.5, high, `tier-worker`). Do the four jobs below and report briefly. Do NOT write new verifier/gate scripts, mutation checks or extra validation passes: one sanity read-back of your outputs is enough. Soft budget 150k tokens.

Repo (absolute paths, no `cd`): `C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine`, branch `quiet-machine/integration`.
Scratch: `C:\Users\Markimus\AppData\Local\Temp\claude\C--Users-Markimus--buzz-REPOS-jgun-quiet-machine\7a0ea69b-a024-4739-ae73-5eab43caed88\scratchpad\asset2` (create it).
Evidence (untracked): `project/work/evidence/rl300-quiet-machine/35-v16-round-1/asset2/`.
V16 input (the ONLY V16 file you may open): `.../scratchpad/v16/V16-copy.blend`, sha256 `788ae2a2a2f784c56e70c16e81365b82fa0d236a48acce261855f4a7aa9d6146` (check it first). Never open `C:\Projects\CAD\...`; never the Blender MCP. Blender: `"C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" --background --factory-startup <blend> --python <script>`, output to a log file.
Reuse what exists (read, then extend): `35-v16-round-1/asset/scripts/build_extras.py` (the Blender build with decimation, welded islands, `CFG`), `make-materials-json.mjs`, `make-report.mjs`, `run-build.sh`; scratch loader for shipped GLBs in node: `.../scratchpad/runtime/load.mjs` (`loadGlb(file)`). Facts already measured: `.../scratchpad/v16/feedback.json` (world bboxes in Blender frame for the objects below).
Rules: edit no tracked file; no git write commands; create files with the Write tool (no heredocs); `python3` hangs, use Blender's Python or node; do not delete the stray `Promise` in the repo root.

## Job 1: add the MAN assembly to `public/models/rl300-extra-parts.glb`
The shipped GLBs fuse eight V16 objects into ONE mesh node `MAN-6650459107-1` (4,000 tris full / 800 lite, all MSP_STEEL_CAST). V16 has them separate with their own materials, in collection `temp move`: `MAN-6650459107-1` DIAL_FACE 1,112 tris; `.001` MSP_BLACK_CHASSIS 2,126; `.002` DIAL_FACE 3,206; `.003` MSP_BLACK_CHASSIS 308; `.004` MSP_STEEL_CAST 20,002; `.005` MSP_BLACK_CHASSIS 189; `.006` MSP_ALUMINUM_CAST 2,334; `.007` MSP_BLACK_POP 976.
- Add a new root empty named exactly `PUMP_HOUSING` to the extras GLB, with eight child meshes named `MAN-6650459107-1.000` (this is V16's `MAN-6650459107-1`; the `.000` suffix avoids a name clash with the fused shipped node) and `MAN-6650459107-1.001` ... `.007` (V16 names). World-baked, Y-up `(x, z, -y)`, positions and normals only, V16 material names exactly, no Draco/UV/textures, like the existing nodes.
- Decimate (planar dissolve then collapse, your existing approach; keep silhouettes; no island-count gate needed): `.004` <= 3,500; `.002` <= 600; `.006` <= 600; `.001` <= 400; base `.000` <= 300; `.007` <= 300; `.003` and `.005` unchanged. Total about 6k.
- Keep every existing node (dials, lenses, connector pipe) exactly as they are.

## Job 2: frame offsets as node translations (JSON patch, no vertex edits)
V16 is a different frame from the shipped GLB for the parts these extras mount on. Set the glTF `translation` of the three ROOT nodes in the extras GLB (patch the JSON chunk and repack; positions in the binary stay as exported):
- `DUCT_EXHAUST` (connector pipe): `[0, 0, 0.0154]` (it mounts on muffler 6103389_REV00_MS-1; measured shipped-minus-V16 z +0.0154)
- `GAUGE_DIALS`: `[0, 0, 0.0140]` (mounts on RL300-CPM-3001-1; measured +0.0140)
- `PUMP_HOUSING` (MAN): `[0, 0, 0.0141]` (measured from the shipped fused node vs the union of the eight V16 objects)

## Job 3: material map JSON `src/scene/rl300/v16-part-materials.json`
Regenerate with your `make-materials-json.mjs` after: adding the eight MAN extras (sanitized keys `MAN-6650459107-1000`, `...-1001` ... `...-1007`, `v16` slots from the V16 object, `glbPrims: null`) and REMOVING the existing key `MAN-6650459107-1` (so the fused shipped node, which stays in lite, is not repainted DIAL_FACE). Everything else unchanged.

## Job 4: fused/shifted-parts audit (report only, no changes)
One headless Blender pass: dump every V16 mesh object's world bbox converted to the glTF frame. Then in node, load `msp-enclosure.glb` with `load.mjs`, compute each shipped mesh node's world bbox, and report:
(a) shipped nodes whose bbox contains the union of two or more V16 objects of the same name family (fused nodes like MAN), with triangle counts both sides;
(b) per shipped parent group (by the `root` in `v16-objs.json`), the median per-axis bbox delta shipped-minus-V16 over matched parts, listing groups whose median is above 5 mm.
Write the result as `asset2/audit.md`, at most 40 lines, tables only.

## Report (short, facts only)
Output sizes and sha256 of the GLB and JSON; per-MAN-piece tris before/after; the three translations as written; audit.md top findings (<= 8 lines); anything not done. No narrative.
