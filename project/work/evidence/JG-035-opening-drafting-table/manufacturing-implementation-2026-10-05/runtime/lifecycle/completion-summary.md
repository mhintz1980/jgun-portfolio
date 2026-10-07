# Lifecycle verifier completion

Completed two fresh, agreeing production-preview runs. Each contains **14 unique cases: 12 PASS, 2 FAIL**, zero unexpected console/page errors, and no fatal harness error. **V1/V2/V3/V5 PASS; V4 FAIL; V6 pending.** Both commands exit 1 because the reduced-motion CAD-fetch checks fail.

Run 1 finished `2026-10-06T03:30:38.892Z`; run 2 finished `2026-10-06T03:36:23.183Z`. Matching verifier SHA256: `3ceee872c909cd13d632c59901fad0f0bac42bc8a29fb33a3c2a093d5c51acce`.

## Changed paths

- `scripts/verify-manufacturing-inspection.mjs`: renderer-based readiness/resource checks, awaited deterministic digests, actual exposed state, completed-frame observations, successful stale-byte delivery, both viewport rosters, scoped injected-error exemptions, fresh unique reports and failure-safe setup reporting.
- `project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/runtime/lifecycle/`: current report/README, archived `run-1/` and `run-2/` reports with six PNGs each, command logs, source review and this completion summary. Iteration logs are historical debugging output, not final evidence; legacy stale PNGs removed.
- `project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/gates/runtime.md`: V1–V5 evidence updated; V4 left unchecked, V6 unchanged.

No app source, other script or public asset edits. No rebuild, preview restart, commit, stage, push or deployment.

## Command

Run twice, unchanged, from `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio`:

```powershell
node scripts/verify-manufacturing-inspection.mjs --url=http://localhost:4173 --out=project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/runtime/lifecycle
```

## Per-case results

Desktop is 1440×960; narrow is 390×844. Values separated by `/` denote run 1/run 2.

| Case | Run 1 | Run 2 | Deciding numbers |
|---|---|---|---|
| readiness-ordering-desktop | PASS | PASS | 61 distinct post-ready samples; program counts remain 187/165 respectively. 63/64 playing frames match sample/camera time and stamp; paused matrices identical across 3 distinct frames. |
| pause-hidden-seek-desktop | PASS | PASS | Paused hidden delta 0/0; playing hidden delta 0/0.016700 s <0.1. Seek/replay digests agree; synchronous Replay time exactly 0; active endpoint held at 12 s. |
| restore-desktop | PASS | PASS | 7 scenario groups, 8 exact restore comparisons; max camera delta 0. Late byte delivery 1,798,620 bytes, epoch 7→8, exactly 1 root, release camera delta 0. Error Return and Try again recover. |
| census-lifecycle-desktop | PASS | PASS | 5 warmed cycles; after-return renderer geometries [305,305,305,305,305], textures [35,35,35,35,35], programs [128,128,128,128,128] in both runs. Context loss disposal delta exactly 1. |
| reduced-motion-static-desktop | **FAIL** | **FAIL** | 3 CAD GLB requests in each run; no inspection tool request. |
| poster-static-desktop | PASS | PASS | 0 GLB requests, 0 live WebGL canvases, static time 0. |
| ring-rendering-desktop | PASS | PASS | Max absolute contact clearance 8.9915524e-7 m <2e-5; 3 nonblank canvas captures/run, minimum luma stddev 14.179. |
| readiness-ordering-narrow | PASS | PASS | 61 distinct post-ready samples; programs remain 155 in both runs. 64/64 playing frames match; paused matrices identical across 3 distinct frames. |
| pause-hidden-seek-narrow | PASS | PASS | Paused hidden delta 0/0; playing hidden delta 0.016600/0 s <0.1. Seek/replay digests agree; Replay time exactly 0; active endpoint held at 12 s. |
| restore-narrow | PASS | PASS | Same 7 groups/8 restore comparisons, max camera delta 0; late 1,798,620-byte release preserves epoch 8 and exactly 1 root. Error Return/retry restore exact context and focus. |
| census-lifecycle-narrow | PASS | PASS | 5 warmed cycles, all after-return vectors constant: geometries 306/305, textures 47/36, programs 143/129. Context loss disposal delta exactly 1. |
| reduced-motion-static-narrow | **FAIL** | **FAIL** | 3 CAD GLB requests in each run; no inspection tool request. |
| poster-static-narrow | PASS | PASS | 0 GLB requests, 0 live WebGL canvases, static time 0. |
| ring-rendering-narrow | PASS | PASS | Same contact clearance bound; 3 nonblank captures/run, minimum luma stddev 16.670. |

Across all 12 captures: minimum luma stddev 14.179 (>1), nonmodal fraction 0.0566 (>0.01), color buckets 69 (>10). DOM overlays are hidden for capture; matching rendered time/stamps and positive draw calls are retained. Ring bore/shoulder masks stay 0; OD relief forms; withdrawal reaches authored clearance before fading; black hold has aluminiumBlend 0 and tool invisible.

## Concrete app defect

**V4: reduced motion fetches CAD.** `src/App.tsx:37` computes `canvasActive = tier !== 'poster'`; `src/App.tsx:45` mounts `SceneCanvas`. Reduced motion disables scroll motion but still mounts the CAD scene. Both widths in both runs requested:

- `/models/Default.glb`
- `/models/msp-enclosure.glb`
- `/models/m249-transformed.glb`

The V4 gate explicitly requires reduced/poster states to avoid CAD/tool fetches. Its checkbox remains unchecked. This producer does not own `src/` and has not changed the application.

## Harness limitations and process notes

- Evidence applies to the served production build; file:line anchors refer to the live checkout. Program counts can differ between independent browser sessions/quality tiers; the measured five-cycle vectors remain constant within each session.
- Late successful byte delivery exercises `ringRuntime.ts:119`; cancellation while `parseAsync` is pending and its `:122` disposal guard are not claimed.
- The compositor temporarily changes background during its render pass. Observations run after the complete frame stack, with synchronous render stamps/draw counts retained; transient pass state is not mislabeled an app defect.
- Expected `net::ERR_FAILED` console entries are exempted only for the exact intercepted tool requests. All are retained separately. No missing required probe remains.
- Read-only source review returned **ship**; inherited served model/effort metadata was unavailable. This does not satisfy the separate parent/different-provider V6 gate.
- Initial session startup read TODO.md and git status before discovering the leaf's narrower read boundary; no subsequent queue/git operations or git mutations occurred.

## Evidence

- [Run 1 report](run-1/report.json), [run 1 README](run-1/README.md), six PNGs in `run-1/`.
- [Run 2 report](run-2/report.json), [run 2 README](run-2/README.md), six PNGs in `run-2/`.
- [Latest report](report.json), [source review](source-review.md), [runtime gates](../../gates/runtime.md).
