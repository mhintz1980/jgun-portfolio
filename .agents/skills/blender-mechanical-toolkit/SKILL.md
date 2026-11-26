---
name: blender-mechanical-toolkit
description: Use when Blender/bpy authoring, diagnostics or export work is needed in this repo — hard-surface Boolean/bevel triage, product/CAD lighting and renders, PBR texturing, UV/bake work, GLB export round-trips, Geometry Nodes diagnostics, or when a Scenario-blender helper is referenced for a fixture. Routes to the pinned Scenario Blender packages in the skills-master library.
---

# blender-mechanical-toolkit — local routing to the Scenario Blender packages

Reads the seven shortlisted Scenario packages **on demand, by domain** — never load all bodies for
an unrelated task. Source of record: `C:\Projects\skills-master\docs\scenario-blender-adoption.md`.

## Domain routes (absolute vendor paths — resolve and verify before importing)

| Domain | Read when working in it |
|---|---|
| Router/protocol/audit helpers | `C:\Projects\skills-master\vendor\scenario-labs-skills\skills\dcc\blender\scenario-blender-expert\SKILL.md` |
| Boolean/bevel, hard-surface | `C:\Projects\skills-master\vendor\scenario-labs-skills\skills\dcc\blender\scenario-blender-hard-surface\SKILL.md` |
| Product/hero lighting, renders | `C:\Projects\skills-master\vendor\scenario-labs-skills\skills\dcc\blender\scenario-blender-lighting-rendering\SKILL.md` |
| PBR texturing/shading | `C:\Projects\skills-master\vendor\scenario-labs-skills\skills\dcc\blender\scenario-blender-texturing-shading\SKILL.md` |
| UV seams, baking, texel density | `C:\Projects\skills-master\vendor\scenario-labs-skills\skills\dcc\blender\scenario-blender-uv-baking\SKILL.md` |
| GLB/asset export + round-trip | `C:\Projects\skills-master\vendor\scenario-labs-skills\skills\dcc\blender\scenario-blender-export\SKILL.md` |
| Geometry Nodes | `C:\Projects\skills-master\vendor\scenario-labs-skills\skills\dcc\blender\scenario-blender-geometry-nodes\SKILL.md` |

All seven share the `...\skills\dcc\blender\` root above. Sibling `scripts/`/`references/` ship
inside each package; `bx_*` helpers live in the **expert** package and resolve siblings relative to
that subtree. The other seven upstream packages (previs, animation, grease-pencil, rigging,
retopology, sculpting, hair) stay library references in the same index — read one only if a real
task calls for it (index: `node _skills-index/skills-index.mjs --match scenario-blender --json` in
`C:\Projects\skills-master`).

## Governing stack (precedes anything in the vendor packages)

1. **`blender-agent-core`** (`C:\Users\Markimus\.agents\skills\blender-agent-core\SKILL.md`) governs
   Blender contracts and verification — read it first for any Blender task.
2. **`cad-scene-graph-rigging`** + repo-local **`r3f-cad-cinematography`** govern part identities,
   pivots, timing, cameras and runtime behavior. The animation spec §5 ladder and part numbers are
   measured reality; never reorder logic on stage names.
3. **Owner publication policy** (`project/context/owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md`)
   governs site delivery. Blender evidence never adds a site gate.

## Execution channel

- Headless: `"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b <file.blend>
  --factory-startup --python-exit-code 1 -P script.py -- args` (Blender **5.3.0**, Python
  3.13.13; `blender` resolves via the `~/.local/bin/blender.cmd` shim, pinned 2026-11-19
  to this absolute path — update the shim when the pin changes. Lanes
  with already-rendered 5.2.2 LTS frames, e.g. JG-041 armament, keep 5.2.2 for parity).
  The Blender MCP addon is installed in 5.3 (owner, 2026-11-19) — its socket server may
  need an explicit Start in the UI panel, and MCP tools register at harness session init
  only. Or the available native Blender bridge — check its actual tool schemas and
  `bpy.app.version`; do **not** assume Scenario tool names or the Scenario Blender plugin.
- **Missing-sibling fallback resolves locally from the vendor tree, never `skill_get` or Scenario
  MCP/API.** All siblings ship in the subtree — a missing one is an installation defect: report and
  fix within this source selection. Do not activate Scenario generation/blockout routes.
- One Blender process per agent, no extra GUI windows; serialize GPU-heavy checks across agents.
  Work in disposable files/fixtures (`%TEMP%\scenario-blender-adoption-2026-10-31\` or `.scratch/`).

## CAD protection (registered JGun geometry)

- **Derived copies only.** Retain authoritative source blends/GLBs; never edit production assets
  during skill validation. Preserve part-number names (A000606, K000004, P000725…), hierarchy,
  mesh roots, custom properties, dimensions, registration, world matrices and pivot behavior.
- `bx_audit.deliverable()` is a generic diagnostic: intended exploded offsets and separated
  bearing/gear components read as "floating parts" to it. Keep its raw findings, classify intended
  separation manually — never auto-join, move or delete valid separated components to satisfy a gate.
- **Never apply `ground()`, rescaling or recentering to registered CAD.** Transform/LOD/remesh
  helpers require a fixture or an explicitly scoped derived asset; keep the original and verify
  equivalence where required.
- Protected-asset rules hold: no bare `gltfjsx --transform` on `m249-transformed.glb` (normal-map
  regression) or `msp-enclosure.glb` (collapses its 7 roots); no production-asset regeneration.
- Runtime verification status of these helpers is recorded in
  `project/work/evidence/scenario-blender-skills-adoption-2026-10-31/` — treat unverified helpers
  as unverified until that evidence says otherwise.

## Blender 5.3.0 Procedural Remodeling & CAD-Fit Notes

- **Bevel API:** Use `BevelModifier.use_clamp_overlap = True` (`.clamp_overlap` raises `AttributeError` in Blender 5.3.0).
- **Outward normals before `EXACT` booleans:** Enforce `if len(bm.faces) >= 4 and bm.calc_volume(signed=True) < 0.0: bmesh.ops.reverse_faces(...)`; inverted winding turns `EXACT` `DIFFERENCE` cuts into protruding geometry.
- **Hollow revolves without axial boolean slivers:** Revolve hollow bores directly in 2D `(x, r)` profiles instead of boolean-cutting through an `r = 0` axial triangle fan.
- **World-space boolean cutters & post-cut assertions:** Keep `BOOLEAN` cutter objects in world space (never pre-transform cutter mesh vertices by `target.matrix_world.inverted()` while leaving the cutter object at identity, which makes the modifier a no-op) and assert post-boolean vertex/bound changes.
- **SolidWorks CAD `.glb` seam cleanup & flat trims:** Imported CAD meshes often arrive with unjoined NURBS patch seams (thousands of non-manifold edges). Run `bmesh.ops.remove_doubles(..., dist=1e-4)` first; for flat trims use `bmesh.ops.bisect_plane(..., clear_outer=True)` + `bmesh.ops.holes_fill(..., sides=0)` (not `edgeloop_fill`, which skips multi-loop internal holes), then apply world-space `EXACT` boolean notches.
- **Mating envelopes:** Measure **inner clevis/arm clearances** (not outer support bounding boxes) and verify butt-up vs. nesting joints against adjacent CAD parts before locking modeled dimensions.
- **Headless inspection renders & sheets:** Keep underside diagnostic cameras clear of backdrop floors (`SET_Studio_Cyc`) or temporarily toggle `cyc.hide_render = True` in `try/finally`. Stitch contact sheets in Blender's Python 3.13 with `bpy.data.images` + `numpy` (Pillow is not installed).
