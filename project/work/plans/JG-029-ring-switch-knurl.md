# JG-029 — Ring switch knurl restoration (OD only)

## Problem (owner report 2026-09-06)

The ring switch (P003068) renders as plain black — no knurl on its outer
diameter. Owner asks for the knurl back, **OD face only**.

## Root cause (two independent defects, both proven)

1. **Role routing — GLTFLoader name uniquification defeats the generic test.**
   Multi-primitive CAD parts expand to child meshes named after the mesh def
   (`mesh2534_mesh`), and GLTFLoader uniquifies duplicates as
   `mesh2534_mesh_1`, `_2`, … The JG-028 generic test `/^mesh\d+_mesh$/`
   matches only the FIRST primitive child, so only prim-0 of every
   multi-primitive part resolved its `ROLE_OVERRIDES` entry; the rest fell to
   the unit default. Reconciliation against the live census is exact:
   ringSwitch bucket = 88 v (= P003068-2 prim-0), clutchSteel = 1,608 v
   (= prim-0s of 3× P000464 pins + 3× K000156 plungers), remainder 15,406 v
   black oxide — including the ring body.
2. **No UVs — the knurl normal map never had coordinates.** Every primitive in
   the export carries only POSITION+NORMAL (verified across the GLB). With no
   `uv` attribute the normal map samples a constant point, so the knurl could
   not render on ANY bucket even where the role was right.

## Fix

- `nodeRoles.ts`: broaden the generic-name test to `/^mesh\d+_mesh(_\d+)?$/i`
  so GLTFLoader-uniquified prim children walk through to their part node.
- `nodeRoles.ts`: synthesize cylindrical UVs on the merged `ringSwitch` bucket
  (u = θ/2π around the gear axis, v = axial span) — seam-free because the
  knurl repeat count in u is an integer.
- `materials.ts`: retune `KNURL_REPEAT` from the untested (30, 8) to
  (182, 17) — Ø93 mm × 27.2 mm ring at ~1.6 mm diamond pitch — and enable
  mipmaps + anisotropy so the pattern doesn't shimmer. OD-only stays enforced
  by the existing object-normal mask (end faces smooth).

## Out of scope

- No geometry/GLB change. No animation, camera, or kinematics change.
- Pins/plungers and other parts that gain their authored overrides via the
  routing fix are accepted as the defect fix completing (same class as
  JG-028's); the full re-bucket delta is enumerated by A/B census before
  commit.

## Required proof

- A/B live census vs pre-fix HEAD `53b6d24`: delta enumerated, ring-switch
  buckets become ringSwitch ≈ 4,292 v + clutchSteel remainder; no unexpected
  re-bucketing.
- Live assertions: `ringSwitch` bucket has a `uv` attribute covering [0,1]²,
  material carries the knurl normalMap at (182, 17).
- Gates: `verify-jg028-handle-realism.mjs`, `verify-jg027-lcd-cluster.mjs`,
  typecheck, `npm test`, `check:station2` — all green, 0 console errors.
- Owner visual ruling at `:4173`.
