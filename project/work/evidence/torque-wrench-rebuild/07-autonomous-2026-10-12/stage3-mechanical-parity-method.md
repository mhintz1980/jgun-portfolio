# JG-038 Stage 3 matched mechanical parity method

Authoring record, 2026-10-13. **Real-browser evidence pending parent execution.** This file records the verifier's method and probe contracts; it does not close Stage 3 or G3. Worker-owned files: the new verifier, this document, and subsequently released `src/scene/TorqueWrenchHero.tsx` solely for its opt-in legacy proof path. No mechanical math, private store/runtime, or shared-product edits by this worker; no build, browser, commit, push, publication, or protected-sibling access.

## Probe contracts and integration state

The parent has delivered the private snapshot's `mechanical` census below. After the explicit single-writer release of TorqueWrenchHero.tsx, this worker delivered the root port below, **only with `?mechanicalProof=1`**. Both interfaces have been inspected in current source; fresh served-build/browser integration remains pending. The existing root drawing proof seek controls paced progress and real scroll; it does **not** hold the separate GSAP proxy or accumulated idle. No additional channel/census probe is currently missing in source.

The private snapshot's plain `mechanical` member reads live cached rig nodes/materials without building a second rig. Channels reflect **the latest frame actually applied** to mechanics and the ghost loop, never a seek request or an expected CPU sample:

```ts
mechanical: {
  tier: 'full' | 'lite', // CURRENT store tier; sheet.tier is only the bake's tier
  channels: { shift: number, explode: number, gearAngle: number,
    idle: number, ghostOpacity: number },
  bearingZ: number, // rig.bearing.position.z, K000004
  baseZ: { handleZ: number, outputZ: number, clutchZ: number, slidingZ: number,
    ringSwitchZ: number, bearingZ: number, stageZ: number[] },
  present: { handle: boolean, output: boolean, clutch: boolean, sliding: boolean,
    ringSwitch: boolean, bearing: boolean, stages: boolean[] },
  planetRotByStage: number[][], // every planet's local rotation.z; dynamic counts
  ghostMaterials: Array<{ mesh: string, opacity: number, transparent: boolean,
    depthWrite: boolean, attached: boolean }>,
}
```

All stage arrays have five entries in **stage1, stage2, stage3, stage4, stage5** order. Part keys are A000591/P001836, A000592/P001837, A000860/P003045, A000861/P003047, A000606/P001849. `baseZ` reads `rig.basePositions.get(node).z`; do not substitute current Z or geometry centroids. `present` tests actual node references, not nonzero coordinates. `ghostMaterials` iterates `rig.ghostMaterials` as `[mesh, material]`, uses `mesh.name` as `mesh`, sorts by that key, and reads the actual material flags. `attached` tests `mesh.material === material` (or array inclusion for a material array). Return fresh serializable data. No world-space recentering enters these local rig measurements.

The root-only proof port is installed and removed with the legacy host only when opted in:

```ts
window.__torqueMechanicalProof = {
  version: 1,
  seek(frame: { shift: number, explode: number, gearAngle: number,
    idle: number, ghostOpacity: number }): void,
  snapshot(): {
    source: 'TorqueWrenchHero/useFrame',
    active: boolean,
    frames: number,
    channels: { shift: number, explode: number, gearAngle: number,
      idle: number, ghostOpacity: number },
  },
  release(): void,
}
```

`seek` copies and validates a finite held tuple, requiring shift/explode/ghostOpacity in [0,1]. The **legacy host frame** applies it through the existing mechanics and live-material paths and updates existing `__telemetry.rig`, echoing the applied `gearAngle` as `gearRotation`. While held, derived GSAP/shift-window inputs cannot override the tuple, accumulated ordinary idle stays frozen, the drawing/reduced rest branches are bypassed, and solid mode is used. The underlying timeline may continue sampling its proxy; its inputs are ignored until release. Legacy ghost flags and thresholds are preserved, not copied from private rules. `snapshot().channels` copies the last **applied** tuple, not the requested tuple; `frames` advances after each application. `release` clears the hold so the following frame resumes ordinary choreography; unmount clears the hold/witness and removes the owned port. The harness never writes `__rig` or constructs/imports an applicator to manufacture comparator outputs. No private module imports root stores or this port.

The harness's root census reads bearing/base/presence/all planets/materials directly from `__rig`, independently of this new port, and cross-checks node values against `__telemetry.rig`. No root census extension is needed.

## Input matching and controls

The canonical reference formula mirrors `MechanismDirector` only for scheduling and validation. Private input uses native `scrollTo` through the existing private conductor (`start:0`, `end:max`). Capture requires a ready live world, completed initial bake, progress within 0.0001, stable transforms for 500 ms, frame advance, and draws on exactly one connected live GL context. The initial bake may wait 90 seconds; each post-input settle is bounded to five seconds. This mechanical comparator is not the Stage 2 three-second input responsiveness gate.

Samples are rest (0), half shift (.4875), full shift (.515), partial ghost (.5375), minimum ghost (.575), leading/middle/late explode (.59375/.6125/.63125), full ladder (.65), full gear sweep (.94). The last sample is at inspection retirement, with all mechanism channels saturated. Native pixel rounding is recorded; the reference is evaluated at **observed** private progress.

Legacy seek receives the **settled private A live channel tuple**, including measured idle and ghost opacity. The harness waits for the root port's applied tuple and frame advance. No legacy-scroll inversion or canonical-progress equivalence is claimed. If the channel probe is absent, non-rest legacy samples are UNVERIFIED. The existing `__drawingProof.setProgress(0)` can collect the legacy drawing-rest control only; it cannot stand in for channel seeking.

