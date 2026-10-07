---
name: cad-scene-graph-rigging
description: Use when building or modifying the JGun Torque Wrench hero rig — GLTF node regex sanitization, D1-AP part-number role classification, pivot-based carrier/planet animation units, destructive mesh-consolidation caching, or rear-extraction explosion offsets.
---

# CAD Scene Graph Rigging & Mesh Consolidation

## Architectural Contract
The JGun D1-AP CAD model (~13,000 raw meshes) is classified into per-part
animation units on the raw scene BEFORE consolidation, then merged per
`(unit × material × ghost-status)` into tens of draw calls. The rig is cached
on `root.userData.wrenchRig`: consolidation is destructive and `useGLTF`
caches the parsed scene per URL, so a remount must reuse the rig and never
re-run the merge.

## Rig Classification Invariants

### 1. GLTFLoader Name Sanitization
- `GLTFLoader` converts spaces, commas, and special characters into underscores `_`.
- All assembly node regexes **MUST** match both spaces and underscores:
  ```ts
  const HANDLE_REGEX = /HANDLE[\s_]*ASSY/i;
  const GEARBOX_REGEX = /GEARBOX[\s_]*ASSY/i;
  const GHOST_REGEX = /(HOUSING|COVER|SHELL|CASE\b|CAP\b)/i;
  ```
- ⚠️ *Historical Failure*: A `\s*`-only regex silently broke the entire rig because `HANDLE ASSY` arrived as `HANDLE_ASSY,_D5AP-...`.

### 2. D1-AP Part-Number Role Table (no geometric stage split)
- Roles come from part-number substrings on NODE names; each mesh belongs to
  its **nearest tagged ancestor**'s unit. Part numbers carry no spaces, so
  substring matches survive mangling (`occurrence_of_P000247-1` matches
  `/P000247/`).
- | Role | Parts |
  |---|---|
  | stage 1 | A000591 + cage P001836 + planets P000247 |
  | stage 2 | A000592 + cage P001837 + planets P000247 (shared part — disambiguate by assembly ancestor) |
  | stage 3 | A000860 + cage P003045 + planets P000069 |
  | stage 4 | A000861 + cage P003047 + planets P003046 |
  | stage 5 | A000606 + cage P001849 + planets P000248 |
  | clutch static | A000881 subtree, P000420, P001835 |
  | clutch sliding | P000724 (fork), P000297 (cam) |
  | ring switch assembly | P003068 (knurled ring), 3× P000464 (pins), 3× K000156 (ball plungers) |
