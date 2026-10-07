# Continuation handoff - JG-035 authorship + P003068 knurling inspection, and hobbed Input Shaft variant

Written 2026-10-05. Context: the previous handoff is `../knurling-tool-2026-10-04/implementation-handoff.md`. Work is authorized to continue; this is not a permission gate. No commit, push or deploy was done. Existing dirty JG-035 opening work predates this task; never treat it as session-owned.

## 1. Knurling inspection (shipped for technical review)

Source GLB `public/models/knurling-tool.glb`, SHA-256 `e5bff99439eb6655ea9eda3929fcca2f3e388b98c5742dcef95c371423c8fbd8`. Plan: `docs/jgun-authorship-knurling-implementation-plan.md`.

- Independent fresh review: **SHIP** (technical only). Text: `.scratch/knurling-final-review.md`. Owner visual acceptance is separate and still pending.
- Production runtime packet: `runtime/report.json`, 7/7 cases pass, 0 console errors (delayed-CAD entry, desktop, mobile, blueprint, exploded, reduced-mobile, poster). Run: `node scripts/verify-ring-inspection.mjs --url=http://localhost:4173 --out=<dir>` against the :4173 preview.
- Static authorship check: `node .scratch/verify-final-authorship.mjs http://localhost:4173` passes desktop and narrow (inspection entry reachable, JGun-only, note exits with intro).
- typecheck PASS, build PASS, 301/301 unit tests, 31/31 B1/B2 contract and Stage 2 (parent runs earlier this session).
- This session's fix: `src/scene/inspection/InspectionScene.tsx` now downloads the tool GLB with its own abortable `fetch` and `GLTFLoader.parseAsync`. GLTFLoader's shared FileLoader made a re-entry wait on a canceled in-flight request, which stalled the desktop run. `scripts/verify-ring-inspection.mjs` now triggers a real WebGL `WEBGL_lose_context` for the quality-fallback case instead of calling the proof hook.

### Still owed on this item
1. **Opening regression is not proven.** `opening-quick` failed 64/64 checkpoints on each viewport, every one "expected full tier for browser evidence, got lite". The headless Chrome run dropped to the lite tier, so the run is invalid, not a code finding. Rerun `node scripts/verify-jgun-opening.mjs --quick --url=http://localhost:5199` on a full-tier GPU session. The full 6-case roster is required before any opening-completion claim.
2. Plan checkboxes 2-7 in the plan, `TODO.md` and `INDEX.md` still read "implementing". Tick them to the evidence above.
3. Staged `.gitignore` exceeds the prop exception (`.codex/`, `.mimosa/`, `.tmp-probe/`, EOL rewrite). Separate session-owned hunks from pre-existing ones before any commit. Stage only session-owned paths.
4. Graph index predates the work (2026-09-30) and the codebase-memory transport closed this session; review rests on direct source reads.

## 2. Hobbed Input Shaft variant (modelled; not yet in the site)

Owner direction (answered after the session started): the undercut story concerns the larger-family reference drawing `C:\Users\Markimus\Desktop\Portfolio-mh\obsolete\fwdexamplesofworkmarkhintz\P001812.PDF` (Input Shaft, J5-J8AP). Apply that story to this tool's Input Shaft: remove the gear-shaper relief groove, form the teeth with a rotary hob on a mill-turn live tool, then show shaped-with-undercut against hobbed side by side. The clip shows the lead-out radius formed by the rotary hob.

Part: `P001835-2` in `public/models/Default.glb` (mesh 16, 131 Draco primitives, axis = Y, 71.52 mm long, 10 teeth, tip r 6.083 mm, root r 4.298 mm). Note the drawing is a larger model (12 teeth, 24/32 DP); its dimensions were not copied, only the process.

