# Evidence — Scenario Blender skills adoption, 2026-10-31

Owner-ordered local adoption of the pinned Scenario Blender packages. Plan:
`C:\Users\Markimus\.codex\visualizations\2026\10\31\01a1914a-1531-7322-8b9b-307820bd9c0d\scenario-blender-skills-adoption-plan.md`.
Checklist: [`project/work/inbox/scenario-blender-skills-adoption-checklist-2026-10-31.md`](../../inbox/scenario-blender-skills-adoption-checklist-2026-10-31.md).
Bulky fixtures/scripts remain in `C:\Users\Markimus\AppData\Local\Temp\scenario-blender-adoption-2026-10-31\` (disposable; ledger `ledger.md` there carries the full session record).

## Completion states (reported separately, per plan)

| Area | State | Proof |
|---|---|---|
| **Library acquisition** | **PASS** | `C:\Projects\skills-master\vendor\scenario-labs-skills` — sparse cone clone of `skills/dcc/blender`, detached pin `7f4b801c7248d51b093ec365aceb114bd06139e6`, MIT, 98 files byte-identical to the planning reference checkout; tree digest `afcd969381f0…c2cdbb`. Digest verified byte-identical immediately after the Eval-1 helper runs and re-verified after the independent review, which found the Eval-2/3 module imports had left five helper-generated `__pycache__/*.pyc` files in the vendor tree (upstream `.gitignore` covers them for git, but they alter the raw digest); those were deleted and the documented digest command now returns `afcd969381f0…c2cdbb` again with the tree pristine (`git status` clean at the pin). Provenance: `docs/scenario-blender-adoption.md` (tracked) + `vendor/scenario-labs-skills.SOURCE` (untracked). |
| **Index + discovery** | **PASS** | Index rebuilt: 321 skills / 69,803 lines / 228 tags; `--check` determinism exit 0. Programmatic allowlist check: exactly 14 scenario ids indexed, blockout path-excluded, no extras, all read paths + shortlist sibling dirs exist. 5/5 skill-find spot checks rank the right skill #1. Query tool returns 14 with pin-matching sha256s. |
| **Project routing** | **PASS (static)** | Adapter `.agents/skills/blender-mechanical-toolkit/SKILL.md` (frontmatter valid, 7 absolute routes all resolve, sibling chain `bx_hardsurface → ../../scenario-blender-expert/scripts` verified with `bx_audit/bx_review/bx_gui` present); registered in `AGENTS.md` (one route line) + `project/context/agent-skills.md` (row + note). Two harness conventions verified by direct file reads; no claim of automatic menu loading. |
| **Runtime evaluation** | **PASS on all three required evaluations** (disposable fixtures; helper residuals recorded) | Eval 1/2/3 below. Geometry Nodes + previs/animation/rigging/GP/retopo/sculpt/hair remain untested on real briefs (per plan, on-demand). |

This is NOT full-technical-completion or owner-visual-acceptance of anything site-facing. Blender
evidence does not create a publication gate (owner policy 2026-10-31). Git changes remain uncommitted.

## Eval 1 — mechanical export + gate interpretation: PASS

`eval1/`: manifest (pre-export), `audit1_blend.json`, `audit1_glb.json`, `inspect1.json`, `compare1_blender.json`, `fixture1.glb`.

- Fixture: `FIX1_Root` empty (0.25, −0.15, 0.10, rotZ15°) + `P000095_TEST_SPINDLE` (off-center pivot: mesh verts +0.03/+0/+0.05) + `K000004_TEST_BEARING` (intentional separation, pivot offset −0.02/+0.01/0), shared `FIX1_Steel` (metallic .8/rough .35) with 8×8 packed sRGB base-color image. Declared tolerances: matrix 1e-5 abs, dims 1e-4 abs.
- `bx_audit --deliverable`: **DELIVERABLE FAIL** with exactly the expected generic finding `K000004_TEST_BEARING: floating, 0.0121 from the nearest part` (GLB round-trip: 0.0128). Raw finding retained; **classified intentional** — no geometry altered. This is the documented `bx_audit.deliverable()` exploded-assembly mismatch the adapter guards against.
- Blender round-trip: FIX1_COMPARE OK — names/hierarchy exact, matrix Δ 3e-08, dims exact, material + image + colorspace preserved. (Artifact note: the `FIX1_Root` row carries vacuous `ok:false` sub-flags — an EMPTY has no images to compare — and the aggregate `all_ok:true` excludes it; all substantive mesh checks pass. Disclosed per review.)
- Three.js GLTFLoader (three 0.185.1, disposable playwright harness): FIX1_THREE OK — matrixWorld Δ ~2e-08 under the empirically confirmed Z-up→Y-up conversion `M_gl = C·M_bl·C⁻¹` (C = (x,y,z)→(x,z,−y)); metalness/roughness/8×8 map preserved; off-center pivots proven via local bbox centers.
- `ground()`/rescale/recenter: **never called**.

## Eval 2 — hard-surface diagnosis: PASS (helper residual recorded, per plan scope)

`eval2/`: `eval2_report.json`, `eval2_reopen.json`, review sheet + 4 closeups.

- Fixture: 100×50×15 mm plate + 4 mm Boolean slot (EXACT) + BevelClamp 6 mm (bevels wider than the slot half-gap). Cutter in its own `Cutters` collection per upstream hygiene.
- Diagnosis (vendor `bx_hardsurface`, local import per adapter): `clamp_probe` ratio **1.12** (clamping bites); `clamp_culprits` → `['Groove']`; verdict names the exact cause (`gap 0.004 under 2 x bevel width`). The helpers also caught my own first fixture-authoring bug (cutter above the plate) before the intended one — honest record.
- Scoped corrections on the derived copy (stack editable): bevel 6→1.9 mm + through-slot→blind pocket. Ratio 1.12 → 0.503. Residual proven fixture-specific (plain-cube differential 0.0, boolean toggle isolates it) and **visually clean** at the worst-at location (`closeup_residual_corner.png`) — a numeric toggle-measurement artifact of EXACT-solver output, recorded honestly, not chased to the 0.1 heuristic threshold.
- Adapter finding (documented, upstream untouched): `HS.review()`'s EXTRA_MODES wrapper signature drifted from this pin's `bx_review`; `bx_review.review()` used directly.
- Reopen `fixture2_fixed.blend`: 192 verts / 380 tris, exact bounds, editable stack, probe stable.

## Eval 3 — UV/material/light pipeline: PASS

`eval3/`: `eval3_report.json`, `eval3_reopen.json`, baked normal map, `blender_still.png`, `three_still.png`, `fixture3.glb`.

- Fixture: metal shaft (1.0/.2), paint housing (0/.4 + coat .5 + 32×32 sRGB base map), plastic knob (0/.5); smooth-shaded by angle per the helper's UV advice.
- `bx_uvbake`: `unwrap()`, `texel_density()` 282.8 px/m, `uv_qa()`+`uv_verdict()` (real findings recorded: coverage 35% < 70%), `bake_multires()` NORMALS low0→high2 with clean sanity (0 inverted/0 steep/0 NaN) + `hookup_maps()`.
- Map roles/color spaces correct before AND after reopen: base color **sRGB**, baked normal **Non-Color**. Images persist with full pixel data. `bx_materials.classify_texture()` maps our filenames to roles correctly.
- Three.js: `FIX3_THREE OK` — MeshStandardMaterial metal 1/.2; MeshPhysicalMaterial paint 0/.4 + map `srgb` + normalMap linear + coat → KHR clearcoat; plastic 0/.5. WebGL frame rendered (SwiftShader).
- **Harness findings recorded for future project Three.js verification**: (1) `gltf.scene` is a `Group` — renderer gates `background`/`environment` on `isScene===true`, so both are silently ignored on `gltf.scene` (wrap in a real `Scene`); (2) off-DOM canvas `toDataURL` on SwiftShader returns the first composited frame (byte-identical captures proven) — `preserveDrawingBuffer` did not fix it; use `gl.readPixels` or a DOM-attached canvas; (3) `bx_light.place()` needs `space="world"` without a camera; (4) `multires_subdivide` needs the active object set.
- Visual comparison under stated lighting (Blender: AREA 60 W @ 0.5 m az35/el45 + SUN 4.0 + gray world, Cycles CPU 48 spp; three: dir 3.5/2.0 + ambient 0.6 + RoomEnvironment): both legible, metal reflective in both; framing differs; **no pixel-parity claim, no owner visual acceptance implied**.

## Unresolved / deferred

- Geometry Nodes evaluation deferred until a real procedural brief (plan-sanctioned).
- Eval 2 helper residual (clamp ratio 0.503 on the fixed fixture) is a numeric artifact; visual state clean. Not a blocker; documented.
- The other seven packages (previs, animation, grease-pencil, rigging, retopology, sculpting, hair) are indexed references only — no runtime testing (plan: real brief required).
- `skills-master` working tree carries a concurrent session's scroll-film-studio edits (preserved untouched); my skills-master changes are README/vendor-README/overrides/index regeneration + new `docs/`.
- Nothing committed, pushed, or deployed. Rollback: remove `vendor/scenario-labs-skills{,.SOURCE}`, `docs/scenario-blender-adoption.md`, the overrides block + index regeneration, the README edits (skills-master); remove the adapter, the `AGENTS.md` route line, the `agent-skills.md` row+note, the inbox checklist and this evidence folder (project).
