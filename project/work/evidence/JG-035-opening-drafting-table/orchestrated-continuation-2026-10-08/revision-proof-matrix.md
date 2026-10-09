# JG-035 S1/E2 — stills regeneration and missing-proof matrix

Prepared 2026-10-08 by GLM-5.3 (reasoning max). No browser, build, GPU capture, production source, public asset, TODO, or work-index write was made. V1 owns the current build/GPU work; the baseline quick collapse is accepted as the reason to wait. Any visual capture below may add `qualityLock=1` for candidate composition only. A quality-locked candidate is not acceptance, tier, performance, or G6 evidence.

## Current producers and provenance decisions

- Current drawing/font proof producer: `scripts/verify-handwriting-reference.mjs`. It already verifies `AcFastReference.ttf`, glyph metrics/ink, reveal/color packing, and precomputed cache use. Cache v8 is accepted and complete; do not regenerate, retune, or republish it for this task.
- Current opening/revision evidence producer: `scripts/capture-owner-revisions.mjs` (`--only=opening|shaft|ring`, explicit viewports/times). It is evidence-only, not a publication encoder.
- Current zero-CAD/zero-canvas natural fallback verifier: `scripts/verify-jgun-opening.mjs` reduced cases (the block asserting zero canvas elements, zero connected/drawing WebGL contexts, zero CAD/tool requests, no Lenis, and native DOM narrative). Run it separately; it is not a visual-capture producer.
- Fallback asset audit: `StaticPoster.tsx` has no raster asset reference (only CSS gradients plus generic `ASSEMBLY_IDENTITY` text). The lettering-adjacent reduced/poster content is `Chapters.tsx` → `AuthorshipInline`, plain DOM text imported from `ownerAnnotations.ts`; it is intentionally readable inline copy, not the accepted `AcFastReference` handwriting and not a published raster. `StaticShaftStory.tsx` is the only drawing/inspection fallback raster consumer. Therefore there is no existing drawing-poster raster destination to refresh; making one requires a new production component/asset decision, not a cache regeneration.
- Legacy shaft publication producer: `manufacturing-implementation-2026-10-05/static-shaft-2026-10-06/final-provenance/capture-refresh.mjs` plus `encode-refresh.py`. Its telemetry method remains useful, but two assumptions are stale: (1) it imports the Vite `/src/state/inspectionStore.ts` instance, so it is dev-server-only; (2) it hides all DOM and screenshots only the canvas, which omits the S2 DOM FOS model/bar.
- Required refresh method: run only against the final integrated build, use normal quality first, and add `qualityLock=1` only if the known canvas-collapse reproduces. Capture a composite containing the render canvas plus live `[data-shaft-fos-model]` and `[data-shaft-fos-bar]`, preserve three completed-render/camera stamps, and SHA-256 both source PNGs and encoded WEBPs. Publication remains blocked until the parent approves the exact inventory below.

## Missing-proof matrix

| Area | Missing proof | Existing producer/gate | This task's bounded output |
|---|---|---|---|
| O1 electrical | Fixed-rate timing; desk-exposure/far-closure sightlines | Opening verifier + fixed-rate capture | Proof row only; no code change |
| O2/O4 drawing | Title/career block at t `.065–.10`; final integrated-build font/cache evidence; owner decision on whether reduced/poster must show handwritten lettering rather than plain DOM equivalent | `verify-handwriting-reference.mjs` + reduced `AuthorshipInline` checks | Current-font proof captures; cache v8 unchanged; no raster drawing fallback exists |
| O3 reading | Tablet `768x1024` capture/readability | `capture-owner-revisions.mjs --only=opening --viewports=tablet` | Proof row only |
| R1/R2 ring | Closure/reopen timings; full-circumference per-sector seam coverage | Ring verifier extension | Proof row only |
| S1 cutter | Engagement/occlusion crops and equal-depth viewer-right proof | Shaft verifier/capture extension | Proof row only |
| S2 FOS | Static parity for authored `.55/.72/.90`, ordered and all `<1`; revised blue-only | Shaft verifier is independent oracle; static encoder supplies visual parity | 17/19/21.5/34.2 s candidate evidence and 16 stills |
| S3 shaft | Exact `1.3/10.9/25.4 s ±.05` artifact assertions; separate residual-groove CAD/remesh decision | Shaft verifier + owner-scoped CAD work | Proof row only; no masking or done claim |
| Item 3 stamp | FAILED driven by sampled `stampScale` | Current parent-owned source edit, then shaft verifier | Wait; do not capture stale baseline |
| Item 4 fallback | Natural reduced mode remains zero canvas/GLB; poster/reduced shaft remains DOM/stills-only | Opening reduced cases + shaft S8 | Separate pass/fail evidence |

