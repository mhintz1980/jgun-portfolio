# Handoff — 2026-09-22: duct reconstruction APPROVED, execution NOT started

Branch `codex/jg033-signature-shot`, HEAD `f46d6bf`, pushed; `main` == `f46d6bf` (owner
directed main to reflect current state; the 09-16 no-commit rule is overridden — see
[`13-handoff-2026-09-16.md`](13-handoff-2026-09-16.md) banner). Supersedes handoff 13 **on
duct status only**; its §4 airflow items and §5 lane rules still stand.

**A fresh session executes the plan below. It was owner-approved in plan mode on 2026-09-22;
nothing has been executed.** Zero writes have happened outside this repo's evidence folder.

## Uncommitted in the tree right now (commit these first)

- [`duct-reconstruction/`](duct-reconstruction/) — the owner's three annotated CAD
  screenshots (re-sent 2026-09-22, saved to disk) + README decoding them. **These are the
  spec for this task.**
- [`13-handoff-2026-09-16.md`](13-handoff-2026-09-16.md) §3 edit marking the
  screenshots as delivered.
- `.zcodeignore` (untracked) is a ZCode-harness artifact — do NOT commit it.

## The task

Rebuild the `DUCT_INTAKE_AIRWAY` volume per the owner's green outline, then re-snap
`SPINES.main` to it. Owner images say: **green = required volume** (hugs the slanted intake
face `GRRL200-SAF-1172-1`, runs aft under the ceiling, turns **down at the canopy leading
edge — web z 0.564**, following the sheet metal); **orange = current volume** (overshoots
downward, wrong aft edge). Blue-arrow image = authoritative flow route (matches handoff 13
§2's measured route: in through hex openings → up the slant → ceiling corridor → down the
`V2RL300-SAF-1171-1` vertical face → U-turn under its bottom lip → aft to the engine).

## Load-bearing facts (verified 2026-09-22 by two exploration passes — do not re-derive)

**The airway mesh:**
- NOT a root. It is one node, `DUCT_INTAKE_AIRWAY`, material `MSP_AIRWAY_VOLUME`, **28
  triangles**, inside the `DUCT_INTAKE` root (the roots are `ENCLOSURE_CHASSIS`,
  `COMPOSITE_PANELS`, `PUMP_HOUSING`, `ACOUSTIC_BAFFLES`, `ISOLATION_MOUNTS`,
  `DUCT_INTAKE`, `DUCT_EXHAUST`).
- The study scene **drops it at prepare time by MATERIAL name**:
  `src/scene/rl300/prepareModel.ts:174` — `if (original.name === 'MSP_AIRWAY_VOLUME') return`.
  Study flow is ribbons only; the volume is never rendered there. **Both the node name AND
  the material name must survive the rebuild** (legacy Station-2 resolves the node by name,
  prepare drops by material).
- Legacy Station-2 (still live on the main page) DOES render it translucent cyan and reads
  it: `src/scene/stages/AirflowField.tsx:353` `getObjectByName('DUCT_INTAKE_AIRWAY')` →
  `uAirwayMin/uAirwayMax` uniforms; `src/scene/stages/airflowRoute.ts` derives the legacy
  particle route from the AABB. A new volume therefore changes the legacy station's helper
  shape + route — disclosed consequence, single shared asset, unavoidable.