| output spindle | P000095, P000207, K000001, K000074 |
| bearing ring | K000004 (rear thrust ring behind A000606 — own unit since pass 3, 2026-08-25; was the gearbox's last untagged part) |
| fastener | PN-less McMaster screw nodes under HANDLE ASSY — `91251A148` ×2, `96006A253` ×1, `90910A815` ×2 (back plate), `91251A344` ×4 (radial); own unit since JG-024 (2026-09-02) so they get `blackOxideSteel` (handle default is anodized); bucket hosts at a screw node, rides rigidly with the handle explosion |
| housing | P000245 (static, ghosts, never explodes) |
| untagged | static remainder |
- Planet counts are **dynamic** (Default.glb: 4/4/4/**5**/4 — never hardcode).
- ⚠️ *Historical Failure*: the pre-2026-08-23 bbox-median "Stage 1/Stage 2"
  split moved stages +0.0875/+0.175 toward the +Z snout, whose bore necks
  down to ⌀0.012–0.028 — physically impossible extraction. Do not
  reintroduce any geometric stage split.

### 3. Rotation Pivots (epicyclic motion)
- Each unit is a merged `Group` with geometry baked into the group's **own**
  frame (`inv(group.matrixWorld) × mesh.matrixWorld`, groups positioned
  first, `updateMatrixWorld` before bake inverses) — the group transform IS
  the part's rigid motion.
- Carrier groups pivot on the gear-train axis: position = mean planet-pin
  center in gearbox-local XY (ring symmetry makes the mean exact); Z animates.
- Planet groups are CHILDREN of their carrier, positioned at each pin
  (`pin − pivot`): carrier `rotation.z` revolves them; each planet's own
  `rotation.z` counter-rotates it on its pin. Carrier angle =
  `(gearRotation / 8π) × ROTATION_TURNS[stage] × 2π` with display turns
  mapped along the physical driveline from motor to snout (stage1: 8.0,
  stage2: 5.2, stage5 [A000606]: 3.38, stage3: 2.20, stage4: 1.43; JG-031,
  2026-09-07 — each successive physical cage in space turns at ~65% speed
  of the preceding cage, ensuring strictly monotonic reduction and perceptible
  motion during scroll scrub without mid-stack reversals; `GEAR_RATIOS`
  {1.0, 0.28, 0.08, 0.022, 0.006} remain the documented kinematics);
  planet angle = `−carrier display angle × 3.5`.

### 4. Ghost Classification
- A mesh ghosts if (a) it sits under a node matching `GHOST_REGEX`, OR
  (b) it belongs to the gearbox's largest child by bbox volume (P000245).
- Verified count: **3 ghost materials** (23 before the 2026-08-24 PBR role
  rework — role bucketing merged the housing's per-CAD-material clones; all
  still fade together). Ghost materials must be cloned with
  `transparent = true`.
- ⚠ *Historical note, superseded 2026-09-02 (JG-024 A/B, both GLBs):* the
  `ghostCount === 0` regression below was measured pre-pass-5; current code
  ghost-merges the housing correctly — telemetry reads **1 ghost material**
  (one consolidated mesh = one material; the "3" expectation above predates
  final consolidation). Likewise the verifier's `slidingZ −0.306` /
  `ringSwitchZ` expectations are stale: both read **−0.291 at 0.52**
  (mechanism not re-derived — code-owned values, verified byte-identical
  across the Medium and Fine assets, so the JG-024 swap changed nothing).
- ⚠ *Historical Failure (2026-08-25, resolved before JG-024)*:
  `ghostCount` read **0** at repo head — `housingMeshSet` ended up empty, so
  the CH.02 fade loop no-oped and the housing stayed solid (commanded
  `ghostOpacity` still reached 0.15).

### 5. Rear-Extraction Explosion Offsets (`EXPLODE_OFFSETS`, meters)
Measured rest-pose geometry (Default.glb): handle at −Z (center z ≈ −0.168),
snout/output cluster at +Z (z ≈ +0.02..0.03), housing bore necks down toward
+Z → internals extract REARWARD only. **The exploded line order is the
DRIVELINE order, not the stage numbering** (Mark review 2026-08-24): behind
the housing rear face (z = −0.074) the line reads P003047 (stage 4, first
out) → P003045 (stage 3) → P001849 (A000606 — the THIRD cage) → K000004
(bearing ring) → P001837 (stage 2) → P001836 (stage 1, furthest back).
Ladder measured from JSON-chunk rest spans: first cage clears the rear
face by ≥14 mm, adjacent units keep ≥15 mm gaps, handle carries 25 mm of
air behind the clutch.

| Unit | Offset |
|---|---|
| output spindle | `+0.050` (forward, through the snout — the only +Z mover) |
| Stage 4 | `-0.099` (first out) |
| Stage 3 | `-0.142` |
| Stage 5 (A000606 — third in line) | `-0.177` |
| bearing ring (K000004) | `-0.197` (15 mm behind A000606; rest span z [−0.058, −0.051], ⌀58 × 7 mm) |
| Stage 2 | `-0.230` |
| Stage 1 | `-0.255` (furthest stage) |
| clutch static + sliding | `-0.291` (sliding adds `shift × -0.015`) |
| handle | `-0.354` |

- Application contract: `node.position.z = baseZ + offset × Math.max(anim.explode, mode === 'exploded' ? 1 : 0)`.
- Clutch `shift` (0→1) leads the timeline; `gearRotation` (0.15→1.0) spins
  the train up AND through the extraction (windows overlap the explode
  0.6→1.0). Rotation is scroll-driven only — the exploded MODE is a static
  fully-open pose, train at rest.
- Pass 3 (2026-08-25) IMPLEMENTED: K000004 = −0.197, re-derived against the
  measured ladder (the queued −0.071-behind-A000606 math predates the
  reorder and would park the ring inside stage 1's exploded span — dead).
  Honoring ≥15 mm gaps on both sides of the 7 mm ring shifted the tail:
  stage 2 −0.230, stage 1 −0.255, clutch −0.291, handle −0.354.

### 6. Photoreal PBR Role Materials (`src/scene/rig/materials.ts`)
- Consolidation buckets by (unit × PBR role × ghost) — the role REPLACES the
  CAD material as merge identity (Mark review 2026-08-24: photoreal per
  `docs/torque-render.webp` + `docs/jgun-handle-gearbox-description.md`).
- Role resolution: node-name overrides first (LCD / MSP430 / PC_BOARD /
  battery / USB shell / rotor / TEFLON / below-axis brackets), then unit-key
  defaults (housing → clearcoat shell black, output → tool steel, carriers →
  cage steel, planets → planet steel, clutch → clutch steel, handle → barrel
  black, static → black-oxide steel).
- Multi-word name regexes MUST use `[\s_]*` separator classes (mangling rule
  above) — the GLB delivers `PC_BOARD-1`, `MANOMETER_LCD`.
- Shared material instance per role; ghost buckets clone transparent-capable
  copies. Lighting contract: RoomEnvironment IBL at intensity 1.0 carries
  the clearcoat reflections; punctual key held at 1.7 so gloss doesn't blow.

### 7. Part Measurement Basis — union AABB over ALL mesh descendants (JG-027)
- `GLTFLoader` expands each multi-primitive glTF mesh into ONE mesh child
  PER PRIMITIVE. Any "first mesh child" or single-child measurement basis
  is unstable: JG-025's LCD dressing measured primitive 0 of a
  22-primitive screen (a zero-thickness sliver) and mounted every decal
  inside the handle — invisible since birth (found JG-027, 2026-09-06).
- Measure part geometry as the UNION AABB of ALL `Mesh` descendants of
  the part node, computed in the part node's LOCAL frame (world-box per
  descendant → `node.worldToLocal`), so offsets and pivots stay
  comparable across units.
- Decal/dressing mounts land on the union bounds, never on one primitive.

### 8. GLTFLoader prim-name uniquification + UV-less CAD GLBs (JG-029)
- GLTFLoader not only fans multi-primitive parts out per primitive (§7),
  it UNIQUIFIES the expanded children's names (`mesh2534_mesh`,
  `mesh2534_mesh_1`, …). Generic-name tests shaped `/^mesh\d+_mesh$/`
  silently stop matching at prim ≥ 1 — only prim-0 of each multi-prim
  part resolves its override. The surviving test is
  `/^mesh\d+_mesh(_\d+)?$/i` (jgun `nodeRoles.ts`). A part escapes this
  bug only when its override equals its unit default (P001924 did —
  which is why it "looked the same" while ring knurl was broken).
- The CAD GLB carries NO UV attributes at all — any normal-map material
  silently samples a constant texel and renders flat. Check
  `TEXCOORD_0` before trusting a normal-map pipeline, and synthesize
  UVs at consolidation time (jgun `attachCylindricalUvs` precedent;
  ring-switch knurl retuned to real pitch 182×17 ≈ 1.6 mm + mipmaps).

## Anti-Patterns
- ❌ Using mesh names instead of node/group hierarchy names for role classification.
- ❌ Modifying original materials without cloning (ghost fades bleed into solid parts).
- ❌ +Z/through-snout stage offsets or any median-Z stage split (necked bore).
- ❌ Hardcoded planet counts per stage.
- ❌ Measuring a part from its first mesh child — multi-primitive meshes fan
  out one child per primitive, so the first child's bbox can be a
  zero-thickness sliver (§7). Union AABB over ALL mesh descendants.
- ❌ Anchoring a name-based override test to `^mesh\d+_mesh$` without the
  `(_\d+)?` prim suffix — GLTFLoader uniquifies expanded children, so
  multi-prim parts only match at prim 0 (§8).
