# P04 attribution and experiment disposition

Baseline source `6ec4fe06b55a4f71865166ac1dfbc5a1a70502c2`, artifact `f624a566bd5571ecef8a0dab052d7b13dc066efc11452f3241b241836c6b7bef`. Diagnostic: `node scripts/capture-portfolio-attribution.mjs --base=http://localhost:5271 --identity=project/work/evidence/JG-042-portfolio-performance/baseline-identity.json --out=project/work/evidence/JG-042-portfolio-performance/baseline-attribution`. Raw report and CDP trace stay local in that folder. Trace instrumentation perturbs performance; these are not primary comparison timings.

Bundled Chromium 141.0.7390.37, desktop 1440×900, DPR 1; renderer explicitly identified AMD Radeon 780M / ANGLE D3D11. Natural mechanical tier remained full at all checkpoints. No page errors. Scene-ready checkpoint at performance.now 5755.5 ms; .72 study checkpoint at 28561.5 ms had inspection.ready true, forward input through .825 and reverse to zero returned ready telemetry. These are diagnostic checkpoints, not medians or contractual startup budgets.

| Request | Start from document request (ms) | Finish (ms) | Status | Classification |
|---|---:|---:|---:|---|
| Default.glb | 844.379 | 1073.995 | 200 | Before scene-ready; boot asset |
| jgun-sheet-v2.bin.gz | 5408.174 | 5857.959 | 200 | Starts around scene readiness; drawing readiness is distinct |
| knurling-tool.glb | 26840.227 | 26880.612 | 200 | After scroll input, late study asset |
| manufacturing-core-full.glb | 26902.419 | 26912.300 | 200 | After scroll input, late study asset |

Request initiator stacks and response timing/cache headers are in attribution.json. First study input started at 11591 ms, before either study GLB request. This establishes that these assets were not eager at initial document load in this baseline desktop case. P08 is **closed without implementation** for that measured path; no startup benefit is available by deferring already late requests. Tier-wide fetch preservation is checked by paired runs; no product fetch timing is altered.

Limitations: the first diagnostic's `forward-.65` world checkpoint lagged its narrative checkpoint by one frame (world still .6). The capture script was corrected to wait for both clocks; retain the initial report as partial diagnostic evidence, not full input/visual acceptance. CPU RunTask totals mix traced threads and cannot be used as unique main-thread time or GPU cost. No isolated Draco/decode/model-preparation spans, GPU execution timing, physical mobile, power or actual hidden-tab evidence. P04 diagnostic attribution is partial; cost attribution stays unresolved. P05 export adoption is deferred because paired decode/prep/readiness and visual parity evidence do not exist. No model has been modified. P07 DPR adoption is deferred pending REQUIRED owner perceptual parity and measured rendering benefit. Dependency and loader decisions are recorded separately.
