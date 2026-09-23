# 15 — `DUCT_INTAKE_AIRWAY` reconstruction + `SPINES.main` re-snap (2026-09-22)

Executes the owner-approved plan in
[`14-handoff-2026-09-22-duct-reconstruction.md`](14-handoff-2026-09-22-duct-reconstruction.md).
Closes handoff 13 §3. Spec = the owner's three annotated screenshots in
[`duct-reconstruction/`](duct-reconstruction/).

**Result:** the airway volume is rebuilt from an 8-sided 28-triangle prism that overshot
downward over the pump into a 7-sided 24-triangle prism that hugs the real corridor and
turns down at the canopy leading edge. `SPINES.main` waypoints 2–8 are re-snapped into it.

---

## 1. What the owner asked for, and what changed

| | Before | After |
|---|---|---|
| Profile | 8-point, 28 tris, 16 verts | 7-point, **24 tris, 14 verts** |
| Web AABB min | `(-0.600, 1.200, 0.431)` | `(-0.600, **1.348**, **0.434**)` |
| Web AABB max | `(0.600, 1.855, 1.300)` | `(0.600, 1.855, 1.300)` (unchanged) |
| Downward overshoot | hangs to y 1.200 over the pump | **removed: floor rises +0.148 m** |
| Turn-down | z 0.62 | **z 0.564** (canopy leading edge) |

The `y_min` rise of 0.148 m is exactly the green-minus-orange difference the owner marked.

### The new cross-section (web frame, Y-up; each point `(y, z)`)

| Pt | y | z | Feature it hugs |
|---|---|---|---|
| A | 1.855 | 1.300 | ceiling at the intake end panel |
| B | 1.855 | 0.564 | ceiling at the canopy leading edge — **the turn-down** |
| C | 1.776 | 0.496 | canopy fore face |
| D | 1.479 | 0.434 | canopy bottom lip |
| E | 1.479 | 0.714 | aft face above the slant |
| F | 1.652 | 0.714 | slant apex |
| G | 1.348 | 1.300 | slant meets the intake end panel |

Extruded x ±0.600. Closed, manifold, 21 edges each used by exactly 2 faces.

### Derived from measured part faces, not eyeballed

A read-only cross-section probe sliced the three corridor parts at five X planes and
returned their true Y-Z silhouettes (an AABB cannot describe a slanted face). The slant
line of `GRRL200-SAF-1172-1` measured from `(y 1.3213, z 1.3516)` to `(y 1.6523, z 0.7136)`;
profile points F and G sit on that line to within **0.0001 m**. Measured part bounds agreed
with handoff 13 §2's independently-measured table exactly.

Probe scripts (house pattern, read-only, `--report` JSON):
- `msp-render-pipeline-scene-prep/scripts/probe_webexport_airway.py`
- `msp-render-pipeline-scene-prep/scripts/section_webexport_corridor.py`

## 2. The CAD edit

`msp-render-pipeline-scene-prep/scripts/edit_webexport_airway.py` — asserts **8
preconditions** before touching anything and **4 postconditions** before saving; refuses to
overwrite the open `.blend`; replaces mesh data in place so the object name, parent,
identity transform and the `MSP_AIRWAY_VOLUME` slot all survive. All 12 checks passed on
the real scene.

Lineage (v4 is reserved for the deferred node-rename pass):

    RL300-SAFE-webexport-v3.blend
      -> RL300-SAFE-webexport-v5-duct.PRE-DUCT-EDIT.blend   (backup)
      -> RL300-SAFE-webexport-v5-duct.blend                 (edited)

**Independently verified**, not trusted from the edit script's own report: re-running the
separate read-only probe on the saved file returned 24 tris / 14 verts, object count
unchanged at 573, and the 7 empty roots intact.

### Renders (owner rules by looking)

Orthographic section on the same Y-Z plane the owner drew on:
[`duct-reconstruction/renders/airway-BEFORE.png`](duct-reconstruction/renders/airway-BEFORE.png)
· [`airway-AFTER.png`](duct-reconstruction/renders/airway-AFTER.png)
(`scripts/render_airway_corridor.py`, read-only).

## 3. Export — settings recorded for the first time

The exporter settings for the shipped GLB **were never recorded** (gap flagged in handoff
14). They are now reconstructed from the shipped file's own glTF JSON and captured in
`scripts/export_webexport_glb.py`:

    export_format=GLB, Draco on (level 6; position 14, normal 10, texcoord 12,
    color 10, generic 12), export_yup=True, export_apply=False,
    export_cameras=False, export_lights=False, export_animations=False,
    export_skins=False, export_morph=False, materials=EXPORT, normals=True,
    tangents=False, use_selection/use_visible/use_renderable=False

Evidence they are right: the export reproduces the baseline exactly — generator
`Khronos glTF Blender I/O v5.1.19`, **555 nodes, 193 meshes, 9 materials, 0 images**, the
7 roots in order, 2,380,636 bytes vs the baseline's 2,380,776 (a 140-byte delta consistent
with 4 fewer triangles).

**Draco round-trip verified at the vertex level:** decoding the shipped GLB returns all 14
design vertices with **zero** quantization error, including the turn-down vertex at
web z 0.564.