Each viewport/tier runs four fresh browser contexts sequentially: private A/B and root A/B. Root URLs include `mechanicalProof=1` and `qualityLock`. Root/root and private/private same-build controls precede interpretation of private/root parity. Every comparison requires matching observed inputs, backend/vendor/API/version, current tier, actual viewport and device DPR, and render-buffer dimensions. A mismatched tuple yields no transform-parity claim. Missing observables remain UNVERIFIED; mismatched available observations FAIL. Root release is followed by a settled ordinary rest-frame check with frame/draw advance and inactive proof state; unmount cleanup is implemented but not independently browser-proved here.

For narrow full-tier runs, the hosts currently have different DPR ceilings (private 1.5, root up to 2). If actual render buffers differ, that comparison fails the like-for-like configuration gate. Parent must provide a separately authorized way to match actual renderer DPR before treating that run as parity evidence; the verifier does not edit renderer settings. Desktop DPR1 is the default bounded first run.

## Assertions and provenance

Rest-relative extraction laws are +.050 output, -.354 handle, -.291 clutch, and stage1–5 offsets [-.255,-.230,-.142,-.099,-.177] metres. The bearing is baseZ -.197×explode. Fork travel adds -.015×shift; ring travel adds +.009525×shift and rotation +120°×shift. Carrier display turns are [8,5.2,2.2,1.43,3.38]×2π×(gearAngle/8π+idle). Every observed planet counter-rotates at -3.5×its carrier angle; counts are discovered, not hardcoded. Missing nodes or planet lists cannot pass via a numeric zero default. Ghost opacity and every attached material's transparent/depthWrite flags are compared with no waivers.

Transform tolerances follow contract18: position 0.1 mm, unwrapped local Euler rotation 0.01°, opacity/normalized channels 1e-4. Independently observed input matching is tighter, 1e-7. Control differences are reported under the same tolerances; they never widen acceptance tolerances.

The comparator is **this checkout's current legacy root entry**, not a historical pre-extraction implementation. Both documents must come from one loopback production preview. Capture hashes the actual browser response bodies for GLBs and JS, records the two documents, checks loaded Default.glb against this checkout's public asset, compares independent control module graphs, and re-fetches the union of observed document/module/GLB paths to detect rotated bytes. With `--build-dir`, observed served assets and both HTML entries are checked against that same local production output. Without it, only stable served-byte identity is established; local source hashes are authoring provenance, not proof of build correspondence.

Reports include assertion status and actual values, separate controls, raw snapshots, request/console/page errors, browser/Playwright versions, launch settings, **observed** unmasked backend, viewport/DPR/buffer sizes, GLB/module hashes, current checkout HEAD/branch/dirty status, local source hashes, verifier hash, timestamps, and run ID. Root `qualityLock` is disclosed: it suppresses the FPS ratchet, not hard context failures. Software GL is never represented as hardware evidence. This harness does not certify pixels, clearance, visual quality, performance, lifecycle/remount behavior, or Stage 3 exit.

Potential source-level findings to verify, not accepted runtime evidence: private sets `transparent=false` at opaque ghost states while legacy retains transparent-capable materials; at .5375 private ghost opacity is about .575 and private disables depthWrite while legacy enables it above .5. Preserve and report these differences; do not silently normalize them in a proof port.

## Parent execution

Restart the task-owned preview after rebuilding. No server is started by the harness. These commands are preparation; none was executed in the authoring session:

```powershell
node scripts/verify-torque-mechanical-parity.mjs --url=http://localhost:<fresh-parent-port> --out=project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/runtime-mechanical-parity --build-dir=.scratch/<parent-production-output>
# Browser alternatives (installed Playwright; no downloads/installations):
# --browser=msedge | --browser=chromium | --executable=C:/path/to/browser.exe
# JGUN_CHROME_PATH is also supported. Existing launch contract supplies ANGLE arguments.
# Supplemental cases after the bounded D/full run: --viewport=N --tier=lite
```

`--url` accepts the origin or its /torque-wrench/ path; both derive the root comparator on the same origin. `--out` is a directory inside this task's evidence folder. JSON filenames include timestamp and run ID and use exclusive creation. No previous report is overwritten. Exit codes: 0 PASS, 1 FAIL, 2 usage, 10 UNVERIFIED/probe missing, 11 environment blocked, 12 report-write error.

## Authoring checks

- `node --check scripts/verify-torque-mechanical-parity.mjs`: exit 0, no output.
- `node scripts/verify-torque-mechanical-parity.mjs --help`: exit 0; prints usage, D/full defaults, serialized four-document roster, probe-missing UNVERIFIED policy and exit codes. It launches no browser.
- `node node_modules/typescript/bin/tsc --noEmit`: exit 0, no output, after the root proof integration and parent's current private census.
- Scoped `git diff --check`: exit 0, no output.
- New-file whitespace check: exit 0, `PASS: new-file whitespace check (2 files)`; covers the untracked verifier/document that Git's ordinary diff check omits.
- Pure reference/diff smoke check: initial exact midpoint equality failed (`0.4999999999999991` vs `0.5`); corrected the check to a 1e-12 tolerance. Corrected execution exit 0: `PASS: reference scheduling endpoints, midpoints, ghost threshold, and strict rig diff (missing fields cannot pass)`.
- Isolated execution of the actual root proof hook block (TypeScript transpilation plus mocked hook registration): exit 0, `PASS: opt-in-only root port, validation, copied hold, non-echo applied witness, release, and unmount cleanup (isolated hook protocol; no browser/frame proof)`.

These are authoring checks only. No browser/build/full test suite was run. The parent must schedule fresh runtime evidence, assess ghost-flag differences without normalizing them, and match actual renderer DPR where necessary. Concurrent parent/other-agent files were preserved.
