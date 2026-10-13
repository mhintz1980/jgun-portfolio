# JG-038 released drawing patch — parent-lane runtime integration record

Workspace `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, branch `torque-wrench/rebuild`,
HEAD `dc44fb79ed43d6a62db47ae58900afb718ad15d1`. Authority: incoming parent-integration instruction
of 2026-10-12. Nothing staged, committed, pushed or published; no cross-chat message was sent; the
protected `jgun-portfolio` sibling was never accessed; `node_modules` was not modified.

Companion files in this folder: `drawing-note-adjudication.md` (NOTE 3 and NOTEs 4–9),
`parallel-drawing-second-review.md` (release), `parallel-drawing-review.md` (first manifest).

## Entry gate — released patch re-verified on current bytes

| Check | Command | Result |
| --- | --- | --- |
| 19-path manifest | `node .scratch/jg038-parent-integration/verify-drawing-manifest.mjs` | 19/19 SHA-256 matched; edgeExtract and profile both set the primary-error flag before `finally` |
| TypeScript | `node node_modules/typescript/bin/tsc --noEmit --pretty false` | exit 0, no output — the three original parent-owned errors are resolved |
| Serialized roster | `node node_modules/vitest/vitest.mjs run … --maxWorkers=1 --no-file-parallelism` | exit 0, 9 files / 142 tests, 30.58 s |
| Scratch build | `node node_modules/vite/bin/vite.js build --manifest --outDir .scratch/jg038-parent-integration/dist` | exit 0, 16.29 s first pass, 33.82 s after the probe change |

## Parent-lane source change (observability only)

`src/scene/torque-wrench/RuntimeWorld.tsx` — the private world host is parent-owned (`stage3-runtime-contract.md`).
It exposed no drawing observable, so registration and the precompute match could not be measured on the
private page. Added: a `bakedSheet` ref and a `sheet` field on the existing `__torqueWorld` probe
(`baked`, `tier`, `precomputed`, `stats`, `registration`), populated when the bake installs and reset on
teardown. `pulseRegistration()` is read lazily through the port, uses the bake result's own cache, and
never throws for a live bake. No render, geometry, camera, tier or lifecycle behaviour changed.

## Runtime verifier (new, parent-owned)

`scripts/verify-torque-drawing-integration.mjs` — read-only browser harness, Playwright 1.56.1 with the
shared `scripts/lib/browser-launch.mjs` config (installed Chrome, ANGLE/D3D11). It drives a served build,
reads the probe ports, and never edits product source. `--only=` runs a subset.

## Results — one consolidated run

Command: `node scripts/verify-torque-drawing-integration.mjs --url=http://localhost:4193/torque-wrench/ --build-dir=.scratch/jg038-parent-integration/dist --out=.scratch/jg038-parent-integration/drawing-integration-report.json`

Report SHA-256 `d50101a2277ac99a3807b4137db547f2507a92a59ae3ee25614c40088e5acdd3`. Preview was a fresh
task-owned Vite preview of the scratch build, stopped after the run. Result: **5 PASS, 0 FAIL, 1 UNVERIFIED.**

| # | Check | Verdict | Measured evidence |
| --- | --- | --- | --- |
| D | Built-chunk isolation | PASS | Eager closure = 4 chunks / 217,063 bytes with **zero** drawing markers; the single dynamic import `Scene.tsx` plus its lazy closure carries the drawing markers (`jgun-sheet-v2`, `AcFastReference`) |
| A | Private integrated mount | PASS | `data-torque-mode=live`, `data-torque-stage=scene`, exactly 1 canvas, 16 frames, chapters drafting→breakthrough→mechanism→inspection→close, story text 1347 chars, footer present, 0 page errors, 0 console errors |
| B | Matched-input runtime registration | PASS | `precomputed: 1` — the frozen precompute matched these inputs; inventory 226,783 segments / 21 fills / 254 texts **equals** the published `jgun-sheet-v2.evidence.json` record; `pulseRegistration` ready, 10,203 profile points vs 24,383 side-view segments, max 8.79e-5 m, mean 3.26e-5 m |
| C | Annotation/pixel visibility | PASS | Stage capture at the drawing beat: paper fraction 0.9997, feature fraction 3.54 %, luma σ 12.79, minimum luma 11.3 (dark ink present); renderer 139 calls / 1.35 M triangles rising to 163 / 1.47 M after scroll |
| F | Real renderer context loss | PASS | `WEBGL_lose_context` on the live canvas → `data-torque-mode=static`, `data-torque-stage=poster`, 0 canvases, world probe released, DOM story intact at 1300 chars |
| E | BFCache | UNVERIFIED | `pageshow.persisted = false`: the browser reloaded the document instead of restoring it, then re-initialized live (`mode=live`, story 1347 chars). No BFCache restore observed, so none is claimed |

## Interpretation

The drawing patch's resource-safety seam is exercised on the real renderer, not only in tests: the bake
installs on the private page, the frozen precompute matches the private inputs (so the side-view ink
registers to the baked pulse within ~0.09 mm at worst), the drawing implementation stays out of the eager
document, annotations reach pixels, and a genuine loss of the WebGL context falls back to the poster layer
with the semantic story preserved.

The precompute match is worth noting for the record: the published evidence record was produced from the
legacy root document on 2026-10-08, yet the private page's snapshot geometry hashes to the same cache key
and reports the identical segment/fill/text inventory. That is the strongest available sign that the
released geometry changes preserved the drawing inputs rather than silently re-deriving them.

## Limits — what these results are not

- No gate is closed. G2/G3/G7 each have several unmet requirements (see the ledger); this run supplies
  partial runtime evidence for their drawing/registration/context-loss components only.
- BFCache is unproven. A `persisted: false` reload is not a BFCache pass, and the harness records it as
  unverified rather than inferring restorability.
- The pixel measure is a contrast/coverage statistic on one 864×129 stage crop, not per-annotation,
  per-glyph or per-part verification, and not an owner visual acceptance. Two screenshots are retained
  under `.scratch/jg038-parent-integration/` (scratch only, never committed).
- Timings, `dpr` and adapter behaviour are one headless installed-Chrome run on this host; nothing here is
  a contract-18 performance claim, and no hardware-GL, freshness, font or offline-asset gate is asserted.
- Only the `full`-tier eager/lazy identity and the default desktop viewport were exercised. Lite, narrow,
  reduced-motion and the remaining Stage 3 inspection/cutter frame paths are untouched by this record.
- The probe addition improves observability only; it does not prove cleanup, remount or zero-frame-churn
  behaviour, and the two screenshots live in scratch output that must never be committed.

## Remaining parent-lane work

Annotation visibility is now measured at the stage level; per-annotation/per-part attribution and the
inspection/cutter frame paths remain. BFCache needs either a restorable-document investigation (why the
document is refused) or an explicit decision to treat the reload path as the supported behaviour.
