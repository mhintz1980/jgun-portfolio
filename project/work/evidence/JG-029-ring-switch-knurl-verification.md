# JG-029 Ring Switch Knurl — VERIFIED 2026-09-06

Owner report: the ring switch renders plain black, no knurl on the OD.
Root-caused to two independent defects; both fixed; verified by A/B census.

## Root cause (proven, not inferred)

1. **Routing:** multi-primitive CAD parts expand to prim meshes named after
   the GLB mesh def; GLTFLoader uniquifies duplicates (`mesh2534_mesh`,
   `mesh2534_mesh_1`, …). The JG-028 generic test `/^mesh\d+_mesh$/` matched
   only prim-0, so only prim-0 of every multi-primitive part resolved its
   `ROLE_OVERRIDES` entry. Live census reconciliation was exact: ringSwitch
   bucket = 88 v (= P003068-2 prim-0), clutchSteel = 1,608 v (= prim-0s of
   3 pins + 3 plungers), remainder 15,406 v black oxide — including the ring
   body. Fix: generic test broadened to `/^mesh\d+_mesh(_\d+)?$/i`.
2. **No UVs:** every primitive in `Default.glb` carries only POSITION+NORMAL
   (GLB-wide check on the ring-switch parts). With no `uv` attribute the
   knurl normal map sampled a constant point — the knurl could never render
   on any bucket. Fix: `attachCylindricalUvs()` synthesizes cylindrical UVs
   on the merged ringSwitch bucket (u = θ/2π, v = axial span; integer u-wrap
   keeps the seam continuous). `KNURL_REPEAT` retuned (30, 8) → (182, 17)
   from the measured ring (Ø93 mm × 27.2 mm, ~1.6 mm diamond pitch), plus
   mipmaps + anisotropy 8. OD-only stays enforced by the existing
   object-normal mask (end faces smooth).

## Verification (A/B census vs pre-fix HEAD `53b6d24`, both freshly built)

- Ring switch unit: ringSwitch 88 → **4,292 v** (exact GLB-derived count) at
  `#1c1c1e` with normalMap (182, 17); pins/plungers → clutchSteel 12,810 v;
  stray black-oxide bucket emptied. Vertex total conserved: 17,102.
- Pipeline assertions: ringSwitch bucket has 4,292/4,292 `uv` verts covering
  the cylinder; material carries the knurl normalMap at (182, 17), scale 0.7;
  baked bbox 0.0753 × 0.0754 × 0.0272 = the ring body.
- Handle assembly: the remaining ~99.7 k multi-primitive rear-electronics
  verts (PCB 39,353, chrome 30,137, steelDark 19,060, stainless P001928
  2,927, rotor 3,956, display 3,206, battery 1,651, polymer 1,416) now also
  route to their authored overrides instead of the anodized default — the
  same defect completing; handle total conserved at 299,183. Handle exterior
  (197,477 v) stays `#040404`. These parts show during rear extraction /
  CH.04; owner ruling on JG-028 already covered the prim-0 subset of this.
- Nothing else changed: zero material deltas outside handle + ring-switch
  parents; consolidated meshes 60 → 59; telemetry at 8 scroll stops differs
  only by known gear-integration residue; 0 console errors.
- Gates on the fixed build: `verify-jg028-handle-realism.mjs` 5/5 PASS,
  `verify-jg027-lcd-cluster.mjs` PASS (rear LCD unaffected), typecheck (via
  build) green, `npm test` 10/10, `check:station2` PASS.

## Artifacts

`jg029-ring-switch-knurl/` beside this file: A/B census diff (`ab-diff.json`),
exploded-view screenshot with the routed train, and the census probe used.
