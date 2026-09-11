# 01 — RL300 CAD source audit & asset-role map

> **JG-033 / W2.** Machine-generated from a read-only Blender 5.1 inspection and a direct
> glTF JSON-chunk parse. No `.blend` was saved; no GLB was re-exported or transformed.
>
> Captured **2026-09-11**, repo at `3e3e49f`. Regenerate with `scripts/audit-rl300-cad.mjs`.

**This document selects nothing.** It reports what each candidate contains so the
derivative input can be chosen on evidence. Where a number is incomplete or a claim is
unverified, it says so.

## 1. Provenance — what is actually shipping

| File | SHA-256 (first 16) | Bytes | Roots | Nodes | Meshes | Materials | Triangles |
|---|---|---|---|---|---|---|---|
| `public/models/Default.glb` | `8b07246cf857aca2` | 10,671,700 | 1 | 345 | 101 | 36 | 561,703 |
| `C:/Projects/CAD/RL300-SAFE/msp-enclosure-draco.glb` | `f429a200be18e9d0` | 2,380,776 | 7 | 555 | 193 | 9 | 293,231 |
| `C:/Projects/CAD/RL300-SAFE/msp-enclosure.glb` | `750d9e0bfcf360fa` | 10,603,764 | 7 | 555 | 193 | 9 | 293,231 |
| `public/models/m249-transformed.glb` | `1c251f45b05b736a` | 892,092 | 1 | 1 | 1 | 1 | 50,000 |
| `public/models/msp-enclosure.glb` | `f429a200be18e9d0` | 2,380,776 | 7 | 555 | 193 | 9 | 293,231 |

**Confirmed:** `public/models/msp-enclosure.glb` is byte-identical to
`C:/Projects/CAD/RL300-SAFE/msp-enclosure-draco.glb` (same SHA-256). The AGENTS.md source-of-truth
claim holds — the shipped file is the Draco export, not the plain one.
The sibling `RL300-SAFE/msp-enclosure.glb` (`750d9e0bfcf360fa`, 10.11 MB) is a *different*
file with an identical node/material census — the uncompressed counterpart, not a second source.

Draco: extensions used = ["KHR_draco_mesh_compression"]; required = ["KHR_draco_mesh_compression"].
Generator: `Khronos glTF Blender I/O v5.1.19`. Images embedded: **0** (confirms the zero-texture status AGENTS.md records).

## 2. The seven named roots — measured cost

| Root | Mesh nodes | Triangles | % of model | Dominant materials (tris) | BBox min → max |
|---|---|---|---|---|---|
| `ENCLOSURE_CHASSIS` | 191 | 88,558 | 30.2% | MSP_YELLOW_PAINT (26,720)<br>MSP_STAINLESS (21,360)<br>MSP_BLACK_CHASSIS (19,686) | -1.4097, -0.8182, -1.0668<br>→ 1.4097, 0.7335, 0.9597 |
| `COMPOSITE_PANELS` | 196 | 87,000 | 29.7% | MSP_YELLOW_PAINT (57,726)<br>MSP_BLACK_CHASSIS (18,576)<br>MSP_PLASTIC (13,098) | -0.6858, -0.7294, -0.6894<br>→ 0.7692, 0.7651, 1.9321 |
| `PUMP_HOUSING` | 144 | 213,504 | 72.8% | MSP_STEEL_CAST (151,655)<br>MSP_YELLOW_PAINT (28,188)<br>MSP_BLACK_CHASSIS (16,560) | -0.581, -0.2906, -0.8711<br>→ 0.5923, 0.7092, 0.6731 |
| `ACOUSTIC_BAFFLES` | 5 | 2,158 | 0.7% | MSP_YELLOW_PAINT (2,158) | -2.3752, -0.0925, -0.637<br>→ -0.2626, 1.4033, 0.637 |
| `ISOLATION_MOUNTS` | 6 | 864 | 0.3% | MSP_RUBBER (864) | -0.055, -0.05, -0.055<br>→ 0.055, 0, 0.055 |
| `DUCT_INTAKE` | 2 | 7,202 | 2.5% | MSP_YELLOW_PAINT (7,174)<br>MSP_AIRWAY_VOLUME (28) | -0.6858, -0.7017, -0.0601<br>→ 0.6858, 1.855, 1.3 |
| `DUCT_EXHAUST` | 4 | 16,606 | 5.7% | MSP_YELLOW_PAINT (16,606)<br>MSP_STAINLESS (2,896) | -0.3302, -0.7017, -0.6858<br>→ 0.3302, 1.1206, 0.6858 |
| **total** | | **293,231** | 100% | | |