Files in `C:\Projects\CAD\jgun-input-shaft-hobbed\` (source of truth, outside the repo):

- `p001835-source-extract.glb` - isolated source part, read-only extract.
- `build_hobbed_input_shaft.py` - Blender 5.2 headless build. Run: `blender -b --factory-startup --python build_hobbed_input_shaft.py -- auto <outdir> MANIFOLD`. Reproduction copy and report are also in `input-shaft-hobbed/` beside this file.
- `input-shaft-hobbed-v1.blend`, `p001835-hobbed.glb` - result.
- Renders: `input-shaft-hobbed/view_shaped_side.png` (original) and `view_hobbed_side.png` (hobbed); `ref_sectionAA-1.png` is the drawing clip.

Method: weld the Draco seams at 5 um (this takes the source from 9,438 to 0 open edges; without it the exact boolean emptied the mesh), fill the relief with a cylinder at the neck radius 6.077 mm, build one tooth-space cutter by taking the real gear cross-section at mid face width, sweep it straight along the axis for the functional face width (0.250 in = 6.35 mm, y 3.175 to 9.525 mm) and then outward on an arc of the hob radius (the lead-out), cut it with the Manifold solver, and pattern it ten times around the OD.

Verification: gap floor follows the analytic hob path to within about 2 um at 7 stations; no stray cutter geometry (max slice radius 6.083 mm over the face, 6.077 mm over the neck); volume falls 8,483 -> 8,422 mm3 across the cuts; 1 open edge in about 129k faces.

Decision needed from Mark: the lead-out hob radius is **1.885 mm** (auto-sized). The bearing journal (r 6.325 mm) starts only 1.9 mm past the functional face (y 11.43 mm), so a realistic 10 mm class hob radius would carve the journal. Options: (a) accept the small radius; (b) larger hob radius with the bearing journal moved outward, which is the drawing's own story ("move lower bearing O.D."); (c) larger hob radius and a lead-out that ends on the journal shoulder. Rerun the script with a numeric first argument (mm) to test a radius; it aborts if the lead-out would reach y 16.4 mm.

Known cosmetic items: the source's old relief edge leaves tiny notches near y 9.5 mm on the tooth flanks; exported normals look streaky in Workbench. Neither affects the geometry check.

### Next steps for the hobbed variant
1. Get Mark's call on the hob radius / journal option, then adjust and rebuild.
2. Decide the integration: a side-by-side study panel or an extra inspection mode. Do not add a heavy GLB to the narrative; export a lite variant with Draco/decimation in Blender and keep the original assembly untouched. Existing GLB rules in AGENTS.md apply (never bare gltfjsx --transform).
3. Keep copy to documented decisions only: do not assert the undercut part or revision, or any numeric outcome. The vault note quoting the single-chucking story is in the authorship notes; credit/revision stays acknowledged-unknown.

## 3. Orchestration notes
Parent hit repeated 429s; Mark asked for simple tasks to go to GLM-5.3 / GLM-5.3-Flash and for the 3D modelling to stay in the parent. A GPT-6 Astra review run and a zai/glm-5.3 review run were both launched with `codex exec`; the surviving `.scratch/knurling-final-review.md` was not tagged with its serving model, so it is not proof of which model ran it. Modelling was done in the parent. Provider routing: `~/.agents/skills/orchestration/SKILL.md`.


## 4. Update 2026-10-05: hob R 6 mm, bearing moved 2.75 mm (supersedes the 1.885 mm decision in section 2)

Mark chose a **6 mm hob radius** and said to move the bearing journal away from the gear and trim the housing. Mark also confirmed: **K000210 is the bearing, K000211 is its retaining ring (it sits in the 0.476 in groove on the Input Shaft) and moves with the bearing.** The housing is P000725 (1st & 2nd St. Housing).

Result (all in shaft-local coordinates; shaft world matrix saved as `shifted/shaft_world_matrix.json`; Blender scene `shifted/input-shaft-assembly-parts-v1.blend`):

- **Shift = 2.75 mm** (smallest round value that clears the lead-out: a 6 mm hob floor leaves the neck at y 13.79 mm; the journal chamfer now starts at y 13.93 mm, was 11.18).
- Shaft `shifted/p001835-hobbed.glb`: gear hobbed with the 6 mm lead-out, relief groove filled, journal, retaining-ring groove, fillet and shoulder rings moved +2.75 mm (575 vertex rings moved, the 8.27 mm body is shortened 2.75 mm). Gap floor matches the analytic arc to about 1.5 um. 1 open edge in about 126k faces.
- Bearing K000210 and ring K000211: translated +2.75 mm along the axis (`shifted/k000210-k000211-moved.glb`). Bearing bore r 6.35 vs journal r 6.325, ring r 6.045 vs groove r 6.045, OD r 9.53 in the housing bore: same fits as before.
- Housing P000725 `shifted/p000725-modified.glb`: bore r 9.52 now runs to y 19.0 mm and the locating shoulder chamfer (9.52 to 9.12 mm) moved from y 16.5-17.05 to 19.3-19.8 mm. 332 of 20,158 vertices moved; walls stay at least 3.1 mm thick.
- Not moved and not checked: K000180-1 (spring, r 14-17 mm, outside the housing OD), the other gearbox parts, and any role-map/rig entries in `public/models/role-map.json` for the shifted parts. Nothing was added to the site; Default.glb is untouched.
- Figure: `input-shaft-hobbed/bearing_move_before_after.png`; section renders: `section_before.png`, `section_after.png`.

Next: (1) Mark to review the figure and the Blender scene; (2) decide how the side-by-side (shaped vs hobbed) is shown in the site and export a lite GLB; (3) assembly-level interference check against all neighbours before re-embedding.

## 5. Owner approval and storyline — 2026-10-05

Mark has now reviewed the modified Input Shaft, P000725 housing and K000210/K000211 placement in Blender and **approved them**. Section 4's pending Blender-review step is closed; its 6 mm radius and 2.75 mm shift remain the accepted model direction. Assembly-neighbour interference, lighter export and runtime visual acceptance are still implementation checks.

The Ring Switch animation concept was already approved. The verbatim new Input Shaft storyline and geometry-approval scope are recorded in `project/context/owner-specs/manufacturing-inspection-storyline-2026-10-05.md`. Follow the subsequent manufacturing-story plan and its next-session handoff for reviewed choreography; preserve the original narrative assembly and all existing scroll windows.

Planning sequence is complete: parent/Astra/Opus concepts agreed; Astra detail pass incorporated; final Opus findings corrected and bounded re-review **SHIP**, Astra final confirmation **AGREE**. Plan: `docs/jgun-manufacturing-inspection-plan.md`. Next-session implementation handoff: `project/work/evidence/JG-035-opening-drafting-table/manufacturing-story-plan-2026-10-05/continuation-handoff.md`. Start at G0; this planning approval does not close runtime/interference/performance/owner-animation gates.

