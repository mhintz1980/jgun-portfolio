# 49 V16 frame shifts (Job 1), 2026-10-12

Change: `src/scene/rl300/prepareModel.ts` only (+41/-6). Shipped GLBs untouched. Baseline = scratch build of HEAD `c7240ad3`; after = same + this edit.

## What moves (glTF z, metres, both tiers, by node name; extras by root)
| Set | Nodes | Shift | Source (shipped minus V16) |
|---|---|---|---|
| 904j-e28t_eng + 26-01305-1 | 35 | -0.0149 | median +14.9 (fused 4874323 on family union +15.0) |
| RM100-PX1029008D-1 | 1 | -0.0145 | +14.5 |
| RL300-CPM-3000, RL300-P-FFM-1000 | 5 | -0.0140 | +14.0 |
| V2CONTROL PANEL, URFS-2 (fused, not in the handoff list) | 1 | -0.0140 | +14.0, 0 dim delta |
| shipped MAN-6650459107-1 (replaced by extras on both tiers) | 1 | -0.0141 | +14.1 |
| extras GAUGE_DIALS | 10 meshes | -0.0140 | root z +0.014 |
| extras PUMP_HOUSING (MAN assembly) | 8 meshes | -0.0141 | root z +0.0141 |
| extras DUCT_EXHAUST (connector) | 1 mesh | -0.0154 | root z +0.0154 |
| `EXHAUST_STACK_OFFSET` z | | -0.0496 -> -0.065 | V16 -0.065; the +0.0154 term is gone |
Not touched: COMPOSITE_PANELS (+94 x), ENCLOSURE_CHASSIS bolts, PUMP_HOUSING tie-downs, RL200-SIF-1019-1.

## Numeric check (base vs after prepareModel on the real GLBs, per vertex)
- 1,348,449 vertices; x/y changed 0; moved 516,552.
- Main table triangles moved 155,877 = triangles of the 42 named nodes in the GLB (exact). Extras 13,411 of 13,411 moved. Stack 2,896 moved -0.0154 (offset change). Nothing else moved.

## Frames (`frames/`, `sheet-*.png`, `diff/`)
Desktop full and lite 1440x900 at u .2 .34 .58 .825, phone 390x844 (DPR 2) full at u .58. Changed pixels (threshold 8): full 2.4 / 2.6 / 4.9 / 3.7 %, lite 2.7 / 3.0 / 5.6 / 4.2 %, phone 3.7 %; all inside the engine, stack and dials (diff maps).

## Gates (once each)
typecheck 0; full vitest 50 files / 701 tests, no test added; build 0; check:station2 0; verify-jg033-preview 0, errors []; ribbon-clipping 0; U.1 only prepareModel.ts.
U.2 (index.html redirect block, quiet-machine/index.html, quiet-machine-main.tsx): unchanged, hunks=0 removed=0. `public/models` and `src/shared` diff empty. Reach: `prepareModel` is imported only by `QuietMachineScene.tsx` (and tests) under `src/scene/rl300`; no other copy of the old frame values exists in `src`.
Spend: about 100k tokens on Sonnet 5.5 (orchestrator context counter, estimate was 40-55k) plus 2 Opus 5.5 advisor calls. No spawns, USD 0.
