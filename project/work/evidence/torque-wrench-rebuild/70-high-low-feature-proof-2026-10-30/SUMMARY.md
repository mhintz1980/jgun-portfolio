# High-to-low cascade camera and authenticated feature proof — 2026-10-30

Owner selected the high-to-low tracking camera and directed that the input shaft stay visible while it remains on screen. The previous whole-shaft pixel stand-in could not distinguish teeth from shaft body, so this pass replaced it with authenticated Draco feature bounds and depth-tested masks.

## Authenticated geometry

| Feature | Shaft-datum +Y band (mm) | Provenance |
|---|---:|---|
| Shared functional ten-tooth face | 3.174827–9.524858 | Present in both `Default.glb` P001835-2 and `manufacturing-core-full.glb` approvedshaft |
| Source shaped exit | 9.524858–9.789711 | P001835-2 only |
| Study hob lead-out | 9.524858–13.938684 | approvedshaft only |
| Far-end sixfold | 61.109647–71.523950 | Both assets; six modulo-60° flat normal clusters in 61.109647–71.120672 |

Full decoded counts: source 11,347 vertices / 12,754 triangles across 131 Draco primitives; study 32,275 vertices / 47,976 triangles. Applying the study lead-out to source P001835-2 would label smooth journal body as teeth, so the contracts carry variant per-mesh bands plus a shared-functional comparison control.

`GEOMETRY-FINDINGS.md`, `geometry-report.json` and `analyze-geometry.mjs` reproduce the measurement offline. Protected GLB hashes were unchanged by the run.

## Runtime proof

Rebuilt candidate asset `dist/assets/Scene-DIluicBv.js`, SHA-256 `9EC1F56E5FD4E04CA52061C55911AB8EFD0F3410766EEEDEF0C12E1BFE99CCED`, served on `:5297`. Both `1440×900` and `390×844` completed forward and reverse sampling with zero camera and subject reverse error, canonical `2e-6` reachability tolerance, and repeat/restore validity in every capture.

Option A keeps Stage 1 carrier `P001836` opaque through `61.5 s` and retires it over `61.5–62.25 s`. `stage1Sun` (`P001836`) stays at `≤0.194` periods/frame while visible through `61.90 s`, reaches `0` by `62.25 s`, and contributes `0 px` at every over-limit sample from `62.80–66.90 s` on both aspects.

The shared functional ten-tooth face contributes `0 px` at every over-limit sample from `56.00–66.90 s` on both aspects. Before Option A the same face held `4,974 px` on desktop and `1,120 px` on narrow at `56.25 s`.

`inputSixfold` leaves the frame before its over-limit span: `0 px` at every sample from `44.40–66.90 s` on narrow; on desktop `45 px` at `56.00 s` (`0.282` periods/frame, under the `.35` rung), a single bottom-edge pixel at `56.25 s`, and `0 px` from `56.35 s` onward.

Residuals kept explicit: the study-only hob lead-out (`9.524858–13.938684 mm`) sits in the axial gap between the top of `P001836` (`y = 9.14 mm`) and the retaining ring `K000211` (`y = 14.60 mm`). It contributes `1,610–7 px` on desktop from `56.00–59.10 s` (`0 px` from `59.60 s`), and `462–2 px` on narrow from `56.00–60.90 s` (`1 px` at `61.90 s`, `0 px` at `62.25 s`).

## Verification and commands

```powershell
npx vitest run src/scene/torque-wrench/cascadeFeatureMask.test.ts src/scene/inspection/shaft/camera.test.ts src/scene/inspection/shaft/schedule.test.ts src/scene/inspection/shaft/shaftRuntime.test.ts src/scene/torque-wrench/finalCascade.test.ts
npm run typecheck
npm run build
node scripts/diagnose-high-low-features.mjs --widths=1440,390 --times=40.2,43.5,44.4,52.2,53.1,53.2,53.3,55.5,56,56.25,56.35,56.4,57,57.9,58.2,58.3,59.1,59.6,60,60.9,61.2,61.3,61.5,61.9,62.25,62.8,63.15,64,64.1,64.65,65.4,66.9
```

Focused tests `81/81` PASS; typecheck and production build PASS; `git diff --check` clean. `runtime-summary.json` is a compact copy of the run with PNG payloads omitted; the raw report remains in the temporary candidate clone.

Open gates: full same-build six-case roster and dense per-frame replay, owner visual acceptance, and the inherited 66.9 s source-takeover C1 stop.