- Current measured AABB (web Y-up): x ±0.600, y 1.200→1.855, z 0.431→1.300.
  Vault construction record: 2D Y-Z profile extruded x ±0.600 ("just inside the wall inner
  faces at ±0.617").

**The spines:** `src/scene/rl300/flow.ts:19-40` — hand-authored literal tuples (main = 12
waypoints, lower = 8, merged = 5). There is NO programmatic snapping; "snapping" = hand-edit
tuples against the new volume's measured bounds. Known deltas (handoff 13 §3): turn-down
waypoints (indices 5–7, currently z .62/.59) move to the canopy edge **z 0.564**; entry
(0–1) stays outboard/through-panel; tail (9–11) stays below/aft. `preview.test.ts:174-185`
envelope test stays green. Add a corridor-containment test (waypoints 2–8 inside new
`AIRWAY_BOUNDS`, exported from `flow.ts`; entry/tail exempted with comments).

**Gates that WILL break and need updating:**
- `scripts/verify-jg033-preview.mjs:105-108` — hardcodes the airway helper as `28` tris in
  the `sourceTriangles − keptTriangles` census (alongside liner `108`, removals `460`).
  Update `28` → new tri count; the GLB hash rows there self-update.
- `scripts/verify-jg032-station2-thermal.mjs:461-466` — hardcodes the old AABB
  `[-0.6,1.2,0.431]→[0.6,1.855,1.3]` ±0.01. Update to the new measured AABB. NOTE: this
  gate already has a PRE-EXISTING stale RED (panel assertion at `:462`, TODO open finding)
  — out of scope, don't fix it here.
- Safe (name-keyed, no counts): `recolorAllowList.test.ts:81`, `verify-jg033-lite-asset.mjs`,
  `verify-jg033-ribbon-clipping.mjs`, `preview.test.ts` §5 root assertions.

**Lite derivative:** `scripts/build-jg033-lite.py` (`SOURCE = public/models/msp-enclosure.glb`
→ `OUTPUT = public/models/rl300-lite.glb`). Regenerate after the GLB swap; keep the whole
`DUCT_INTAKE` root as it does today; run `verify-jg033-lite-asset.mjs`.

**CAD side (C:\Projects\CAD\RL300-SAFE — NOT a git repo, files just live there):**
- Working file: `RL300-SAFE-webexport-v3.blend`; source of truth GLB:
  `msp-enclosure-draco.glb`; uncompressed reference `msp-enclosure.glb` also lives there.
- Lineage pattern: never edit in place — copy to a new versioned blend. **v4 name is
  reserved for the deferred node-rename pass (`DUCT_LABYRINTH`/`EXHAUST_PORT`) — out of
  scope; use v5** (e.g. `RL300-SAFE-webexport-v5-duct.blend`).
- Blender **5.1.1** verified at `"C:\Program Files\Blender Foundation\Blender 5.1\blender.exe"`
  (not on PATH). Shipped GLB generator: "Blender glTF I/O v5.1.19" + Draco.
- **The exact glTF exporter settings were never recorded** (flagged gap) — replicate
  (Draco, Y-up) and WRITE THEM DOWN in the vault this time.
- House pattern for scripted edits: `C:\Projects\msp-render-pipeline-scene-prep\scripts\edit_rl300_geometry.py`
  — assert preconditions → edit → `--save-as` staging + `--report` JSON, never overwrite.
  Run headless **from PowerShell, not Git Bash** (MSYS rewrites leading paths):
  `blender -b <blend> --factory-startup -noaudio -P script.py -- --save-as ... --report ...`.
  scene-prep IS a git repo but has unrelated dirty state (someone else's AGENTS.md edit) —
  don't touch it.
- Do NOT apply transforms on other roots (destroys instancing — vault record).
- Probe before editing: the .blend binaries are compressed (no `strings` hits) — write a
  small bpy probe to dump object names/world bboxes/tri counts/materials first, then build
  the profile from MEASURED part faces (`G2RL300-SAF-1003-2`, `GRRL200-SAF-1172-1`,
  `V2RL300-SAF-1171-1`, ceiling), not eyeballed numbers.

**Orientation:** Blender Z-up ↔ web Y-up: `web_y = bl_z`, `web_z = −bl_y`. Keep the export
Y-up; the placement chain has no rotation anywhere (handoffs 08/10).

**Ship procedure into the repo (documented, commit `0ddf096` is the precedent):** copy the
new `msp-enclosure-draco.glb` byte-identical → `public/models/msp-enclosure.glb`,
`git add -f` (path is gitignored), never add to `sync-assets.ps1`. Verify GLBs with vault
`Skills/glb-web-export-triage.md` procedure: `_system/scripts/glb-probe.py` +
`npx @gltf-transform/cli@4 inspect` — 7 roots, 555 nodes, Y-up, bbox 1.600 × 3.366 × 2.107 m
(unchanged; the airway is interior), 9 materials, new airway tri count.

## The approved plan (owner-approved in plan mode 2026-09-22 — execute as written)

1. Commit the pending evidence files listed above.
2. Snapshot `v3.blend` → `RL300-SAFE-webexport-v5-duct.blend`.
3. bpy probe → dump names/bounds; then write `edit_webexport_airway.py` in
   `msp-render-pipeline-scene-prep\scripts\` (house pattern): assert 7 roots / one airway /
   28 tris / material name → measure corridor from named parts → build new Y-Z profile
   extruded x ±0.600, aft turn-down at the measured canopy edge (web z 0.564) → replace
   mesh data in place (same object + material, nothing else touched) → report JSON with
   old/new AABBs in BOTH Z-up and web Y-up + tri counts.
4. Before/after viewport renders of the corridor region (owner rules by looking).
5. Export glTF + Draco (record settings in vault `04-Projects/Portfolio-Site/rl300-safe-web-export.md`
   + add v5 lineage); keep `.pre-duct-edit` GLB copies; verify per triage skill.
6. Repo: swap `public/models/msp-enclosure.glb` (force-add), regenerate lite, update the
   two gates, re-snap `SPINES.main` + export `AIRWAY_BOUNDS` from `flow.ts`, add the
   containment test to `preview.test.ts`.
7. Full battery: `typecheck` · `vitest` · `build` · `check:station2` ·
   `verify-jg033-preview.mjs` · `verify-jg033-lite-asset.mjs` ·
   `verify-jg033-ribbon-clipping.mjs` · rebuild + **restart :4173** · Playwright captures
   at study stops .05/.34/.51/.70/.82/.95 (`window.__quietMachine.seek(u)`, wait on frame
   advance) + the Blender renders.
8. Docs: `project/work/evidence/rl300-quiet-machine/15-duct-reconstruction.md` (measured
   bounds old/new, tri counts, script report, renders, captures); handoff 13 §3 → DONE;
   TODO JG-033 entry; vault web-export record (lineage + settings); source-register row
   (no name changes — confirm only).
9. Commits: repo commit(s) on `codex/jg033-signature-shot`, push branch + ff `main` (same
   flow as 2026-09-22 morning). CAD-side files live outside git.
10. Astra: standing verdict `fix-first` blocks further visual-effects work. The duct
    correction is owner-instructed geometry (proceeds), but the Astra re-review packet must
    include the airflow beat AND this duct/spine change before any further visual polish.

## Out of scope (explicit)

v4 node-rename pass; verify-jg032's pre-existing stale panel RED; radiator-fan visual
treatment (unowned decision); any Astra-gated visual polish; the JG-034 opening-scene refit
bug (separate task, evidence in `project/work/evidence/JG-034-opening-scene-refit/`).

## Session state at this handoff

    branch    codex/jg033-signature-shot @ f46d6bf (pushed); main == f46d6bf (pushed)
    gates     typecheck 0 · 87/87 · build ✓ · clipping gate 18188/0/0 (all re-verified today)
    tree      clean except: duct-reconstruction/ + handoff-13 §3 edit (commit first),
              .zcodeignore (never commit)
    server    vite preview on :4173 was up at handoff time (curl 200) but is UNOWNED — its
              ZCode background wrapper exited (exit 127) and the orphaned vite process may
              die or serve stale hashes at any time. Verify with curl first; per AGENTS.md,
              rebuild + RESTART :4173 before trusting what it serves.
    Blender   5.1.1 at "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe"