### What the distribution means for the section work

- `PUMP_HOUSING` alone is **213,504 triangles (73% of the model)** across just 144 mesh nodes —
  it is the single largest cost and the equipment the cross-section is meant to reveal.
  Decimating it reduces the model most; it is also the thing the shot is about.
- `ACOUSTIC_BAFFLES` (2,158 tris, 5 nodes) and `ISOLATION_MOUNTS` (864 tris, 6 nodes)
  are nearly free. Geometry budget is not what limits the baffle story.
- Node-to-mesh ratio is ~2.9:1 overall, so meshes are shared across nodes. A per-part cap pass
  would run per **node**, not per mesh — the plan's warning about "hundreds of CAD parts" is
  concrete here: 555 nodes.

## 3. Material census — the recolor target list

| Material | Triangles | Mesh nodes | baseColorFactor | metallic | roughness | alphaMode | doubleSided |
|---|---|---|---|---|---|---|---|
| `MSP_STEEL_CAST` | 151,655 | 36 | 0.34, 0.35, 0.37, 1 | 0.8999999761581421 | 0.550000011920929 | OPAQUE | yes |
| `MSP_YELLOW_PAINT` | 138,572 | 138 | 1, 0.56, 0, 1 | 0.05000000074505806 | 0.41999998688697815 | OPAQUE | yes |
| `MSP_BLACK_CHASSIS` | 54,822 | 155 | 0.02, 0.02, 0.021, 1 | 0.10000000149011612 | 0.47999998927116394 | OPAQUE | yes |
| `MSP_PLASTIC` | 31,962 | 103 | 0.52, 0.52, 0.52, 1 | 0 | 0.3499999940395355 | OPAQUE | yes |
| `MSP_STAINLESS` | 26,223 | 99 | 0.72, 0.73, 0.75, 1 | — | 0.2199999988079071 | OPAQUE | yes |
| `MSP_STEEL_MACHINED` | 12,739 | 12 | 0.62, 0.63, 0.65, 1 | 0.949999988079071 | 0.30000001192092896 | OPAQUE | yes |
| `MSP_ALUMINUM` | 6,223 | 12 | 0.72, 0.722, 0.73, 1 | — | 0.5 | OPAQUE | yes |
| `MSP_RUBBER` | 2,644 | 14 | 0.016, 0.018, 0.02, 1 | 0 | 0.75 | OPAQUE | yes |
| `MSP_AIRWAY_VOLUME` | 28 | 1 | 0.1, 0.55, 0.95, 0.22 | 0 | 0.5 | BLEND | yes |

### `MSP_YELLOW_PAINT` — per-root attribution

The owner ruling makes yellow the **primary recolor target**, inverting the old
"yellow unchanged" gate. Exhaustive per-root totals (computed over the full node subtree,
not a sampled owner list):

| Root | Triangles carrying MSP_YELLOW_PAINT |
|---|---|
| `ENCLOSURE_CHASSIS` | 26,720 |
| `COMPOSITE_PANELS` | 57,726 |
| `PUMP_HOUSING` | 28,188 |
| `ACOUSTIC_BAFFLES` | 2,158 |
| `DUCT_INTAKE` | 7,174 |
| `DUCT_EXHAUST` | 16,606 |
| **total** | **138,572** |

That is **47.3% of all model triangles** on 138 mesh nodes — the largest
single visual surface in the enclosure. Every one of those nodes is in scope for the blue shell.

**Every material in the shipped GLB is `doubleSided: true`.** That matters directly for the
capped cross-section: double-sided geometry renders back faces, which changes what a stencil
cap pass sees. Verify cap behaviour against this rather than assuming single-sided CAD surfaces.

