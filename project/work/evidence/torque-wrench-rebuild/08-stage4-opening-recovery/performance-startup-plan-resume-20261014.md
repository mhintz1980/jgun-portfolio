# JG-038 G8 startup/cache/shader five-trial protocol — Lane B resume plan, 2026-10-14

Workspace `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, branch `torque-wrench/rebuild`,
HEAD `1c7a7d2d1d73b1a94d015bfcae10c101cd94b72c`. This is a protocol only. This lane launched no
browser, build, GPU job, or test, changed no product/source/shared file, and closes no G-gate.
The other top-level chat owns performance producer repairs and all runtime scheduling; product
`Scene.tsx` may change concurrently. Runtime work from this plan must be re-bound to the then-live
revision before it runs.

## Inspected revision binding

The observations below are bound to these SHA-256 hashes, not merely to paths:

| Inspected path | SHA-256 |
|---|---|
`scripts/verify-torque-performance-contract.mjs` | `d79580c0083a0659104e1f596ca2311d9ab1ef8bc2874af57865f62a4bfa8cc2` |
`scripts/lib/torque-performance-observers.mjs` | `a2967b0c32ff7a5df6fff60dfdb60d4ef75e5f4ceb5450ec977b9ef8cd987ac6` |
`src/scene/drawing/sheet/drawingCache.ts` | `d00fb9bf55534f66c8622433b51258a5706f97f117b0923c6032033d3d156196` |
`src/scene/drawing/sheet/sheetBake.ts` | `0bf816399a29ea655c48cbd324bc056b564544b0be52e3e71066c207c1f2971c` |
`src/scene/torque-wrench/RuntimeWorld.tsx` | `ee11b6614ea6527382079d9f02e28bb8876f0f3e7596f1b870763fa51b38d76a` |
`src/scene/torque-wrench/PrivateSheet.tsx` | `8849bc540a402321f191a2da693d71322374fd2e26c1932133a282a9ece63cd7` |
`src/scene/torque-wrench/privateSheetRuntime.ts` | `7e9c476380b7f37f46224ee4c50fdcc2ae12de77a9cea72bd82bdf8ebcbfe6b0` |

Before execution the parent must hash the live files again. A changed `Scene.tsx` alone does not invalidate the cache
observations below, but it does require a fresh source/build/served binding and may change runtime
ownership or readiness. Any change to the files listed above invalidates this exact revision
binding. This document does not review or duplicate the active Banach code-correctness review.

## Exact current cache identity and loading path

“Valid cache” below means a valid application drawing precompute fetched and installed by the page;
it is not a claim that the browser HTTP cache was warm. The current asset is:

- URL: `/drawing/jgun-sheet-v2.bin.gz`.
- Semantic cache version: 8; container version: 3.
- Asset key: `ab313a48a30ac0dd2d2d20c2bb7963f8d80517bfc61bfe7fdacd72728f5f15fc:non-indexed:89ba77022f7cb0bf349e9606a030dfd713b0633d332db425b5df3d5edae85c74`.
- Wire size: 4,205,481 bytes; SHA-256 `8d4a3d10ea75d7221ab510c4cd476fc762f74759e5f8fee266284ad03fecaec3`.
- The public asset and the copy in frozen build `s` hashed identically. Frozen build manifest SHA-256:
  `4aa176d38f8c49bf8ff7e638c753dfd3d6e61cef84ae7e4dacb2e0c8778944b8`.

The inspected load order is:

1. `RuntimeWorld.tsx:31-38` loads `/models/Default.glb` through local Draco at `/draco/` and builds
   the rig with `buildWrenchRig(model)`.
2. `RuntimeWorld.tsx:163-185` snapshots drawing geometry, makes the layout, prepares PMREM, sets
   `probe.ready = true`, and only then starts `bakeSheet()`. Therefore `ready === true` is not
   full startup readiness and does not include the sheet bake.
3. `sheetBake.ts:72-123` calls `prepareDrawingCache()`, then extraction, compose/profile bake,
   breakthrough resources, flex field, ink meshes, and text. Its public stats contain aggregate
   `cacheMs`, `extractMs`, `bakeMs`, and `precomputed`.
4. `drawingCache.ts:4` pins `DRAWING_CACHE_VERSION = 8`. Its key is
   `SHA256(position bytes):topology:SHA256(layoutKey)`; `layoutKey` includes version, geometry
   metadata, and layout/view data. The runtime-computed key is not currently exposed.
5. `drawingCache.ts:149-206` accepts the v3 JGD3 container or legacy JSON, sniffs gzip rather than
   trusting transport behavior, validates structure/version/key, and installs only an exact match.
6. `drawingCache.ts:209-246` fetches the default URL with an 8 s header timeout and 30 s body
   timeout. Any miss, decode/validation failure, or key mismatch returns `false`, after which the
   caller continues the live bake. A timeout is not permission to exceed the fallback readiness ceiling.
7. `PrivateSheet.tsx:29-49` creates the presentation, runs `gl.compile(scene, camera)`, and changes
   `shaderWarmReady` from 0 to 1 only after that synchronous compile.
8. `privateSheetRuntime.ts:378-389` exposes only binary `annotationsReady`/`annotationsFailed`
   from the Troika text readiness promise.

Available probe:

- `window.__torqueWorld.snapshot()` reports `ready`, `frames`, `sheet.baked`, `sheet.tier`,
  `sheet.precomputed`, the numeric `sheet.stats` map, renderer identity/DPR/buffer, and later
  `inspection.ready`.
- The phase observer is installed before navigation by the existing producer
  (`verify-torque-performance-contract.mjs:543-547`) and records WebGL contexts, draws, texture and
  target estimates, and program events. Its current measurement begins only after readiness and
  prewarm (`:595-608`), so the delivered phase flow does not retain a startup program timeline.

## Preserved contract budgets

Contract 18 §5 (`18-stage0-verification-contract-proposal.md:81-96`) is unchanged:

| Span | Maximum |
|---|---:|
| Valid drawing cache: navigation to fully ready | 10 s |
| Stale/missing cache: navigation to fully ready with live fallback | 15 s |
| Drawing preparation/bake span, cached path | 4 s |
| Drawing extraction/bake span, live fallback | 8 s |
| Selected inspection decode/parse to ready | 3 s |
| Initial shader preparation | 3 s |
| First selected inspection shader preparation | 1.5 s |
| New shader programs during measured warm replay | 0 |

Every value and every condition maximum is reported. Overlapping spans are never summed. Missing
observables produce UNVERIFIED, never an inferred zero or PASS. Historical timing JSON and the one
phase-pilot readiness observation are not five-trial evidence and do not become startup acceptance.

## Proposed future producer and report files

Create only after the concurrent product/producer work reaches a stable revision and the parent
grants the serialized runtime window:

1. `scripts/verify-torque-startup-contract.mjs` — one startup/cache/shader producer. It must import
   and install the live observer before navigation, launch one fresh browser process and fresh
   context per trial, intercept only the cache asset for missing/stale conditions, record full
   source/build/served identity, emit one immutable JSON per trial, and emit one summary. It must
   not modify product files or reuse the 60-phase report producer’s output names.
2. Output directory `project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/startup-cache-shader-20261014-s/`
   with `startup-{condition}-trial{1..5}-{stamp}-{runId}.json` and `summary.json`. Reports are never
   written inside the served build.

No such file is created by this lane. The future producer must support at least:
`--url`, `--build-dir`, `--viewport=D|N`, `--tier=full|lite`,
`--condition=valid|missing|stale|all`, `--trials=5`, `--out`, `--device`, `--os`, and `--power`,
with the existing loopback, evidence-root, branch, quality-lock, and unique-output checks.

## Fifteen-trial serial protocol

Run all trials in one parent-owned serial window on AC power, observed hardware GL, and recorded
refresh. Each trial is a new browser process plus a new context, so browser HTTP cache and page
state cannot carry between trials; this does not claim an OS-, disk-, or driver-cold state. Record
process model, browser version, power, renderer, refresh, visibility, backend, served identity, and
any environment change. An environment mismatch makes the condition comparison UNVERIFIED rather
than silently comparable.

Order the three conditions in five repeat blocks (for example valid → missing → stale), preserving
trial numbers; never run conditions in parallel. Each trial:

1. Install the observer before document creation and start network/resource/program timeline marks.
2. Navigate with no `qualityLock`, no service workers, and the requested tier parameter only.
3. For **valid**, let the preview serve the untouched v2 asset. For **missing**, fulfill exactly
   `**/drawing/jgun-sheet-v2.bin.gz` with a recorded 404. For **stale**, fulfill that URL from
   `public/drawing/jgun-sheet-v1.json.gz`; its sidecar records cache version 2, so the current
   version-8 validator must reject it and fall back. The intentional 404/old-version response is an
   expected condition observation, not an unexplained page error.
4. Full initial readiness requires all of: live DOM mode, `world.ready === true`,
   `sheet.baked === true`, expected `sheet.precomputed` (1 for valid; 0 for missing/stale),
   `shaderWarmReady === 1`, `annotationsReady === 1`, `annotationsFailed === 0`, at least one live
   frame, visible tab, no unexpected page/console/request error, and observed hardware GL/AC. The
   current phase producer’s `ready && sheet.baked` check is insufficient for this startup contract.
5. Record navigation-to-full-readiness, plus every exposed sub-span and all observer/resource
   events. Never fill an absent span from wall-clock inference.
6. After initial readiness, direct-seek the inspection window and wait for `inspection.ready` to
   measure the selected-inspection path and its first program creations/links. The external seek-to-ready
   value is an upper-bound observation; exact decode/parse and shader spans still require the producer fields below.
7. After inspection readiness and a 5 s idle settle, establish a program-event baseline, then run one
   bounded startup-stability sweep over canonical progress 0→1→0 plus a 5 s hold. This sweep checks
   only zero new program identities; it is not a 60-phase frame-time sample and does not replace the roster.

Per-trial PASS requires all applicable budgets and required observables present. A condition summary
can pass only with 5/5 valid trials; do not average, pool, drop, or replace a failed/UNVERIFIED trial.

## Shader identity requirements

The startup observer must satisfy contract §5 (`:96`) using event identity, not renderer count:

- Wrap `createShader`, `shaderSource`, `createProgram`, `attachShader`, `linkProgram`,
  `getProgramParameter(LINK_STATUS)`, and `deleteProgram` from the first context.
- Assign a monotonic program ID per program object; retain create, attach, link, and delete events.
- Identity is `(programId, ordered attached shader type + source hash, link count, timestamps,
  LINK_STATUS)`. A delete never cancels a create/link and cannot be netted from the count.
- Initial preparation and first selected-inspection preparation are reported as separate event sets.
  After the post-inspection warm baseline, any new create/link event makes the trial FAIL; a missing
  event stream makes it UNVERIFIED.
- `renderer.info.programs.length`, material flags, and absence of a visible stall are not substitutes.

The inspected observer contains some required event kinds and delete retention
(`torque-performance-observers.mjs:250-256,312-328`), but its bounded 2048-event ring and late
measurement start make startup use valid only after the new producer records from document creation
and proves no required events were evicted. Before relying on it, verify that shader source hashes,
attachment identity, link status and the selected narrative rendering context are actually retained;
the presence of wrappers alone does not prove this complete identity contract.

## Exact unresolved producer fields

The inventory below includes both missing budget measurements and useful diagnostic sub-spans.
Only the approved contract's required observables determine acceptance. Header/body/codec, layout,
PMREM, font fetch and similar decompositions do not create additional gates or budgets. Where an
approved measurement is missing, report UNVERIFIED rather than inventing it:

- Cache: `cacheVersion`, embedded `assetKey`, runtime-computed key, actual fallback cause,
  header-wait, body-wait, transport-decode, codec-decode, key-compare, and install spans. Only
  aggregate `cacheMs` and binary `precomputed` exist.
- Model/rig/drawing: GLTF fetch/decode, rig consolidation, drawing snapshot, layout, PMREM, and
  upload spans. `world.ready` only marks the pre-bake host milestone.
- Bake boundaries: cached/live compose and upload sub-spans. `bakeMs` is one aggregate value;
  `extractMs` is separate.
- Fonts: Troika/font fetch and sync spans and readiness elapsed. Only binary
  `annotationsReady`/`annotationsFailed` exist.
- Initial shader preparation: exact `gl.compile` elapsed. Only `shaderWarmReady` exists.
- Selected inspection: exact decode/parse-to-ready and first-shader preparation spans. Only the lazy
  `inspection.ready` endpoint exists.
- Instrumentation overhead: a bounded total wrapper/sentinel overhead value. The current observer
  explicitly reports it unavailable; no partial proxy may be relabeled as overhead.
- Driver/GPU: memory residency, GPU execution time, and OS/driver-cold state remain unobservable and
  must remain explicit limitations.

## Exact future serial command

After rehash/rebinding, with the unchanged frozen build served by the parent:

```powershell
node scripts/verify-torque-startup-contract.mjs --url=http://localhost:5288/torque-wrench/ --build-dir=.scratch/jg038-stage4-20261013-s --viewport=D --tier=full --condition=all --trials=5 --out=project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery/startup-cache-shader-20261014-s
```

The parent must run it alone, inspect all 15 trial reports and `summary.json`, and use unique names
if any path already exists. If source changes first, build into a fresh task-owned scratch output,
restart the preview, record new served/build hashes, and update the revision binding; never reuse
this plan’s hashes for changed bytes.

## Prerequisites and limitations

- The existing phase producer correctly marks startup cache/shader budgets out of scope. Its one
  pilot recorded 17,963 ms to `ready && sheet.baked` while on battery/discharge and did not include
  fonts/compile full readiness; it is an observation and blocker evidence, not a trial or verdict.
- Until the missing producer fields and instrumentation overhead exist, startup reports can be
  diagnostic/UNVERIFIED but cannot claim contract PASS. The 60-phase roster is separately blocked by
  its own required instrumentation-overhead observable and any active producer repair; the startup
  trials do not repair or substitute for it.
- Concurrent `Scene.tsx` ownership means no runtime execution should start until the parent records
  the final source revision, build, and served identity.
- No Astra, owner, G0–G9, physical-mobile, performance, or visual acceptance is inferred.

## Checks and ownership release

Checks in this lane were read-only: named handoff/ledger, contract 18, producer/observer source,
cache/load/probe source, current asset/sidecar/build hashes, and the required
`C:/Projects/skills-master/local/webgl-telemetry-verifier/SKILL.md` were inspected. No browser,
build, GPU, test, product/source edit, commit, push, publish, cutover, archive, or sibling-checkout
access occurred. Ownership of this document is released to the parent; no other file is claimed.
