# JG-038 Stage 3 host preparation — independent sidecar review

Date: 2026-10-12 (review snapshot refreshed through 17:51 UTC)
Reviewer: independent GLM-5.3 sidecar
Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`

## Verdict

No P0 finding. One P1 issue should be corrected before the parent build: the live-loss
inspection exit does not close the DOM region or return focus. The explicit playback slider
can also disagree with the actual epoch, classified P2 below, and is closely related to that
exit; both belong in the same immediate control correction pass. No finding
depends on the still-provisional opening camera, final sheet integration, ring writer, or
missing final controls.

The final current host corrected an ordering issue observed earlier in the review: merged
snapshot geometry is now registered with the resource scope before layout construction and
before installing `drawing.current` (`RuntimeWorld.tsx:70-76`). The final-current verdict
below uses that version, not the earlier intermediate source.

## Findings

### P1 — live loss closes only the model, not the accessible inspection exit

`src/scene/torque-wrench/Story.tsx:52-55`

When `live` becomes false, the effect calls `playback.close()` but does not set the local
`open` state false or return focus to `triggerRef`. The region therefore remains expanded,
`aria-expanded` remains true, and the live Play/Pause/seek controls disappear without an
accessible exit transition. This violates the fixed C1 rule that inspection exit returns focus
to the recorded trigger control (`extraction-contracts.md:265-270,299-302`).

Correction: on a transition from live to non-live while `open` is true, call
`playback.close()`, set `open=false`, and focus the trigger. The Story unmount cleanup should
remain model-close only because focusing a node during its own unmount is not meaningful.

### P2 — uncontrolled seek slider diverges from explicit playback state

`src/scene/torque-wrench/inspectionPlayback.ts:15-27`;
`src/scene/torque-wrench/Story.tsx:86-92`

`open()` resets progress to zero and `play()` restarts a completed epoch at zero, but the DOM
range input is uncontrolled with `defaultValue="0"`. During Play it does not display current
position; after completion and replay it can remain at 100 while the model restarts at zero; a
later open can likewise inherit a stale visual position. Explicit seek still writes the model
correctly, so this is a control-truth defect rather than camera/sampling corruption.

Correction: keep imperative playback but synchronize the range value at command boundaries and
playback completion (or expose a small DOM-only playback state subscription). Do not subscribe
the R3F canvas or introduce per-frame React renders.

### P2 — private frame path allocates two arrays every frame

`src/scene/torque-wrench/RuntimeWorld.tsx:109-116`;
`src/scene/rig/wrenchMechanics.ts:184-198`

The host calls `writeWrenchMechanicsProbe` every frame. The writer replaces `probe.stageZ` and
`probe.stageRot` with new `STAGE_IDS.map(...)` arrays at `wrenchMechanics.ts:188-189`. This
violates the zero-allocation canvas frame rule from `r3f-scroll-performance-guard` and is easy
to miss because transforms and numeric parity are otherwise correct.

Correction: write the five fixed entries into the caller-owned arrays in place. The public
array-valued probe shape can remain unchanged.

### P2 — synchronous shaft-factory construction fault can leak and retry

`src/scene/inspection/shaft/shaftRuntime.ts:102-153,450-466`;
`src/scene/torque-wrench/RuntimeWorld.tsx:118-125`

`createShaftRuntime` allocates groups, lights, materials, tool geometry, state objects, and
scratch objects before the runtime object exists and before `session.own(runtime)` at line 465.
A synchronous construction throw therefore bypasses the factory's disposal sets. The host also
leaves `shaft.current` null after the throw, so another frame can retry factory construction
until the terminal scene unmount lands. This is a fault-path issue, not an observed normal-load
failure; the async parse path does register results and has explicit stale-result disposal.

Correction: register an immediately disposable runtime shell with the session before synchronous
allocation, or wrap construction in an epoch-aware `try/finally` that disposes every partial
resource and seals this creation attempt so the host cannot retry it every frame.

### P3 — async shaft failure is reported twice

`src/scene/inspection/shaft/shaftRuntime.ts:326-328`;
`src/scene/torque-wrench/RuntimeWorld.tsx:119-125`

On an active async failure, the factory calls `session.fail(error)` (which reaches
`onFailure`), then rethrows; RuntimeWorld's ready rejection handler calls `onFailure(error)`
again. The page failure store is terminal/idempotent, so behavior remains safe, but diagnostics
can count one asset failure twice. Report through exactly one ownership path.

### P3 — ring-switch direction comment contradicts the delivered law

`src/data/caseStudies.ts:241-250`;
`src/scene/rig/wrenchMechanics.ts:81-92,106-114`

The constant comment says the value is “applied as negative,` while M1 deliberately applies the
positive constant to `rotation.z`, matching the Stage 3 contract and tests. Update the stale
comment only; do not change the transform sign.

## Confirmed host behavior