`MSP_AIRWAY_VOLUME` is a 28-triangle proxy on 1 node with `alphaMode: BLEND`
(alpha 0.22) — it is the AABB source the airflow field resolves against, not visible geometry.

## 4. `.blend` candidates — comparison

Ten `.blend` files sit in `C:/Projects/CAD/RL300-SAFE/`. Several are byte-different but
**census-identical**; they are grouped below so the real choice is between families, not filenames.

| Family | Files | Objects | Mesh objs | Materials | Triangles | Cameras | Lights | Named materials? |
|---|---|---|---|---|---|---|---|---|
| `RL300-SAFE-webexport-v1` | 1 | 633 | 550 | 92 | 3,257,153 | 14 | 3 | **no — generic** |
| `RL300-SAFE-photoreal`<br>`RL300-SAFE-render_ready`<br>`RL300-SAFE-render_ready_photoreal` | 3 | 578 | 552 | 11 | 919,668 | 16 | 3 | yes (MSP_*) |
| `RL300-SAFE-render_ready_PRE-LATCH-RESTORE_20260907-161811`<br>`RL300-SAFE-webexport-v3`<br>`RL300-SAFE-webexport-v4-node-rename`<br>`RL301-SAFE-render_ready` | 4 | 573 | 548 | 9 | 415,892 | 15 | 3 | yes (MSP_*) |
| `RL300-SAFE-webexport-v2-decimated` | 1 | 625 | 541 | 84 | 390,935 | 15 | 3 | **no — generic** |

### Observations (not a recommendation)

- **The plan's named starting point, `RL300-SAFE-photoreal.blend`, carries 919,668 triangles** —
  2.2× the webexport family (415,892) and
  3.1× the shipped GLB (293,231).
- `photoreal` has **11 materials** vs the webexport family's 9: it retains
  `MSP_STAINLESS_FASTENER` and `MSP_ALUMINUM_CAST` as distinct slots, which the webexport
  family folds into `MSP_STAINLESS` / `MSP_ALUMINUM`. Finer material separation = finer
  control over what the section exposes, at the cost of more draw-call splits.
- `RL300-SAFE-webexport-v2-decimated.blend` has **84 generically-named materials**
  (`mattesteel.004`, `defaultplastic.005`, …). It predates the MSP_* rename. Any part-number or
  material-name logic written against it would not transfer.
- `RL300-SAFE-webexport-v1.blend` is the undecimated master: 3,257,153 triangles,
  92 materials, 232 MB on disk.
- Every candidate is **METRIC, unit scale 1.0**, render engine `BLENDER_WORKBENCH`.
- `photoreal` carries **16 saved cameras** and 3 lights; the webexport family carries 15.
  Those camera setups are existing authored viewpoints worth inspecting before new ones are framed.

### The owner's named plate

`V2RL300-SAF-1047-5` — the solid plate the owner wants opened into a lower intake — is present in
`RL300-SAFE-photoreal.blend` as **exactly 1 object**. The plan's assessment is confirmed against the file.

Related named geometry found in the same file: `DUCT_INTAKE_AIRWAY` (1), `ISO_MOUNT_1..6` (6),
`EXHAUST PIPE-1` (1), `V2CONTROL PANEL, URFS-2` (1), and 40 objects on the `V2RL300-*` part-number prefix.

## 5. Gaps and things this audit does NOT establish

- `Untitled.blend` (93 MB) and `RL300-SAFE-render_ready_PRE-LATCH-RESTORE_*.blend` were
  present in the directory; `Untitled.blend` was **not audited** (unnamed scratch file, not
  referenced by any manifest). If it matters, audit it explicitly.
- Triangle counts from `.blend` files are **raw polygon fans on unevaluated meshes** — modifiers
  (subdivision, decimate) are not applied. Export counts will differ; the GLB numbers are the
  ones that reflect shipped cost.
- Nothing here evaluates **export suitability** beyond counts: UV state, normals, manifoldness,
  and whether a given group closes cleanly enough for stencil caps are unverified. The plan
  flags thin/intersecting surfaces as the top risk; this audit does not resolve it.
- No airflow, acoustic, or thermal behaviour is validated. Geometry only.