## Exact capture/encode plan after final integrated build and slot release

Run from `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio` after the current V4 baseline GPU commands complete and the parent releases the slot. Owner clarification: additional existing enclosure/M249 badges are allowed, so no source producer restriction or rebuild is required solely for hotspot scope. The frozen 5203 integrated build remains eligible; `stills/preview-api-audit-2026-10-09.json` is valid for that source bundle, and the capture report must independently retain its served-index/loaded-JS SHA-256 provenance. Run the shaft command without `--quality-lock` first. If the known canvas-collapse reproduces, rerun with `--quality-lock`; the report then labels itself `qualityLockVisualOnly`, excluding acceptance, tier, performance, and G6 claims.

```powershell
node scripts/verify-handwriting-reference.mjs --url http://localhost:5203 --qualityLock --require-precomputed --out project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/stills/drawing-final
node project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/stills/capture-final-stills.mjs --url http://localhost:5203 --out project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/stills/shaft-capture-final
python project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/stills/encode-final-stills.py --capture project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/stills/shaft-capture-final --dest project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/stills/candidate-public/inspection/shaft --manifest project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/stills/shaft-raster-manifest.json
node scripts/verify-jgun-opening.mjs --quick --case desktop-reduced --url http://localhost:5203 --out project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/stills/fallback-desktop-reduced
node scripts/verify-jgun-opening.mjs --quick --case narrow-reduced --url http://localhost:5203 --out project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/stills/fallback-narrow-reduced
```

Authorized item2 quality-lock visual-only neighbor proof, after the same explicit GPU release and without overwriting older captures:

```powershell
node scripts/capture-owner-revisions.mjs --url=http://localhost:5203 --out project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/stills/revision-title-tablet --only=opening --viewports=desktop,tablet --times=0.065,0.08,0.10
node project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/stills/finalize-owner-revision-captures.mjs --dir project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/stills/revision-title-tablet --url http://localhost:5203
node scripts/capture-owner-revisions.mjs --url=http://localhost:5203 --out project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/stills/revision-shaft-artifact-neighbors --only=shaft --times=1.25,1.3,1.35,10.85,10.9,10.95,25.35,25.4,25.45
node project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/stills/finalize-owner-revision-captures.mjs --dir project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/stills/revision-shaft-artifact-neighbors --url http://localhost:5203
```

The finalizer adds per-PNG SHA-256/pixel dimensions, report captions, current source hashes, and the served index/loaded-JS hashes. The residual relief geometry remains explicitly flagged for the owner; no geometry change is authorized.

Expected evidence: drawing verifier report/PNGs with cache v8 and current-font telemetry for the live sheet; reduced fallback reports proving the plain-DOM authorship equivalent, zero canvas, and zero CAD/tool requests; shaft capture report with 20 source PNGs (eight publication candidates per layout at `1440x900`/`390x844`, plus two FOS plateau proofs per layout), SHA-256, exact sample times, completed-render stamps, stable camera/projection, and FOS text/opacity; encoder manifest with exactly 16 WEBPs (`960x600` desktop, `600x600` narrow, quality 90) and source/output hashes. These are two different lettering surfaces and must not be conflated.

## Exact production destination inventory — parent approval required

All sixteen approved files replace same-named assets in `public/inspection/shaft/`:

- `cutter-exit-desktop.webp`; `cutter-exit-narrow.webp`
- `material-attempts-desktop.webp`; `material-attempts-narrow.webp`
- `revised-blank-desktop.webp`; `revised-blank-narrow.webp`
- `hobbed-desktop.webp`; `hobbed-narrow.webp`
- `cool-stress-desktop.webp`; `cool-stress-narrow.webp`
- `support-before-desktop.webp`; `support-before-narrow.webp`
- `support-after-desktop.webp`; `support-after-narrow.webp`
- `assembled-finale-desktop.webp`; `assembled-finale-narrow.webp`

No drawing production destination is requested because none exists in the current fallback architecture. Cache v8 and `AcFastReference.ttf` serve the live WebGL sheet only; they do not make `StaticPoster` current. `AuthorshipInline` is built from source strings at runtime and has no file destination. If the owner requires the reduced/poster path to display the accepted handwritten lettering, the parent must first approve a new fallback component and exact destination (for example a future `public/drawing/` raster pair); that is outside E2's evidence/file ownership. The evidence-local encoder manifest and candidate tree are not production destinations.
