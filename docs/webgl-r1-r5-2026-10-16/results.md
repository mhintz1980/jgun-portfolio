# R1–R5 hardware verification

Measured acceptance: **PASS**. 21 rendering/runtime gates; four lighting stops; compiled role gains; source identity and camera framing. Owner visual approval remains open.

The three Sol/high implementation lanes wrote only the five authorized source files. A GLM-5.3/max follow-up wrote one fill panel then hit HTTP429; parent inspected and completed calibration. Reviewer binding is Astra/medium; see independent-review.md for actual reviewer result.

| Capture | Subject p99 | Clipped >252 | Status |
|---|---:|---:|---|
| 0.15 | 219 | 0.0000% | PASS |
| 0.35 | 222 | 0.0000% | PASS |
| 0.47 | 244 | 0.0418% | PASS |
| 0.65 | 215 | 0.0000% | PASS |

Exploded-stop role medians: tool 114, carrier 133, planet 150; pairwise gaps 19/17/36. Flat-ID masks exclude translucent composites and erode silhouettes by two pixels. Matching screenshots retain DOM overlays, a measurement limitation. Role statistics apply where the role has visible samples.

| Sweep | p50 ms | p95 ms | p99 ms |
|---|---:|---:|---:|
| Historical supplied | 33.20 | 33.80 | 50.00 |
| Fresh pre-task A | 16.90 | 50.10 | 451.30 |
| Final candidate B | 16.80 | 33.70 | 785.40 |

Separate symmetric performance-only arms exclude mask/screenshot work in both and fix actual DPR1. First run is warmup; post-warm samples:

| Arm/run | p50 ms | p95 ms | p99 ms |
|---|---:|---:|---:|
| baseline/1 | 33.30 | 66.60 | 66.90 |
| baseline/2 | 33.40 | 67.00 | 83.70 |
| baseline/3 | 33.30 | 66.80 | 66.90 |
| candidate/1 | 17.20 | 50.20 | 66.80 |
| candidate/2 | 33.00 | 50.10 | 66.90 |
| candidate/3 | 17.00 | 50.30 | 66.80 |

Candidate p95 improves in these short repeated observations; median varies between17.0 and33.0ms. Long frames remain, including the original capture-run p99 785.4ms and symmetric max83.6ms. This does not establish sustained60fps or a general startup/performance acceptance.

The sweep is a short rAF observation, not a GPU timing benchmark or a steady-60fps claim. Fresh A reproduced the stale 2880×1800 composer buffer and cold-warm decline. B resizes the composer to the requested drawing buffer; full uses supported 4× samples, lite uses SMAA at DPR1, and final EffectPass output dithers. Poster and reduced-motion unmount the canvas/composer.

| Stop | Historical changed pixels (>8/channel) | Historical mean channel delta | Fresh A changed pixels |
|---|---:|---:|---:|
| 0.048 | 3.53% | 0.96 | 3.48% |
| 0.103 | 0.61% | 0.48 | 0.28% |
| 0.15 | 42.95% | 24.92 | 42.72% |
| 0.35 | 11.16% | 4.77 | 10.94% |
| 0.47 | 12.16% | 5.81 | 11.96% |
| 0.65 | 11.61% | 3.08 | 11.42% |
| 0.85 | 3.89% | 2.79 | 1.47% |

Both matching arms use real Lenis seeks and confirm all seven historical explode/ghost states. Camera differences are recorded in acceptance.json; shader compilation, connected-canvas context loss and page/console/HTTP errors are checked. Diagnostic staircase, tier transitions, overlay cycles and actual hero-frame callbacks are explicitly forced probes, separate from natural seek evidence. The disconnected WebGL capability probe is excluded from context-loss failures.

Historical p=.85 camera position is 29.57mm short of its own goal; fresh A/B endpoints match. Framing preservation uses fresh A/B, whose maximum difference is below0.068mm. Historical pixel changes at that stop include the baseline settling discrepancy. Saved actual yaw samples also pass the independent expected exponential-response assertion across30/60/120/144Hz.

Initial baseline/candidate folders omitted real scrolling and are diagnostic history only. candidate-matched precedes lighting calibration; candidate-final used hero gain12 and measured p99 212. candidate-verified is the final evidence. Frozen source hashes in its telemetry must match current files.

Build and suite details: static-checks.json. Controlled suite: 1013 passed, four skipped, one existing portal geometry fold failure, independently reproduced with pre-task source. Full suite is therefore not green. Final production checks: production-smoke.json. Preservation: preservation-manifest.json and preservation-final.json. No protected assets, canonical dirty files, existing evidence, or .scratch are authorized write paths.
