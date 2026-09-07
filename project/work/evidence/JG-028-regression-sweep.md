# JG-028 Regression Sweep — VERIFIED CLEAN 2026-09-06

Independent verification that the JG-028 changes affected nothing outside their
approved scope. Run by a second agent against a fresh `npm run build` of the
JG-028 working tree, with an empirical A/B baseline: pre-JG-028 HEAD `a76fc73`
built in a detached worktree (identical `Default.glb`, hash-verified same source
tree — the only differing bundle is `SceneCanvas-*.js`, which contains
`materials.ts`/`nodeRoles.ts`).

## Method

- **A/B live census** (`.scratch/verify-jg028-regression-census.mjs`): every
  consolidated mesh in `rig.meshes` dumped as (parent group, material
  signature, vertex count, local bbox) on both builds; diff keyed by
  (parent, verts, bbox) so any re-bucketing is exact and vertex accounting
  must close.
- **Telemetry A/B** at 8 scroll stops (0.10 / 0.22 / 0.35 / 0.50 / 0.518 /
  0.555 / 0.64 / 0.90): full `window.__telemetry` deep-diff, tolerance 1e-3.
- **Screenshot pixel diffs** at 0.10 / 0.35 / 0.50, plus a same-build control
  pair at 0.50 to size gear-spin phase noise, plus static `?view=exploded`
  A/B (train at rest).
- **Gates re-run**: `verify-jg028-handle-realism.mjs`, `verify-jg027-lcd-cluster.mjs`
  (incl. decal pixel gates), `npm test`, `npm run check:station2`,
  `tsc` (via build). 0 console/page errors in every capture, both builds.

## Findings

1. **Kinematics and scene behavior: byte-identical.** Camera, scroll, stage
   alphas/flow, explodeFactor, ghostOpacity, handleZ (−0.354), stageZ ladder,
   slidingZ, ringSwitchZ, gearRotation — zero diffs at every stop. Only
   `stageRot`/`planetRot` show integration residue from independent rAF
   timing; the delta ratios exactly match the turns table
   ([8, 2.24, 1.5, 1, 0.5]) and `planetRot = −3.5 × stageRot[0]` holds, and
   `gearRotation` itself is identical — measurement noise, not behavior.
2. **Material changes: fully accounted, all inside the defect-fix blast
   radius.** Zero meshes changed material without a matching bucket split.
   Vertex accounting closes exactly:
   - Handle bucket 299,183 v `#1a1a1e`+clearcoat → 297,165 v `#040404`
     (owner-approved) + 8 override splits totaling exactly 2,018 v:
     P001928 stainless (6 v), chrome K000537/CU04 (693 v), steelDark
     FLANGE-class (200 v), pcb electronics (649 v), polymer Teflon (348 v),
     rotor (60 v), battery (59 v), manometer display (3 v).
   - Ring-switch bucket 17,102 v black-oxide → 3-way split: P003068 ring →
     `ringSwitch` knurl `#1c1c1e` (88 v), P000464/K000156 pins/plungers →
     `clutchSteel` `#63666a` (1,608 v), remainder black oxide (15,406 v).
   - **These splits are the `nodeRoles.ts` ancestor-name fix working as
     authored**: every fired override (except the new `[/P001928/i]`) existed
     in `ROLE_OVERRIDES` before JG-028, written for exactly these part
     numbers; the generic-`meshN_mesh` defect had prevented them from ever
     matching. JG-028's build is the first where they render. Most are
     internal hardware, visible mainly during the rear extraction. Owner
     PASS ruling was given on this post-fix build. Consolidated mesh count
     50 → 60 (+10 draw calls, negligible vs the ~13k pre-consolidation).
3. **Untouched, verified:** fastener buckets (`#0d0d0d` m≥0.95), housing /
   output / carriers / planets / clutch-static / clutch-sliding / static
   buckets (zero diffs), LCD cluster present with `verify-jg027` pixel gates
   PASS, ghost material count 1 = 1, blue/red P000420 grooves `#005daa` /
   `#c8102e`, Stations 2/3 contract PASS.
4. **Pixel diffs explained:** 0.10 → 2.2% changed, one localized region;
   0.35 → 3.5%, localized on the handle; 0.50 → 31.8% = the approved handle
   re-tint (left-block mean luminance 64.98 → 30.90, i.e. darker, matching
   `#1a1a1e`→`#040404`) + gear-phase residue (same-build control pair: 1.2%,
   single gear patch only); static exploded mode → 4 px of 2,073,600.

## Verdict

**No regression.** All changes are the owner-ruled finishes plus the
pre-existing override table becoming live on the parts it was written for.
Probe scripts and diff artifacts are preserved in `jg028-regression/` beside
this file; re-run by building HEAD `a76fc73` and the working tree in two
worktrees (junction `node_modules`, copy the gitignored
`public/models/Default.glb`) and serving both.

## Known doc drift (cosmetic, not fixed here)

`scripts/verify-jg028-handle-realism.mjs` header (lines 5–7) and plan/
handoff §1 still quote the abandoned first-pass values (`#0c0c0e`, r0.28,
m0.85, clearcoat); the script's assertions and the shipped code use the final
`#040404`/0.26/0.98. Trust INDEX.md and this file.
