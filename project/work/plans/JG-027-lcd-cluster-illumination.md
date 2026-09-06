# JG-027 — LCD Cluster Restoration & Illumination

**Status: verified** — CLOSED VERIFIED 2026-09-06, owner visual ruling PASS ("Looks good, pass it.") at `?dwell=lcd`, round 2 after rev 1 (bezel+readout rotated 90° CW per the owner's portrait-window defect report; buttons ruled correct as-is). Merged into `main` (`7a526ba`). Machine record: [evidence](../evidence/JG-027-lcd-cluster-verification.md).

**Objective:** make the rear LCD cluster actually visible (it has never been), light
the button symbols white, ship the owner-ruled dual-unit readout, and leave a
one-URL ruling stop.

## Owner authorizations & rulings

- 2026-09-06: plan approved (this document); **ruling 1 — dual readout**: primary
  `1,250` `N·m`, secondary `922 FT-LB` (replaces `kgf·m`), status flags
  `PEAK / STAGE 5 / CAL OK`, battery 4 bars. **Ruling 2 — button glow**: crisp
  white Option A with a soft touch of B (in-canvas aura + scene bloom at rest).
- Origin: owner request "in the image there is white symbol in the middle of each
  button. Can we make that area of each button lit up as well?" (2026-09 dictation
  with the JG-025 CAD reference).

## Record correction (carried from intake, 2026-09-06)

The blank LCD is **not** a JG-026 regression. Git topology: JG-025's work commit
`4e2b51a` was developed on top of the JG-026 rebuild (`93370ac` is an ancestor);
`src/` is byte-identical since `4e2b51a`. The JG-025 owner-approved evidence
frames already show a blank LCD. Root cause: `findPartMesh`
(`src/scene/rig/lcdCluster.ts:178-190`) measures **primitive 0** of multi-primitive
GLTF meshes (screen P002115 = 22 prims; prim 0 is a zero-thickness edge sliver) →
degenerate center/axis math → decals glued inside the handle facing down,
permanently occluded by the P002115 panel and P001924 endcap. Buttons additionally
pick the cap axis by longest extent instead of the screen-normal-aligned axis.
JG-025's verification asserted material identity and button de-stack pixels, never
decal **visibility** — so it passed invisibly. JG-027's evidence carries an erratum
note; the JG-025 evidence doc itself remains closed and unedited.

## Items

### Item 0 — Restore cluster placement (latent JG-025 defect)

`src/scene/rig/lcdCluster.ts` only:

1. `findPartMesh` returns the part node plus a **union bounding box over all mesh
   descendants** (`Box3().setFromObject(node)` after computing child boxes) —
   child-order independent, robust pre/post consolidation. `worldMeshCenter` and
   the extent/axis math consume the union box, not primitive-0 geometry.
2. Button cap axis: axis whose world direction has max |dot| with the resolved
   `screenNormal` (buttons are coplanar with the screen on the rear face); guard
   degenerate (≈0-size) extents.
3. Expected measured outcome (pre-verified on union boxes): screen thin axis =
   local Y, outward ≈ `[−0.292, 0, −0.956]` (rearward, matches the endcap), bezel
   sized to the real ~37.8×18.4 mm panel, all decals rear-facing at the dwell.
4. **No changes** to pose ordering, scrollCommit, extractionPose, introTimeline,
   wrappers, or any GLB.

### Item 1 — Illuminated button symbols (ruling 2)

`createButtonSymbolTexture`: glyph fill `#ffffff`; soft white stroke
`rgba(255,255,255,0.45)` (~4px) for clean AA; radial aura
`rgba(255,255,255,0.25) → transparent` behind the glyph (membrane backlight).
Keep 128×128 canvas, `MeshBasicMaterial` `toneMapped:false`; the existing bloom
(threshold 0.6, rest 0.25) supplies the halo — no post-processing changes.

### Item 2 — Dual-unit readout (ruling 1)

`createLcdReadoutTexture`: primary `1,250` with `N·m`; top row `PEAK` / `CAL OK`;
bottom row battery (4 bars) | `STAGE 5` (mode slot, replaces `TRACK`) |
`922 FT-LB` (replaces `kgf·m`). Same layout/font system; no other content changes.
`materials.ts` `lcdButtonRed` is verify-only (contrast against the new white).

### Item 3 — `?dwell=lcd` debug deep-link

`src/state/scrollStore.ts` `initialScrollProgress()`: return
`(LCD_REVEAL_WINDOW.dwellStart + dwellEnd) / 2` (paced 0.473) for
`?dwell=lcd`; import the constant from `caseStudies.ts` (no cycle). `ScrollRig`'s
existing `rawScrollFor()` conversion makes it viewport-independent. Natural-scroll
path only — never the `__drawingProof` pin (pin drives the camera but not GSAP:
`explodeFactor` would stay 0 and the cluster would not be presented).

### Item 4 — Verification (the gate that failed before)

- New `scripts/verify-jg027-lcd-cluster.mjs` modeled on
  `verify-b1b2-rebuild.mjs` (`waitReady` + `settleAt` natural-scroll driving at
  paced 0.473, quiet-frame gating, Chrome launch args; exit-code discipline from
  `verify-b1b2-supplemental.mjs`). Asserts, for bezel + readout + 3 symbols:
  facingDot > 0.5 vs the active camera AND zero occluding meshes between decal and
  camera AND a **pixel assertion** that bezel red + readout white appear in a
  rear-panel screenshot crop (invisible decals can never pass again).
- Standard suite: `npm run typecheck`, `npm run build`, `npm run check:station2`,
  fresh `:4173` (kill stale node PID first), reduced-motion + poster tier smoke,
  same-frame before/after dwell pairs (standing evidence rule).
- Closing gate: owner visual ruling at `http://localhost:4173/?dwell=lcd`.

## Out of scope (flagged to inbox)

- `navigateToStation()` (`scrollStore.ts:42-62`) scrolls by raw fractions and now
  undershoots stations 2/3 post-JG-026.
- Assembly headline / page-theme copy strings ("High Precision Industrial Grade
  Torque Gun", "Engineered from CAD to Reality") — no landing spot ruled.
- Decal mesh renames — rejected (names are internal, evidence-stable).
- Page-wide vocabulary rescan — the vocabulary cleanup already shipped in JG-026
  (`f39a73f`, `79f0e84`); the rule is "maintain while touching strings."

## Delegation & commits

Wave 1 (parallel, disjoint files): agent A = Item 0; agent C = Item 3. Wave 2
(after A): agent B = Items 1+2 (same file as A). Wave 3 (main agent): probe
script, diff review, full suite, before/after pairs, registry commits. Agents
leave uncommitted working-tree edits; all commits are made by the orchestrator on
`zcode/jg-027-lcd-cluster`. Merge to `main` + push only after the owner PASS.
