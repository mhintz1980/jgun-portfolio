# JG-038 G8 performance-contract producer — corrected Lane B delivery, 2026-10-14

Workspace `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, branch `torque-wrench/rebuild`.
This lane performed bounded source preparation only: no browser, build, GPU, test, commit, push,
publication or acceptance action. No gate is closed and no threshold was changed. The parent's
`beginMeasurement` and measured-phase preseek are preserved as received.

## Round 2 release

- AC requires an explicit operator declaration and remains noninstrumented. Battery charging is
  supporting evidence only; the producer gates `acPowerVerified` and reports UNVERIFIED without the
  declaration. Ambiguous labels such as `charging` and `plugged in` do not satisfy it.
- Reverse-to-hold uses the existing progress-to-scroll mapping, then a separate transition: target
  progress within 0.5 CSS pixels for 300 ms, with a 5 s timeout. Only then does the 20 s hold clock start.
  Every hold sample and boundary must remain within 0.5 CSS pixels of that fixed target. Missing
  witnesses, target drift, missing transition or a short hold fail.
- Sentinel rows retain monotonic sequence/timestamp and live narrative-context call counts. Every row
  after the initial boundary must have `liveCalls > 0`; missing or nonmonotonic identity fails.
- Texel sizes: `RGBA4` and `RGB5_A1` are 2 bytes, `DEPTH32F_STENCIL8` is 8. Unsized formats including
  RGB/RGBA are unknown, since their sizes depend on upload type; memory stays incomplete.
- Checks: both syntax checks and help passed; 139 updated pure assertions passed, preserving prior
  coverage and replacing superseded charging/unsized-format expectations. Observer smoke: 23 passed.
  A simulated-rAF sweep passed separate-settle, >=20 s hold and fixed-target witness checks.

Only these three owned files were edited. Parent measurement start/preseek behavior and original pilot
reports were preserved. No browser, build, GPU, child, product, frozen, sibling or commit action.
Ownership is released to the parent; corrected runtime pilot remains parent-owned.

## Delivered files

| Path | State |
| --- | --- |
| `scripts/verify-torque-performance-contract.mjs` | new contract-18 phase-sample producer |
| `scripts/lib/torque-performance-observers.mjs` | repaired in-page WebGL rAF/draw/memory instrument |
| this document | delivery note; ownership released to the parent |

## Corrections applied in this pass

1. **Narrative context.** `environmentSummary` no longer reads `contexts[0]`. It selects the context
   bound to the live `[data-torque-scene]` canvas, reports every context (type, canvas descriptor,
   drawing buffer, narrative flag), and the producer gates on `narrativeContextAvailable`. A detached
   capability-probe canvas defaults to 300x150 and can no longer supply vendor, renderer, drawing buffer,
   dpr or pixels.
2. **Draw paths.** Draw commands are distinguished from `drawBuffers`/`drawingBuffer*`, which are
   never counted. Entries classify as `coreDraw` and `instancedExtension` (geometry-accounted, now
   including `drawRangeElements` and the ANGLE instanced entry points), `multiDraw` (the
   `WEBGL_multi_draw` entry points, named explicitly with `geometryAccounted:false`) or
   `unrecognizedDraw`. Unsupported methods are reported as named objects with a reason. Each
   target/name pair is wrapped once, so repeated `getExtension` calls cannot multiply counted draws.
3. **Memory incompleteness.** `generateMipmap`, `compressedTexImage2D/3D`,
   `compressedTexSubImage2D/3D`, `texStorage3D`, `texSubImage3D` and a `texSubImage2D` with
   no recorded level raise `unsupportedAllocationEvents` and force `estimateComplete:false`, so the
   residency field is omitted rather than reported as a floor.
4. **Texel sizes.** `RGBA16F` 8, `R11F_G11F_B10F` 4, `RGB9_E5` 4; adjacent table errors
   corrected (`RG16I`/`RG16UI` 4, `DEPTH_COMPONENT16` 2). Block-compressed formats (ETC/BC/RGTC)
   and any unlisted format resolve to unknown instead of a guessed size, which marks the estimate
   incomplete.
5. **DPR and pixels.** A device pixel ratio is reported only when the drawing buffer scales both viewport
   dimensions by the same ratio (tolerance 0.02); both ratios and the delta are recorded and a mismatch
   fails the run. Pixels always use both buffer dimensions.
6. **Progress witnesses.** Every phase witness is retained. A missing or non-finite witness, an
   out-of-window witness or an invalid hold entry/exit witness fails the gate; nothing is filtered out.
7. **AC power.** The primary requirement needs an explicit `--power` label naming AC; battery charging
   is supporting evidence only. An arbitrary label or missing declaration stays UNVERIFIED, with
   `acPowerVerified` recorded.
8. **Served identity.** Status 200 plus local SHA binding for the HTML document, the manifest-selected
   entry chunk, the manifest-selected lazy scene chunk and `Default.glb`. A non-200 response, an
   unresolved target or a sha mismatch fails the run; without `--build-dir` the binding is UNVERIFIED.
9. **Instrumentation overhead.** Still absent, so the validator reports it UNVERIFIED.

Byte totals remain storage estimates derived from API-bound dimensions, internal formats, mip levels, cube
faces, depth and multisample counts; they are not driver residency. An unrecognised internal format, an
unsupported allocation or mipmap path, a compressed upload or 3D storage marks the estimate incomplete and
the residency field is omitted rather than reported as a floor.

## Producer

```
node scripts/verify-torque-performance-contract.mjs --url=http://localhost:5288/torque-wrench/ --build-dir=.scratch/jg038-stage4-20261013-s
```

Options: `--url` (required, loopback), `--out`, `--build-dir`, `--viewport=D|N`, `--tier=full|lite`,
`--phase`, `--run=1|2|3`, `--hold-progress`, `--prewarm-seconds`, `--device`, `--os`, `--power`, `--help`.
Defaults are D / full / breakthrough / run 1, output directory
`project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/runtime-performance/`, 6 s per
prewarm direction and a hold at the breakthrough midpoint 0.39. Exit codes: 0 PASS, 1 FAIL, 2 usage,
10 UNVERIFIED, 11 environment blocked, 12 report write error.

One run is: readiness wait (timeout 30 s) → 6 s forward + 6 s reverse prewarm → 5 s settle → measurement
start → 20 s forward / 20 s reverse / separate target settle / 20 s hold plus a 250 ms guard → measurement finish. Every frame's
draw, triangle, line-segment and point totals are closed at a harness sentinel rAF registered after the
existing render loop, so the totals are per presented frame across all passes. Narrative progress is
sampled about once per second inside the window, the store tier is read before and after (the ladder is
one-way, so a matching start/end pair excludes a mid-run step down), and the HTML document, the manifest
entry chunk, the lazy scene chunk and `/models/Default.glb` are fetched and hashed for comparison with
`--build-dir`.

Phase windows come from the real beat table, not from a copy: breakthrough resolves to 0.32-0.46 over five
beats. The default hold sits in `breakthrough-trace`; pass `--hold-progress=0.42` to hold inside the
first-rupture beat (0.42-0.435) that produced the earlier cold-stall observations.

## Pilot evidence (untouched)

The pilot reports under `performance-pilot-20261014-s-D-full/` and `...-full-retry/` are unchanged.
Pilot 1 recorded no measurement at all (`observationSeconds` and `maximum` absent, `allPassTotals`
false). Pilot 2 recorded 60.36 s with a 1184.4 ms maximum and 148 unsupported draw calls whose methods were
`drawRangeElements`, `drawBuffers` and `drawingBufferStorage`, plus `dpr 0.2083` /
`pixels 45000` taken from the 300x150 probe buffer. Those are exactly the defects corrected above.

## What stays unverified

Driver memory residency always, the texture/target total whenever any allocation, mipmap, compressed or 3D
storage path or an unrecognised format is present, instrumentation overhead, wall power unless AC is
established, the startup cache and shader budgets, GPU execution time (rAF intervals are presented-frame
timing) and physical mobile. A clean run therefore returns 10 rather than PASS. Budget breaches and failed
gates still return 1 with named errors, so a missing observable cannot be mistaken for a passing one.

Gates the producer adds on top of the contract validator, each producing FAIL rather than silence: every
phase and hold progress witness finite and inside the phase window (tolerance 0.01, never filtered), a
selected live narrative context and a drawing buffer whose width and height ratios agree, served status 200
with matching local SHAs for all four targets when `--build-dir` is supplied, any pageerror, console error
or failed request, a hidden tab during the measured window, a tier step or a sheet bake tier that differs
from the requested tier, and a page that is not in live mode.

## Checks performed in this lane, without a browser

- `node --check` clean on both files; `--help` prints the full usage; missing `--url`, bad tier, bad
  phase, bad run index, unknown argument, a non-loopback URL and an `--out` path escaping the evidence
  root all exit 2.
- 131 browser-free assertions over report composition and the pure contract validator: a clean sample stays
  UNVERIFIED with no gate failures; an arbitrary power label, a reported discharge and an AC label behave
  as specified; the detached-context and dpr-disagreement gates fire; missing, out-of-window and
  invalid-hold witnesses fail; served 404, sha mismatch, unresolved target and no-`--build-dir` are
  handled; an unsupported allocation omits the residency field; a multiDraw path is named once; and the
  manifest targets resolve against `.scratch/jg038-stage4-20261013-s`. It also covers the draw and texel
  classifiers and asserts the serialized initializer source still carries the corrected table and rules.
- 21 assertions executing the page initializer in Node against a stubbed canvas/WebGL pair: the narrative
  context (1440x900) is selected over a first-instrumented 300x150 probe, 240 triangles per frame come from
  `drawElements` + `drawRangeElements` + instanced draws, `drawBuffers` and
  `drawingBufferStorage` are never counted, one named multiDraw path is counted per call, `RGBA16F`
  counts at 8 bytes per texel, and the named unsupported-allocation paths force an incomplete estimate.
- Pure-helper checks against the real beat table: breakthrough 0.32-0.46 with five beats; the other four
  windows resolve; unknown phases and missing beats are rejected; the tail threshold, percentile and
  hardware/software classification behave as documented.

The self-check scripts ran from the OS temp directory and are not repository files.

## Parent-owned follow-up

Running the pilot, the served preview and all browser/GPU scheduling; the full 60-report roster
(D/N × full/lite × 3 runs × 5 phases); the H/pixel-cap supplemental case; the startup cache and shader
trials; the repeatable wheel and touch input rosters; physical mobile; independent review of this
producer; Astra review and owner acceptance.

No product, shared, index, frozen-build or sibling-checkout file was touched. A run writes only into the
task evidence directory. Ownership of both scripts and this document is released to the parent.

