# JG-024 Verification — Fine-tessellation JGun re-export with missing fasteners

**Date:** 2026-09-01/02 · **Status:** implemented + machine-verified; **owner visual ruling pending**
(Mark's stop point: `?chapter=` walk at the back plate + Ring-Switch zoom on the preview)

## 1. Source & processing

- Source: `C:\Projects\CAD\JGUN.glb` — Onshape Fine tessellation, uncompressed,
  203.7 MB, 10,945,989 triangles, Y-up, bbox `[0.148, 0.272, 0.253]` (identical to old).
- Pipeline (gltf-transform 4.5.0, same family as the file it replaces):
  `prune → weld → simplify --ratio 0.033 --error 0.004 --lock-border → dedup → draco`
  → `jgun-full-fine.glb` **13,729,788 B (13.73 MB) Draco, 1,292,875 triangles** installed as
  `optimized/jgun-full.glb` → `sync-assets` → `public/models/Default.glb` → `dist/models/Default.glb`.
  Previous file preserved: `optimized/jgun-full-medium-nofasteners.glb` (8,430,884 B, 333,093 tris).
- Triangle outcome vs the 333 K baseline: gearbox subtrees hit ≈3.9% (≈4.24 M → ≈165 K);
  the handle retained ≈16% (6.70 M → ≈1.13 M incl. screws) — meshopt's error bound +
  `--lock-border` resist collapse on the handle's many small fragmented surface patches.
  Accepted: perf gates green (below), denser-than-baseline silhouettes are an upgrade, and
  the Ring-Switch zoom region (gear teeth) is error-protected.
- ⚠ **`gltf-transform join` is FORBIDDEN on this tree** (measured): it merged across the
  hierarchy and collapsed 337 nodes → 31 / 10,674 prims → 36, destroying the rig's
  per-part identity skeleton — same failure class as the msp-enclosure gltfjsx trap.

## 2. Static forensics (probes: `.scratch/jgun-reswap/probe-*.mjs`, kept local)

- Tree diff vs old Default.glb: **exactly +9 mesh nodes and 1 reparent.** All 76
  part-number groups identical instance counts. New nodes (all direct children of
  `HANDLE ASSY`, all `NO THREADS`): `91251A148` ×2, `96006A253` ×1, `90910A815` ×2
  (the 5 back-plate counterbore screws, world z ≈ −190…−210 mm) + `91251A344` ×4
  (the radial set). `K000004` moved from gearbox root to under `A000592-1`; world
  center `[0, 0, −0.0545]` identical in both files.
- World-space parity (99 common mesh paths, TRS-composed world AABBs): **center Δ 0.00 mm
  worst; dim Δ ≤ 0.40 mm** (tessellation only; worst = ring-switch ring P003068).
- Processed-output parity: signature diff vs the Fine source **0/0** (names + hierarchy
  untouched); role-map.json occurrences **316/316 resolve**.

## 3. Runtime telemetry (:4173, fresh preview restart, headed-Chrome CDP)

- Liveness: canvas + `__telemetry` + `__rig` live; console = only the two known-benign
  warnings (THREE.Clock deprecation, X4122 shader info-log).
- **Explode ladder at progress 0.52 — old and new BYTE-IDENTICAL:**
  `stageZ [−0.255, −0.230, −0.142, −0.099, −0.177]`, `outputZ +0.050`, `handleZ −0.354`,
  `clutchZ −0.291`, `bearingZ −0.197`, `gearRotation 25.133` (8π), `explodeFactor 1`.
  Mid-window 0.40 also identical (`explode 0.73`, `gear 19.918`).
- Planet counts `4/4/4/5/4`; bearing merged bbox `[0.058, 0.058, 0.007]` (exact identity).
- Sweep `[−0.233, 0.0518]` (span 0.2848; −1.7 mm vs old — screws at the plate; immaterial
  to the normalized CAD sweep).
- **Fastener unit (the one rig change):** handle subtree enumerates 5 merged meshes, led by
  `#0d0d0d 383,354 tris` — the 9 screws consolidated as unit `fastener` with the
  `blackOxideSteel` default (`nodeRoles.ts` `FASTENER_RE` + `materials.ts` unit default).
  The handle `#1a1a1e` bucket dropped 1,068,946 → 685,592 by exactly the screw share.
  0 unconsolidated leftovers; scene structure identical (636 total meshes old = new).
- **Perf (rAF, final build):** rest p50 16.7 / p95 16.8 ms; exploded hold p50 16.7 /
  p95 16.8 / max 17 — the 16.8 vsync quantum, matching the JG-023 baseline; zero declines.
- `ghostCount 1` and `slidingZ/ringSwitchZ −0.291` at 0.52: **pre-existing** (identical on
  the old model, A/B measured same session). The rig skill's `ghostCount === 0` regression
  note is stale — current code ghost-merges the housing into one material (1 = correct
  consolidated state); `slidingZ −0.306` doc value is stale the same way.

## 4. Same-pose visual pairs (`.scratch/jgun-reswap/shots/`, local)

Old vs new2 at identical scroll poses + settle, deterministic pixel-diff (`shotdiff.mjs`):

| Pose | Changed px (d>8) | Localization |
|---|---|---|
| CH.01 hero | 0.18% | center band only (wrench body) |
| Exploded 0.52 | 0.29% | train silhouettes + rear cluster |
| **CH.04 rear** | **1.17%** | **~21.7 K px in exactly the two back-plate cells** |

No full-frame deltas → no lighting/material drift; the CH.04 concentration is the screws
filling the counterbores. (Machine-measured; screenshots are supporting artifacts.)

## 5. Findings filed separately

- **`ROLE_OVERRIDES` keyed on part names are dead code** (pre-existing, both models):
  `materialRoleFor(unit.key, mesh.name)` receives generic `meshN_mesh` names
  (nodeRoles.ts:16 invariant), so `/ROTOR/`, `/TEFLON/`, pcb/battery/chrome/FLANGE
  overrides never fire — everything untagged renders the unit default. The materials that
  appear correct (LCD, ring switch, housing, clutch) work via *unit* defaults. → inbox seed
  `project/work/inbox/dead-role-overrides.md` (fixing it changes the approved CH.04
  electronics look — owner ruling required, out of JG-024 scope).
- Environment: consecutive fresh-profile Chrome probes are intermittently poster-dead for
  minutes at a time (matches the documented D3D storm pattern); persistent-browser +
  sentinel batching (`.scratch/jgun-reswap/ab2.mjs`) rides it out.

## 6. Checks

- `npm run typecheck` green · `npm run build` green (×2: pre-fastener + final).
- `npm run sync-assets` → `Default.glb` 13,729,788 B in `public/models/` and `dist/models/`.
- Tier matrix not re-run (asset swap only; lite renders the same consolidated rig at lower
  DPR, poster path doesn't load the GLB — JG-019/JG-022 records stand).
- **Open:** Mark's visual ruling (AC 6) at the preview stop points — `?chapter=2` walk,
  back plate + Ring-Switch zoom. TODO checkbox stays unchecked until then.