Ship procedure (precedent `0ddf096`): copy `msp-enclosure-draco.glb` byte-identical to
`public/models/msp-enclosure.glb`, `git add -f`, never add to `sync-assets.ps1`. Confirmed
identical by md5. Backup: `msp-enclosure-draco.pre-duct-edit.glb`.

## 4. Repo side

### `SPINES.main` re-snapped (`src/scene/rl300/flow.ts`)

Waypoints 2–8 moved into the corridor; entry (0–1) and tail (9–11) unchanged.
**Waypoints 7–8 were outside the corridor entirely under the old volume** — a real defect
this fixes, not just a cosmetic re-snap.

Clearance to the nearest corridor wall, after an adversarial review found the first
re-snap left 11 mm at the U-turn against a **48 mm ribbon fan**
(`AirRibbons.tsx:309`, `radialScale = .006 + .042*sqrt(...)`):

| idx | before fix | after fix |
|---|---|---|
| 6 | 34.9 mm | **64.3 mm** |
| 7 | 18.7 mm | **55.4 mm** |
| 8 | **11.0 mm** | **81.0 mm** |

### New guards

`AIRWAY_BOUNDS`, `AIRWAY_SECTION` and `insideAirwaySection(y, z)` are exported from
`flow.ts`. The corridor is **L-shaped**, so the AABB is not the volume: **32.5 % of the
AABB area is solid metal**. `preview.test.ts` therefore tests true polygon containment,
not just the box, plus a regression pin that the removed corner
`insideAirwaySection(1.40, .74)` is `false`.

**The containment gate was mutation-tested:** poisoning waypoint 7 back to the old
dead-corner value `[-.39, 1.40, .74]` — which passes the AABB check — makes the suite go
red. The gate is not vacuous.

### Gates updated (both hardcoded the old geometry)

- `verify-jg033-preview.mjs:105-107` — airway helper census `28` → `24`.
- `verify-jg032-station2-thermal.mjs:461` — expected AABB min → `[-0.6, 1.348, 0.434]`.
- `verify-jg033-lite-asset.mjs:27` and `build-jg033-lite.py:16` — **pinned source sha256**
  (not listed in handoff 14 as affected; both fired correctly). Old pin verified to match
  the pre-edit GLB byte-for-byte before updating, so the guard was working as designed.

### Disclosed consequence — legacy Station 2

`AirflowField.tsx:353` resolves `DUCT_INTAKE_AIRWAY` from the shared GLB and derives the
legacy particle route from its AABB, so the **main page's** cyan helper and particle route
change with the volume (floor rises y 1.200 → 1.348). Single shared asset; unavoidable.
Code changes to those files were **comment-only** (stale "48 verts" → 42, stale bounds).

## 5. Verification

| Check | Result |
|---|---|
| `npm run typecheck` | 0 errors |
| `npx vitest run` | **88/88** (was 87; +1 containment test) |
| `npm run build` | ✓ 5.08 s |
| `npm run check:station2` | PASS — 2,380,636 bytes, 7 roots, 7 CAD anchors |
| `verify-jg033-lite-asset.mjs` | PASS — 555 occurrences, 9 twins, 245,092 tris, max transform delta 4.1e-7 |
| `verify-jg033-ribbon-clipping.mjs` | PASS — 17,222 px changed / 0 restore / 0 lower |
| `verify-jg033-preview.mjs` | exit 0, **0 errors**, all viewports |
| Study captures ×6 | 0 console errors, draw calls 99–103 (budget 150) |

Study stops `.05/.34/.51/.70/.82/.95` at 1440×900:
[`duct-reconstruction/captures/`](duct-reconstruction/captures/) + `captures.json`.

### `verify-jg032-station2-thermal.mjs` — cannot be run to completion

It reports one **expected** delta from this change (`verts: 48 vs 42`, the airway census
vs a baseline captured before the rebuild) and — importantly — **the airway uniform
assertion PASSES** with the new AABB:

    PASS: uAirwayMin/uAirwayMax = measured AABB [-0.6,1.348,0.434] → [0.6,1.855,1.3] (±0.01), uAirwayValid=1

Its other failures (CH.04 camera telemetry, cross-section "live station-2 scene missing")
**could not be attributed**: a clean `HEAD` worktree built from unmodified assets and
served on :4174 **times out at `__drawingProof.ready` before any assertion runs** (3
attempts). That is the open **JG-034** opening-scene bug, which blocks this gate
independently of this change. Treat the gate as unrunnable until JG-034 is fixed; its
pre-existing stale panel RED at `:462` also remains open and untouched, per plan.

## 6. Out of scope (unchanged)

v4 node-rename pass; verify-jg032's stale panel assertion; radiator-fan treatment;
Astra-gated visual polish; JG-034.

## 7. Open

- **Astra re-review** — standing verdict `fix-first`. Packet must cover the airflow beat
  **and** this duct/spine change before further visual work.
- **JG-033 integration into the main page's Station 2** is still pending: the blue
  enclosure + new animation live at `?study=rl300`, the main page still shows the
  pre-JG-033 station (per the JG-034 report's version-provenance note).