- **Manual arbitration**: `RuntimeWorld.tsx:103-108` reads canonical progress once, maps open
  manual playback `0..1` linearly to inspection `.735....94`, and does not write page scroll.
  Close resumes canonical sampling and the canonical camera branch. Wrench mechanics remain a
  function of canonical page progress even while manual inspection is open.
- **Visibility**: hidden documents increment `hiddenFrames` and return before playback advance,
  mechanism sampling, inspection sampling, or camera writes. Returning samples recompute from
  canonical progress with no elapsed-time catch-up. Playback's 43 s duration and 0.1 s delta cap
  are explicit.
- **Snapshot recenter/remount**: `RuntimeWorld.tsx:63-76` temporarily puts the host at identity,
  updates world matrices, snapshots raw CAD, restores the center in `finally`, updates matrices
  again, then owns the merged geometry before layout installation. `buildWrenchRig` reuses
  `root.userData.wrenchRig`, and both the outer group and cached GLTF primitive are mounted with
  disposal disabled, preserving borrowed cached CAD across StrictMode/remount.
- **Resource order/borrowed preservation**: `resourceScope.ts` aborts before reverse-order
  cleanup, attempts every disposer despite faults, freezes one cleanup report, immediately
  disposes stale results, and suppresses reporter exceptions. Environment registration and
  identity-guarded release are correctly ordered. Shaft runtime disposal removes owned
  geometry/materials/textures while leaving shared narrative geometry/textures untouched.
- **Imperative sampling/lazy topology**: the canvas has no React scroll subscription. Mechanism,
  private inspection, and manual playback use preallocated caller objects. The shaft topology is
  created only when canonical or manual study visibility first requests it and remains reusable
  across manual open/close.
- **M1 matched-source parity**: `applyWrenchMechanics` applies gear rotation, shift, then
  explosion; uses the measured part-keyed ladder, clutch −Z travel, ring-switch +Z travel and
  positive rotation, leading fastener pop, and JG-031 carrier/planet display turns. The legacy
  adapter retains its proxy/timeline, idle accumulation, root store/global probe, and preload while
  delegating transforms. The private probe mirrors the legacy fields and null-tolerant defaults.

## Test and source status

Parent-reported, not rerun by this sidecar:

- Final M1: 12 tests across the two delivered files pass, after changing the planet zero assertion
  to numeric `toBeCloseTo`.
- Resource scope: 2 tests pass.
- InspectionDirector C1: 20 tests pass.
- Page/playback: 5 tests pass.

Installed APIs checked directly: `@react-three/fiber` 9.7.0, `@react-three/drei` 10.7.8,
`three` 0.185.1, React 19.2.8. R3F 9.7's Canvas `fallback` prop is DOM fallback content inside
the canvas element, not a WebGL-creation error callback; actual scene errors still depend on the
outer boundary/`onFailure` path.

Read source/contracts included: Stage 3 host (`RuntimeWorld`, `Scene`, `Story`,
`TorqueWrenchPage`, `cadGate`, playback/test, resourceScope/test, store/conductor/lifecycle),
C1 director/test, M1 applicator/test and legacy hero adapter, rig cache/snapshot/camera support,
shaft session/runtime/camera/kinematics, both Stage 3 contracts, and the two named local skills.
The external drawing/ring lanes were treated as active/in progress, not claimed complete.

## Limitations

- Read-only source/contract review only. This sidecar ran no tests, typecheck, build, browser,
  server, GPU, or Git operations, and spawned no agents/chats.
- Parent-reported test counts are accepted as reports only; they are not independent execution
  evidence from this review.
- Full `tsc` was not attempted because the drawing lane was still in progress.
- Runtime framing, cutter clearance, focus behavior under a real browser, remount/context-loss
  telemetry, GPU resource lifetime, built-chunk import closure, and owner visual acceptance remain
  open. Provisional opening/mechanism cameras and missing final sheet/ring/controls are not done
  claims.
- No protected sibling checkout, shared file, or pre-existing evidence record was accessed or
  modified.

## Ownership release

This sidecar wrote only:

`project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12/stage3-host-review.md`

The parent owns immediate corrections, integration, serialized tests/build/runtime evidence, and
any release decision. This document closes no JG-038 gate.



## Round 1 release — 2026-10-12 17:57:41 UTC

Released to the parent for immediate correction. Parent acknowledged and owns:

- focus/live-loss closure in `Story.tsx`;
- imperative range synchronization on a DOM-only cadence (planned 100 ms), without canvas React rerenders;
- in-place M1 probe arrays;
- `shaftRuntime.ts` partial-factory fault sealing and duplicate-failure suppression, delegated with an exact test to Lorentz;
- continued private sheet implementation under Sol while the parent prepares bake lifecycle integration.

This release does not verify those corrections, close JG-038, or authorize any writer beyond the
parent's stated ownership. Round 2 remains available after corrections land; all runtime, build,
browser/GPU, import-closure, and owner-acceptance evidence remains open.

